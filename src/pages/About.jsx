import { Link } from 'react-router-dom';
import { Megaphone, Users, Target, TrendingUp, Shield, Globe, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/BrandLogo';

export default function About() {
  const features = [
    {
      icon: Megaphone,
      title: 'Campaign Management',
      description: 'Create and manage Facebook ad campaigns with our intuitive wizard and real-time performance tracking.'
    },
    {
      icon: Users,
      title: 'Audience Targeting',
      description: 'Reach your ideal customers with precise targeting by location, age, gender, and interests.'
    },
    {
      icon: Target,
      title: 'Flexible Packages',
      description: 'Choose from starter, growth, business, premium, and enterprise packages to fit your budget.'
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Track impressions, reach, clicks, and conversions with detailed campaign reports.'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Pay safely using local mobile money, bank transfer, or cryptocurrency with payment verification.'
    },
    {
      icon: Globe,
      title: 'Africa-Focused',
      description: 'Built specifically for African businesses with local currencies and payment methods.'
    }
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/">
          <BrandLogo size="sidebar" black />
        </Link>
        <nav className="flex gap-4">
          <Link to="/about" className="text-sm font-medium text-primary">About</Link>
          <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">Contact</Link>
        </nav>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl lg:text-5xl font-bold font-heading text-foreground">
          About Brandfletch Ads
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Empowering African businesses with world-class advertising technology
        </p>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Brandfletch Ads is a comprehensive advertising management platform designed to help businesses of all sizes create, manage, and optimize their Facebook advertising campaigns with ease. Whether you're a small local business looking to reach customers in your community, or a growing enterprise seeking to expand your digital presence, Brandfletch Ads provides the tools and expertise you need to succeed.
            </p>
            <p>
              Our platform simplifies the complex process of running Facebook ad campaigns by offering pre-built campaign packages, intuitive audience targeting tools, and seamless payment integration tailored to African markets. We understand the unique challenges faced by businesses in Malawi, Kenya, Zambia, and across the continent.
            </p>
            <p>
              Brandfletch Ads is built for entrepreneurs, marketing managers, and business owners who want professional advertising results without the complexity of navigating Facebook's Ads Manager on their own. Our guided campaign wizard walks you through every step of the process.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-heading text-center">What We Offer</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <feature.icon className="w-10 h-10 text-primary mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
        <CardContent className="p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold font-heading">Ready to Get Started?</h2>
          <p className="text-sm opacity-90 max-w-xl mx-auto">
            Join hundreds of African businesses already using Brandfletch Ads to grow their brand and reach more customers.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/campaigns/new">
              <Button variant="secondary" size="lg" className="gap-2">
                Create Your First Campaign <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="gap-2 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20">
                Contact Us
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="border-t pt-6 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <BrandLogo size="sidebar" black />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Brandfletch Media. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}