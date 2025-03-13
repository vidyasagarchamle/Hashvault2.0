"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Cloud, Lock } from 'lucide-react';
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  const { login, authenticated } = usePrivy();
  const router = useRouter();

  if (authenticated) {
    router.push('/dashboard');
    return null;
  }

  const features = [
    {
      icon: Shield,
      title: "Secure Storage",
      description: "Your files are encrypted and stored on decentralized networks"
    },
    {
      icon: Cloud,
      title: "Always Available",
      description: "Access your files anywhere, anytime with IPFS technology"
    },
    {
      icon: Lock,
      title: "Web3 Native",
      description: "Full control over your data with wallet-based authentication"
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto max-w-6xl py-2 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Logo size={32} />
            <span className="font-bold text-xl text-gray-900 dark:text-white">HashVault</span>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
            <Button onClick={() => login()}>Connect Wallet</Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-white dark:bg-gray-900 flex flex-col">
        {/* Hero Section */}
        <section className="pt-8 pb-2 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                Decentralized Storage
                <br />
                for the Web3 Era
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Store your files securely on the decentralized web. Fast, reliable, and always accessible.
              </p>
              <div className="mt-4">
                <Button onClick={() => login()} size="lg" className="px-6 group">
                  Get Started <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="flex-1 pt-8 px-4 bg-white dark:bg-gray-900 flex items-start">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-8 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <p className="text-center text-gray-500 dark:text-gray-400 text-xs py-2">
            © 2024 HashVault. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
