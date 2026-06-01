import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Plus, Pencil, Trash2, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SavedAudiences() {
  const [audiences, setAudiences] = useState([]);
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    loadAudiences(u.id);
  }

  async function loadAudiences(uid) {
    const data = await base44.entities.SavedAudience.filter({ user_id: uid }, '-created_date');
    setAudiences(data);
  }

  async function handleDelete(id) {
    await base44.entities.SavedAudience.delete(id);
    toast.success('Audience deleted');
    loadAudiences(user.id);
  }

  async function handleSave(form) {
    if (editing) {
      await base44.entities.SavedAudience.update(editing.id, form);
      toast.success('Audience updated');
    } else {
      await base44.entities.SavedAudience.create({ ...form, user_id: user.id });
      toast.success('Audience saved');
    }
    setShowDialog(false);
    setEditing(null);
    loadAudiences(user.id);
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Saved Audiences</h1>
          <p className="text-muted-foreground text-sm mt-1">Reuse targeting configurations across campaigns</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowDialog(true); }} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
          <Plus className="w-4 h-4" /> New Audience
        </Button>
      </div>

      {audiences.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No saved audiences</h3>
          <p className="text-muted-foreground text-sm mb-6">Save audience configurations during campaign creation to reuse them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {audiences.map(a => (
            <Card key={a.id} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-[hsl(var(--primary))]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{a.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {a.worldwide ? (
                          <Badge variant="secondary" className="gap-1"><Globe className="w-3 h-3" /> Worldwide</Badge>
                        ) : (
                          a.countries?.map(c => <Badge key={c} variant="secondary">{c}</Badge>)
                        )}
                        <Badge variant="outline">Age {a.age_min}–{a.age_max}</Badge>
                        <Badge variant="outline" className="capitalize">{a.gender}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setShowDialog(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AudienceDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
      />
    </div>
  );
}

function AudienceDialog({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    name: '', countries: [], worldwide: false,
    age_min: 18, age_max: 65, gender: 'all'
  });
  const [countryInput, setCountryInput] = useState('');

  useEffect(() => {
    if (initial) setForm({
      name: initial.name || '',
      countries: initial.countries || [],
      worldwide: initial.worldwide || false,
      age_min: initial.age_min || 18,
      age_max: initial.age_max || 65,
      gender: initial.gender || 'all',
    });
    else setForm({ name: '', countries: [], worldwide: false, age_min: 18, age_max: 65, gender: 'all' });
  }, [initial, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Audience' : 'New Audience'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Audience Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Malawi Young Adults" />
          </div>
          <div>
            <Label className="mb-1.5 block">Countries (comma separated)</Label>
            <Input
              value={form.countries?.join(', ')}
              onChange={e => setForm(f => ({ ...f, countries: e.target.value.split(',').map(c => c.trim()).filter(Boolean) }))}
              placeholder="e.g. Malawi, Zambia, Kenya"
              disabled={form.worldwide}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Age Range: {form.age_min}–{form.age_max}</Label>
            <div className="flex gap-3">
              <Input type="number" min="13" max="65" value={form.age_min} onChange={e => setForm(f => ({ ...f, age_min: parseInt(e.target.value) }))} />
              <Input type="number" min="13" max="65" value={form.age_max} onChange={e => setForm(f => ({ ...f, age_max: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div className="flex gap-3">
            {['all', 'male', 'female'].map(g => (
              <button key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium capitalize transition-all ${form.gender === g ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]' : 'border-border'}`}>
                {g}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => onSave(form)} className="flex-1 bg-[hsl(var(--primary))] text-primary-foreground" disabled={!form.name}>
              {initial ? 'Update' : 'Save'} Audience
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}