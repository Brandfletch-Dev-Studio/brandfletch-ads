import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Facebook, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function StepSelectPage({ data, update, userId }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      base44.entities.FacebookPage.filter(
        { user_id: userId, connection_status: 'connected' }
      ).then(p => { setPages(p); setLoading(false); });
    }
  }, [userId]);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading pages...</div>;

  if (pages.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold font-heading mb-2">No connected pages</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
          Please connect a Facebook Page before creating a campaign.
        </p>
        <Link to="/pages">
          <Button className="gap-2">
            <Facebook className="w-4 h-4" /> Connect a Page
          </Button>
        </Link>
      </div>
    );
  }

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
              <p className="font-semibold text-sm">{page.page_name}</p>
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