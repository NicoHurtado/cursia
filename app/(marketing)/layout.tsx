import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { SessionProvider } from '@/components/session-provider';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar variant="marketing" />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </SessionProvider>
  );
}
