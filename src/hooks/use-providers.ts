import { useEffect } from 'react';
import { useProviderStore } from '@/store/use-provider-store';

export function useProviders() {
  const { providers, isLoading, error, fetchProviders } = useProviderStore();

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    providers,
    isLoading,
    error,
  };
} 