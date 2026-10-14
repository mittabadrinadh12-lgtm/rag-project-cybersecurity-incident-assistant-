import type { Metadata } from "next";
import { ConsoleShell } from "@/components/layout/console-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinelRAG — Cybersecurity Incident Assistant",
  description: "A defensive incident investigation workspace for security operations teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ConsoleShell>{children}</ConsoleShell>
      </body>
    </html>
  );
}
