import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';


// ── Shared affiliate commission helper ────────────────────────────────
async function maybeCreateAffiliateCommission(base44, payingUserId, serviceType, productName, saleAmount, saleCurrency) {
  try {
    const payingUser = await base44.asServiceRole.entities.User.get(payingUserId).catch(() => null);
    if (!payingUser?.referred_by) return;

    const affiliateUsers = await base44.asServiceRole.entities.User.filter({ referral_code: payingUser.referred_by }).catch(() => []);
    let affiliate = affiliateUsers?.[0];
    if (!affiliate) {
      const allUsers = await base44.asServiceRole.entities.User.list().catch(() => []);
      affiliate = allUsers.find(u => {
        const code = u.referral_code || (u.id ? `BF-${u.id.slice(-6).toUpperCase()}` : '');
        return code === payingUser.referred_by;
      });
    }
    if (!affiliate) return;

    const settingsList = await base44.asServiceRole.entities.AffiliateSettings.list(null, 1).catch(() => []);
    const settings = settingsList?.[0];
    if (settings?.program_enabled === false) return;

    if (settings?.one_commission_per_client) {
      const existing = await base44.asServiceRole.entities.AffiliateCommission.filter({
        affiliate_id: affiliate.id, referred_user_id: payingUserId
      }).catch(() => []);
      if ((existing || []).some(c => !c.is_recurring)) return;
    }

    const typeField = `${serviceType}_commission_type`;
    const fixedField = `${serviceType}_fixed_amount`;
    const pctField = `${serviceType}_percentage`;
    const svcType = settings?.[typeField] || 'global';

    let commissionType = 'fixed', commissionAmount = 0, commissionRate = 0;
    if (svcType === 'fixed') {
      commissionType = 'fixed'; commissionAmount = settings[fixedField] || 0;
    } else if (svcType === 'percentage') {
      commissionType = 'percentage'; commissionRate = settings[pctField] || 0;
      commissionAmount = Math.round((saleAmount * commissionRate) / 100);
    } else {
      if (settings?.default_commission_type === 'fixed') {
        commissionType = 'fixed'; commissionAmount = settings.default_fixed_amount || 0;
      } else {
        commissionType = 'percentage'; commissionRate = settings.default_percentage || 0;
        commissionAmount = Math.round((saleAmount * commissionRate) / 100);
      }
    }

    await base44.asServiceRole.entities.AffiliateCommission.create({
      affiliate_id: affiliate.id,
      affiliate_name: affiliate.full_name || affiliate.email || '',
      referred_user_id: payingUserId,
      referred_user_name: payingUser.full_name || '',
      referred_user_email: payingUser.email || '',
      referral_code: payingUser.referred_by,
      product_name: productName,
      service_type: serviceType,
      sale_amount: saleAmount, sale_currency: saleCurrency,
      commission_type: commissionType, commission_rate: commissionRate || null,
      commission_amount: commissionAmount,
      commission_currency: settings?.default_currency || saleCurrency,
      is_recurring: false, status: 'pending', trigger_event: 'payment_confirmed',
    });

    const refs = await base44.asServiceRole.entities.Referral.filter({ referred_user_id: payingUserId }).catch(() => []);
    if (refs?.length > 0) {
      await base44.asServiceRole.entities.Referral.update(refs[0].id, {
        status: 'converted', converted_date: new Date().toISOString(),
        reward_amount: commissionAmount, reward_currency: settings?.default_currency || saleCurrency,
      });
    }

    await base44.asServiceRole.entities.Notification.create({
      recipient_id: affiliate.id,
      title: 'New Commission Earned! 🎉',
      message: `You earned ${settings?.default_currency || saleCurrency} ${commissionAmount.toLocaleString()} from a referral (${payingUser.full_name || payingUser.email || 'new client'})`,
      type: 'commission_earned', is_read: false,
    });
  } catch (err) {
    console.error('Commission creation error (non-fatal):', err);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tx_ref, campaign_id, subscription_id, payment_type } = await req.json();

    const secretKey = Deno.env.get('PAYCHANGU_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'Paychangu not configured' }, { status: 500 });

    // Verify with Paychangu
    const response = await fetch(`https://api.paychangu.com/verify-payment/${tx_ref}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    const data = await response.json();

    if (data.status !== 'success' || data.data?.status !== 'success') {
      return Response.json({ verified: false, status: data.data?.status || 'failed' });
    }

    const txData = data.data;

    // Handle campaign payment
    if (payment_type === 'campaign' && campaign_id) {
      await base44.entities.Campaign.update(campaign_id, {
        status: 'pending_review',
        payment_method: 'Paychangu',
        payment_reference: tx_ref,
        payment_type: 'external',
      });

      const campaign = await base44.entities.Campaign.get(campaign_id);
      await base44.entities.WalletTransaction.create({
        user_id: user.id,
        type: 'payment',
        amount: txData.amount,
        currency: txData.currency,
        payment_method: 'Paychangu',
        payment_reference: tx_ref,
        campaign_id,
        status: 'completed',
        description: `Campaign payment via Paychangu - ${campaign?.page_name || ''}`,
      });
      // Auto-create affiliate commission if user was referred
      await maybeCreateAffiliateCommission(base44, user.id, 'meta_ads', campaign?.campaign_name || 'Meta Ads Campaign', txData.amount, txData.currency);
    }

    // Handle design subscription payment
    if (payment_type === 'design' && subscription_id) {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      const resetDate = new Date(endDate);

      // Fetch existing subscription to preserve quota
      const existingSub = await base44.asServiceRole.entities.PlatformSubscription.get(subscription_id);

      await base44.entities.PlatformSubscription.update(subscription_id, {
        status: 'active',
        payment_method: 'Paychangu',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        quota_used: 0,
        quota_reset_date: resetDate.toISOString().split('T')[0],
        // preserve monthly_quota if already set
        ...(existingSub?.monthly_quota ? {} : { monthly_quota: 20 }),
      });

      await base44.entities.WalletTransaction.create({
        user_id: user.id,
        type: 'payment',
        amount: txData.amount,
        currency: txData.currency,
        payment_method: 'Paychangu',
        payment_reference: tx_ref,
        status: 'completed',
        description: `Design subscription via Paychangu`,
      });
      // Auto-create affiliate commission if user was referred
      await maybeCreateAffiliateCommission(base44, user.id, 'graphic_design', 'Design Subscription', txData.amount, txData.currency);
    }

    return Response.json({ verified: true, status: 'success', tx_ref });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});