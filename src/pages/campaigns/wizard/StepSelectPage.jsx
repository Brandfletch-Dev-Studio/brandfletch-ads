import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Facebook, CheckCircle2, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function StepSelectPage({ data, update, userId, user }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      base44.entities.FacebookPage.filter(
        { user_id: userId }
      ).then(p => {
        setPages(p);
        // If user has connected pages and none selected yet, pre-select first
        if (p.length > 0 && !data.page_id) {
          update({ page_id: p[0].id, page_name: p[0].page_name });
        }
        setLoading(false);
      });
    }
  }, [userId]);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading pages...</div>;

  // User has connected pages — show selection
  if (pages.length > 0) {
    return (
      <div>
        <h2 className="text-xl font-bold font-heading mb-1">Select your Facebook Page</h2>
        <p className="text-muted-foreground text-sm mb-6">Choose which page you want to advertise from.</p>
        <div className="space-y-3">
          {pages.map(page => (
            <button
              key={page.id}
              onClick={() => update({ page_id: page.id, page_name: page.page_name })}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                data.page_id === page.id
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                  : "border-border hover:border-[hsl(var(--primary))]/40 hover:bg-secondary/50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Facebook className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{page.page_name}</p>
                  {page.connection_status !== 'connected' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{page.page_url}</p>
              </div>
              {data.page_id === page.id && (
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--primary))] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // No connected pages — use profile page name or let them type it
  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">Your Facebook Page</h2>
      <p className="text-muted-foreground text-sm mb-6">Which Facebook Page will this campaign run on?</p>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 mb-5">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Your page will be formally connected after payment is confirmed — no action needed now.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-1.5 block">Facebook Page Name *</Label>
          <Input
            value={data.page_name || ''}
            onChange={e => update({ page_name: e.target.value, page_id: '' })}
            placeholder="e.g. Chisomo's Boutique"
            className="h-11"
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Facebook Page URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            value={data.page_url || ''}
            onChange={e => update({ page_url: e.target.value })}
            placeholder="e.g. facebook.com/ChisomoBoutique"
            className="h-11"
          />
        </div>
      </div>
    </div>
  );
}