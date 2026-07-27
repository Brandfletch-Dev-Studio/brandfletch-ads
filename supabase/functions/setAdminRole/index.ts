import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Roles that can change other users' roles
const ADMIN_ROLES = ['admin', 'super_admin']

// All valid roles that can be assigned — must stay in sync with permissions.js
const VALID_ROLES = [
  'super_admin', 'admin',
  'platform_sales', 'platform_finance', 'platform_director_ops',
  'ads_manager', 'ads_sales', 'ads_finance',
  'campaign_manager',
  'user',
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // Verify caller is authenticated
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await supabaseUser.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check caller role from User table
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: callerProfile } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', caller.id)
      .single()

    const callerRole = (callerProfile as any)?.role
    if (!ADMIN_ROLES.includes(callerRole)) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { userId, role } = await req.json()
    if (!userId || !role) {
      return new Response(JSON.stringify({ error: 'userId and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate the role being assigned
    if (!VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role "${role}". Valid roles: ${VALID_ROLES.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Update the User table (source of truth for app role checks)
    const { error: dbError } = await supabaseAdmin
      .from('User')
      .update({ role })
      .eq('id', userId)

    if (dbError) throw dbError

    // 2. Update auth user metadata so role persists across sessions
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    })

    if (authError) {
      // Non-fatal — DB was already updated
      console.warn('Auth metadata update failed:', authError.message)
    }

    return new Response(JSON.stringify({ success: true, userId, role }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
