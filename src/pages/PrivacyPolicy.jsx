import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Database, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/BrandLogo';

export default function PrivacyPolicy() {
  const sections = [
    {
      title: '1. Information We Collect',
      icon: Database,
      content: [
        'Personal Information: We collect information you provide directly to us, including your name, email address, business name, and payment information when you create an account or use our services.',
        'Usage Information: We automatically collect information about how you interact with our platform, including pages visited, features used, and time spent on the platform.',
        'Device Information: We collect information about the device you use to access our services, including browser type, operating system, and IP address.'
      ]
    },
    {
      title: '2. How We Use Your Information',
      icon: Eye,
      content: [
        'To provide, maintain, and improve our advertising management services',
        'To process your payments and send you related information',
        'To send you promotional communications (with your consent)',
        'To monitor and analyze trends, usage, and activities',
        'To detect, investigate, and prevent fraudulent transactions and other illegal activities',
        'To personalize your experience and deliver content tailored to your interests'
      ]
    },
    {
      title: '3. Information Sharing',
      icon: Shield,
      content: [
        'We do not sell, trade, or rent your personal information to third parties.',
        'We may share your information with service providers who perform services on our behalf, such as payment processing and data analysis.',
        'We may disclose information if required by law or in response to valid requests by public authorities.',
        'We may share information with your consent or at your direction.'
      ]
    },
    {
      title: '4. Data Security',
      icon: Lock,
      content: [
        'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
        'Your account is protected by a password that you create. Please keep your password confidential and do not share it with anyone.',
        'While we strive to protect your personal information, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.'
      ]
    },
    {
      title: '5. Your Rights',
      icon: Shield,
      content: [
        'You have the right to access your personal information and request corrections.',
        'You may request deletion of your personal information, subject to legal obligations.',
        'You can opt-out of receiving promotional communications from us.',
        'You may request a copy of your personal information in a portable format.'
      ]
    },
    {
      title: '6. Cookies and Tracking',
      icon: Eye,
      content: [
        'We use cookies and similar tracking technologies to collect information about your browsing activities.',
        'You can control cookies through your browser settings, but disabling cookies may limit your ability to use certain features of our platform.',
        'We may use third-party analytics services to help us understand how you use our services.'
      ]
    },
    {
      title: '7. Data Retention',
      icon: Database,
      content: [
        'We retain your personal information for as long as necessary to provide our services and comply with legal obligations.',
        'When your information is no longer needed, we will either delete or anonymize it.',
        'If deletion is not possible, we will implement appropriate security measures to protect the information.'
      ]
    },
    {
      title: '8. Children\'s Privacy',
      icon: Shield,
      content: [
        'Our services are not intended for individuals under the age of 18.',
        'We do not knowingly collect personal information from children.',
        'If we become aware that we have collected information from a child, we will take steps to delete that information.'
      ]
    },
    {
      title: '9. Changes to This Policy',
      icon: Shield,
      content: [
        'We may update this privacy policy from time to time to reflect changes in our practices or legal requirements.',
        'We will notify you of any material changes by posting the new policy on this page and updating the effective date.',
        'We encourage you to review this policy periodically for the latest information on our privacy practices.'
      ]
    },
    {
      title: '10. Contact Us',
      icon: Shield,
      content: [
        'If you have any questions about this privacy policy, please contact us at support@brandfletch.com',
        'You may also reach us through the support ticket system available in your dashboard.',
        'We will respond to all privacy-related inquiries within 30 days.'
      ]
    }
  ];

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/">
          <BrandLogo size="sidebar" black />
        </Link>
        <nav className="flex gap-4">
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">About</Link>
          <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">Contact</Link>
        </nav>
      </div>

      {/* Title */}
      <div className="text-center space-y-4 py-8">
        <Shield className="w-16 h-16 text-primary mx-auto" />
        <h1 className="text-4xl font-bold font-heading text-foreground">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground">Last updated: January 2025</p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <section.icon className="w-6 h-6 text-primary" />
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              {section.content.map((paragraph, idx) => (
                <p key={idx} className="text-sm leading-relaxed">
                  {paragraph.startsWith('•') || paragraph.startsWith('-') ? paragraph : paragraph}
                </p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-bold font-heading mb-2">Questions About Privacy?</h2>
          <p className="text-sm opacity-90 mb-4">
            Contact us at support@brandfletch.com or submit a support ticket.
          </p>
          <Link to="/contact">
            <Button variant="secondary" size="sm">Contact Us</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="border-t pt-6 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <BrandLogo size="sidebar" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Brandfletch Media. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="text-sm text-primary">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}