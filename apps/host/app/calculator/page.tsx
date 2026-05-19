import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/metadata";
import CalculatorClient from "./calculator-client";

export const metadata: Metadata = createToolMetadata("calculator");

export default function CalculatorPage() {
  return <CalculatorClient />;
}
