// Shared affiliate commission logic — used by both paychanguWebhook (server
// webhook from Paychangu) and verifyPaychanguPayment (client-triggered
// verification poll). Both can fire for the same payment, so this function
// must be safe to call twice concurrently for the same sale.
export async function maybeCreateAffiliateCommission(
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

    // Self-referral guard — defaults to true (blocked) unless explicitly
    // disabled in settings, matching the AffiliateSettings schema default.
    // Previously this setting existed in the schema and admin toggle but was
    // never actually enforced anywhere, so an affiliate could sign up a
    // second account under their own referral code and collect commission
    // on their own purchases.
    if (settings?.block_self_referrals !== false && affiliate.id === payingUserId) {
      console.warn(`Blocked self-referral commission: user ${payingUserId} referred themselves`)
      return
    }

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

    const { error: insertError } = await adminClient.from('AffiliateCommission').insert({
      affiliate_id: affiliate.id, affiliate_name: affiliate.full_name || affiliate.email || '',
      referred_user_id: payingUserId, referred_user_name: payingUser.full_name || '',
      referred_user_email: payingUser.email || '', referral_code: payingUser.referred_by,
      product_name: productName, service_type: serviceType, sale_amount: saleAmount,
      sale_currency: saleCurrency, commission_type: commissionType,
      commission_rate: commissionRate || null, commission_amount: commissionAmount,
      commission_currency: settings?.default_currency || saleCurrency,
      is_recurring: false, status: 'pending', trigger_event: 'payment_confirmed',
    })

    if (insertError) {
      // 23505 = unique_violation. A DB-level unique index on
      // (affiliate_id, referred_user_id) WHERE is_recurring = false backs up
      // the one_commission_per_client check above — this is the expected,
      // harmless outcome when the webhook and verify-payment paths both race
      // to create a commission for the same sale. Only the first wins; the
      // second bails out here instead of double-paying the affiliate.
      if (insertError.code === '23505') {
        console.warn(`Duplicate commission insert prevented for affiliate ${affiliate.id} / client ${payingUserId}`)
        return
      }
      throw insertError
    }

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
