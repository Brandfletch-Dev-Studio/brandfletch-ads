import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
        .from('AffiliateCommission')
        .select('id, is_recurring')
        .eq('affiliate_id', affiliate.id)
        .eq('referred_user_id', payingUserId)
      if ((existing || []).some((c: any) => !c.is_recurring)) return
    }

    const svcType = settings?.[`${serviceType}_commission_type`] || 'global'
    let commissionType = 'fixed', commissionAmount = 0, commissionRate = 0

    if (svcType === 'fixed') {
      commissionType = 'fixed'
      commissionAmount = settings[`${serviceType}_fixed_amount`] || 0
    } else if (svcType === 'percentage') {
      commissionType = 'percentage'
      commissionRate = settings[`${serviceType}_percentage`] || 0
      commissionAmount = Math.round((saleAmount * commissionRate) / 100)
    } else {
      if (settings?.default_commission_type === 'fixed') {
        commissionType = 'fixed'
        commissionAmount = settings.default_fixed_amount || 0
      } else {
        commissionType = 'percentage'
        commissionRate = settings.default_percentage || 0
        commissionAmount = Math.round((saleAmount * commissionRate) / 100)
      }
    }

    await adminClient.from('AffiliateCommission').insert({
      affiliate_id: affiliate.id,
      affiliate_name: affiliate.full_name || affiliate.email || '',
      referred_user_id: payingUserId,
      referred_user_name: payingUser.full_name || '',
      referred_user_email: payingUser.email || '',
      referral_code: payingUser.referred_by,
      product_name: productName,
      service_type: serviceType,
      sale_amount: saleAmount,
      sale_currency: saleCurrency,
      commission_type: commissionType,
      commission_rate: commissionRate || null,
      commission_amount: commissionAmount,
      commission_currency: settings?.default_currency || saleCurrency,
      is_recurring: false,
      status: 'pending',
      trigger_event: 'payment_confirmed',
    })

    const { data: refs } = await adminClient
      .from('Referral')
      .select('*')
      .eq('referred_user_id', payingUserId)
    if (refs?.length > 0) {
      await adminClient.from('Referral').update({
        status: 'converted',
        converted_date: new Date().toISOString(),
        reward_amount: commissionAmount,
        reward_currency: settings?.default_currency || saleCurrency,
      }).eq('id', refs[0].id)
    }

    await adminClient.from('Notification').insert({
      recipient_id: affiliate.id,
      title: 'New Commission Earned! 🎉',
      message: `You earned ${settings?.default_currency || saleCurrency} ${commissionAmount.toLocaleString()} from a referral (${payingUser.full_name || payingUser.email || 'new client'})`,
      type: 'commission_earned',
      is_read: false,
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

    const { tx_ref, campaign_id, subscription_id, payment_type } = await req.json()
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
        adminClient, user.id, 'graphic_design', 'Design Subscription', txData.amount, txData.currency,
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
