/**
 * useAppConfig — fetches app-wide configuration from the AppConfig table.
 * Admin-editable at runtime; no env var rebuild needed.
 *
 * Usage:
 *   const { config, loading } = useAppConfig();
 *   config.meta_business_id  // e.g. "1531314561797001"
 *
 * Or for a single key:
 *   const { value, loading } = useAppConfigValue('meta_business_id');
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Module-level cache so we only fetch once per page load
let _cache = null;
let _promise = null;

async function fetchConfig() {
  if (_cache) return _cache;
  if (_promise) return _promise;

  _promise = base44.entities.AppConfig.list({})
    .then(rows => {
      const map = {};
      for (const row of rows) map[row.key] = row.value;
      _cache = map;
      return map;
    })
    .catch(() => {
      _promise = null; // allow retry on error
      return {};
    });

  return _promise;
}

/** Invalidate the cache (call after admin saves a new value) */
export function invalidateAppConfig() {
  _cache = null;
  _promise = null;
}

/** Returns { config: { key: value, ... }, loading } */
export function useAppConfig() {
  const [config, setConfig] = useState(_cache || {});
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) { setConfig(_cache); setLoading(false); return; }
    setLoading(true);
    fetchConfig().then(c => { setConfig(c); setLoading(false); });
  }, []);

  return { config, loading };
}

/** Returns { value, loading } for a single config key */
export function useAppConfigValue(key) {
  const { config, loading } = useAppConfig();
  return { value: config[key] ?? null, loading };
}
