import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // NOTE: always resolve with HTTP 200 and put success/error in the JSON body.
  // The frontend base44Client shim throws a generic message on non-2xx status,
  // swallowing any custom error text — matching the convention used by
  // paychanguCheckout/verifyPaychanguPayment elsewhere in this codebase.
  const respond = (body) => new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return respond({ success: false, error: 'Unauthorized' })
    }

    // Verify the caller via their own JWT (anon key + auth header)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await supabaseUser.auth.getUser()
    if (!caller) {
      return respond({ success: false, error: 'Unauthorized' })
    }

    const { code } = await req.json()
    const clean = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')

    if (clean.length < 4 || clean.length > 20) {
      return respond({ success: false, error: 'Code must be 4-20 characters (letters, numbers, dashes only)' })
    }

    // Service-role client — bypasses RLS so we can check uniqueness across ALL users
    // (a regular user's own RLS policy only lets them SELECT their own row, so this
    // check would silently never catch collisions with other affiliates otherwise)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: existing, error: lookupErr } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('referral_code', clean)
      .neq('id', caller.id)
      .limit(1)

    if (lookupErr) throw lookupErr

    if (existing && existing.length > 0) {
      return respond({ success: false, error: 'That code is already taken — try another' })
    }

    const { error: updateErr } = await supabaseAdmin
      .from('User')
      .update({ referral_code: clean })
      .eq('id', caller.id)

    if (updateErr) throw updateErr

    return respond({ success: true, referral_code: clean })
  } catch (err) {
    return respond({ success: false, error: err?.message || 'Failed to set referral code' })
  }
})
