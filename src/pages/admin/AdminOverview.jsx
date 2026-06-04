import { Card, CardContent } from '@/components/ui/card';
import { Palette, Users, TrendingUp, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminOverview() {
  const stats = [
    {
      title: 'Total Designs',
      value: '0',
      icon: Palette,
      color: 'bg-purple-100 text-purple-700',
      link: '/admin/designs',
    },
    {
      title: 'Total Leads',
      value: '0',
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
      link: '/admin/leads',
    },
    {
      title: 'Active Campaigns',
      value: '0',
      icon: Activity,
      color: 'bg-green-100 text-green-700',
      link: '/admin/campaigns',
    },
    {
      title: 'Revenue',
      value: '$0',
      icon: TrendingUp,
      color: 'bg-amber-100 text-amber-700',
      link: '/admin/payments',
    },
  ];

  return (
    <div className="p-[15px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading mb-2">Admin Overview</h1>
        <p className="text-muted-foreground">Platform statistics and quick access</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/admin/designs" className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <p className="font-medium">Manage Design Requests</p>
                <p className="text-sm text-muted-foreground">Review and assign design tasks</p>
              </Link>
              <Link to="/admin/leads" className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <p className="font-medium">View All Leads</p>
                <p className="text-sm text-muted-foreground">Monitor lead pipeline across users</p>
              </Link>
              <Link to="/admin/campaigns" className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <p className="font-medium">Campaign Management</p>
                <p className="text-sm text-muted-foreground">Approve and track ad campaigns</p>
              </Link>
              <Link to="/admin/users" className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <p className="font-medium">User Management</p>
                <p className="text-sm text-muted-foreground">Manage platform users</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Platform Status</span>
                <span className="text-sm font-medium text-green-600">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <span className="text-sm font-medium">Loading...</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Subscriptions</span>
                <span className="text-sm font-medium">Loading...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}