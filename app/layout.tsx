import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mina Rahi — Selected Works",
  description: "A collection of drawings, studies, and digital artwork.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
