import { useEffect } from 'react';
import { useSiteStore } from '@/store/use-site-store';

export function useSites() {
  const { 
    sites, 
    isLoading, 
    error, 
    fetchSites,
    addSite,
    updateSite,
    deleteSite,
    siteTypes,
    fetchSiteTypes
  } = useSiteStore();

  useEffect(() => {
    fetchSites();
    fetchSiteTypes();
  }, [fetchSites, fetchSiteTypes]);

  return {
    sites,
    siteTypes,
    isLoading,
    error,
    fetchSites,
    addSite,
    updateSite,
    deleteSite
  };
}