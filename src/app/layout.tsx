// src/app/layout.tsx
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