"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@web-tools/ui/components/button";
import { Card } from "@web-tools/ui/components/card";
import { ToolFrame } from "@/components/tool-frame";
import { getBuiltin } from "@/lib/tools";

type Op = "+" | "-" | "×" | "÷";

const manifest = getBuiltin("calculator");

export default function CalculatorClient() {
  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Op | null>(null);
  const [overwrite, setOverwrite] = useState(false);

  const inputDigit = useCallback((d: string) => {
    setDisplay((prev) => {
      if (overwrite || prev === "0") {
        setOverwrite(false);
        return d;
      }
      if (prev.length >= 16) return prev;
      return prev + d;
    });
  }, [overwrite]);

  const inputDot = useCallback(() => {
    setDisplay((prev) => {
      if (overwrite) {
        setOverwrite(false);
        return "0.";
      }
      return prev.includes(".") ? prev : prev + ".";
    });
  }, [overwrite]);

  const applyOp = useCallback((a: number, b: number, op: Op): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
    }
  }, []);

  const handleOp = useCallback((op: Op) => {
    const current = parseFloat(display);
    if (accumulator === null || pendingOp === null) {
      setAccumulator(current);
    } else if (!overwrite) {
      const result = applyOp(accumulator, current, pendingOp);
      setAccumulator(result);
      setDisplay(formatNumber(result));
    }
    setPendingOp(op);
    setOverwrite(true);
  }, [display, accumulator, pendingOp, overwrite, applyOp]);

  const handleEquals = useCallback(() => {
    if (accumulator === null || pendingOp === null) return;
    const current = parseFloat(display);
    const result = applyOp(accumulator, current, pendingOp);
    setDisplay(formatNumber(result));
    setAccumulator(null);
    setPendingOp(null);
    setOverwrite(true);
  }, [accumulator, pendingOp, display, applyOp]);

  const handleClear = useCallback(() => {
    setDisplay("0");
    setAccumulator(null);
    setPendingOp(null);
    setOverwrite(false);
  }, []);

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => {
      if (overwrite) return prev;
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith("-"))) return "0";
      return prev.slice(0, -1);
    });
  }, [overwrite]);

  const handleSign = useCallback(() => {
    setDisplay((prev) => (prev.startsWith("-") ? prev.slice(1) : prev === "0" ? prev : "-" + prev));
  }, []);

  const handlePercent = useCallback(() => {
    setDisplay((prev) => formatNumber(parseFloat(prev) / 100));
  }, []);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") inputDigit(e.key);
      else if (e.key === ".") inputDot();
      else if (e.key === "+") handleOp("+");
      else if (e.key === "-") handleOp("-");
      else if (e.key === "*") handleOp("×");
      else if (e.key === "/") { e.preventDefault(); handleOp("÷"); }
      else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); handleEquals(); }
      else if (e.key === "Backspace") handleBackspace();
      else if (e.key === "Escape") handleClear();
      else if (e.key === "%") handlePercent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputDigit, inputDot, handleOp, handleEquals, handleBackspace, handleClear, handlePercent]);

  return (
    <ToolFrame
      title={manifest?.title ?? "Calculator"}
      description={manifest?.description}
    >
      <div className="mx-auto w-full max-w-sm">
        <Card className="p-4">
          <div className="mb-4 flex h-20 items-end justify-end overflow-hidden rounded-md bg-(--color-input) px-4 py-3 text-right">
            <span className="font-mono text-3xl tabular-nums">{display}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button variant="secondary" onClick={handleClear}>AC</Button>
            <Button variant="secondary" onClick={handleSign}>±</Button>
            <Button variant="secondary" onClick={handlePercent}>%</Button>
            <Button variant="default" onClick={() => handleOp("÷")}>÷</Button>

            {["7", "8", "9"].map((n) => (
              <Button key={n} variant="outline" onClick={() => inputDigit(n)}>{n}</Button>
            ))}
            <Button variant="default" onClick={() => handleOp("×")}>×</Button>

            {["4", "5", "6"].map((n) => (
              <Button key={n} variant="outline" onClick={() => inputDigit(n)}>{n}</Button>
            ))}
            <Button variant="default" onClick={() => handleOp("-")}>−</Button>

            {["1", "2", "3"].map((n) => (
              <Button key={n} variant="outline" onClick={() => inputDigit(n)}>{n}</Button>
            ))}
            <Button variant="default" onClick={() => handleOp("+")}>+</Button>

            <Button variant="outline" className="col-span-2" onClick={() => inputDigit("0")}>0</Button>
            <Button variant="outline" onClick={inputDot}>.</Button>
            <Button variant="default" onClick={handleEquals}>=</Button>
          </div>
          <p className="mt-3 text-xs text-(--color-muted-foreground)">
            Keyboard: digits, + − * / for operators, Enter to equal, Backspace, Esc to clear.
          </p>
        </Card>
      </div>
    </ToolFrame>
  );
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const s = String(n);
  if (s.length <= 16) return s;
  return n.toPrecision(12).replace(/\.?0+$/, "");
}
