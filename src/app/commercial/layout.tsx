import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "GreenBroker Commercial | HVAC FDD for Existing Buildings",
    template: "%s | GreenBroker Commercial",
  },
  description:
    "Commercial fault detection and benchmarking for existing buildings. Upload utility bills or BMS trend logs to find HVAC waste, rank findings, and surface utility rebate opportunities.",
  keywords: [
    "commercial buildings",
    "fault detection",
    "HVAC analytics",
    "building benchmarking",
    "energy waste",
    "BMS trend logs",
    "utility rebates",
    "DMV buildings",
  ],
};

export default function CommercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
