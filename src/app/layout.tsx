import { Inter } from "next/font/google";
import "./globals.css";
import { PrivyClientProvider } from "@/components/providers/privy-provider";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "HashVault - Decentralized Storage Platform",
  description: "Secure, decentralized file storage powered by IPFS",
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
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PrivyClientProvider>
            <div className="flex flex-col min-h-screen">
              {children}
            </div>
            <ToasterProvider />
          </PrivyClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
