import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import ChatRoomSidebar from "@/components/ChatRoomSidebar";

export const metadata: Metadata = {
  title: "Citizen Voice — Know Your Representatives",
  description:
    "Know Your Representatives. Understand the Laws. Shape Your Community.",
  manifest: "/site.webmanifest",
  other: {
    "google-adsense-account": "ca-pub-1184595877548269",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* AdSense — loaded once, site-wide. `strategy="afterInteractive"`
            keeps it from blocking first paint on a civic-info site where
            speed matters more than ad load time. */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1184595877548269"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-[#0E1225]">
        {children}
        <ChatRoomSidebar />
      </body>
    </html>
  );
}
