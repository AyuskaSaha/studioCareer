
'use client';

import { PageHeader } from '@/components/page-header';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader title="Employer Dashboard" />
      <main className="flex-1 bg-background">
        {isClient ? (
          children
        ) : (
          <div className="container mx-auto max-w-7xl py-8 px-4 flex justify-center items-center h-[calc(100vh-8rem)]">
            <Loader2 className="h-16 w-16 animate-spin" />
          </div>
        )}
      </main>
    </div>
  );
}
