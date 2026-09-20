import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono, Poppins } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { PageTransitionProvider } from '@/components/layout/PageTransition';
import { ScrollPageTransition } from '@/components/layout/ScrollPageTransition';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'HireFlow — Autonomous Executive Talent Intelligence',
  description: 'Evidence-backed candidate screening, requirement mapping, personalized interview intelligence, and structured evaluation reports.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${poppins.variable} antialiased`}
    >
      <body className="min-h-screen">
        <SmoothScroll>
          <PageTransitionProvider>
            <ScrollPageTransition />
            <AppShell>
              {children}
            </AppShell>
          </PageTransitionProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}


