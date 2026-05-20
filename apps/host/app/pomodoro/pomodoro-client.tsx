"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@web-tools/ui/components/button";
import { Card } from "@web-tools/ui/components/card";
import { ToolFrame } from "@/components/tool-frame";
import { getBuiltin } from "@/lib/tools";

type Mode = "focus" | "short" | "long";

const LABELS: Record<Mode, string> = {
  focus: "Focus",
  long: "Long Break",
  short: "Short Break",
};

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  long: 15 * 60,
  short: 5 * 60,
};

const manifest = getBuiltin("pomodoro");

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // AudioContext not available in this environment
  }
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function PomodoroClient() {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);

  // Interval tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Completion — fires when timer reaches 0 while running
  useEffect(() => {
    if (secondsLeft !== 0 || !running) return;
    setRunning(false);
    beep();
    if (mode === "focus") {
      const next = rounds + 1;
      setRounds(next);
      const nextMode = next % 4 === 0 ? "long" : "short";
      setMode(nextMode);
      setSecondsLeft(DURATIONS[nextMode]);
    } else {
      setMode("focus");
      setSecondsLeft(DURATIONS.focus);
    }
  }, [secondsLeft, running, mode, rounds]);

  // Live document title while running
  useEffect(() => {
    document.title = running
      ? `${fmt(secondsLeft)} · ${LABELS[mode]}`
      : (manifest?.title ?? "Pomodoro");
    return () => {
      document.title = manifest?.title ?? "Pomodoro";
    };
  }, [secondsLeft, running, mode]);

  const switchMode = (m: Mode) => {
    setRunning(false);
    setMode(m);
    setSecondsLeft(DURATIONS[m]);
  };

  const toggle = () => setRunning((r) => !r);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(DURATIONS[mode]);
  };

  const progress = (DURATIONS[mode] - secondsLeft) / DURATIONS[mode];
  const setInRound = rounds % 4;

  return (
    <ToolFrame title={manifest?.title ?? "Pomodoro"} description={manifest?.description}>
      <div className="mx-auto w-full max-w-sm">
        <Card className="flex flex-col items-center gap-6 p-6">
          {/* Mode tabs */}
          <div className="flex w-full gap-1 rounded-lg bg-(--color-muted) p-1">
            {(["focus", "long", "short"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors " +
                  (mode === m
                    ? "bg-(--color-background) text-(--color-foreground) shadow-sm"
                    : "text-(--color-muted-foreground) hover:text-(--color-foreground)")
                }
              >
                {LABELS[m]}
              </button>
            ))}
          </div>

          {/* Countdown */}
          <div className="flex flex-col items-center gap-3">
            <span className="font-mono text-7xl font-semibold tabular-nums tracking-tight">
              {fmt(secondsLeft)}
            </span>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-(--color-muted)">
              <div
                className="h-full rounded-full bg-(--color-primary) transition-[width] duration-1000 ease-linear"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={reset} aria-label="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={toggle} aria-label={running ? "Pause" : "Start"}>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>

          {/* Round indicators */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={
                    "h-2 w-2 rounded-full transition-colors " +
                    (i < setInRound ? "bg-(--color-primary)" : "bg-(--color-muted)")
                  }
                />
              ))}
            </div>
            {rounds > 0 && (
              <p className="text-xs text-(--color-muted-foreground)">
                {rounds} {rounds === 1 ? "round" : "rounds"} completed
              </p>
            )}
          </div>
        </Card>
      </div>
    </ToolFrame>
  );
}
