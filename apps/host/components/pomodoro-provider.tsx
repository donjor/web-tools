"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Mode = "focus" | "short" | "long";
const MODES: Mode[] = ["focus", "short", "long"];

export const LABELS: Record<Mode, string> = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
};

export const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const STORAGE_KEY = "web-tools.pomodoro.v1";

type TimerState = { secondsLeft: number; running: boolean };
type AllTimers = Record<Mode, TimerState>;

type Snapshot = {
  timers: AllTimers;
  mode: Mode;
  rounds: number;
  savedAt: number;
};

type PomodoroCtx = {
  mode: Mode;
  secondsLeft: number;
  running: boolean;
  rounds: number;
  switchMode: (m: Mode) => void;
  toggle: () => void;
  reset: () => void;
};

const Context = createContext<PomodoroCtx | null>(null);

export function usePomodoroTimer(): PomodoroCtx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("usePomodoroTimer must be used inside PomodoroProvider");
  return ctx;
}

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
    // AudioContext not available
  }
}

function nextBreak(roundsCompleted: number): Mode {
  return roundsCompleted % 4 === 0 ? "long" : "short";
}

const defaultTimers = (): AllTimers => ({
  focus: { secondsLeft: DURATIONS.focus, running: false },
  short: { secondsLeft: DURATIONS.short, running: false },
  long: { secondsLeft: DURATIONS.long, running: false },
});

function loadSnapshot(): { timers: AllTimers; mode: Mode; rounds: number } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { timers: defaultTimers(), mode: "focus", rounds: 0 };

    const snap = JSON.parse(raw) as Snapshot;
    const elapsed = Math.floor((Date.now() - snap.savedAt) / 1000);
    const timers = { ...snap.timers };
    let { mode, rounds } = snap;

    for (const m of MODES) {
      if (!timers[m].running) continue;
      const remaining = timers[m].secondsLeft - elapsed;
      if (remaining > 0) {
        timers[m] = { secondsLeft: remaining, running: true };
      } else {
        // Timer completed while away — advance and leave stopped
        timers[m] = { secondsLeft: DURATIONS[m], running: false };
        if (m === "focus") {
          rounds += 1;
          const nb = nextBreak(rounds);
          mode = nb;
          timers[nb] = { secondsLeft: DURATIONS[nb], running: false };
        } else {
          mode = "focus";
          timers.focus = { secondsLeft: DURATIONS.focus, running: false };
        }
      }
    }

    return { timers, mode, rounds };
  } catch {
    return { timers: defaultTimers(), mode: "focus", rounds: 0 };
  }
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [timers, setTimers] = useState<AllTimers>(defaultTimers);
  const [mode, setMode] = useState<Mode>("focus");
  const [rounds, setRounds] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Restore from sessionStorage on mount
  useEffect(() => {
    const s = loadSnapshot();
    setTimers(s.timers);
    setMode(s.mode);
    setRounds(s.rounds);
    setHydrated(true);
  }, []);

  // Persist on every state change
  useEffect(() => {
    if (!hydrated) return;
    const snap: Snapshot = { timers, mode, rounds, savedAt: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  }, [timers, mode, rounds, hydrated]);

  // Single interval — ticks all running timers
  const anyRunning = MODES.some((m) => timers[m].running);
  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const m of MODES) {
          if (prev[m].running && prev[m].secondsLeft > 0) {
            next[m] = { ...prev[m], secondsLeft: prev[m].secondsLeft - 1 };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [anyRunning]);

  // Completion — focus
  useEffect(() => {
    if (timers.focus.secondsLeft !== 0 || !timers.focus.running) return;
    beep();
    const next = rounds + 1;
    const nb = nextBreak(next);
    setRounds(next);
    setTimers((prev) => ({
      ...prev,
      focus: { ...prev.focus, running: false },
      [nb]: { secondsLeft: DURATIONS[nb], running: false },
    }));
    setMode(nb);
  }, [timers.focus.secondsLeft, timers.focus.running, rounds]);

  // Completion — short break
  useEffect(() => {
    if (timers.short.secondsLeft !== 0 || !timers.short.running) return;
    beep();
    setTimers((prev) => ({
      ...prev,
      short: { ...prev.short, running: false },
      focus: { secondsLeft: DURATIONS.focus, running: false },
    }));
    setMode("focus");
  }, [timers.short.secondsLeft, timers.short.running]);

  // Completion — long break
  useEffect(() => {
    if (timers.long.secondsLeft !== 0 || !timers.long.running) return;
    beep();
    setTimers((prev) => ({
      ...prev,
      long: { ...prev.long, running: false },
      focus: { secondsLeft: DURATIONS.focus, running: false },
    }));
    setMode("focus");
  }, [timers.long.secondsLeft, timers.long.running]);

  // Tab switch — pure view change, no timer side effects
  const switchMode = (m: Mode) => setMode(m);

  const toggle = () =>
    setTimers((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], running: !prev[mode].running },
    }));

  const reset = () =>
    setTimers((prev) => ({
      ...prev,
      [mode]: { secondsLeft: DURATIONS[mode], running: false },
    }));

  return (
    <Context.Provider
      value={{
        mode,
        secondsLeft: timers[mode].secondsLeft,
        running: timers[mode].running,
        rounds,
        switchMode,
        toggle,
        reset,
      }}
    >
      {children}
    </Context.Provider>
  );
}
