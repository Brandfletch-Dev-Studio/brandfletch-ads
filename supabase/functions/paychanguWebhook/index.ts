import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const rawBody = await req.text()
    const signature = req.headers.get('Signature')
    const webhookSecret = Deno.env.get('PAYCHANGU_SECRET_KEY')

    if (!webhookSecret) {
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify HMAC signature
    const computedSig = createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
    if (signature !== computedSig) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.parse(rawBody)

    // Only process successful charge events
    if (payload.event_type !== 'api.charge.payment' || payload.status !== 'success') {
      return new Response(JSON.stringify({ received: true, status: 'ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tx_ref = payload.reference
    if (!tx_ref) {
      return new Response(JSON.stringify({ error: 'No reference in payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse tx_ref: BF-DESIGN-[id]-[ts] or BF-CAMP-[id]-[ts]
    const parts = tx_ref.split('-')
    const paymentType = parts[1] // DESIGN or CAMP

    // Re-verify with Paychangu API
    const verifyRes = await fetch(`https://api.paychangu.com/verify-payment/${tx_ref}`, {
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${webhookSecret}` },
    })
    const verifyData = await verifyRes.json()
    if (verifyData.status !== 'success' || verifyData.data?.status !== 'success') {
      return new Response(JSON.stringify({ verified: false, status: 'failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const txData = verifyData.data

    // ── Design subscription ──
    if (paymentType === 'DESIGN' && parts[2]) {
      const subscriptionId = parts[2]
      const { data: subscription } = await adminClient
        .from('PlatformSubscription').select('*').eq('id', subscriptionId).single()

      if (subscription && (subscription as any).status === 'pending') {
        const startDate = new Date()
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)

        await adminClient.from('PlatformSubscription').update({
          status: 'active', payment_method: 'Paychangu',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        }).eq('id', subscriptionId)

        await adminClient.from('WalletTransaction').insert({
          user_id: (subscription as any).user_id, type: 'payment',
          amount: txData.amount, currency: txData.currency,
          payment_method: 'Paychangu', payment_reference: tx_ref,
          status: 'completed', description: 'Design subscription via Paychangu (webhook)',
        })

        await adminClient.from('Notification').insert({
          recipient_id: (subscription as any).user_id,
          title: 'Design Subscription Activated',
          message: 'Your design subscription has been activated successfully. You can now request designs!',
          type: 'payment_confirmed', is_read: false,
        })

        await maybeCreateAffiliateCommission(
          adminClient, (subscription as any).user_id, 'designs',
          'Design Subscription', txData.amount, txData.currency,
        )
      }
    }

    // ── UGC Ads order (Brandfletch Studios) ──
    // tx_ref format from UgcAds.jsx is BF-UGC-[id]-[ts], but this webhook
    // previously only recognized DESIGN/CAMP — UGC payments fell through
    // untouched (order stayed 'pending_payment' forever server-side even
    // though Paychangu had actually charged the customer).
    if (paymentType === 'UGC' && parts[2]) {
      const orderId = parts[2]
      const { data: order } = await adminClient
        .from('UgcOrder').select('*').eq('id', orderId).single()

      if (order && (order as any).payment_status !== 'paid') {
        await adminClient.from('UgcOrder').update({
          status: 'awaiting_brief',
          payment_status: 'paid',
          payment_method: 'Paychangu',
          payment_reference: tx_ref,
        }).eq('id', orderId)

        await adminClient.from('WalletTransaction').insert({
          user_id: (order as any).user_id, type: 'payment',
          amount: txData.amount, currency: txData.currency,
          payment_method: 'Paychangu', payment_reference: tx_ref,
          status: 'completed', description: `UGC Ad order via Paychangu (webhook) - ${(order as any).package || ''}`,
        })

        await adminClient.from('Notification').insert({
          recipient_id: (order as any).user_id,
          title: 'UGC Ad Order Payment Confirmed',
          message: 'Your payment was received — our team will begin production shortly.',
          type: 'payment_confirmed', is_read: false,
        })

        await maybeCreateAffiliateCommission(
          adminClient, (order as any).user_id, 'studios',
          `UGC Ad Order - ${(order as any).package || ''}`, txData.amount, txData.currency,
        )
      }
    }

    // ── Campaign ──
    if (paymentType === 'CAMP' && parts[2]) {
      const campaignId = parts[2]
      const { data: campaign } = await adminClient.from('Campaign').select('*').eq('id', campaignId).single()

      if (campaign && (campaign as any).status === 'awaiting_payment') {
        await adminClient.from('Campaign').update({
          status: 'pending_review', payment_method: 'Paychangu',
          payment_reference: tx_ref, payment_type: 'external',
        }).eq('id', campaignId)

        await adminClient.from('WalletTransaction').insert({
          user_id: (campaign as any).user_id, type: 'payment',
          amount: txData.amount, currency: txData.currency,
          payment_method: 'Paychangu', payment_reference: tx_ref, campaign_id: campaignId,
          status: 'completed',
          description: `Campaign payment via Paychangu (webhook) - ${(campaign as any).page_name || ''}`,
        })

        await adminClient.from('Notification').insert({
          recipient_id: (campaign as any).user_id,
          title: 'Campaign Payment Received',
          message: `Your campaign "${(campaign as any).campaign_name}" payment has been received and is pending review.`,
          type: 'payment_confirmed', campaign_id: campaignId, is_read: false,
        })

        // Trigger email alerts (non-blocking, best-effort)
        adminClient.functions.invoke('campaignEmailAlerts', {
          body: { campaign_id: campaignId, event_type: 'payment_confirmed' },
        }).catch(() => {})

        await maybeCreateAffiliateCommission(
          adminClient, (campaign as any).user_id, 'meta_ads',
          (campaign as any).campaign_name || 'Meta Ads Campaign', txData.amount, txData.currency,
        )
      }
    }

    return new Response(JSON.stringify({ received: true, status: 'processed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
