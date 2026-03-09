import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "U4B Dashboard | Uber for Business",
  description: "Automated calling system dashboard for Uber for Business",
  icons: {
    icon: "/vercel.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
