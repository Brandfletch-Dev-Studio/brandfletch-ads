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
    

    // ── Affiliate Commission Auto-Creation ─────────────────────────────
    // After any successful payment, check if the paying user was referred
    // and auto-create a commission record for the affiliate
    try {
      let payingUserId = null;
      let serviceType = 'other';
      let saleAmount = txData.amount || 0;
      let saleCurrency = txData.currency || 'MWK';
      let productName = '';

      if (paymentType === 'DESIGN' && parts[2]) {
        const sub = await base44.asServiceRole.entities.PlatformSubscription.get(parts[2]).catch(() => null);
        if (sub) {
          payingUserId = sub.user_id;
          serviceType = 'graphic_design';
          productName = 'Design Subscription';
        }
      } else if (paymentType === 'CAMP' && parts[2]) {
        const camp = await base44.asServiceRole.entities.Campaign.get(parts[2]).catch(() => null);
        if (camp) {
          payingUserId = camp.user_id;
          serviceType = 'meta_ads';
          productName = camp.campaign_name || 'Meta Ads Campaign';
        }
      }

      if (payingUserId) {
        // Get the paying user to check if they were referred
        const payingUser = await base44.asServiceRole.entities.User.get(payingUserId).catch(() => null);
        if (payingUser?.referred_by) {
          // Find the affiliate by referral code
          const affiliateUsers = await base44.asServiceRole.entities.User.filter({ referral_code: payingUser.referred_by }).catch(() => []);
          let affiliate = affiliateUsers?.[0];

          // Fallback: match auto-generated code BF-{id.slice(-6)}
          if (!affiliate) {
            const allUsers = await base44.asServiceRole.entities.User.list().catch(() => []);
            affiliate = allUsers.find(u => {
              const code = u.referral_code || (u.id ? `BF-${u.id.slice(-6).toUpperCase()}` : '');
              return code === payingUser.referred_by;
            });
          }

          if (affiliate) {
            // Get affiliate settings
            const settingsList = await base44.asServiceRole.entities.AffiliateSettings.list(null, 1).catch(() => []);
            const settings = settingsList?.[0];

            if (settings?.program_enabled !== false) {
              // Check one_commission_per_client rule
              let alreadyHasCommission = false;
              if (settings?.one_commission_per_client) {
                const existing = await base44.asServiceRole.entities.AffiliateCommission.filter({
                  affiliate_id: affiliate.id,
                  referred_user_id: payingUserId
                }).catch(() => []);
                alreadyHasCommission = (existing || []).some(c => !c.is_recurring);
              }

              if (!alreadyHasCommission) {
                // Resolve commission amount for this service
                const typeField = `${serviceType}_commission_type`;
                const fixedField = `${serviceType}_fixed_amount`;
                const pctField = `${serviceType}_percentage`;
                const svcType = settings?.[typeField] || 'global';

                let commissionType = 'fixed';
                let commissionAmount = 0;
                let commissionRate = 0;

                if (svcType === 'fixed') {
                  commissionType = 'fixed';
                  commissionAmount = settings[fixedField] || 0;
                } else if (svcType === 'percentage') {
                  commissionType = 'percentage';
                  commissionRate = settings[pctField] || 0;
                  commissionAmount = Math.round((saleAmount * commissionRate) / 100);
                } else {
                  // global
                  if (settings?.default_commission_type === 'fixed') {
                    commissionType = 'fixed';
                    commissionAmount = settings.default_fixed_amount || 0;
                  } else {
                    commissionType = 'percentage';
                    commissionRate = settings.default_percentage || 0;
                    commissionAmount = Math.round((saleAmount * commissionRate) / 100);
                  }
                }

                // Create the commission record
                await base44.asServiceRole.entities.AffiliateCommission.create({
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
                });

                // Update the Referral record to converted
                const referrals = await base44.asServiceRole.entities.Referral.filter({
                  referred_user_id: payingUserId
                }).catch(() => []);
                if (referrals?.length > 0) {
                  await base44.asServiceRole.entities.Referral.update(referrals[0].id, {
                    status: 'converted',
                    converted_date: new Date().toISOString(),
                    reward_amount: commissionAmount,
                    reward_currency: settings?.default_currency || saleCurrency,
                  });
                }

                // Notify the affiliate
                await base44.asServiceRole.entities.Notification.create({
                  recipient_id: affiliate.id,
                  title: 'New Commission Earned! 🎉',
                  message: `You earned ${settings?.default_currency || saleCurrency} ${commissionAmount.toLocaleString()} from a referral (${payingUser.full_name || payingUser.email || 'new client'})`,
                  type: 'commission_earned',
                  is_read: false,
                });
              }
            }
          }
        }
      }
    } catch (commErr) {
      console.error('Commission creation error (non-fatal):', commErr);
    }
    // ── End Affiliate Commission Logic ──────────────────────────────────

    return Response.json({ received: true, status: 'processed', tx_ref });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});