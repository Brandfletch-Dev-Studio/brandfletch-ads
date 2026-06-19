import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { form_type, custom_request } = await req.json();

    // Field suggestions based on form type
    const fieldTemplates = {
      contact: [
        { field_name: 'full_name', field_type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true, options: [] },
        { field_name: 'email', field_type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true, options: [] },
        { field_name: 'phone', field_type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: false, options: [] },
        { field_name: 'subject', field_type: 'text', label: 'Subject', placeholder: 'What is this regarding?', required: true, options: [] },
        { field_name: 'message', field_type: 'textarea', label: 'Message', placeholder: 'How can we help you?', required: true, options: [] }
      ],
 },
        { field_name: 'email', field_type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true, options: [] },
        { field_name: 'company', field_type: 'text', label: 'Company Name', placeholder: 'Your Company Ltd', required: false, options: [] },
        { field_name: 'phone', field_type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: true, options: [] },
        { field_name: 'service_type', field_type: 'dropdown', label: 'Service Type', placeholder: '', required: true, options: ['Web Design', 'Marketing', 'Consulting', 'Other'] },
        { field_name: 'budget_range', field_type: 'dropdown', label: 'Budget Range', placeholder: '', required: true, options: ['$500-$1000', '$1000-$5000', '$5000-$10000', '$10000+'] },
        { field_name: 'project_details', field_type: 'textarea', label: 'Project Details', placeholder: 'Describe your project requirements...', required: true, options: [] },
        { field_name: 'timeline', field_type: 'dropdown', label: 'Expected Timeline', placeholder: '', required: false, options: ['ASAP', '1-2 weeks', '2-4 weeks', '1-3 months', '3+ months'] }
      ],
      consultation: [
        { field_name: 'full_name', field_type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true, options: [] },
        { field_name: 'email', field_type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true, options: [] },
        { field_name: 'phone', field_type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: true, options: [] },
        { field_name: 'company', field_type: 'text', label: 'Company/Organization', placeholder: '', required: false, options: [] },
        { field_name: 'consultation_type', field_type: 'dropdown', label: 'Consultation Type', placeholder: '', required: true, options: ['Initial Consultation', 'Follow-up', 'Expert Review', 'Strategy Session'] },
        { field_name: 'preferred_date', field_type: 'date', label: 'Preferred Date', placeholder: '', required: true, options: [] },
        { field_name: 'preferred_time', field_type: 'dropdown', label: 'Preferred Time', placeholder: '', required: true, options: ['Morning (9AM-12PM)', 'Afternoon (12PM-5PM)', 'Evening (5PM-8PM)'] },
        { field_name: 'topics', field_type: 'textarea', label: 'Topics to Discuss', placeholder: 'What would you like to discuss?', required: true, options: [] }
      ],
      lead_generation: [
        { field_name: 'full_name', field_type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true, options: [] },
        { field_name: 'email', field_type: 'email', label: 'Work Email', placeholder: 'john@company.com', required: true, options: [] },
        { field_name: 'company', field_type: 'text', label: 'Company Name', placeholder: 'Your Company', required: true, options: [] },
        { field_name: 'job_title', field_type: 'text', label: 'Job Title', placeholder: 'Marketing Manager', required: true, options: [] },
        { field_name: 'company_size', field_type: 'dropdown', label: 'Company Size', placeholder: '', required: true, options: ['1-10', '11-50', '51-200', '201-500', '500+'] },
        { field_name: 'industry', field_type: 'dropdown', label: 'Industry', placeholder: '', required: false, options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Other'] },
        { field_name: 'phone', field_type: 'phone', label: 'Business Phone', placeholder: '', required: false, options: [] },
        { field_name: 'challenges', field_type: 'textarea', label: 'Main Challenges', placeholder: 'What challenges are you facing?', required: true, options: [] }
      ],
      newsletter: [
        { field_name: 'email', field_type: 'email', label: 'Email Address', placeholder: 'your@email.com', required: true, options: [] },
        { field_name: 'full_name', field_type: 'text', label: 'First Name', placeholder: 'John', required: false, options: [] },
        { field_name: 'interests', field_type: 'checkbox', label: 'Topics of Interest', placeholder: '', required: false, options: ['Product Updates', 'Industry News', 'Tips & Tutorials', 'Case Studies', 'Events & Webinars'] },
        { field_name: 'frequency', field_type: 'radio', label: 'Email Frequency', placeholder: '', required: false, options: ['Daily', 'Weekly', 'Monthly'] }
      ],
      registration: [
        { field_name: 'full_name', field_type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true, options: [] },
        { field_name: 'email', field_type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true, options: [] },
        { field_name: 'phone', field_type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: true, options: [] },
        { field_name: 'company', field_type: 'text', label: 'Company/Organization', placeholder: '', required: false, options: [] },
        { field_name: 'job_title', field_type: 'text', label: 'Job Title', placeholder: '', required: false, options: [] },
        { field_name: 'dietary_requirements', field_type: 'textarea', label: 'Dietary Requirements', placeholder: 'Any special dietary needs?', required: false, options: [] },
        { field_name: 'accessibility', field_type: 'textarea', label: 'Accessibility Requirements', placeholder: 'Do you need any special accommodations?', required: false, options: [] }
      ],
      feedback: [
        { field_name: 'full_name', field_type: 'text', label: 'Full Name', placeholder: 'John Doe', required: false, options: [] },
        { field_name: 'email', field_type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: false, options: [] },
        { field_name: 'rating', field_type: 'radio', label: 'Overall Rating', placeholder: '', required: true, options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'] },
        { field_name: 'category', field_type: 'dropdown', label: 'Feedback Category', placeholder: '', required: true, options: ['Product Quality', 'Customer Service', 'Website Experience', 'Delivery', 'Pricing', 'Other'] },
        { field_name: 'feedback', field_type: 'textarea', label: 'Your Feedback', placeholder: 'Please share your experience...', required: true, options: [] },
        { field_name: 'recommend', field_type: 'radio', label: 'Would you recommend us?', placeholder: '', required: true, options: ['Yes', 'No', 'Maybe'] }
      ],
      custom: [
        { field_name: 'field_1', field_type: 'text', label: 'Field 1', placeholder: '', required: false, options: [] },
        { field_name: 'field_2', field_type: 'text', label: 'Field 2', placeholder: '', required: false, options: [] },
        { field_name: 'field_3', field_type: 'textarea', label: 'Additional Information', placeholder: '', required: false, options: [] }
      ]
    };

    // Get base fields for the form type
    let suggestedFields = fieldTemplates[form_type] || fieldTemplates.custom;

    // If there's a custom request, we could enhance with AI (future enhancement)
    // For now, we'll use the template-based approach
    if (custom_request && custom_request.trim()) {
      // In future, integrate with InvokeLLM to customize fields based on request
      // For now, just add a custom text area for the request
      suggestedFields = [
        ...suggestedFields,
        {
          field_name: 'custom_requirements',
          field_type: 'textarea',
          label: 'Additional Requirements',
          placeholder: custom_request.substring(0, 100) + '...',
          required: false,
          options: []
        }
      ];
    }

    return Response.json({ 
      fields: suggestedFields,
      form_type: form_type,
      custom_request: custom_request
    });
  } catch (error) {
    console.error('Error generating form fields:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});