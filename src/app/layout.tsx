import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chinese Notes - Chinese-English Dictionary",
  description: "Look up Chinese words and phrases in English",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <html>
      <body>{children}</body>
    </html>
  );
}
