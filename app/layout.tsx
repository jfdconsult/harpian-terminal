import type { Metadata } from "next";
import MobileHint from "@/components/MobileHint";
import "./globals.css";

export const metadata: Metadata = {
  title: "HARPIAN ETP Terminal",
  description: "ETP product terminal — Harpian Capital",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        <MobileHint />
        {children}
      </body>
    </html>
  );
}
