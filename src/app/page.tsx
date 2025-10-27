
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, Briefcase, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect, useState } from 'react';

export default function Home() {
  const seekerImage = PlaceHolderImages.find(img => img.id === 'job-seeker-card');
  const employerImage = PlaceHolderImages.find(img => img.id === 'employer-card');
  const [year, setYear] = useState(new Date().getFullYear());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setYear(new Date().getFullYear());
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Logo />
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                  Unlock Your Career Potential with AI
                </h1>
                <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl">
                  CareerAI provides intelligent tools for both job seekers and employers to navigate the modern job market.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full pb-12 md:pb-24 lg:pb-32">
          <div className="container grid max-w-6xl items-start gap-8 px-4 md:px-6 lg:grid-cols-2 lg:gap-12">
            
            <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1.5">
              <CardHeader className="p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <User className="h-8 w-8" />
                  </div>
                  <CardTitle className="font-headline text-3xl">For Job Seekers</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Build a winning resume, get AI-powered insights, discover tailored job suggestions, and land your dream job faster.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-6 pt-0">
                {seekerImage && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image src={seekerImage.imageUrl} alt={seekerImage.description} fill className="object-cover" data-ai-hint={seekerImage.imageHint}/>
                  </div>
                )}
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild className="w-full" size="lg">
                  <Link href="/job-seeker">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1.5">
              <CardHeader className="p-6">
                <div className="mb-4 flex items-center gap-4">
                   <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <CardTitle className="font-headline text-3xl">For Employers</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Generate compelling job postings, automatically rank candidates, and identify top talent with our intelligent analysis tools.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-6 pt-0">
                {employerImage && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image src={employerImage.imageUrl} alt={employerImage.description} fill className="object-cover" data-ai-hint={employerImage.imageHint}/>
                  </div>
                )}
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild className="w-full" size="lg">
                   <Link href="/employer">
                    Find Talent <ArrowRight className="ml-2 h-4 w-4" />
                   </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex h-14 items-center justify-center text-sm text-foreground/60">
          <p>&copy; {year} CareerAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
