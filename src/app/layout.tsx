import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";

const VALID_THEMES = ["demo", "chinesenotes", "ntireader", "hbreader"] as const;
type Theme = (typeof VALID_THEMES)[number];

function resolveTheme(): Theme {
  const raw = process.env.SITE_THEME ?? "demo";
  return (VALID_THEMES as readonly string[]).includes(raw)
    ? (raw as Theme)
    : "demo";
}

const THEME_ICONS: Record<Theme, { url: string; type: string }> = {
  demo:         { url: "/icon.svg",   type: "image/svg+xml" },
  chinesenotes: { url: "/cnicon.svg", type: "image/svg+xml" },
  ntireader:    { url: "/nticon.svg", type: "image/svg+xml" },
  hbreader:     { url: "/hbicon.png", type: "image/png" },
};

const THEME_TITLES: Record<Theme, string> = {
  demo:         "Chinese-English Dictionary Demo",
  chinesenotes: "Chinese Notes Chinese-English Dictionary 中文笔记汉英词典",
  ntireader:    "NTI Reader Chinese-English Buddhist Dictionary",
  hbreader:     "HB Reader Chinese-English Buddhist Dictionary",
};

const _theme = resolveTheme();
const _icon = THEME_ICONS[_theme];
const _title = THEME_TITLES[_theme];

export const metadata: Metadata = {
  title: _title,
  description: "Look up Chinese words and phrases in English",
  icons: { icon: [_icon] },
};

const BUILD_DATE = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC";
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className={`theme-${_theme}`}>
      <body className="bg-gray-100 text-gray-900 min-h-screen font-sans flex flex-col">
        <Header title={_title} />
        <main className="flex-1">{children}</main>
        <footer className="mt-8 py-4 px-6 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
          Copyright Fo Guang Shan 佛光山 2013-2026. Last updated on {BUILD_DATE}.{" "}
          This work may be freely reused under the{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="underline hover:text-gray-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Creative Commons Attribution 4.0 International License
          </a>{" "}
          with attribution. Please send comments to{" "}
          <a href="mailto:alex@chinesenotes.com" className="underline hover:text-gray-700">
            alex@chinesenotes.com
          </a>
          .
        </footer>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-03MVHHCXJ6"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-03MVHHCXJ6');
          `}
        </Script>
        {RECAPTCHA_SITE_KEY && (
          <Script
            src={`https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
