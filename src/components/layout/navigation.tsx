'use client';

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/lib/hooks/use-auth";
import { ClientOnly } from "@/components/providers/client-only";

export function Navigation() {
  const { login } = useAuth();

  return (
    <ClientOnly>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto max-w-6xl py-4 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Logo size={32} />
            <span className="font-bold text-xl text-white">HashVault</span>
          </div>
          <Button onClick={() => login && login()} variant="outline" className="border-white/20 hover:bg-white/10">
            Connect Wallet
          </Button>
        </div>
      </nav>
    </ClientOnly>
  );
} 