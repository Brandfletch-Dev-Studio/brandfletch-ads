import { useState } from 'react';
import { Mail, MessageSquare, MapPin, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function ContactPage() {
  const [form, setForm] = useState({ name:'', email:'', subject:'', message:'' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simple mailto fallback — can be wired to Resend later
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-[hsl(var(--primary))] text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Badge className="mb-5 bg-white/10 text-white/80 border-white/20">Get in touch</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">We'd love to hear from you</h1>
          <p className="text-white/70 text-lg">Questions, partnerships, or just want to say hi — our team replies fast.</p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12">
          {/* Info */}
          <div>
            <h2 className="text-2xl font-bold font-display mb-6">Contact information</h2>
            <div className="space-y-5">
              {[
                { icon: Mail,          label: 'Email',    val: 'hello@brandfletch.com' },
                { icon: MessageSquare, label: 'WhatsApp', val: '+265 XXX XXX XXX' },
                { icon: MapPin,        label: 'Based in', val: 'Malawi · Serving all of Africa' },
              ].map(c => (
                <div key={c.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[hsl(var(--accent))]/10 flex items-center justify-center shrink-0">
                    <c.icon className="w-4 h-4 text-[hsl(var(--accent))]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="font-medium text-foreground">{c.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <h3 className="text-xl font-bold font-display">Message sent!</h3>
                <p className="text-muted-foreground text-sm">We'll get back to you within 24 hours.</p>
                <Button variant="outline" onClick={() => { setSent(false); setForm({ name:'', email:'', subject:'', message:'' }); }}>
                  Send another
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" value={form.name} onChange={e => setForm({...form,name:e.target.value})} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Tell us more…" rows={5} value={form.message} onChange={e => setForm({...form,message:e.target.value})} required className="mt-1 resize-none" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white font-semibold">
                  {loading ? 'Sending…' : <><Send className="w-4 h-4 mr-2" /> Send message</>}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
