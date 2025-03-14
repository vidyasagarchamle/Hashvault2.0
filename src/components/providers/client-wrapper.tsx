'use client';

import { useEffect, useState } from "react";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true as soon as the component mounts
    setMounted(true);
    
    // Log to help with debugging
    console.log("ClientWrapper mounted:", mounted);
  }, []);

  // Simply return children without any visibility classes
  return <>{children}</>;
} 