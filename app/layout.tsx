import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dycem Data Centers | Connection Test",
  description: "Test your device's live network latency with Dycem Data Centers.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

