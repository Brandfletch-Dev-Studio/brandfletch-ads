import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSEO } from '@/hooks/useSEO';

const ADMIN_WHATSAPP = '265980011467';

const DEPARTMENT_CONFIG = {
  designs: {
    name: 'Brandfletch Designs',
    tagline: 'Professional design that makes your business stand out.',
    serviceOptions: ['Logo Design', 'Brand Identity', 'Social Media Graphics', 'Print Design', 'Packaging Design', 'Other'],
    accent: 'from-purple-600 to-pink-700',
  },
  studios: {
    name: 'Brandfletch Studios',
    tagline: 'Content that captures attention and drives engagement.',
    serviceOptions: ['Video Production', 'Photography', 'UGC Content', 'Social Media Content', 'Product Photography', 'Other'],
    accent: 'from-orange-600 to-red-700',
  },
  sales: {
    name: 'Brandfletch Sales',
    tagline: 'An outsourced sales team that converts your leads into customers.',
    serviceOptions: ['Outbound Sales Team', 'Lead Conversion', 'Sales Strategy', 'Sales Training', 'Other'],
    accent: 'from-amber-600 to-orange-700',
  },
  academy: {
    name: 'Brandfletch Business Academy',
    tagline: 'Learn the systems behind the growth.',
    serviceOptions: ['Marketing Course', 'Sales Course', 'Business Operations', '1-on-1 Coaching', 'Group Program', 'Other'],
    accent: 'from-cyan-600 to-sky-800',
  },
  'dev-studio': {
    name: 'Brandfletch Dev Studio',
    tagline: 'Websites, apps, automations, and AI agents built to scale.',
    serviceOptions: ['Website', 'Web App', 'Mobile App', 'Automation', 'AI Sales Agent', 'CRM Setup', 'Other'],
    accent: 'from-emerald-600 to-teal-800',
  },
};

const BUDGET_OPTIONS = [
  'Under $500', '$500 – $1,000', '$1,000 – $5,000',
  '$5,000 – $10,000', '$10,000+', 'Not sure yet',
];

const TIMELINE_OPTIONS = ['ASAP', '1–2 weeks', 'Within 1 month', '1–3 months', 'Flexible'];

export default function QuotePage() {
  const { department } = useParams();
  const config = DEPARTMENT_CONFIG[department];

  useSEO({
    title: config ? `Get a Quotation — ${config.name}` : 'Get a Quotation — Brandfletch',
    description: config?.tagline || 'Get a quotation for your project with Brandfletch.',
  });

  const [form, setForm] = useState({
    name: '', business: '', phone: '', email: '',
    service: '', description: '', budget: '', timeline: '', notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  if (!config) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">Department not found</h1>
          <Link to="/"><Button>Back to home</Button></Link>
        </div>
      </div>
    );
  }

  function update(field, value) { setForm(prev => ({ ...prev, [field]: value })); }

  function buildMessage() {
    return [
      `*New Project Brief — ${config.name}*`, '',
      `*Name:* ${form.name}`,
      form.business && `*Business:* ${form.business}`,
      `*Phone:* ${form.phone}`,
      form.email && `*Email:* ${form.email}`,
      `*Service:* ${form.service}`,
      `*Project:* ${form.description}`,
      form.budget && `*Budget:* ${form.budget}`,
      form.timeline && `*Timeline:* ${form.timeline}`,
      form.notes && `*Notes:* ${form.notes}`,
      '', `Sent via brandfletch.com/quote/${department}`,
    ].filter(Boolean).join('\n');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.service || !form.description) return;
    const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(buildMessage())}`;
    setSubmitted(true);
    setTimeout(() => window.open(waUrl, '_blank'), 300);
  }

  const required = !form.name || !form.phone || !form.service || !form.description;

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--accent))]/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-[hsl(var(--accent))]" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-3">Opening WhatsApp…</h1>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            Your project brief has been prepared. If WhatsApp didn't open automatically, click the button below to send it to our team.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(buildMessage())}`, '_blank')}
              className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-semibold gap-2">
              <Send className="w-4 h-4" /> Open WhatsApp
            </Button>
            <Link to={`/${department}`}>
              <Button variant="outline" className="w-full">Back to {config.name}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className={`bg-gradient-to-br ${config.accent} text-white py-14 px-4 text-center`}>
        <div className="max-w-2xl mx-auto">
          <Badge className="mb-4 bg-white/15 text-white border-white/20 text-xs">Project Brief</Badge>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold mb-3">Get a Quotation</h1>
          <p className="text-white/70 text-sm">{config.tagline} Fill in your project details and we'll take it from there on WhatsApp.</p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <Link to={`/${department}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to {config.name}
        </Link>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Your name <span className="text-destructive">*</span></label>
              <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40"
                placeholder="John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Business name</label>
              <input type="text" value={form.business} onChange={e => update('business', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40"
                placeholder="Acme Ltd" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Phone <span className="text-destructive">*</span></label>
              <input type="tel" required value={form.phone} onChange={e => update('phone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40"
                placeholder="+265 990 00 00 00" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40"
                placeholder="john@acme.com" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">What do you need? <span className="text-destructive">*</span></label>
            <select required value={form.service} onChange={e => update('service', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40">
              <option value="">Select a service…</option>
              {config.serviceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Tell us about your project <span className="text-destructive">*</span></label>
            <textarea required rows={4} value={form.description} onChange={e => update('description', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40 resize-none"
              placeholder="Describe what you're looking for, your goals, and any specific requirements…" />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Budget range</label>
              <select value={form.budget} onChange={e => update('budget', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40">
                <option value="">Select budget…</option>
                {BUDGET_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Timeline</label>
              <select value={form.timeline} onChange={e => update('timeline', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40">
                <option value="">Select timeline…</option>
                {TIMELINE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Additional notes</label>
            <textarea rows={2} value={form.notes} onChange={e => update('notes', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40 resize-none"
              placeholder="Anything else we should know?" />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={required}
              className="w-full bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-bold h-12 gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              Submit via WhatsApp <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Your project brief will be sent to our team on WhatsApp. We'll respond within 24 hours.
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
