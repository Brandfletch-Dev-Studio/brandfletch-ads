import { Link } from 'react-router-dom';
import { FileText, Scale, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/BrandLogo';

export default function Terms() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      icon: FileText,
      content: [
        'By accessing and using Brandfletch Ads, you accept and agree to be bound by these Terms and Conditions.',
        'If you do not agree to these terms, please do not use our services.',
        'We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of the modified terms.'
      ]
    },
    {
      title: '2. Description of Service',
      icon: FileText,
      content: [
        'Brandfletch Ads provides a platform for creating, managing, and optimizing Facebook advertising campaigns.',
        'We offer campaign packages, audience targeting tools, payment processing, and performance analytics.',
        'We do not guarantee specific advertising results, impressions, reach, or conversions.',
        'All advertising campaigns are subject to Facebook\'s advertising policies and approval process.'
      ]
    },
    {
      title: '3. User Accounts',
      icon: AlertCircle,
      content: [
        'You must create an account to use our services. You are responsible for maintaining the security of your account.',
        'You must provide accurate and complete information when creating an account.',
        'You are responsible for all activities that occur under your account.',
        'You must notify us immediately of any unauthorized use of your account.',
        'We reserve the right to suspend or terminate accounts that violate these terms.'
      ]
    },
    {
      title: '4. Payment Terms',
      icon: Scale,
      content: [
        'All payments are processed securely through our platform using approved payment methods.',
        'Prices are displayed in your local currency and may vary based on exchange rates.',
        'Payments are non-refundable once your campaign has been approved and launched.',
        'We reserve the right to adjust pricing with prior notice.',
        'Failed payments may result in campaign suspension or termination.'
      ]
    },
    {
      title: '5. Campaign Submission and Approval',
      icon: CheckCircle,
      content: [
        'All campaigns must comply with Facebook\'s advertising policies and local regulations.',
        'Campaigns are subject to review and approval by our team before launch.',
        'We may request changes to your campaign content, creative, or targeting.',
        'We reserve the right to reject campaigns that violate policies or are inappropriate.',
        'Approval times may vary but we strive to review campaigns within 24-48 hours.'
      ]
    },
    {
      title: '6. User Responsibilities',
      icon: AlertCircle,
      content: [
        'You are responsible for the content of your advertisements and ensuring they comply with applicable laws.',
        'You must not use our platform for illegal, fraudulent, or misleading purposes.',
        'You must not interfere with the platform\'s functionality or security.',
        'You must not attempt to access other users\' accounts or data.',
        'You must comply with all applicable laws and regulations in your jurisdiction.'
      ]
    },
    {
      title: '7. Intellectual Property',
      icon: Scale,
      content: [
        'Brandfletch Ads and its content, features, and functionality are owned by Brandfletch Media and protected by intellectual property laws.',
        'You retain ownership of the content you create for your campaigns.',
        'By using our platform, you grant us a license to use your content solely for the purpose of providing our services.',
        'You may not copy, modify, distribute, or create derivative works from our platform without permission.'
      ]
    },
    {
      title: '8. Disclaimer of Warranties',
      icon: AlertCircle,
      content: [
        'Our services are provided "as is" and "as available" without warranties of any kind.',
        'We do not guarantee that the platform will be uninterrupted, secure, or error-free.',
        'We do not guarantee specific advertising results or business outcomes.',
        'You use the platform at your own risk and discretion.'
      ]
    },
    {
      title: '9. Limitation of Liability',
      icon: Scale,
      content: [
        'Brandfletch Media shall not be liable for any indirect, incidental, special, or consequential damages.',
        'Our total liability shall not exceed the amount you paid for the services giving rise to the claim.',
        'We are not responsible for the actions or omissions of third parties, including Facebook.',
        'We are not liable for any loss of data, profits, or business opportunities.'
      ]
    },
    {
      title: '10. Termination',
      icon: AlertCircle,
      content: [
        'We may suspend or terminate your access to the platform at any time for violations of these terms.',
        'You may terminate your account at any time by contacting support.',
        'Upon termination, your right to use the platform will immediately cease.',
        'Termination does not entitle you to any refunds unless required by law.'
      ]
    },
    {
      title: '11. Governing Law',
      icon: Scale,
      content: [
        'These terms are governed by the laws of Malawi.',
        'Any disputes arising from these terms shall be resolved in the courts of Malawi.',
        'If any provision of these terms is found to be invalid, the remaining provisions shall remain in effect.'
      ]
    },
    {
      title: '12. Contact Information',
      icon: FileText,
      content: [
        'For questions about these Terms and Conditions, please contact us at support@brandfletch.com',
        'You may also submit a support ticket through your dashboard.',
        'We will respond to all inquiries within 30 days.'
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
        <Scale className="w-16 h-16 text-primary mx-auto" />
        <h1 className="text-4xl font-bold font-heading text-foreground">Terms & Conditions</h1>
        <p className="text-lg text-muted-foreground">Effective Date: January 2025</p>
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
                  {paragraph}
                </p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Acceptance CTA */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
        <CardContent className="p-6 text-center space-y-4">
          <h2 className="text-xl font-bold font-heading">Ready to Get Started?</h2>
          <p className="text-sm opacity-90">
            By using Brandfletch Ads, you agree to these terms and conditions.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register">
              <Button variant="secondary" size="lg">Create Account</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20">
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
            <Link to="/terms" className="text-sm text-primary">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}