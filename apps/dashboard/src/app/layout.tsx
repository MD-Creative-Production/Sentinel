import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export const metadata: Metadata = {
  title: {
    default: 'Sentinel Dashboard',
    template: '%s | Sentinel',
  },
  description: 'Real-time monitoring and security alerts for Stellar/EVM smart contracts.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto p-6 space-y-6"
            role="main"
            aria-label="Dashboard content"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
