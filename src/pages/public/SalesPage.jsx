import { Link } from 'react-router-dom';
import { ArrowRight, Users, Phone, Target, TrendingUp, Handshake, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSEO } from '@/hooks/useSEO';

export default function SalesPage() {
  useSEO({
    title: 'Brandfletch Sales — Outsourced Sales Teams for African Businesses',
    description: 'A dedicated outsourced sales team that converts your leads into customers.',
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-600 to-orange-700 text-white py-20 text-center relative overflow-hidden">
        {/* Subtle background dot pattern */}
        <div 
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center">
          <Badge className="mb-5 bg-white/10 text-white border-white/20 hover:bg-white/20 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
            Outsourced Sales
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-tight mb-5">
            Brandfletch Sales
          </h1>
          <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed mb-8">
            An outsourced sales team that converts your leads into customers — without the overhead of hiring in-house.
          </p>
          <Link to="/quote/sales">
            <Button size="lg" className="bg-white text-amber-700 hover:bg-amber-50 font-bold px-8 h-12 shadow-lg hover:shadow-xl transition-all">
              Get a Quotation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center mb-16">
          <Badge variant="outline" className="mb-4 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5">
            What We Do
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight">
            Sales services that close deals
          </h2>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Users,
              title: 'Outbound Sales Team',
              desc: 'A dedicated team that handles your outbound calls and follow-ups.',
            },
            {
              icon: Phone,
              title: 'Lead Conversion',
              desc: 'We turn your cold and warm leads into paying customers.',
            },
            {
              icon: Target,
              title: 'Sales Strategy',
              desc: 'A proven sales process built around your offer and market.',
            },
            {
              icon: TrendingUp,
              title: 'Pipeline Management',
              desc: 'We manage your CRM and keep your pipeline flowing.',
            },
            {
              icon: Award,
              title: 'Sales Training',
              desc: 'Train your team with the systems we use to close deals.',
            },
            {
              icon: Handshake,
              title: 'Account Management',
              desc: 'Ongoing relationship management to retain and grow accounts.',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-display text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Outsourced Sales Section */}
      <section className="py-20 bg-muted/30 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center md:text-left mb-12">
            <Badge variant="outline" className="mb-4 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5">
              Why Outsource
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight">
              The advantage of an outsourced sales team
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-stretch">
            {/* Left Column: Benefits list */}
            <div className="flex flex-col justify-center space-y-5">
              {[
                'No hiring costs',
                'Trained from day one',
                'Scale up or down as needed',
                'Full transparency on performance',
                'Focus on your core business',
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-foreground font-medium text-base sm:text-lg">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Right Column: Stat Card */}
            <div className="bg-card border border-border rounded-2xl p-8 text-center flex flex-col justify-center space-y-8 shadow-sm">
              <div>
                <p className="text-4xl sm:text-5xl font-extrabold text-[hsl(var(--accent))] font-display">3× faster</p>
                <p className="text-sm text-muted-foreground mt-2">than hiring in-house</p>
              </div>
              <div className="border-t border-border pt-8">
                <p className="text-4xl sm:text-5xl font-extrabold text-[hsl(var(--accent))] font-display">60% lower</p>
                <p className="text-sm text-muted-foreground mt-2">cost than a full-time sales rep</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center mb-16">
          <Badge variant="outline" className="mb-4 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight">
            From setup to closing
          </h2>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              step: '01',
              title: 'Discovery',
              desc: 'We learn your product, market, and sales process.',
            },
            {
              step: '02',
              title: 'Setup',
              desc: 'We build your sales scripts, CRM, and reporting.',
            },
            {
              step: '03',
              title: 'Launch',
              desc: 'Your sales team starts calling and converting.',
            },
            {
              step: '04',
              title: 'Scale',
              desc: 'We optimize based on results and scale what works.',
            },
          ].map((item, idx) => (
            <div key={idx} className="relative bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-all duration-200">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-500/25 mb-4 font-display">
                {item.step}
              </div>
              <h3 className="text-lg font-bold font-display text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amber-600 to-orange-700 text-white text-center relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
        />
        <div className="relative max-w-3xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display mb-6">
            Ready to close more deals?
          </h2>
          <Link to="/quote/sales">
            <Button size="lg" className="bg-white text-amber-700 hover:bg-amber-50 font-bold px-8 h-12 shadow-lg hover:shadow-xl transition-all">
              Get a Quotation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
