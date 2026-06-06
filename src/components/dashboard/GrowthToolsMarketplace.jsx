import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ArrowRight, Zap, MessageCircle, FileText, Bot } from 'lucide-react';

export default function GrowthToolsMarketplace() {
  const tools = [
    {
      id: 'designs',
      title: 'Brandfletch Designs',
      icon: Palette,
      description: 'Need a poster, flyer, social media graphic, banner or advert creative? Order professional designs directly from our creative team.',
      cta: 'Order Design',
      link: '/designs',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Marketing',
      icon: MessageCircle,
      description: 'Reach customers directly on WhatsApp. Send broadcast messages, automated responses and build customer relationships.',
      cta: 'Coming Soon',
      link: '#',
      disabled: true,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      id: 'crm',
      title: 'CRM',
      icon: FileText,
      description: 'Manage customer relationships, track interactions and close more deals with our powerful CRM system.',
      cta: 'Coming Soon',
      link: '#',
      disabled: true,
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      icon: Bot,
      description: 'Get AI-powered insights, recommendations and automation for your marketing campaigns and business growth.',
      cta: 'Coming Soon',
      link: '#',
      disabled: true,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading">Growth Tools Marketplace</h2>
        <p className="text-muted-foreground">Powerful add-ons to grow your business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Card key={tool.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className={`w-12 h-12 rounded-lg ${tool.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <tool.icon className={`w-6 h-6 ${tool.textColor}`} />
              </div>
              <CardTitle className="text-base">{tool.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-sm leading-relaxed">
                {tool.description}
              </CardDescription>
              {tool.disabled ? (
                <Button className="w-full" variant="outline" disabled>
                  <Zap className="w-4 h-4 mr-2 opacity-50" />
                  {tool.cta}
                </Button>
              ) : (
                <Link to={tool.link} className="block">
                  <Button className="w-full group/btn">
                    {tool.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}