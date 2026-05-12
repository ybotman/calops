'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFixtureFor } from './fixtures';

/**
 * useMongoHealth — fetches M0 health from CALBEAF-106 endpoint via calops
 * `/api/ops/[...path]` proxy (which forwards with the Azure Functions key
 * server-side and passes through the firebase bearer token).
 *
 * Returns a mock fixture when `config.useMockData` is true. Same return
 * shape in both modes.
 */
export function useMongoHealth(config) {
  const { getAuthToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    if (!config?.enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    if (config.useMockData) {
      const state =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('mockState')
          : null;
      setData(getFixtureFor(state || 'baseline'));
      setLoading(false);
      return;
    }

    try {
      const token = getAuthToken ? await getAuthToken() : null;
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(config.endpoint, { headers, credentials: 'include' });
      if (!res.ok) throw new Error(`health endpoint ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message || 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, [config?.enabled, config?.useMockData, config?.endpoint, getAuthToken]);

  useEffect(() => {
    fetchHealth();
    const ms = config?.refreshIntervalMs;
    if (!ms || config?.useMockData) return;
    const id = setInterval(fetchHealth, ms);
    return () => clearInterval(id);
  }, [fetchHealth, config?.refreshIntervalMs, config?.useMockData]);

  return { data, loading, error, refetch: fetchHealth };
}
