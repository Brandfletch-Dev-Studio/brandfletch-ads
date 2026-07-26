import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Facebook, CheckCircle2, XCircle, Clock, ExternalLink, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Facebook Pages — management view.
 *
 * Pages are connected via the onboarding flow (Facebook OAuth) after
 * payment. This page lists the connected pages and their status. New
 * pages are NOT added here — they're added during the campaign setup.
 */
export default function FacebookPages() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  // A paid campaign that's waiting for the user to continue onboarding
  const [pendingCampaign, setPendingCampaign] = useState(null);
  const [checkingCampaigns, setCheckingCampaigns] = useState(true);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user?.id) return;
    loadPages(user.id);
    loadPendingCampaign(user.id);
  }, [user?.id, isLoadingAuth]);

  async function loadPages(uid) {
    try {
      const data = await base44.entities.FacebookPage.filter({ created_by: uid }, { sort: '-created_date' });
      setPages(data);
    } catch (err) {
      console.error('Failed to load pages:', err);
    }
  }

  // Look for a campaign that's been paid but not yet onboarded —
  // if one exists, show a "Continue setup" CTA so /pages doubles as
  // an entry point back into the onboarding flow.
  async function loadPendingCampaign(uid) {
    setCheckingCampaigns(true);
    try {
      const camps = await base44.entities.Campaign
        .filter({ created_by: uid }, { sort: '-created_date', limit: 50 })
        .catch(() => []);
      const paid = (camps || []).find(c =>
        ['pending_review', 'awaiting_payment'].includes(c.status) ||
        (c.status === 'draft' && c.payment_proof_url)
      );
      setPendingCampaign(paid || null);
    } catch (_err) {
      // Non-fatal — just don't show the CTA
    } finally {
      setCheckingCampaigns(false);
    }
  }

  if (isLoadingAuth) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-3">
        {[1, 2].map(i => <div key={i} className="h-28 rounded-xl bg-secondary animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Facebook Pages</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your connected Facebook pages. New pages are added during campaign setup.
        </p>
      </div>

      {/* Continue campaign setup CTA — connects /pages back to the onboarding flow */}
      {pendingCampaign && !checkingCampaigns && (
        <Card className="border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/5">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground mb-1">Continue your campaign setup</p>
              <p className="text-sm text-muted-foreground">
                Your campaign <strong>{pendingCampaign.campaign_name || pendingCampaign.page_name || ''}</strong> is ready for the next step.
              </p>
            </div>
            <Button
              onClick={() => navigate(`/campaigns/${pendingCampaign.id}/onboarding`)}
              className="shrink-0 gap-2 whitespace-nowrap"
            >
              Continue Setup <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {pages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Facebook className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No pages connected yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Pages are connected when you set up a campaign. Create a campaign and complete
              payment to connect your Facebook Page via Facebook login.
            </p>
            {pendingCampaign ? (
              <Button onClick={() => navigate(`/campaigns/${pendingCampaign.id}/onboarding`)} className="gap-2">
                Continue Campaign Setup <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => navigate('/campaigns/new')} className="gap-2">
                Create Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pages.map(page => (
            <Card key={page.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Facebook className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{page.page_name}</p>
                      {page.page_url && (
                        <a href={page.page_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-[hsl(var(--accent))] flex items-center gap-1 mt-0.5">
                          {page.page_url} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {page.connection_status === 'connected' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                      </span>
                    )}
                    {page.connection_status === 'pending_verification' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                    {page.connection_status === 'rejected' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
