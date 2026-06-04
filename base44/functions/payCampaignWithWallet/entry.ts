import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    return Response.json({ 
      success: true, 
      new_balance: newBalance,
      message: 'Campaign paid successfully' 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});