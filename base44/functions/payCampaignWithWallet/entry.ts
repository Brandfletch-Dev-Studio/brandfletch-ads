import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';


// ── Affiliate commission helper ───────────────────────────────────────
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
      const existing = await base44.asServiceRole.entities.AffiliateCommission.filter({ affiliate_id: affiliate.id, referred_user_id: payingUserId }).catch(() => []);
      if ((existing || []).some(c => !c.is_recurring)) return;
    }

    const typeField = `${serviceType}_commission_type`;
    const fixedField = `${serviceType}_fixed_amount`;
    const pctField = `${serviceType}_percentage`;
    const svcType = settings?.[typeField] || 'global';
    let commissionType = 'fixed', commissionAmount = 0, commissionRate = 0;
    if (svcType === 'fixed') { commissionAmount = settings[fixedField] || 0; }
    else if (svcType === 'percentage') { commissionType = 'percentage'; commissionRate = settings[pctField] || 0; commissionAmount = Math.round((saleAmount * commissionRate) / 100); }
    else if (settings?.default_commission_type === 'fixed') { commissionAmount = settings.default_fixed_amount || 0; }
    else { commissionType = 'percentage'; commissionRate = settings.default_percentage || 0; commissionAmount = Math.round((saleAmount * commissionRate) / 100); }

    await base44.asServiceRole.entities.AffiliateCommission.create({
      affiliate_id: affiliate.id, affiliate_name: affiliate.full_name || affiliate.email || '',
      referred_user_id: payingUserId, referred_user_name: payingUser.full_name || '', referred_user_email: payingUser.email || '',
      referral_code: payingUser.referred_by, product_name: productName, service_type: serviceType,
      sale_amount: saleAmount, sale_currency: saleCurrency, commission_type: commissionType,
      commission_rate: commissionRate || null, commission_amount: commissionAmount,
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
  } catch (err) { console.error('Commission creation error (non-fatal):', err); }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId } = await req.json();
    
    if (!campaignId) {
      return Response.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    // Get campaign
    const campaigns = await base44.entities.Campaign.filter({ id: campaignId });
    if (campaigns.length === 0) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    const campaign = campaigns[0];
    
    // Verify ownership
    if (campaign.user_id !== user.id) {
      return Response.json({ error: 'Unauthorized - not your campaign' }, { status: 403 });
    }

    // Check if already paid
    if (campaign.status !== 'awaiting_payment' && campaign.status !== 'draft') {
      return Response.json({ error: 'Campaign is not awaiting payment' }, { status: 400 });
    }

    // Get user's wallet
    const wallets = await base44.entities.Wallet.filter({ user_id: user.id });
    if (wallets.length === 0) {
      return Response.json({ error: 'Wallet not found' }, { status: 404 });
    }
    
    const wallet = wallets[0];
    
    // Check balance
    if (wallet.balance < campaign.total_cost) {
      return Response.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    // Deduct from wallet
    const newBalance = wallet.balance - campaign.total_cost;
    await base44.entities.Wallet.update(wallet.id, { balance: newBalance });

    // Create transaction record
    await base44.entities.WalletTransaction.create({
      user_id: user.id,
      type: 'payment',
      amount: campaign.total_cost,
      amount_usd: campaign.total_cost_usd || (campaign.currency === 'USD' ? campaign.total_cost : null),
      currency: campaign.currency,
      payment_method: 'wallet',
      status: 'confirmed',
      campaign_id: campaignId,
      description: `Campaign payment - ${campaign.campaign_name || campaign.page_name}`,
      verified_by: user.id,
    });

    // Update campaign status to approved/active
    await base44.entities.Campaign.update(campaignId, {
      status: 'approved',
      payment_method: 'wallet',
      payment_verified_by: user.id,
    });

    // Create audit log
    await base44.entities.AuditLog.create({
      actor_id: user.id,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'payment_confirmed',
      entity_type: 'Campaign',
      entity_id: campaignId,
      details: `Campaign paid with wallet balance. Amount: ${campaign.total_cost} ${campaign.currency}`,
    });

    // Auto-create affiliate commission if user was referred
    await maybeCreateAffiliateCommission(base44, user.id, 'meta_ads', campaign?.campaign_name || campaign?.page_name || 'Meta Ads Campaign', campaign.total_cost, campaign.currency || 'MWK');

    return Response.json({ 
      success: true, 
      new_balance: newBalance,
      message: 'Campaign paid successfully' 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});