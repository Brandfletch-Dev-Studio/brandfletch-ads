import { Link } from 'react-router-dom';
import {
  ArrowRight,
  GraduationCap,
  BookOpen,
  Briefcase,
  Users2,
  Lightbulb,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSEO } from '@/hooks/useSEO';

const PROGRAMS = [
  {
    icon: BookOpen,
    title: 'Marketing Mastery',
    desc: 'Learn the marketing systems we use to grow businesses — from Meta Ads to content strategy.',
  },
  {
    icon: Briefcase,
    title: 'Sales Excellence',
    desc: 'Master the art of selling — from cold calls to closing deals and managing accounts.',
  },
  {
    icon: Users2,
    title: 'Business Operations',
    desc: 'Build the systems and processes that make your business run without you.',
  },
  {
    icon: Lightbulb,
    title: '1-on-1 Coaching',
    desc: 'Personalised coaching tailored to your business goals and challenges.',
  },
];

const POINTS = [
  'Taught by active practitioners',
  'Real case studies from African businesses',
  'Actionable frameworks you can apply today',
  'Community of like-minded entrepreneurs',
];

export default function AcademyPage() {
  useSEO({
    title: 'Brandfletch Business Academy — Learn the Systems Behind Growth',
    description: 'Courses and programs built to teach business owners the marketing, sales, and operations skills we use every day.',
  });

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-br from-cyan-600 to-sky-800 text-white py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center">
          <Badge className="mb-5 bg-white/10 text-white/90 border-white/20 px-3 py-1 text-xs gap-1.5 hover:bg-white/15">
            <GraduationCap className="w-3.5 h-3.5" /> Business Education
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display mb-5 leading-tight">
            Brandfletch Business Academy
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-8">
            Learn the systems behind the growth — courses and programs that teach you the marketing, sales, and operations skills we use every day.
          </p>
          <Link to="/quote/academy">
            <Button className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white font-bold px-8 py-5 h-12 rounded-xl text-base shadow-lg transition-all duration-200">
              Enrol Now <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Programs grid Section */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30 px-3 py-1 text-xs font-semibold">
              Our Programs
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              Programs designed for real business growth
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {PROGRAMS.map((program) => {
              const IconComponent = program.icon;
              return (
                <div
                  key={program.title}
                  className="bg-card border border-border rounded-2xl p-8 hover:shadow-md transition-all duration-200 flex flex-col items-start"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 text-cyan-600">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{program.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {program.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Why learn with us section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30 px-3 py-1 text-xs font-semibold">
              Why Brandfletch Academy
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              Learn from practitioners, not theorists
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="space-y-6">
              {POINTS.map((pt, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center mt-0.5 text-cyan-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <p className="text-base font-medium text-foreground">{pt}</p>
                </div>
              ))}
            </div>

            {/* Right Side - Testimonial */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <p className="text-lg font-medium italic text-foreground mb-6 leading-relaxed">
                "The Academy gave me the exact systems I needed to scale my business. Worth every minute."
              </p>
              <p className="text-sm text-muted-foreground font-semibold">
                — Academy graduate, Lilongwe
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA Section */}
      <section className="py-20 bg-background">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-card border-2 border-[hsl(var(--accent))]/20 rounded-3xl p-10 text-center relative overflow-hidden shadow-lg">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--accent))]/10 flex items-center justify-center mx-auto mb-6 text-[hsl(var(--accent))]">
              <Rocket className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold font-display text-foreground mb-3">
              Ready to invest in your growth?
            </h2>
            <p className="text-muted-foreground mb-8 text-base">
              Enrol in a program or book a coaching session.
            </p>
            <Link to="/quote/academy">
              <Button className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white font-bold px-8 py-5 h-12 rounded-xl text-base shadow-sm transition-all duration-200">
                Enrol Now <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
