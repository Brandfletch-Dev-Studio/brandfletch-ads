import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leads = await base44.entities.Lead.filter({ user_id: user.id });

    // Convert leads to CSV
    const csvRows = [
      ['Name', 'Email', 'Phone', 'Company', 'Stage', 'Grade', 'Source', 'Estimated Value', 'Currency', 'Created Date'],
      ...leads.map(lead => [
        lead.lead_name || '',
        lead.lead_email || '',
        lead.lead_phone || '',
        lead.company || '',
        lead.stage || '',
        lead.grade || '',
        lead.lead_source || '',
        lead.estimated_value || '',
        lead.currency || '',
        lead.created_date || ''
      ])
    ];

    const csvContent = csvRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const arrayBuffer = await blob.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});