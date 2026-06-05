import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
    }

    // Handle design subscription payment
    if (payment_type === 'design' && subscription_id) {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      await base44.entities.PlatformSubscription.update(subscription_id, {
        status: 'active',
        payment_method: 'Paychangu',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
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
    }

    return Response.json({ verified: true, status: 'success', tx_ref });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});