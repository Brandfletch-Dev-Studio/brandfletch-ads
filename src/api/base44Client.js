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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars — auth and data calls will fail');
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
    async list(params = {}) {
      // Backward compat: if first arg is a string, treat it as sort
      if (typeof params === 'string') params = { sort: params };
      const { limit = 100, skip = 0, sort, ...filters } = params;
      let query = supabase.from(entityName).select('*');

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
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

    async get(id) {
      const { data, error } = await supabase
        .from(entityName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(data) {
      const { data: result, error } = await supabase
        .from(entityName)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async update(id, data) {
      const { data: result, error } = await supabase
        .from(entityName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async delete(id) {
      const { error } = await supabase
        .from(entityName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },

    async filter(queryObj = {}, options = {}) {
      // Backward compat: if second arg is a string, treat it as sort
      if (typeof options === 'string') options = { sort: options };
      const { limit = 100, skip = 0, sort } = options;
      let query = supabase.from(entityName).select('*');

      for (const [key, value] of Object.entries(queryObj)) {
        if (value === undefined || value === null) continue;

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

const entitiesProxy = new Proxy({}, {
  get(target, prop) {
    if (!(prop in target)) {
      target[prop] = createEntityWrapper(prop);
    }
    return target[prop];
  },
});

// ── Auth wrapper ──────────────────────────────────────────────────────────────
// Full auth API surface matching all Base44 auth calls used in the app

const authWrapper = {
  // Get current user with profile from User table
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw { status: 401, message: 'Not authenticated' };

    const { data: profile } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) return profile;

    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      role: user.user_metadata?.role || 'user',
      ...user.user_metadata,
    };
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // Login with email + password
  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Register new user
  async register({ email, password, full_name, ...metadata }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name, ...metadata },
      },
    });
    if (error) throw error;

    // Create profile in User table
    if (data.user) {
      await supabase.from('User').upsert({
        id: data.user.id,
        email,
        full_name: full_name || email,
        role: 'user',
        ...metadata,
      });
    }

    return data;
  },

  // Verify OTP (for email verification flow)
  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup',
    });
    if (error) throw error;
    return data;
  },

  // Resend OTP
  async resendOtp(email) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
    return data;
  },

  // Update current user profile
  async updateMe(data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw { status: 401, message: 'Not authenticated' };

    // Update auth metadata
    if (data.full_name || data.role) {
      await supabase.auth.updateUser({
        data: { full_name: data.full_name, role: data.role },
      });
    }

    // Upsert User table — works whether the row exists yet or not
    const { data: result, error } = await supabase
      .from('User')
      .upsert({ id: user.id, email: user.email, ...data }, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.error('updateMe error:', error);
      throw error;
    }
    return result;
  },

  // Set token (for manual token management — used by Register page)
  async setToken(token) {
    if (token) {
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: token,
      });
    }
  },

  // Request password reset
  async resetPasswordRequest(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  },

  // Reset password with token
  async resetPassword({ resetToken, newPassword }) {
    // Supabase handles this via the recovery link flow
    // The token is already consumed by the URL redirect
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  // Logout
  async logout(returnUrl) {
    await supabase.auth.signOut();
    window.location.href = returnUrl || '/';
  },

  // Redirect to login
  redirectToLogin(returnUrl) {
    const redirectTo = returnUrl || window.location.href;
    window.location.href = `/login?redirect=${encodeURIComponent(redirectTo)}`;
  },

  // Invite user (admin)
  async inviteUser(email, metadata = {}) {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: metadata,
    });
    if (error) throw error;
    return data;
  },
};

// ── Functions wrapper ─────────────────────────────────────────────────────────

const functionsProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === 'invoke') {
      // base44.functions.invoke('fnName', payload) → Supabase Edge Function
      return async (functionName, payload = {}) => {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload,
        });
        if (error) throw error;
        return data;
      };
    }
    // base44.functions.someFunction(payload) shorthand
    return async (payload = {}) => {
      const { data, error } = await supabase.functions.invoke(prop, {
        body: payload,
      });
      if (error) throw error;
      return data;
    };
  },
});

// ── Export ────────────────────────────────────────────────────────────────────

export const base44 = {
  entities: entitiesProxy,
  auth: authWrapper,
  functions: functionsProxy,
  supabase,
};

export default base44;
