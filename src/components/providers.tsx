'use client';

import { ReactNode, useEffect, useState } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Prevent hydration mismatch for Zustand stores that use localStorage
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    // Return children without client-side store data to prevent hydration mismatch
    return <>{children}</>;
  }

  return <>{children}</>;
}
