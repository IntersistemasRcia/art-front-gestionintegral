// src/app/layout.tsx
import type { Viewport } from 'next';
import Providers from './Providers';
import "./normalize.css";
import "@/styles/globals.css";

export const metadata = {
  title: "ART Gestión Integral",
  description: "ART - App Web",
  other: {
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <body translate="no" className="notranslate">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}