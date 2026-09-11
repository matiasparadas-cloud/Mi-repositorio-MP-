import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BI de Ventas",
  description: "Panel de indicadores de ventas",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-black antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
