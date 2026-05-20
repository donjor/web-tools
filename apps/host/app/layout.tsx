import type { Metadata } from "next";
import { createRootMetadata } from "@/lib/metadata";
import { SiteFooter } from "@/components/site-footer";
import { PomodoroProvider } from "@/components/pomodoro-provider";
import "./globals.css";

export const metadata: Metadata = createRootMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col antialiased">
        <PomodoroProvider>
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </PomodoroProvider>
      </body>
    </html>
  );
}
