import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, MapPin, Clock, Send, Phone, MessageCircle, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';
import { useSEO } from '@/hooks/useSEO';

const CONTACT_METHODS = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+265 980 011 467',
    href: 'https://wa.me/265980011467',
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    icon: Phone,
    label: 'Phone Call',
    value: '+265 980 011 467',
    href: 'tel:+265980011467',
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@brandfletch.com',
    href: 'mailto:hello@brandfletch.com',
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    icon: Ticket,
    label: 'Support Ticket',
    value: 'Login to submit',
    href: '/support',
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
];

export default function ContactPage() {
  useSEO({
    title:       "Contact Brandfletch Media — Let's Grow Your Business",
    description: "Get in touch with our advertising team. We're ready to help you launch campaigns and grow your business across Africa.",
  });

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // Try to get current user (may be null for public visitors)
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      await supabase.from('SupportTicket').insert({
        user_id: user?.id || null,
        user_name: form.name,
        user_email: form.email,
        subject: form.subject,
        description: form.message,
        category: 'general',
        priority: 'medium',
        status: 'open',
      });
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      toast.success('Message sent! We\'ll get back to you shortly.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send. Please email us directly at hello@brandfletch.com');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="bg-[hsl(var(--primary))] text-white py-16 text-center px-4">
        <Badge className="mb-4 bg-white/10 text-white border-white/20 text-xs">Get in touch</Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold mb-4 leading-tight">
          Let's talk about your growth
        </h1>
        <p className="text-white/60 max-w-xl mx-auto text-base leading-relaxed">
          Questions, campaign enquiries, or ready to start — our team responds fast. 
          Reach us on WhatsApp for the quickest reply.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">

        {/* Contact method cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CONTACT_METHODS.map(m => (
            <a
              key={m.label}
              href={m.href}
              target={m.href.startsWith('http') ? '_blank' : undefined}
              rel={m.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group"
            >
              <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all h-full">
                <CardContent className="p-5 text-center space-y-3">
                  <div className={`w-12 h-12 rounded-full ${m.bg} ${m.color} flex items-center justify-center mx-auto`}>
                    <m.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.value}</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: info */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[hsl(var(--accent))] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Location</p>
                    <p className="text-muted-foreground">Blantyre & Lilongwe, Malawi</p>
                    <p className="text-muted-foreground">Serving all of Africa</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[hsl(var(--accent))] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Business Hours</p>
                    <p className="text-muted-foreground">Mon – Fri: 8:00 AM – 5:00 PM (CAT)</p>
                    <p className="text-muted-foreground">WhatsApp: typically faster</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Common Enquiries</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1.5">
                {[
                  'Campaign packages and pricing',
                  'UGC ad creative production',
                  'Graphic design retainers',
                  'Website design & development',
                  'Social media management',
                  'Online payment solutions',
                  'Partnership enquiries',
                ].map(q => (
                  <p key={q} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] flex-shrink-0" />
                    {q}
                  </p>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form and we'll respond within 24 hours. For urgent matters, WhatsApp is faster.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sent ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                      <Send className="w-7 h-7 text-green-600" />
                    </div>
                    <p className="font-semibold text-foreground">Message sent!</p>
                    <p className="text-sm text-muted-foreground">We'll get back to you shortly.</p>
                    <Button variant="outline" size="sm" onClick={() => setSent(false)}>Send another</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email address</Label>
                        <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. UGC ad package enquiry" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us about your business and what you're looking for..."
                        className="min-h-[130px] resize-none"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 font-semibold gap-2" disabled={sending}>
                      {sending ? 'Sending…' : <><Send className="w-4 h-4" /> Send message</>}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

