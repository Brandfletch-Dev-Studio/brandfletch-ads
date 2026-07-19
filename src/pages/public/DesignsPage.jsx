import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Palette,
  PenTool,
  Image,
  Layout,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSEO } from '@/hooks/useSEO';

const SERVICES = [
  {
    icon: PenTool,
    title: 'Logo Design',
    desc: 'A memorable logo that represents your business and builds instant recognition.',
  },
  {
    icon: Palette,
    title: 'Brand Identity',
    desc: 'Complete visual identity systems — colours, typography, and guidelines that keep you consistent.',
  },
  {
    icon: Image,
    title: 'Social Media Graphics',
    desc: 'Scroll-stopping graphics for Facebook, Instagram, and every platform that matters.',
  },
  {
    icon: Layout,
    title: 'Print Design',
    desc: 'Flyers, posters, business cards, and brochures — designed to convert in the real world.',
  },
  {
    icon: Sparkles,
    title: 'Packaging Design',
    desc: 'Product packaging that stands out on the shelf and tells your story.',
  },
  {
    icon: CheckCircle2,
    title: 'Creative Direction',
    desc: 'Strategic creative direction that ties every visual element together.',
  },
];

const PORTFOLIO_ITEMS = [
  {
    type: 'Logo Design',
    gradient: 'from-purple-600 to-pink-500',
    span: 'sm:col-span-2 lg:col-span-1',
  },
  {
    type: 'Brand Identity',
    gradient: 'from-indigo-600 to-purple-600',
    span: 'sm:col-span-1 lg:col-span-2',
  },
  {
    type: 'Social Media',
    gradient: 'from-pink-500 to-fuchsia-600',
    span: 'sm:col-span-1 lg:col-span-1',
  },
  {
    type: 'Print Design',
    gradient: 'from-violet-600 to-indigo-600',
    span: 'sm:col-span-1 lg:col-span-1',
  },
  {
    type: 'Packaging',
    gradient: 'from-fuchsia-500 to-pink-600',
    span: 'sm:col-span-2 lg:col-span-2',
  },
  {
    type: 'Creative Direction',
    gradient: 'from-purple-600 to-violet-600',
    span: 'sm:col-span-1 lg:col-span-1',
  },
];

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Brief',
    desc: 'Share your vision, goals, and brand personality.',
  },
  {
    step: '02',
    title: 'Concept',
    desc: 'We create initial design concepts for your review.',
  },
  {
    step: '03',
    title: 'Refine',
    desc: "We iterate based on your feedback until it's perfect.",
  },
  {
    step: '04',
    title: 'Deliver',
    desc: 'You receive all files in every format you need.',
  },
];

export default function DesignsPage() {
  useSEO({
    title: 'Brandfletch Designs — Professional Design for African Businesses',
    description: 'Logo design, brand identity, social media graphics, and print design for African businesses.',
  });

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-700 text-white py-20 text-center">
        {/* Subtle dot pattern */}
        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{ 
            backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }} 
        />
        
        {/* Glow accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4 bg-white/10 text-white border-white/20 hover:bg-white/20 transition-colors uppercase tracking-wider text-xs px-4 py-1.5 rounded-full">
            Design Services
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight mb-6">
            Brandfletch Designs
          </h1>
          
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed mb-10">
            Professional design that makes your business stand out — from logos to full brand identities and everything in between.
          </p>
          
          <div className="flex justify-center">
            <Link to="/quote/designs">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 font-bold px-8 h-12 text-base rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02]">
                Get a Quotation <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. SERVICES GRID SECTION ────────────────────────────────────────── */}
      <section className="py-20 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
            What We Design
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground mb-12">
            Design services built to elevate your brand
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {SERVICES.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. PORTFOLIO SECTION ────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
              Our Work
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground">
              Recent design projects
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PORTFOLIO_ITEMS.map((item, idx) => (
              <div 
                key={idx} 
                className={`${item.span} rounded-2xl overflow-hidden h-64 bg-gradient-to-br ${item.gradient} relative group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300`}
              >
                {/* Overlay pattern for aesthetics */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors duration-300" />
                <div 
                  className="absolute inset-0 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-300"
                  style={{ 
                    backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1.5px, transparent 1.5px)', 
                    backgroundSize: '16px 16px' 
                  }} 
                />
                
                {/* Bottom label */}
                <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm px-4 py-3 rounded-xl border border-border/50 shadow-sm transform group-hover:translate-y-[-2px] transition-transform duration-300">
                  <span className="text-xs font-semibold text-foreground tracking-wide uppercase">
                    {item.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PROCESS SECTION ──────────────────────────────────────────────── */}
      <section className="py-20 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground">
              From brief to final design
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((h, i) => (
              <div key={h.step} className="relative">
                {i < PROCESS_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%-0px)] w-full h-px bg-border z-0" />
                )}
                <div className="relative z-10 bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow duration-300 h-full">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold mb-4 shadow-sm">
                    {h.step}
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-2">
                    {h.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {h.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CTA SECTION ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-700 text-white py-20 text-center">
        {/* Subtle dot pattern */}
        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{ 
            backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }} 
        />
        
        {/* Glow accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-white/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold mb-4">
            Ready to elevate your brand?
          </h2>
          
          <p className="text-lg text-white/90 max-w-xl mx-auto mb-10 leading-relaxed">
            Get a quotation and we'll bring your vision to life.
          </p>
          
          <div className="flex justify-center">
            <Link to="/quote/designs">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 font-bold px-8 h-12 text-base rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02]">
                Get a Quotation <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
