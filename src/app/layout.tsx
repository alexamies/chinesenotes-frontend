import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chinese Notes - Chinese-English Dictionary",
  description: "Look up Chinese words and phrases in English",
};

const VALID_THEMES = ["demo", "chinesenotes", "ntireader", "hbreader"] as const;
type Theme = (typeof VALID_THEMES)[number];

function resolveTheme(): Theme {
  const raw = process.env.SITE_THEME ?? "demo";
  return (VALID_THEMES as readonly string[]).includes(raw)
    ? (raw as Theme)
    : "demo";
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = resolveTheme();

  return (
    <html lang="zh" className={`theme-${theme}`}>
      <body className="bg-gray-100 text-gray-900 min-h-screen font-sans">{children}</body>
    </html>
  );
}
