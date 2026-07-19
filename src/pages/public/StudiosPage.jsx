import { Link } from 'react-router-dom';
import { ArrowRight, Video, Camera, Film, Smartphone, Users, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSEO } from '@/hooks/useSEO';

export default function StudiosPage() {
  useSEO({
    title: 'Brandfletch Studios — Content Creation for African Businesses',
    description: 'Video production, photography, and UGC content that captures attention and drives engagement.',
  });

  const services = [
    {
      icon: Video,
      title: 'Video Production',
      desc: 'Professional video content for ads, social media, and brand storytelling.',
    },
    {
      icon: Camera,
      title: 'Photography',
      desc: 'Product, event, and brand photography that looks great everywhere.',
    },
    {
      icon: Smartphone,
      title: 'UGC Content',
      desc: 'User-generated style content that feels authentic and converts.',
    },
    {
      icon: Film,
      title: 'Social Media Content',
      desc: 'Reels, TikToks, and short-form video built for the algorithm.',
    },
    {
      icon: Users,
      title: 'Brand Stories',
      desc: 'Documentary-style content that tells your business story.',
    },
    {
      icon: Play,
      title: 'Content Strategy',
      desc: 'A content calendar and strategy that keeps you consistent.',
    },
  ];

  const stats = [
    { value: '500+', label: 'Pieces of content created' },
    { value: '50+', label: 'Happy clients' },
    { value: '1M+', label: 'Total views generated' },
  ];

  const steps = [
    {
      number: '01',
      title: 'Brief',
      desc: 'Tell us what you need — video, photos, UGC, or a full content strategy.',
    },
    {
      number: '02',
      title: 'Plan',
      desc: 'We create a content plan and shot list for your approval.',
    },
    {
      number: '03',
      title: 'Shoot',
      desc: 'We handle production — filming, photography, and editing.',
    },
    {
      number: '04',
      title: 'Deliver',
      desc: 'You receive polished content ready to post.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 to-red-700 text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <Badge className="mb-5 bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm">
            Content Creation
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight mb-6">
            Brandfletch Studios
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed mb-8">
            Content that captures attention and drives engagement — from video production to UGC content that converts.
          </p>
          <div className="flex justify-center">
            <Link to="/quote/studios">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg rounded-full px-8 h-12">
                Get a Quotation <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 text-orange-600 border-orange-500/30">
            What We Create
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-12">
            Content services built to perform
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 transition-all duration-200 hover:shadow-lg flex flex-col gap-4">
                  <div className="p-3 rounded-lg bg-orange-500/10 text-orange-600 self-start">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-display mb-2">{service.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {service.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Bar Section */}
      <section className="py-12 bg-muted/30 border-y border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-[hsl(var(--accent))] font-display mb-2">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 text-orange-600 border-orange-500/30">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-12">
            From concept to content
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col gap-3">
                <span className="text-4xl sm:text-5xl font-extrabold text-orange-600/20 font-display">
                  {step.number}
                </span>
                <h3 className="text-lg font-bold font-display">{step.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-orange-600 to-red-700 text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-6">
            Ready to create content that converts?
          </h2>
          <div className="flex justify-center">
            <Link to="/quote/studios">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg rounded-full px-8 h-12">
                Get a Quotation <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
