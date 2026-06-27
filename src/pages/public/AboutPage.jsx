import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Globe, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSEO } from '@/hooks/useSEO';

const VALUES = [
  { icon: Heart,  title: 'Africa-First',      desc: 'We understand the African market — its nuances, local payment methods, and growth opportunities.' },
  { icon: Globe,  title: 'Accessible Tech',   desc: 'World-class advertising tools should not be reserved for enterprises with big agency budgets.' },
  { icon: Users,  title: 'Human Support',     desc: 'Real humans back every campaign. Our team reviews, optimises, and is always one message away.' },
  { icon: Zap,    title: 'Results-Driven',    desc: 'We obsess over your ROI. Every feature we build is measured against one question: does it help clients grow?' },
];

export default function AboutPage() {
  useSEO({
    title:       'About Brandfletch Media — Built for Africa, Powered by Ambition',
    description: 'Brandfletch Media was born from the African market. We democratise world-class digital advertising for businesses across Malawi, Kenya, Zambia, and beyond.',
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-[hsl(var(--primary))] text-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Badge className="mb-5 bg-white/10 text-white/80 border-white/20">Our story</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-5">
            Built for Africa.<br />
            <span className="text-[hsl(var(--accent))]">Powered by ambition.</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Brandfletch Media was born from a simple frustration — African businesses deserve the same advertising power as global enterprises, at a price that makes sense.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="outline" className="mb-4 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30">Our mission</Badge>
            <h2 className="text-3xl font-bold font-display mb-4">Democratising digital advertising across Africa</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We started in Malawi, frustrated by how hard it was for local businesses to run effective Facebook campaigns without a big agency. Everything was either too expensive, too complex, or not built for our currencies and realities.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              So we built Brandfletch Media — a full-stack advertising platform that handles campaign creation, creative design, payment, and reporting in one place. Today we serve businesses in Malawi, Zambia, Kenya, South Africa, and Tanzania.
            </p>
            <Link to="/register">
              <Button className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white">
                Join us <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['500+','Businesses served'],['5','Countries'],['$2M+','Ad spend managed'],['98%','Satisfaction rate']].map(([v,l]) => (
              <div key={l} className="bg-card border border-border rounded-2xl p-6 text-center">
                <p className="text-3xl font-bold font-display text-[hsl(var(--accent))]">{v}</p>
                <p className="text-sm text-muted-foreground mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30">What drives us</Badge>
            <h2 className="text-3xl font-bold font-display">Our values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(v => (
              <div key={v.title} className="bg-card rounded-2xl border border-border p-6">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent))]/10 flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-[hsl(var(--accent))]" />
                </div>
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[hsl(var(--primary))] text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold font-display mb-4">Ready to be part of the story?</h2>
          <p className="text-white/70 mb-7">Start advertising today. No agency. No complexity. Just results.</p>
          <Link to="/register">
            <Button className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white font-bold px-8 h-11">
              Get started free <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

