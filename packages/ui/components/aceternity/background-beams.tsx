"use client";
// Aceternity UI — Background Beams (free)
// Source: https://ui.aceternity.com/components/background-beams
// Adapted to inline cn() and our token color names.
import React from "react";
import { motion } from "motion/react";
import { cn } from "@web-tools/ui/lib/utils";

export const BackgroundBeams = React.memo(function BackgroundBeams({
  className,
}: {
  className?: string;
}) {
  const paths = [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867",
    "M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859",
    "M-359 -213C-359 -213 -291 192 173 319C637 446 705 851 705 851",
    "M-352 -221C-352 -221 -284 184 180 311C644 438 712 843 712 843",
  ];

  return (
    <div
      className={cn(
        "absolute inset-0 flex h-full w-full items-center justify-center [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)]",
        className,
      )}
    >
      <svg
        className="pointer-events-none absolute z-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859M-359 -213C-359 -213 -291 192 173 319C637 446 705 851 705 851M-352 -221C-352 -221 -284 184 180 311C644 438 712 843 712 843"
          stroke="url(#paint0_radial)"
          strokeOpacity="0.05"
          strokeWidth="0.5"
        />
        {paths.map((path, index) => (
          <motion.path
            key={`path-${index}`}
            d={path}
            stroke={`url(#linearGradient-${index})`}
            strokeOpacity="0.4"
            strokeWidth="0.5"
          />
        ))}
        <defs>
          {paths.map((_, index) => (
            <motion.linearGradient
              id={`linearGradient-${index}`}
              key={`gradient-${index}`}
              initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
              animate={{ x1: ["0%", "100%"], x2: ["0%", "95%"], y1: ["0%", "100%"], y2: ["0%", "100%"] }}
              transition={{
                duration: Math.random() * 10 + 10,
                ease: "easeInOut",
                repeat: Infinity,
                delay: Math.random() * 10,
              }}
            >
              <stop stopColor="#18CCFC" stopOpacity="0" />
              <stop stopColor="#18CCFC" />
              <stop offset="32.5%" stopColor="#6344F5" />
              <stop offset="100%" stopColor="#AE48FF" stopOpacity="0" />
            </motion.linearGradient>
          ))}
          <radialGradient
            id="paint0_radial"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(352 34) rotate(90) scale(555 1117.16)"
          >
            <stop offset="0.0625" stopColor="#d4d4d4" />
            <stop offset="0.375" stopColor="#d4d4d4" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
});
