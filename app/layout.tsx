import type { Metadata } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });
const serif = Instrument_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: '400',
});

export const metadata: Metadata = {
  title: 'Kestrel Interactive — Browser Games Archive',
  description: 'Eight small browser games from an independent studio archive.',
  openGraph: {
    title: 'Kestrel Interactive — Small Games. Long Shadows.',
    description:
      'Eight small browser games from an independent studio archive.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Kestrel Interactive — Small Games. Long Shadows.',
    description:
      'Eight small browser games from an independent studio archive.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
        {children}
      </body>
    </html>
  );
}
