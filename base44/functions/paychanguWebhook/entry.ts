import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the raw body and signature header
    const rawBody = await req.text();
    const signature = req.headers.get('Signature');
    
    const webhookSecret = Deno.env.get('PAYCHANGU_SECRET_KEY');
    if (!webhookSecret) {
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    
    // Verify the webhook signature
    const computedSignature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    
    if (signature !== computedSignature) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    
    // Only process successful payment events
    if (payload.event_type !== 'api.charge.payment' || payload.status !== 'success') {
      return Response.json({ received: true, status: 'ignored' });
    }
    
    const tx_ref = payload.reference;
    if (!tx_ref) {
      return Response.json({ error: 'No reference in payload' }, { status: 400 });
    }
    
    // Parse tx_ref to determine payment type
    // Format: BF-DESIGN-[subscription_id]-[timestamp] or BF-CAMP-[campaign_id]-[timestamp]
    const parts = tx_ref.split('-');
    const paymentType = parts[1]; // DESIGN or CAMP
    
    // Verify transaction with Paychangu API to ensure authenticity
    const verifyResponse = await fetch(`https://api.paychangu.com/verify-payment/${tx_ref}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`,
      },
    });
    
    const verifyData = await verifyResponse.json();
    if (verifyData.status !== 'success' || verifyData.data?.status !== 'success') {
      return Response.json({ verified: false, status: 'failed' });
    }
    
    const txData = verifyData.data;
    
    // Handle design subscription payment
    if (paymentType === 'DESIGN' && parts[2]) {
      const subscriptionId = parts[2];
      const subscription = await base44.entities.PlatformSubscription.get(subscriptionId);
      
      if (subscription && subscription.status === 'pending') {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        
        await base44.entities.PlatformSubscription.update(subscriptionId, {
          status: 'active',
          payment_method: 'Paychangu',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        });
        
        await base44.entities.WalletTransaction.create({
          user_id: subscription.user_id,
          type: 'payment',
          amount: txData.amount,
          currency: txData.currency,
          payment_method: 'Paychangu',
          payment_reference: tx_ref,
          status: 'completed',
          description: `Design subscription via Paychangu (webhook)`,
        });
        
        // Send notification to user
        await base44.entities.Notification.create({
          recipient_id: subscription.user_id,
          title: 'Design Subscription Activated',
          message: 'Your design subscription has been activated successfully. You can now request designs!',
          type: 'payment_confirmed',
          is_read: false,
        });
      }
    }
    
    // Handle campaign payment
    if (paymentType === 'CAMP' && parts[2]) {
      const campaignId = parts[2];
      const campaign = await base44.entities.Campaign.get(campaignId);
      
      if (campaign && campaign.status === 'awaiting_payment') {
        await base44.entities.Campaign.update(campaignId, {
          status: 'pending_review',
          payment_method: 'Paychangu',
          payment_reference: tx_ref,
          payment_type: 'external',
        });
        
        await base44.entities.WalletTransaction.create({
          user_id: campaign.user_id,
          type: 'payment',
          amount: txData.amount,
          currency: txData.currency,
          payment_method: 'Paychangu',
          payment_reference: tx_ref,
          campaign_id: campaignId,
          status: 'completed',
          description: `Campaign payment via Paychangu (webhook) - ${campaign.page_name || ''}`,
        });
        
        // Send notification to user
        await base44.entities.Notification.create({
          recipient_id: campaign.user_id,
          title: 'Campaign Payment Received',
          message: `Your campaign "${campaign.campaign_name}" payment has been received and is pending review.`,
          type: 'payment_confirmed',
          campaign_id: campaignId,
          is_read: false,
        });
        
        // Send email alert
        try {
          await base44.functions.invoke('campaignEmailAlerts', {
            campaign_id: campaignId,
            event_type: 'payment_confirmed',
          });
        } catch (e) {
          // Ignore email errors
        }
      }
    }
    
    return Response.json({ received: true, status: 'processed', tx_ref });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});