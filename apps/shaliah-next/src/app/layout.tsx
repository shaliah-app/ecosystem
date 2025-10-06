import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import {NextIntlClientProvider} from 'next-intl';
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "Shaliah",
  description: "Shaliah Next with Supabase integration",
};

type Props = {
  children: React.ReactNode;
};

export default function RootLayout({children}: Props) {
  return (
    <html lang="en">
      <body
        className={`${rubik.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
