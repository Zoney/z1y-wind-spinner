import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grimstad Wind Farm VR | Interactive 3D Visualization",
  description: "Immersive 3D visualization of Grimstad Wind Farm with VR support, real-time controls, and geolocation features",
  keywords: ["wind farm", "VR", "3D visualization", "Grimstad", "renewable energy", "WebXR", "Three.js"],
  authors: [{ name: "Wind Farm VR Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "Grimstad Wind Farm VR | Interactive 3D Visualization",
    description: "Experience the Grimstad Wind Farm in immersive 3D with VR support and real-time controls",
    type: "website",
    siteName: "Grimstad Wind Farm VR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
