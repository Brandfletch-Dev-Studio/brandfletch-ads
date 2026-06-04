import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { form_id, form_data } = await req.json();

    // Get form details
    const form = await base44.entities.LeadForm.get(form_id);
    if (!form) {
      return Response.json({ error: 'Form not found' }, { status: 404 });
    }

    // Create lead record
    await base44.entities.Lead.create({
      user_id: form.user_id,
      form_id: form.id,
      form_name: form.form_name,
      lead_name: form_data.name || `${form_data.first_name || ''} ${form_data.last_name || ''}`.trim() || 'Unknown',
      lead_email: form_data.email,
      lead_phone: form_data.phone,
      company: form_data.company,
      lead_data: form_data,
      stage: 'new_lead',
    });

    // Update form submission count
    await base44.entities.LeadForm.update(form.id, {
      total_submissions: (form.total_submissions || 0) + 1,
    });

    // Send webhook if configured
    if (form.webhook_url) {
      try {
        await fetch(form.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form_data),
        });
      } catch (webhookError) {
        console.error('Webhook failed:', webhookError);
        // Don't fail the submission if webhook fails
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error submitting form:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});