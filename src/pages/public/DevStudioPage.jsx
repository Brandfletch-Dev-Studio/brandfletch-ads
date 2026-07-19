import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Smartphone, Bot, Workflow, Database, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSEO } from '@/hooks/useSEO';

export default function DevStudioPage() {
  useSEO({
    title: 'Brandfletch Dev Studio — Websites, Apps, Automations & AI Agents',
    description: 'Websites, web apps, automations, and AI sales agents built to scale your business.',
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white py-20 text-center relative overflow-hidden">
        {/* Decorative Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.06] pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
          }} 
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/15 px-3 py-1 text-sm font-medium">
            Development & Automation
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display mb-6 tracking-tight">
            Brandfletch Dev Studio
          </h1>
          <p className="text-lg sm:text-xl text-emerald-50/90 max-w-2xl mx-auto leading-relaxed mb-8">
            Websites, apps, automations, and AI agents built to scale your business — from landing pages to full systems.
          </p>
          <Link to="/quote/dev-studio">
            <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-8 shadow-lg transition-all rounded-xl">
              Get a Quotation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Services Grid Section */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-600 font-semibold bg-emerald-50/50">
            What We Build
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground mb-12">
            Development services that scale with you
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {[
              {
                title: 'Websites',
                icon: Globe,
                desc: 'Fast, responsive websites that convert visitors into customers.',
              },
              {
                title: 'Web Apps',
                icon: Code2,
                desc: 'Custom web applications built around your business processes.',
              },
              {
                title: 'Mobile Apps',
                icon: Smartphone,
                desc: 'iOS and Android apps that your customers love to use.',
              },
              {
                title: 'AI Sales Agents',
                icon: Bot,
                desc: 'AI-powered agents that handle enquiries, qualify leads, and book appointments 24/7.',
              },
              {
                title: 'Automations',
                icon: Workflow,
                desc: 'Automate repetitive tasks and connect your tools together.',
              },
              {
                title: 'CRM & Integrations',
                icon: Database,
                desc: 'Set up and integrate your CRM with everything you use.',
              },
            ].map((service) => (
              <div
                key={service.title}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm transition-all hover:shadow-md hover:border-emerald-500/20 group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-5 transition-colors group-hover:bg-emerald-500/15">
                  <service.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Tech Stack Section */}
      <section className="py-12 bg-muted/30 border-y border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-600 font-semibold bg-emerald-50/50">
            Built With
          </Badge>
          <h2 className="text-3xl font-bold font-display tracking-tight text-foreground mb-8">
            Modern, reliable technology
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              'React & Next.js',
              'Supabase & PostgreSQL',
              'Vercel & Cloudflare',
              'Meta & OpenAI APIs',
              'Node.js & Python',
              'WhatsApp Business API',
            ].map((tech) => (
              <div
                key={tech}
                className="bg-card border border-border rounded-xl p-4 text-center flex items-center justify-center shadow-sm hover:border-emerald-500/20 transition-colors"
              >
                <span className="font-semibold text-sm text-foreground">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Process Section */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-600 font-semibold bg-emerald-50/50">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground mb-12">
            From idea to deployment
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left relative">
            {[
              {
                step: '01',
                title: 'Discovery',
                desc: 'We scope your project and define the requirements.',
              },
              {
                step: '02',
                title: 'Design',
                desc: 'We design the UX/UI and get your approval.',
              },
              {
                step: '03',
                title: 'Build',
                desc: 'We develop, test, and iterate on your product.',
              },
              {
                step: '04',
                title: 'Launch',
                desc: 'We deploy, monitor, and support your launch.',
              },
            ].map((step, idx) => (
              <div key={step.step} className="relative group">
                {/* Connecting line for large screens */}
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-[1px] bg-border z-0 -translate-x-4" />
                )}
                <div className="relative z-10">
                  <div className="text-4xl font-extrabold text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors font-display mb-3">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-800 text-white text-center relative overflow-hidden">
        {/* Decorative Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.06] pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
          }} 
        />
        <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-4">
            Ready to build something great?
          </h2>
          <p className="text-emerald-50/80 max-w-lg mx-auto mb-8 leading-relaxed">
            Let's turn your idea into high-performing software. Start by requesting a quotation today.
          </p>
          <Link to="/quote/dev-studio">
            <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-8 shadow-lg transition-all rounded-xl">
              Get a Quotation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
