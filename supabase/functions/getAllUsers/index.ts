import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Roles that are allowed to view all users — must stay in sync with src/lib/permissions.js
const ALLOWED_ROLES = [
  'super_admin', 'admin',
  'platform_sales', 'platform_finance', 'platform_director_ops',
  'ads_manager', 'ads_sales', 'ads_finance',
  'campaign_manager',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Verify the calling user is authenticated + has permission to view users
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check that the caller has a staff role with users.view permission
    const { data: callerProfile } = await userClient
      .from('User').select('role').eq('id', user.id).single()

    const callerRole = (callerProfile as any)?.role
    if (!ALLOWED_ROLES.includes(callerRole)) {
      return new Response(JSON.stringify({ error: 'Forbidden — insufficient permissions' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role to bypass RLS and fetch ALL users
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: users, error: usersError } = await adminClient
      .from('User')
      .select('*')
      .order('created_date', { ascending: false })

    if (usersError) {
      return new Response(JSON.stringify({ error: usersError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ users: users ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
