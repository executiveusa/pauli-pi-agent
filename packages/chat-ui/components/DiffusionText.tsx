"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Mercury uses a mix of these characters for the "noise" state
// — visible chars that scramble before resolving
const NOISE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

interface CharState {
  char: string;       // current displayed char
  target: string;     // the real char we're resolving to
  resolved: boolean;  // has this char settled?
  progress: number;   // 0-1, how close to resolving
}

interface DiffusionTextProps {
  text: string;
  isStreaming?: boolean;
  /** How fast chars resolve. Lower = slower / more dramatic. Default 0.08 */
  speed?: number;
}

export function DiffusionText({ text, isStreaming = true, speed = 0.08 }: DiffusionTextProps) {
  const [chars, setChars] = useState<CharState[]>([]);
  const frameRef = useRef<number>(0);
  const prevTextRef = useRef<string>("");
  const charsRef = useRef<CharState[]>([]);

  // Sync charsRef with state so animation loop can access latest
  useEffect(() => {
    charsRef.current = chars;
  }, [chars]);

  // When text changes (new tokens arrive), inject new chars in noise state
  useEffect(() => {
    const prev = prevTextRef.current;
    prevTextRef.current = text;

    if (!text) {
      setChars([]);
      return;
    }

    setChars((current) => {
      const next: CharState[] = text.split("").map((targetChar, i) => {
        // Already resolved chars stay resolved
        if (i < current.length && current[i].resolved && current[i].target === targetChar) {
          return current[i];
        }
        // Whitespace resolves immediately — no noise for spaces/newlines
        if (targetChar === " " || targetChar === "\n") {
          return { char: targetChar, target: targetChar, resolved: true, progress: 1 };
        }
        // New char: start in pure noise
        return {
          char: NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)],
          target: targetChar,
          resolved: false,
          progress: Math.random() * 0.2, // stagger start time
        };
      });
      return next;
    });
  }, [text]);

  // RAF animation loop: probabilistically resolve chars
  const animate = useCallback(() => {
    setChars((current) => {
      if (current.length === 0) return current;

      let anyChanged = false;
      const next = current.map((c) => {
        if (c.resolved) return c;

        const newProgress = Math.min(1, c.progress + speed * (0.5 + Math.random() * 0.8));

        // Char resolves when progress crosses 1, with some randomness
        const shouldResolve = newProgress >= 1 || Math.random() < newProgress * 0.15;

        if (shouldResolve) {
          anyChanged = true;
          return { ...c, char: c.target, resolved: true, progress: 1 };
        }

        // Still noisy — pick a random char from the noise set
        anyChanged = true;
        return {
          ...c,
          progress: newProgress,
          char: NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)],
        };
      });

      return anyChanged ? next : current;
    });

    frameRef.current = requestAnimationFrame(animate);
  }, [speed]);

  // Start/stop animation loop
  useEffect(() => {
    const allResolved = chars.every((c) => c.resolved);

    if (!allResolved) {
      frameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [chars, animate]);

  if (!text) return null;

  return (
    <span className="diffusion-text" style={{ fontVariantNumeric: "tabular-nums" }}>
      {chars.map((c, i) => (
        <span
          key={i}
          style={{
            opacity: c.resolved ? 1 : 0.35 + c.progress * 0.65,
            color: c.resolved ? "inherit" : `hsl(${200 + c.progress * 40}, 70%, 70%)`,
            transition: c.resolved ? "color 0.1s ease, opacity 0.1s ease" : "none",
            display: c.target === "\n" ? "block" : "inline",
          }}
        >
          {c.char}
        </span>
      ))}
    </span>
  );
}
