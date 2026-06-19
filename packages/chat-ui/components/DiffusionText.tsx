"use client";

import { useEffect, useState } from "react";

const CHARS = "01";

export function DiffusionText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        return text
          .split("")
          .map((char, index) => {
            if (index < iteration) {
              return char;
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("");
      });

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3; 
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}</span>;
}
