import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PreFit — AI 피부·성형 컨시어지",
  description:
    "검증된 전문의 유튜브 데이터 기반 AI 상담 플랫폼. 신뢰할 수 있는 피부·성형 정보를 제공합니다.",
  keywords: ["피부", "성형", "AI 상담", "PreFit", "뷰티 컨설팅"],
  openGraph: {
    title: "PreFit — AI 피부·성형 컨시어지",
    description: "검증된 전문의 데이터 기반 AI 상담",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#6ecfc0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
