import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800']
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: 'AMH Kalmunai — HO & RHO Rotation App',
  description:
    'Ashraff Memorial Hospital (AMH), Kalmunai • Ministry of Health Sri Lanka Official House Officer and RHO Rotation Portal',
  manifest: `${basePath}/manifest.json`,
  icons: {
    icon: `${basePath}/icon.svg`,
    apple: `${basePath}/icon.svg`
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AMH Rotation'
  }
};

export const viewport: Viewport = {
  themeColor: '#5A9BF6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <body
        className="bg-[#F4F7FE] text-[#1B2559] antialiased min-h-screen font-sans selection:bg-[#5A9BF6] selection:text-white"
        suppressHydrationWarning
      >
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
