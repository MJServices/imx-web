'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function Home() {
  const router = useRouter();

  // Immediately redirect to intake questions form on page load
  useEffect(() => {
    router.push('/intake/questions');
  }, [router]);

  // Show a minimal loading state while redirecting
  return (
    <div className="min-h-screen bg-imx-gray-50">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imx-red mx-auto"></div>
          <p className="mt-4 text-imx-gray-600">Loading intake form...</p>
        </div>
      </div>
    </div>
  );
}
