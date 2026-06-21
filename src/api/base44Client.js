/**
 * Supabase Shim Layer — replaces @base44/sdk
 * 
 * This file exposes the exact same `base44` interface that the app
 * currently uses (base44.entities.*, base44.auth.*, base44.functions.*)
 * but routes everything to Supabase behind the scenes.
 * 
 * No other file in the app needs to change — they all import { base44 }
 * from here and call the same methods they always have.
 */

import { createClient } from '@supabase/supabase-js';

// ── Supabase client ───────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ── Entity wrapper ────────────────────────────────────────────────────────────
// Mimics base44.entities.EntityName.list/get/create/update/delete/filter

function createEntityWrapper(entityName) {
  return {
    // list({ limit, skip, sort, ...filters }) → array
    async list(params = {}) {
      const { limit = 100, skip = 0, sort, ...filters } = params;
      let query = supabase.from(entityName).select('*');

      // Apply filters (exact match)
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }

      // Pagination
      if (limit) query = query.range(skip, skip + limit - 1);

      // Sorting — Base44 sort format: "-created_date" or "name"
      if (sort) {
        if (sort.startsWith('-')) {
          query = query.order(sort.slice(1), { ascending: false });
        } else {
          query = query.order(sort, { ascending: true });
        }
      } else {
        query = query.order('created_date', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    // get(id) → single record
    async get(id) {
      const { data, error } = await supabase
        .from(entityName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    // create(data) → created record
    async create(data) {
      const { data: result, error } = await supabase
        .from(entityName)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    // update(id, data) → updated record
    async update(id, data) {
      // Base44 PATCH drops null values — Supabase preserves them.
      // This is actually better behavior, but we keep the interface identical.
      const { data: result, error } = await supabase
        .from(entityName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    // delete(id)
    async delete(id) {
      const { error } = await supabase
        .from(entityName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },

    // filter(queryObj, options) → array
    // Supports: exact match, { filter_type: 'in'/'not_in'/'like'/'gt'/'gte'/'lt'/'lte' }
    async filter(queryObj = {}, options = {}) {
      const { limit = 100, skip = 0, sort } = options;
      let query = supabase.from(entityName).select('*');

      for (const [key, value] of Object.entries(queryObj)) {
        if (value === undefined || value === null) continue;

        // Check if the value has a filter_type wrapper
        // Base44 format: { field: { filter_type: 'gt', value: 100 } }
        if (typeof value === 'object' && value !== null && value.filter_type) {
          const { filter_type, value: filterValue } = value;
          switch (filter_type) {
            case 'in':
              query = query.in(key, filterValue);
              break;
            case 'not_in':
              query = query.not(key, 'in', filterValue);
              break;
            case 'like':
              query = query.ilike(key, `%${filterValue}%`);
              break;
            case 'gt':
              query = query.gt(key, filterValue);
              break;
            case 'gte':
              query = query.gte(key, filterValue);
              break;
            case 'lt':
              query = query.lt(key, filterValue);
              break;
            case 'lte':
              query = query.lte(key, filterValue);
              break;
            default:
              query = query.eq(key, filterValue);
          }
        } else {
          query = query.eq(key, value);
        }
      }

      if (limit) query = query.range(skip, skip + limit - 1);

      if (sort) {
        if (sort.startsWith('-')) {
          query = query.order(sort.slice(1), { ascending: false });
        } else {
          query = query.order(sort, { ascending: true });
        }
      } else {
        query = query.order('created_date', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  };
}

// ── Build entities proxy ──────────────────────────────────────────────────────
// Any base44.entities.SomeEntity call will auto-create a wrapper

const entitiesProxy = new Proxy({}, {
  get(target, prop) {
    if (!(prop in target)) {
      target[prop] = createEntityWrapper(prop);
    }
    return target[prop];
  },
});

// ── Auth wrapper ──────────────────────────────────────────────────────────────
// Mimics base44.auth.me(), base44.auth.logout(), base44.auth.redirectToLogin(), base44.auth.inviteUser()

const authWrapper = {
  // Get current user (with profile data from User table)
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw { status: 401, message: 'Not authenticated' };

    // Fetch profile from User table
    const { data: profile, error: profileError } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Return basic auth user if no profile exists yet
      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
        role: user.user_metadata?.role || 'user',
        ...user.user_metadata,
      };
    }

    return profile;
  },

  // Logout
  async logout(returnUrl) {
    await supabase.auth.signOut();
    if (returnUrl) {
      window.location.href = returnUrl;
    }
  },

  // Redirect to login
  redirectToLogin(returnUrl) {
    const redirectTo = returnUrl || window.location.href;
    // For Supabase, we redirect to our own login page which uses supabase.auth.signInWithPassword
    window.location.href = `/login?redirect=${encodeURIComponent(redirectTo)}`;
  },

  // Invite user (admin function)
  async inviteUser(email, metadata = {}) {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: metadata,
    });
    if (error) throw error;
    return data;
  },
};

// ── Functions wrapper ─────────────────────────────────────────────────────────
// Mimics base44.functions.functionName() and base44.functions.invoke()

const functionsProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === 'invoke') {
      // base44.functions.invoke(functionName, payload)
      return async (functionName, payload = {}) => {
        const { data, error } = await supabase.rpc(functionName, payload);
        if (error) throw error;
        return data;
      };
    }
    // Direct call: base44.functions.functionName(payload)
    return async (payload = {}) => {
      const { data, error } = await supabase.rpc(prop, payload);
      if (error) throw error;
      return data;
    };
  },
});

// ── Export the base44-compatible client ─────────────────────────────────────────

export const base44 = {
  entities: entitiesProxy,
  auth: authWrapper,
  functions: functionsProxy,
  supabase, // Expose raw supabase client for direct access when needed
};

export default base44;
