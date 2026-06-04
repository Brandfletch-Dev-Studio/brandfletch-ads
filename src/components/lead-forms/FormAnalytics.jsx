import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';

export default function FormAnalytics({ forms, onClose }) {
  const totalSubmissions = forms?.reduce((sum, f) => sum + (f.total_submissions || 0), 0) || 0;
  const activeForms = forms?.filter(f => f.is_active).length || 0;
  
  const topForms = forms
    ?.filter(f => f.total_submissions > 0)
    .sort((a, b) => (b.total_submissions || 0) - (a.total_submissions || 0))
    .slice(0, 5) || [];

  const conversionRate = forms?.length > 0 
    ? ((activeForms / forms.length) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Form Analytics</h1>
          <p className="text-muted-foreground">Performance insights across all forms</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Back to Forms
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{forms?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Forms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSubmissions}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeForms}</p>
                <p className="text-xs text-muted-foreground">Active Forms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Active Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {topForms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topForms.map((form, idx) => (
                <div key={form.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{form.form_name}</p>
                      <p className="text-xs text-muted-foreground">{form.form_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{form.total_submissions}</p>
                    <p className="text-xs text-muted-foreground">leads</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}