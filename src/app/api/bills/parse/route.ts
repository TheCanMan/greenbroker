import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractTextFromPdf } from "@/lib/bill-parser/pdf";
import { parseUtilityBillText } from "@/lib/bill-parser/parser";
import { getClientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const parseRequestSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const limit = rateLimit(`bill-parse:${getClientIp(request)}`, {
    limit: 12,
    windowSecs: 60,
  });
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many bill parse attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  try {
    const body = parseRequestSchema.parse(await request.json());
    const fileResponse = await fetch(body.fileUrl, { cache: "no-store" });
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Could not fetch uploaded bill for parsing." },
        { status: 400 },
      );
    }

    const contentType = fileResponse.headers.get("content-type") ?? "";
    const looksLikePdf =
      contentType.includes("pdf") ||
      body.fileUrl.toLowerCase().includes(".pdf") ||
      body.fileName?.toLowerCase().endsWith(".pdf");
    if (!looksLikePdf) {
      return NextResponse.json(
        {
          error:
            "This first version can parse PDF bills only. The file is stored, but please enter the fields manually.",
        },
        { status: 415 },
      );
    }

    const buffer = await fileResponse.arrayBuffer();
    if (buffer.byteLength > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Bill PDF is too large to parse." },
        { status: 413 },
      );
    }

    const { text, totalPages } = await extractTextFromPdf(buffer);
    const extraction = parseUtilityBillText(text, {
      fileName: body.fileName ?? null,
      fileUrl: body.fileUrl,
    });
    const { rawText: _rawText, ...safeExtraction } = extraction;

    return NextResponse.json({ extraction: safeExtraction, totalPages });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid bill parse request." }, { status: 400 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not parse utility bill.",
      },
      { status: 500 },
    );
  }
}
