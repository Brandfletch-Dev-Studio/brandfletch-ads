import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { amount, currency, tx_ref, description, callback_url, return_url } = await req.json()

    const secretKey = Deno.env.get('PAYCHANGU_SECRET_KEY')
    if (!secretKey) {
      return new Response(JSON.stringify({ error: 'Paychangu not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabase
      .from('User')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const fullName = (profile as any)?.full_name || user.email || 'User'
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0] || 'User'
    const lastName = nameParts.slice(1).join(' ') || ''

    const payload = {
      amount: String(amount),
      currency: currency || 'MWK',
      tx_ref,
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      callback_url,
      return_url,
      customization: {
        title: 'Brandfletch Media',
        description: description || 'Payment',
      },
    }

    const response = await fetch('https://api.paychangu.com/payment', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (data.status !== 'success') {
      return new Response(JSON.stringify({ error: data.message || 'Payment initiation failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const checkoutUrl = data.data?.checkout_url || data.checkout_url
    const txRefOut = data.data?.tx_ref || tx_ref

    return new Response(JSON.stringify({ checkout_url: checkoutUrl, tx_ref: txRefOut }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
