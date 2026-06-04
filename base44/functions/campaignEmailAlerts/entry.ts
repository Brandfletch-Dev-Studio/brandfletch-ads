/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const EVENT_CONFIG = {
  // Campaign lifecycle events
  pending_review: {
    clientSubject: '📋 Campaign Submitted Successfully',
    clientBody: (c, u) => `Hi ${u?.full_name || 'there'},\n\nYour campaign for "${c.page_name}" has been submitted and is now under review by our team.\n\nWe'll notify you once it's been reviewed — this usually takes 1–2 business days.\n\nCampaign Details:\n• Package: ${c.package}\n• Duration: ${c.duration}\n• Total Cost: ${c.currency} ${c.total_cost?.toLocaleString()}\n\nView your campaign: https://brandfletchads.base44.app/campaigns/${c.id}\n\n— Brandfletch Ads Team`,
    adminSubject: (c) => `🔔 New Campaign Submitted — ${c.page_name}`,
    adminBody: (c, u) => `A new campaign has been submitted and needs review.\n\nClient: ${u?.full_name || 'Unknown'} (${u?.email || 'N/A'})\nPage: ${c.page_name}\nPackage: ${c.package} · ${c.duration}\nCost: ${c.currency} ${c.total_cost?.toLocaleString()}\n\nReview it here: https://brandfletchads.base44.app/admin/campaigns/${c.id}`,
  },
  approved: {
    clientSubject: '✅ Campaign Approved!',
    clientBody: (c, u) => `Hi ${u?.full_name || 'there'},\n\nGreat news! Your campaign for "${c.page_name}" has been approved and will be launched shortly.\n\nView your campaign: https://brandfletchads.base44.app/campaigns/${c.id}\n\n— Brandfletch Ads Team`,
  },
  active: {
    clientSubject: '🚀 Your Campaign is Now Live!',
    clientBody: (c, u) => `Hi ${u?.full_name || 'there'},\n\nYour campaign for "${c.page_name}" is now live and running!\n\nYou can track its performance in your dashboard.\n\nView your campaign: https://brandfletchads.base44.app/campaigns/${c.id}\n\n— Brandfletch Ads Team`,
  },
  rejected: {
    clientSubject: '❌ Campaign Not Approved',
    clientBody: (c, u, notes) => `Hi ${u?.full_name || 'there'},\n\nUnfortunately, your campaign for "${c.page_name}" was not approved at this time.${notes ? `\n\nReason: ${notes}` : ''}\n\nPlease contact our support team if you have questions or would like to resubmit.\n\nView your campaign: https://brandfletchads.base44.app/campaigns/${c.id}\n\n— Brandfletch Ads Team`,
  },
  changes_requested: {
    clientSubject: '⚠️ Changes Requested for Your Campaign',
    clientBody: (c, u, notes) => `Hi ${u?.full_name || 'there'},\n\nOur team has reviewed your campaign for "${c.page_name}" and requires some changes before we can approve it.${notes ? `\n\nRequested Changes:\n${notes}` : ''}\n\nPlease log in to update your campaign.\n\nView your campaign: https://brandfletchads.base44.app/campaigns/${c.id}\n\n— Brandfletch Ads Team`,
  },
  completed: {
    clientSubject: '🎉 Campaign Completed!',
    clientBody: (c, u) => `Hi ${u?.full_name || 'there'},\n\nYour campaign for "${c.page_name}" has successfully completed its run!\n\nLog in to view your final performance report.\n\nView your campaign: https://brandfletchads.base44.app/campaigns/${c.id}\n\n— Brandfletch Ads Team`,
  },
  refunded: {
    clientSubject: '↩ Campaign Refunded',
    clientBody: (c, u, notes) => `Hi ${u?.full_name || 'there'},\n\nYour campaign for "${c.page_name}" has been refunded.${notes ? `\n\nNotes: ${notes}` : ''}\n\nIf you have any questions, please contact our support team.\n\n— Brandfletch Ads Team`,
  },
  // Payment events
  awaiting_payment: {
    clientSubject: '💳 Complete Your Payment',
    clientBody: (c, u) => `Hi ${u?.full_name || 'there'},\n\nYour campaign for "${c.page_name}" is ready! Please complete your payment to proceed.\n\nTotal: ${c.currency} ${c.total_cost?.toLocaleString()}\n\nComplete payment here: https://brandfletchads.base44.app/campaigns/${c.id}/payment\n\n— Brandfletch Ads Team`,
  },
  payment_submitted: {
    clientSubject: '💳 Payment Proof Received',
    clientBody: (c, u) => `Hi ${u?.full_name || 'there'},\n\nWe've received your payment proof for campaign "${c.page_name}".\n\nOur finance team will verify your payment within 1–2 business days.\n\nView your campaign: https://brandfletchads.base44.app/campaigns/${c.id}\n\n— Brandfletch Ads Team`,
    adminSubject: (c) => `💳 Payment Submitted — ${c.page_name}`,
    adminBody: (c, u) => `A client has submitted payment proof and is awaiting verification.\n\nClient: ${u?.full_name || 'Unknown'} (${u?.email || 'N/A'})\nPage: ${c.page_name}\nPackage: ${c.package} · ${c.duration}\nCost: ${c.currency} ${c.total_cost?.toLocaleString()}\nPayment Method: ${c.payment_method || 'N/A'}\nReference: ${c.payment_reference || 'N/A'}\n\nVerify here: https://brandfletchads.base44.app/admin/payments`,
  },
  payment_confirmed: {
    clientSubject: '✅ Payment Confirmed!',
    clientBody: (c, u) => `Hi ${u?.full_name || 'there'},\n\nYour payment for campaign "${c.page_name}" has been confirmed!\n\nYour campaign is now submitted for review and will be processed shortly.\n\nView your campaign: https://brandfletchads.base44.app/campaigns/${c.id}\n\n— Brandfletch Ads Team`,
  },
  payment_rejected: {
    clientSubject: '❌ Payment Could Not Be Verified',
    clientBody: (c, u, notes) => `Hi ${u?.full_name || 'there'},\n\nUnfortunately, we were unable to verify your payment for campaign "${c.page_name}".${notes ? `\n\nReason: ${notes}` : ''}\n\nPlease resubmit your payment proof or contact our support team.\n\nView your campaign: https://brandfletchads.base44.app/campaigns/${c.id}\n\n— Brandfletch Ads Team`,
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both direct invocation and entity automation payload
    let campaign_id = body.campaign_id;
    let event_type = body.event_type;
    let notes = body.notes;

    // When triggered by entity automation, the payload has { event, data }
    if (!campaign_id && body.event?.entity_id) {
      campaign_id = body.event.entity_id;
    }
    if (!event_type && body.data?.status) {
      event_type = body.data.status;
      // Detect payment submission specifically
      if (body.data?.payment_proof_url && !body.old_data?.payment_proof_url) {
        event_type = 'payment_submitted';
      }
    }
    if (!notes && body.data?.manager_notes) {
      notes = body.data.manager_notes;
    }

    if (!campaign_id || !event_type) {
      return Response.json({ error: 'Missing campaign_id or event_type' }, { status: 400 });
    }

    const config = EVENT_CONFIG[event_type];
    if (!config) {
      return Response.json({ error: `Unknown event_type: ${event_type}` }, { status: 400 });
    }

    // Fetch campaign and users
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: campaign_id });
    const campaign = campaigns[0];
    if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const clientUser = allUsers.find(u => u.id === campaign.user_id);
    const admins = allUsers.filter(u => u.role === 'admin');

    const results = { client: null, admin: null };

    // Send client email
    if (clientUser?.email && config.clientBody) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: clientUser.email,
        from_name: 'Brandfletch Ads',
        subject: typeof config.clientSubject === 'function' ? config.clientSubject(campaign) : config.clientSubject,
        body: config.clientBody(campaign, clientUser, notes),
      });
      results.client = `sent to ${clientUser.email}`;
    }

    // Send admin notification email if configured
    if (config.adminSubject && config.adminBody) {
      for (const admin of admins) {
        if (admin.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            from_name: 'Brandfletch Ads (Internal)',
            subject: typeof config.adminSubject === 'function' ? config.adminSubject(campaign) : config.adminSubject,
            body: config.adminBody(campaign, clientUser),
          });
        }
      }
      results.admin = `sent to ${admins.length} admin(s)`;
    }

    return Response.json({ success: true, event_type, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});