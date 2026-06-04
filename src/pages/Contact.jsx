import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, MapPin, Clock, Send, Phone, MessageCircle, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import BrandLogo from '@/components/BrandLogo';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const user = await base44.auth.me().catch(() => null);
      
      await base44.entities.SupportTicket.create({
        user_id: user?.id || 'anonymous',
        user_name: formData.name,
        user_email: formData.email,
        subject: formData.subject,
        description: formData.message,
        category: 'general',
        priority: 'medium',
        status: 'open'
      });

      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactMethods = [
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: '+265 980 011 467',
      href: 'https://wa.me/265980011467',
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      icon: Phone,
      label: 'Phone Call',
      value: '+265 980 011 467',
      href: 'tel:+265980011467',
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'support@brandfletch.com',
      href: 'mailto:support@brandfletch.com',
      color: 'text-amber-600',
      bg: 'bg-amber-100'
    },
    {
      icon: Ticket,
      label: 'Support Ticket',
      value: 'Submit a ticket',
      href: '/support',
      color: 'text-purple-600',
      bg: 'bg-purple-100'
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
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">About</Link>
          <Link to="/contact" className="text-sm font-medium text-primary">Contact</Link>
        </nav>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl lg:text-5xl font-bold font-heading text-foreground">
          Get in Touch
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Have questions? We're here to help you succeed with your advertising campaigns.
        </p>
      </div>

      {/* Contact Methods */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {contactMethods.map((method) => (
          <a
            key={method.label}
            href={method.href}
            target={method.label !== 'Support Ticket' ? '_blank' : undefined}
            rel={method.label !== 'Support Ticket' ? 'noopener noreferrer' : undefined}
          >
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 h-full">
              <CardContent className="p-6 text-center space-y-3">
                <div className={`w-14 h-14 rounded-full ${method.bg} ${method.color} flex items-center justify-center mx-auto`}>
                  <method.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{method.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{method.value}</p>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Location</p>
                  <p className="text-muted-foreground">Lilongwe, Malawi</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Business Hours</p>
                  <p className="text-muted-foreground">Monday - Friday: 8:00 AM - 5:00 PM (CAT)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Inquiries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Campaign packages and pricing</p>
              <p>• Technical support for advertising campaigns</p>
              <p>• Partnership and collaboration inquiries</p>
              <p>• Feedback and feature requests</p>
              <p>• Account and payment assistance</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll respond as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your inquiry..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t pt-6 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <BrandLogo size="sidebar" />
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