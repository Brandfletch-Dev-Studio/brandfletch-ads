import { base44 } from '@/api/base44Client';
import { ADMIN_WHATSAPP } from '@/lib/constants';

/**
 * useDesignAssign
 *
 * Auto-assign algorithm:
 * 1. Fetch all users with role = 'designer'
 * 2. For each designer, count their active (non-completed) design requests
 * 3. Pick the designer with the lowest active workload
 * 4. Update the DesignRequest with designer_id + status = 'assigned'
 * 5. Send WhatsApp notification to the assigned designer
 * 6. Send WhatsApp notification to the relevant admin phone (from PublicSettings)
 *
 * Returns: { assignDesign(requestId, designRequest) }
 */
export function useDesignAssign() {

  async function getAdminPhone() {
    // PublicSettings table may not exist / have no override yet — always
    // fall back to the known business WhatsApp number so this notification
    // never silently no-ops.
    try {
      const settings = await base44.entities.PublicSettings.list({ limit: 1 });
      return settings?.[0]?.admin_whatsapp || settings?.[0]?.admin_phone || ADMIN_WHATSAPP;
    } catch {
      return ADMIN_WHATSAPP;
    }
  }

  async function sendWA(to, message) {
    if (!to) return;
    try {
      await base44.functions.invoke('sendWhatsApp', { to, message });
    } catch (err) {
      console.warn('WhatsApp notification failed (non-blocking):', err);
    }
  }

  async function assignDesign(requestId, designRequest, clientName = '') {
    try {
      // 1. Get all assignable designers — includes creative_ops_director (dept head can take work too)
      const [designers, directors] = await Promise.all([
        base44.entities.User.filter({ role: 'designer' }),
        base44.entities.User.filter({ role: 'creative_ops_director' }),
      ]);
      const allDesigners = [...directors, ...designers];
      if (!allDesigners || allDesigners.length === 0) {
        console.log('No designers found — design left unassigned');
        return null;
      }

      // 2. Count active jobs per designer
      const allActive = await base44.entities.DesignRequest.filter({});
      const workloads = {};
      allDesigners.forEach(d => { workloads[d.id] = 0; });
      allActive.forEach(req => {
        if (
          req.designer_id &&
          workloads[req.designer_id] !== undefined &&
          !['completed', 'delivered', 'cancelled'].includes(req.status)
        ) {
          workloads[req.designer_id]++;
        }
      });

      // 3. Pick lightest loaded designer (COD included)
      const assigned = allDesigners.reduce((best, d) =>
        (workloads[d.id] ?? 999) < (workloads[best.id] ?? 999) ? d : best
      , allDesigners[0]);

      // 4. Update the request — save both id and name
      await base44.entities.DesignRequest.update(requestId, {
        designer_id: assigned.id,
        designer_name: assigned.full_name || assigned.email || '',
        status: 'assigned',
      });

      // 5. Notify the designer via WhatsApp
      const designType = (designRequest.design_type || 'design').replace(/_/g, ' ');
      const designerMsg = [
        `🎨 *New Design Job Assigned — Brandfletch Media*`,
        ``,
        `Hi ${assigned.full_name?.split(' ')[0] || 'Designer'}, you have a new job!`,
        ``,
        `*Type:* ${designType}`,
        `*Client:* ${clientName || designRequest.user_name || 'Client'}`,
        `*Title:* ${designRequest.title || designRequest.design_type || 'Design Request'}`,
        `*Priority:* ${designRequest.priority || 'standard'}`,
        ``,
        `Log in to view details and start working:`,
        `${window.location.origin}/designer`,
      ].join('\n');

      if (assigned.phone) {
        await sendWA(assigned.phone, designerMsg);
      }

      // 6. Notify admin
      const adminPhone = await getAdminPhone();
      if (adminPhone) {
        const adminMsg = [
          `✅ *Design Auto-Assigned — Brandfletch Media*`,
          ``,
          `*Request:* ${designRequest.title || designType}`,
          `*Client:* ${clientName || designRequest.user_name || '—'}`,
          `*Assigned to:* ${assigned.full_name || assigned.email}`,
          `*Designer workload:* ${workloads[assigned.id]} active jobs`,
        ].join('\n');
        await sendWA(adminPhone, adminMsg);
      }

      return assigned;
    } catch (err) {
      console.error('Auto-assign failed:', err);
      return null;
    }
  }

  return { assignDesign };
}
