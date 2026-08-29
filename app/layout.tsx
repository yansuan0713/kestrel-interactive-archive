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
  title: 'Kestrel Interactive — 独立浏览器游戏档案馆',
  description: '八款彼此独立、却共享同一段隐藏叙事的浏览器游戏。',
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
