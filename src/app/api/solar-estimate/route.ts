import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/ratelimit";

const schema = z.object({
  zip: z.string().regex(/^\d{5}$/),
  systemSizeKw: z.coerce.number().min(1).max(50),
  arrayType: z.coerce.number().int().min(0).max(4).default(1), // 0=fixed-open, 1=fixed-roof, 2=1-axis, 3=1-axis-backtrack, 4=2-axis
  tilt: z.coerce.number().min(0).max(90).default(20),
  azimuth: z.coerce.number().min(0).max(360).default(180), // 180 = south
  losses: z.coerce.number().min(0).max(0.99).default(0.14), // 14% system losses (typical)
});

/**
 * GET /api/solar-estimate?zip=20850&systemSizeKw=7.5
 *
 * Proxies NREL PVWatts API to estimate annual solar production for a given location.
 * Returns production data with SREC income calculation for Maryland.
 *
 * NREL PVWatts V8 docs: https://developer.nrel.gov/docs/solar/pvwatts/v8/
 */
export async function GET(request: NextRequest) {
  // ─── Rate limiting ────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const rl = rateLimit(ip, RATE_LIMITS.external);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const params = schema.parse(Object.fromEntries(searchParams));

    // ─── Call NREL PVWatts V8 ──────────────────────────────────────────────
    const nrelParams = new URLSearchParams({
      api_key: process.env.NREL_API_KEY!,
      system_capacity: params.systemSizeKw.toString(),
      module_type: "1",           // 1 = premium (monocrystalline)
      losses: (params.losses * 100).toString(), // PVWatts takes percentage
      array_type: params.arrayType.toString(),
      tilt: params.tilt.toString(),
      azimuth: params.azimuth.toString(),
      address: params.zip,
      timeframe: "monthly",
    });

    const nrelRes = await fetch(
      `https://developer.nrel.gov/api/pvwatts/v8.json?${nrelParams}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours (solar production is static per location)
        headers: { "X-Api-Key": process.env.NREL_API_KEY! },
      }
    );

    if (!nrelRes.ok) {
      throw new Error(`NREL API error: ${nrelRes.status}`);
    }

    const nrelData = await nrelRes.json();

    if (nrelData.errors?.length) {
      return NextResponse.json(
        { error: "Solar estimate unavailable for this location", details: nrelData.errors },
        { status: 422 }
      );
    }

    const annualKwh: number = nrelData.outputs.ac_annual;
    const monthlyKwh: number[] = nrelData.outputs.ac_monthly;

    // ─── Calculate Maryland-specific financials ────────────────────────────
    const PEPCO_RATE = 0.217; // $/kWh
    const SREC_PRICE_CERTIFIED = 70; // $/SREC (Brighter Tomorrow 1.5x multiplier)
    const INSTALLED_COST_PER_W = 3.50; // mid-range

    const annualNetMeteringSavings = annualKwh * PEPCO_RATE;
    const annualSrecCount = annualKwh / 1000;
    const annualSrecIncome = annualSrecCount * SREC_PRICE_CERTIFIED;
    const totalAnnualValue = annualNetMeteringSavings + annualSrecIncome;
    const grossSystemCost = params.systemSizeKw * 1000 * INSTALLED_COST_PER_W;
    const salesTaxSavings = grossSystemCost * 0.06;
    const simplePaybackYears = grossSystemCost / totalAnnualValue;
    const lifetime25YearSavings = totalAnnualValue * 25 - grossSystemCost;

    // CO2 offset: PJM grid ~0.434 lbs CO2/kWh = 0.000197 metric tons
    const co2TonsPerYear = annualKwh * 0.000197;

    return NextResponse.json({
      location: {
        zip: params.zip,
        lat: nrelData.station_info?.lat,
        lon: nrelData.station_info?.lon,
        city: nrelData.station_info?.city,
        state: nrelData.station_info?.state,
        elevation: nrelData.station_info?.elev,
        timezone: nrelData.station_info?.tz,
        peakSunHours: nrelData.station_info?.solrad_annual,
      },
      system: {
        sizeKw: params.systemSizeKw,
        arrayType: params.arrayType,
        tilt: params.tilt,
        azimuth: params.azimuth,
      },
      production: {
        annualKwh: Math.round(annualKwh),
        monthlyKwh: monthlyKwh.map(Math.round),
        specificYield: Math.round(annualKwh / params.systemSizeKw), // kWh/kW
      },
      financials: {
        annualNetMeteringSavings: Math.round(annualNetMeteringSavings),
        annualSrecIncome: Math.round(annualSrecIncome),
        totalAnnualValue: Math.round(totalAnnualValue),
        grossSystemCost: Math.round(grossSystemCost),
        salesTaxSavings: Math.round(salesTaxSavings),
        simplePaybackYears: Math.round(simplePaybackYears * 10) / 10,
        lifetime25YearSavings: Math.round(lifetime25YearSavings),
        co2TonsPerYear: Math.round(co2TonsPerYear * 10) / 10,
      },
      incentives: {
        federalCreditAvailable: false,    // ELIMINATED 1/1/2026
        federalCreditNote: "The 30% federal solar tax credit (25D) was eliminated by the One Big Beautiful Bill Act for installations after December 31, 2025.",
        msapAvailable: true,
        msapAmount: Math.min(params.systemSizeKw * 750, 7500), // $750/kW up to $7,500
        msapNote: "Income-qualified (≤150% AMI). Apply BEFORE installation. FY26 deadline: June 5, 2026.",
        rcesBatteryGrant: 5000,
        salesTaxExemption: Math.round(salesTaxSavings),
      },
      metadata: {
        source: "NREL PVWatts V8",
        ratesAsOf: "April 2026",
        pepcoRatePerKwh: PEPCO_RATE,
        srecPricePerCredit: SREC_PRICE_CERTIFIED,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error("Solar estimate error:", error);
    return NextResponse.json({ error: "Failed to generate solar estimate" }, { status: 500 });
  }
}
