import { Providers } from '@/components/providers';
import { WalletConnect } from '@/components/wallet-connect';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Shape MCP Server Demo',
  description:
    'Shape is the culture-first L2 built on top of Ethereum to power the new NFT economy',
  openGraph: {
    type: 'website',
    url: 'https://shape-mcp-server-demo.vercel.app',
    title: 'Shape',
    siteName: 'Shape',
    description:
      'Shape is the culture-first L2 built on top of Ethereum to power the new NFT economy',
    images: [
      {
        url: `https://shape-mcp-server-demo.vercel.app/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: 'Shape',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {/* Background banner handled via body::before in globals.css */}
        <Providers>
          <div className="relative z-10 min-h-screen font-[family-name:var(--font-geist-sans)]">
            <header className="border-b">
              <div className="container mx-auto max-w-5xl flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center">
                  <img src="/cards/logo.png" alt="Logo" className="h-12 w-12 rounded-sm mr-2" />
                  {/* DEEPLE TILES LOGO */}
                  {/* <svg
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    viewBox="0 0 797.717 221.585"
                    className="h-6"
                    fill="currentColor"
                  >
                    <circle
                      cx="110.793"
                      cy="110.793"
                      r="110.793"
                      className="fill-foreground stroke-foreground dark:fill-background dark:stroke-foreground"
                      strokeWidth="4"
                    />
                    <path d="M306.537,171.41c-5.863-.343-11.52-1.419-16.969-3.229-5.451-1.81-10.279-4.287-14.488-7.432-4.21-3.142-7.441-6.9-9.696-11.274l23.226-9.021c.902,1.368,2.368,2.819,4.397,4.356,2.029,1.538,4.454,2.819,7.272,3.844,2.819,1.025,5.919,1.538,9.302,1.538,2.856,0,5.581-.359,8.174-1.077,2.593-.717,4.697-1.827,6.314-3.331,1.616-1.502,2.424-3.449,2.424-5.842,0-2.527-.958-4.493-2.875-5.895-1.917-1.399-4.323-2.46-7.216-3.177-2.895-.718-5.694-1.384-8.4-1.999-7.142-1.298-13.775-3.313-19.9-6.048-6.127-2.732-11.049-6.269-14.77-10.608-3.721-4.339-5.581-9.584-5.581-15.734,0-6.766,1.973-12.608,5.919-17.528s9.094-8.712,15.447-11.377c6.351-2.665,13.209-3.998,20.577-3.998,8.944,0,17.156,1.691,24.636,5.074,7.479,3.383,13.398,8.148,17.758,14.299l-21.761,11.685c-1.054-1.64-2.52-3.159-4.397-4.561-1.879-1.4-4.022-2.562-6.427-3.485-2.406-.923-4.924-1.451-7.554-1.589-3.382-.136-6.465.138-9.246.82-2.782.684-5.017,1.845-6.708,3.484-1.691,1.641-2.537,3.828-2.537,6.561,0,2.598,1.127,4.527,3.382,5.791,2.255,1.266,4.979,2.239,8.174,2.921,3.194.685,6.258,1.436,9.189,2.255,6.614,1.983,12.834,4.408,18.66,7.279,5.824,2.87,10.503,6.39,14.038,10.558,3.532,4.168,5.224,9.157,5.074,14.965,0,6.629-2.181,12.42-6.54,17.373-4.36,4.956-9.979,8.73-16.856,11.326-6.878,2.597-14.226,3.622-22.043,3.075Z" />
                   </svg> */}
                   <span className="ml-2 font-semibold">Deeple Tiles</span>
                 </Link>

                <div className="flex items-center gap-4">
                  <Link href="/game" className="text-sm font-medium hover:underline">Play Game</Link>
                  <Link href="/leaderboard" className="text-sm font-medium hover:underline">Leaderboard</Link>
                  <Link href="/public" className="text-sm font-medium hover:underline">Publications</Link>
                  <WalletConnect />
                </div>
              </div>
            </header>

            <main className="container mx-auto max-w-5xl px-4 py-8">{children}</main>

            <footer className="border-t py-6 md:py-0">
              <div className="container mx-auto max-w-5xl flex items-center justify-between gap-4 px-4 sm:h-16">
                <Link
                  href="https://shape.network/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground text-left text-sm leading-loose hover:underline"
                >
                  shape.network
                </Link>
                <div className="flex items-center gap-8">
                  <Link
                    href="https://x.com/Shape_L2"
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="sr-only">Twitter/X</span>
                  </Link>
                  <Link
                    href="http://discord.com/invite/shape-l2"
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                    <span className="sr-only">Discord</span>
                  </Link>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
