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
  metadataBase: new URL(
    'https://kestrel-interactive-archive.qadgunn.chatgpt.site',
  ),
  title: 'Kestrel Interactive — 独立浏览器游戏档案馆',
  description: '八款彼此独立、却共享同一段隐藏叙事的浏览器游戏。',
  openGraph: {
    title: 'Kestrel Interactive — Small Games. Long Shadows.',
    description:
      'Eight playable browser games share one hidden narrative and persistent local meta-state.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'zh_CN',
    siteName: 'Kestrel Interactive Archive',
    images: [
      {
        url: '/og.png',
        width: 1730,
        height: 909,
        alt: 'Kestrel Interactive — Small Games. Long Shadows.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kestrel Interactive — Small Games. Long Shadows.',
    description:
      'Eight playable browser games share one hidden narrative and persistent local meta-state.',
    images: ['/og.png'],
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
