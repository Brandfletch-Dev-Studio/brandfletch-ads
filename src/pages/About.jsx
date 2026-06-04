import { Link } from 'react-router-dom';
import { Megaphone, Users, Target, TrendingUp, Shield, Globe } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="sidebar" />
          </Link>
          <nav className="flex gap-4">
            <Link to="/about" className="text-sm font-medium text-primary">About</Link>
            <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">Contact</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold font-heading text-foreground mb-8">
          About Brandfletch Ads
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Brandfletch Ads is a comprehensive advertising management platform designed to help businesses of all sizes create, manage, and optimize their Facebook advertising campaigns with ease. Whether you're a small local business looking to reach customers in your community, or a growing enterprise seeking to expand your digital presence, Brandfletch Ads provides the tools and expertise you need to succeed in the competitive world of online advertising.
          </p>

          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Our platform simplifies the complex process of running Facebook ad campaigns by offering pre-built campaign packages, intuitive audience targeting tools, and seamless payment integration tailored to African markets. We understand the unique challenges faced by businesses in Malawi, Kenya, Zambia, and across the continent, which is why we've built a system that supports local payment methods including mobile money, bank transfers, and cryptocurrency options.
          </p>

          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Brandfletch Ads is built for entrepreneurs, marketing managers, and business owners who want professional advertising results without the complexity of navigating Facebook's Ads Manager on their own. Our guided campaign wizard walks you through every step of the process, from selecting your advertising goal to defining your target audience and setting your budget. We also offer a marketplace of professional services including page setup, content creation, and ongoing ads management for those who prefer a hands-off approach.
          </p>

          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            The platform is developed and maintained by Brandfletch Media, a team of digital marketing professionals and software engineers passionate about empowering African businesses with world-class advertising technology. We combine deep expertise in Facebook advertising with local market knowledge to deliver a platform that truly meets the needs of our users. Our commitment to transparency, affordability, and customer support sets us apart in the digital advertising landscape.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-xl border bg-card">
            <Megaphone className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold font-heading mb-2">Campaign Management</h3>
            <p className="text-muted-foreground">Create and manage Facebook ad campaigns with our intuitive wizard and real-time performance tracking.</p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <Users className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold font-heading mb-2">Audience Targeting</h3>
            <p className="text-muted-foreground">Reach your ideal customers with precise targeting by location, age, gender, and interests.</p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <Target className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold font-heading mb-2">Flexible Packages</h3>
            <p className="text-muted-foreground">Choose from starter, growth, business, premium, and enterprise packages to fit your budget.</p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <TrendingUp className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold font-heading mb-2">Performance Analytics</h3>
            <p className="text-muted-foreground">Track impressions, reach, clicks, and conversions with detailed campaign reports.</p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <Shield className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold font-heading mb-2">Secure Payments</h3>
            <p className="text-muted-foreground">Pay safely using local mobile money, bank transfer, or cryptocurrency with payment verification.</p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <Globe className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold font-heading mb-2">Africa-Focused</h3>
            <p className="text-muted-foreground">Built specifically for African businesses with local currencies and payment methods.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <BrandLogo size="sidebar" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Brandfletch Media. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link to="/about" className="text-sm font-medium text-primary">About</Link>
              <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}