import { PageHeader } from '@/components/page-header';

export default function JobSeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader title="Job Seeker Dashboard" />
      <main className="flex-1 bg-background">{children}</main>
    </div>
  );
}
