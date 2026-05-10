'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './queryClient';
import { Toaster } from 'sonner';

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors />
    </QueryClientProvider>
  );
}
