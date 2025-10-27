import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export function PageHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back to Home</span>
            </Link>
          </Button>
          <div className="hidden md:block">
            <Logo />
          </div>
        </div>
        <h1 className="font-headline text-xl font-semibold text-center md:text-2xl">{title}</h1>
        <div className="w-10"></div> {/* Spacer to balance the layout */}
      </div>
    </header>
  );
}
