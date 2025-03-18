"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Cloud, Lock, Upload, Download, Key, CheckCircle2, Zap, Users, Globe2, Wallet } from 'lucide-react';
import { Logo } from "@/components/ui/logo";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from "@/lib/hooks/use-auth";

function Navigation() {
  const { login } = useAuth();
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto max-w-6xl py-4 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Logo size={32} />
          <span className="font-bold text-xl text-white">HashVault</span>
        </div>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <Button 
              onClick={openConnectModal} 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}
        </ConnectButton.Custom>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <Logo size={32} />
              <span className="font-bold text-xl text-white">HashVault</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              An ecosystem product of WebHash Protocol, providing secure decentralized storage for your files on IPFS.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Product</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-gray-400 hover:text-white text-sm transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#benefits" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Benefits
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Company */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Legal & Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://webhash.io" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">
                  WebHash Protocol
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            © 2024 HashVault. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <a href="https://github.com/vidyasagarchamle/Hash-vault" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="https://twitter.com/HashVaultApp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { ready, authenticated, login } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log("HomePage mounted:", mounted);
    
    if (ready && authenticated) {
      router.push('/dashboard');
    }
  }, [ready, authenticated, router]);

  const features = [
    {
      icon: Shield,
      title: "Secure Storage",
      description: "Your files are stored on decentralized networks, ensuring maximum availability and censorship resistance"
    },
    {
      icon: Cloud,
      title: "Always Available",
      description: "Access your files anywhere, anytime with IPFS technology. No more downtime or server issues"
    },
    {
      icon: Lock,
      title: "Web3 Native",
      description: "Full control over your data with wallet-based authentication. You own your data, not us"
    }
  ];

  const benefits = [
    {
      icon: CheckCircle2,
      title: "Zero Trust Architecture",
      description: "Files are stored directly on IPFS without intermediaries"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for speed and performance"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share files securely with your team"
    },
    {
      icon: Globe2,
      title: "Global Access",
      description: "Access from anywhere in the world"
    }
  ];

  const howItWorks = [
    {
      icon: Upload,
      title: "Upload Files",
      description: "Simply drag and drop your files into HashVault. We store them securely on decentralized networks"
    },
    {
      icon: Key,
      title: "Secure Storage",
      description: "Files are stored on IPFS, ensuring they're always available and resistant to censorship"
    },
    {
      icon: Download,
      title: "Access Anywhere",
      description: "Retrieve your files securely from any device, at any time, with your Web3 wallet"
    }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-6xl relative">
            <div className="text-center space-y-8">
              <div className="inline-block px-6 py-3 bg-white/10 rounded-full text-base font-medium mb-4">
                Decentralized Storage for Web3
              </div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent leading-[1.1]">
                Store Your Files
                <br />
                Permanently on IPFS
              </h1>
              <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Fast, reliable, and always accessible. Your files are stored on decentralized networks, built on the Webhash Protocol for seamless and secure storage.
              </p>
              <div className="flex items-center justify-center gap-4 pt-8">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button 
                      onClick={openConnectModal}
                      size="lg" 
                      className="px-10 py-7 text-xl group bg-white text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                    >
                      Get Started <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </ConnectButton.Custom>
              </div>
              <div className="pt-16 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-white">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                  <span className="text-lg font-medium">Secure Storage</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                  <span className="text-lg font-medium">Decentralized Storage</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                  <span className="text-lg font-medium">Web3 Native</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
          <div className="container mx-auto max-w-6xl relative">
            <div className="text-center mb-16">
              <div className="text-white font-semibold mb-4">FEATURES</div>
              <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Why Choose HashVault?
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="p-8 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-32 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <div className="text-white font-semibold mb-4">BENEFITS</div>
              <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Everything You Need
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="p-6 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group">
                  <benefit.icon className="w-8 h-8 text-white mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-gray-400 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-32 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
          <div className="container mx-auto max-w-6xl relative">
            <div className="text-center mb-16">
              <div className="text-white font-semibold mb-4">PROCESS</div>
              <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                How It Works
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {howItWorks.map((step, index) => (
                <div
                  key={step.title}
                  className="text-center relative group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-8 group-hover:bg-white/20 transition-all">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-white/20 to-transparent"></div>
                  )}
                  <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="p-12 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent relative">
                Ready to Get Started?
              </h2>
              <p className="text-xl mb-8 text-gray-300 relative">
                Join the future of decentralized storage today.
              </p>
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button 
                    onClick={openConnectModal}
                    size="lg" 
                    className="px-8 py-6 text-lg bg-white text-gray-900 hover:bg-gray-100 relative"
                  >
                    Connect Wallet to Begin
                  </Button>
                )}
              </ConnectButton.Custom>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
} 