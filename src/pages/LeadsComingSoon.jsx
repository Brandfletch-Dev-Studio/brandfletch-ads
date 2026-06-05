import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Zap, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LeadsComingSoon() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-3xl font-bold font-heading text-foreground mb-4">
            Leads Module - Coming Soon
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            We're building a powerful CRM to help you track, manage, and convert your leads. 
            Stay tuned for this exciting feature!
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-secondary/50">
              <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm mb-1">Lead Tracking</h3>
              <p className="text-xs text-muted-foreground">Monitor every interaction</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <Target className="w-6 h-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm mb-1">Sales Pipeline</h3>
              <p className="text-xs text-muted-foreground">Visual kanban boards</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <Bell className="w-6 h-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm mb-1">Auto Notifications</h3>
              <p className="text-xs text-muted-foreground">Never miss a follow-up</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard">
              <Button variant="outline" className="gap-2">
                Back to Dashboard
              </Button>
            </Link>
            <Link to="/campaigns">
              <Button className="gap-2">
                Create Campaign Instead
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}