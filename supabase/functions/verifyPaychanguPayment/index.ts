import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { maybeCreateAffiliateCommission } from '../_shared/affiliateCommission.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // User-scoped client (respects RLS)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    // Admin client (bypasses RLS for cross-entity writes)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { tx_ref, campaign_id, subscription_id, order_id, payment_type } = await req.json()
    const secretKey = Deno.env.get('PAYCHANGU_SECRET_KEY')
    if (!secretKey) {
      return new Response(JSON.stringify({ error: 'Paychangu not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify with Paychangu
    const response = await fetch(`https://api.paychangu.com/verify-payment/${tx_ref}`, {
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${secretKey}` },
    })
    const data = await response.json()

    if (data.status !== 'success' || data.data?.status !== 'success') {
      return new Response(JSON.stringify({ verified: false, status: data.data?.status || 'failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const txData = data.data

    // ── Campaign payment ──
    if (payment_type === 'campaign' && campaign_id) {
      await userClient.from('Campaign').update({
        status: 'pending_review',
        payment_method: 'Paychangu',
        payment_reference: tx_ref,
        payment_type: 'external',
      }).eq('id', campaign_id)

      const { data: campaign } = await userClient.from('Campaign').select('*').eq('id', campaign_id).single()

      await adminClient.from('WalletTransaction').insert({
        user_id: user.id,
        type: 'payment',
        amount: txData.amount,
        currency: txData.currency,
        payment_method: 'Paychangu',
        payment_reference: tx_ref,
        campaign_id,
        status: 'completed',
        description: `Campaign payment via Paychangu - ${(campaign as any)?.page_name || ''}`,
      })

      await maybeCreateAffiliateCommission(
        adminClient, user.id, 'meta_ads',
        (campaign as any)?.campaign_name || 'Meta Ads Campaign',
        txData.amount, txData.currency,
      )
    }

    // ── UGC Ads order payment (Brandfletch Studios) ──
    // Previously unhandled entirely: the client always called this with
    // payment_type: 'ugc' and order_id, but this function never read either
    // field — it fell through with no matching branch and still returned
    // { verified: true } at the bottom, so customers were told their payment
    // succeeded while the UgcOrder record silently stayed 'pending_payment'/
    // 'unpaid' forever (no wallet transaction, no affiliate commission).
    if (payment_type === 'ugc' && order_id) {
      const { data: order } = await userClient.from('UgcOrder').select('*').eq('id', order_id).single()

      if (order && (order as any).payment_status !== 'paid') {
        await userClient.from('UgcOrder').update({
          status: 'awaiting_brief',
          payment_status: 'paid',
          payment_method: 'Paychangu',
          payment_reference: tx_ref,
        }).eq('id', order_id)

        await adminClient.from('WalletTransaction').insert({
          user_id: user.id,
          type: 'payment',
          amount: txData.amount,
          currency: txData.currency,
          payment_method: 'Paychangu',
          payment_reference: tx_ref,
          status: 'completed',
          description: `UGC Ad order via Paychangu - ${(order as any)?.package || ''}`,
        })

        await adminClient.from('Notification').insert({
          recipient_id: user.id,
          title: 'UGC Ad Order Payment Confirmed',
          message: 'Your payment was received — our team will begin production shortly.',
          type: 'payment_confirmed', is_read: false,
        })

        await maybeCreateAffiliateCommission(
          adminClient, user.id, 'studios',
          `UGC Ad Order - ${(order as any)?.package || ''}`, txData.amount, txData.currency,
        )
      }
    }

    // ── Design subscription payment ──
    if (payment_type === 'design' && subscription_id) {
      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)

      const { data: existingSub } = await adminClient
        .from('PlatformSubscription').select('*').eq('id', subscription_id).single()

      await userClient.from('PlatformSubscription').update({
        status: 'active',
        payment_method: 'Paychangu',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        quota_used: 0,
        quota_reset_date: endDate.toISOString().split('T')[0],
        ...((existingSub as any)?.monthly_quota ? {} : { monthly_quota: 20 }),
      }).eq('id', subscription_id)

      await adminClient.from('WalletTransaction').insert({
        user_id: user.id,
        type: 'payment',
        amount: txData.amount,
        currency: txData.currency,
        payment_method: 'Paychangu',
        payment_reference: tx_ref,
        status: 'completed',
        description: 'Design subscription via Paychangu',
      })

      await maybeCreateAffiliateCommission(
        adminClient, user.id, 'designs', 'Design Subscription', txData.amount, txData.currency,
      )
    }

    return new Response(JSON.stringify({ verified: true, status: 'success', tx_ref }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
