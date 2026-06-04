import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, MapPin, Clock, Send } from 'lucide-react';
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
      // Create a support ticket from the contact form
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="sidebar" />
          </Link>
          <nav className="flex gap-4">
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">About</Link>
            <Link to="/contact" className="text-sm font-medium text-primary">Contact</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-4xl font-bold font-heading text-foreground mb-8">
          Contact Us
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>
                  Have questions about our platform? We're here to help.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <a href="mailto:support@brandfletch.com" className="text-muted-foreground hover:text-primary">
                      support@brandfletch.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Support Portal</p>
                    <a href="/support" className="text-muted-foreground hover:text-primary">
                      Submit a support ticket
                    </a>
                  </div>
                </div>

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
                <CardTitle>Why Contact Us?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Questions about campaign packages and pricing</p>
                <p>• Technical support for your advertising campaigns</p>
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
              <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">About</Link>
              <Link to="/contact" className="text-sm font-medium text-primary">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}