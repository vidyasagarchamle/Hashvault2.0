import { Inter } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ClientWrapper } from "@/components/providers/client-wrapper";
import { RainbowKitClientProvider } from "@/components/providers/rainbow-provider";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HashVault - Decentralized Storage Platform",
  description: "Secure, decentralized file storage powered by IPFS",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className={`${inter.className} antialiased bg-gradient-to-b from-gray-900 via-gray-800 to-black`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <RainbowKitClientProvider>
            <ClientWrapper>
              <div className="flex flex-col min-h-screen">
                {children}
              </div>
            </ClientWrapper>
            <ToasterProvider />
          </RainbowKitClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
