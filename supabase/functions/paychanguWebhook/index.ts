import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Shared affiliate commission helper ───────────────────────────────────────
async function maybeCreateAffiliateCommission(
  adminClient: any,
  payingUserId: string,
  serviceType: string,
  productName: string,
  saleAmount: number,
  saleCurrency: string,
) {
  try {
    const { data: payingUser } = await adminClient.from('User').select('*').eq('id', payingUserId).single()
    if (!payingUser?.referred_by) return

    let { data: affiliateUsers } = await adminClient.from('User').select('*').eq('referral_code', payingUser.referred_by)
    let affiliate = affiliateUsers?.[0]
    if (!affiliate) {
      const { data: allUsers } = await adminClient.from('User').select('*')
      affiliate = allUsers?.find((u: any) => {
        const code = u.referral_code || (u.id ? `BF-${u.id.slice(-6).toUpperCase()}` : '')
        return code === payingUser.referred_by
      })
    }
    if (!affiliate) return

    const { data: settingsList } = await adminClient.from('AffiliateSettings').select('*').limit(1)
    const settings = settingsList?.[0]
    if (settings?.program_enabled === false) return

    if (settings?.one_commission_per_client) {
      const { data: existing } = await adminClient
        .from('AffiliateCommission').select('id, is_recurring')
        .eq('affiliate_id', affiliate.id).eq('referred_user_id', payingUserId)
      if ((existing || []).some((c: any) => !c.is_recurring)) return
    }

    const svcType = settings?.[`${serviceType}_commission_type`] || 'global'
    let commissionType = 'fixed', commissionAmount = 0, commissionRate = 0

    if (svcType === 'fixed') {
      commissionType = 'fixed'; commissionAmount = settings[`${serviceType}_fixed_amount`] || 0
    } else if (svcType === 'percentage') {
      commissionType = 'percentage'; commissionRate = settings[`${serviceType}_percentage`] || 0
      commissionAmount = Math.round((saleAmount * commissionRate) / 100)
    } else {
      if (settings?.default_commission_type === 'fixed') {
        commissionType = 'fixed'; commissionAmount = settings.default_fixed_amount || 0
      } else {
        commissionType = 'percentage'; commissionRate = settings.default_percentage || 0
        commissionAmount = Math.round((saleAmount * commissionRate) / 100)
      }
    }

    await adminClient.from('AffiliateCommission').insert({
      affiliate_id: affiliate.id, affiliate_name: affiliate.full_name || affiliate.email || '',
      referred_user_id: payingUserId, referred_user_name: payingUser.full_name || '',
      referred_user_email: payingUser.email || '', referral_code: payingUser.referred_by,
      product_name: productName, service_type: serviceType, sale_amount: saleAmount,
      sale_currency: saleCurrency, commission_type: commissionType,
      commission_rate: commissionRate || null, commission_amount: commissionAmount,
      commission_currency: settings?.default_currency || saleCurrency,
      is_recurring: false, status: 'pending', trigger_event: 'payment_confirmed',
    })

    const { data: refs } = await adminClient.from('Referral').select('*').eq('referred_user_id', payingUserId)
    if (refs?.length > 0) {
      await adminClient.from('Referral').update({
        status: 'converted', converted_date: new Date().toISOString(),
        reward_amount: commissionAmount, reward_currency: settings?.default_currency || saleCurrency,
      }).eq('id', refs[0].id)
    }

    await adminClient.from('Notification').insert({
      recipient_id: affiliate.id, title: 'New Commission Earned! 🎉',
      message: `You earned ${settings?.default_currency || saleCurrency} ${commissionAmount.toLocaleString()} from a referral (${payingUser.full_name || payingUser.email || 'new client'})`,
      type: 'commission_earned', is_read: false,
    })
  } catch (err) {
    console.error('Commission creation error (non-fatal):', err)
  }
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
          adminClient, (subscription as any).user_id, 'graphic_design',
          'Design Subscription', txData.amount, txData.currency,
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
