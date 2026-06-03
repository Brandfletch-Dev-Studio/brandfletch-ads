import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, BookmarkPlus, MapPin } from 'lucide-react';

export default function StepAudience({ data, update, userId }) {
  const [savedAudiences, setSavedAudiences] = useState([]);
  const [locationInput, setLocationInput] = useState('');
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (userId) {
      base44.entities.SavedAudience.filter({ user_id: userId }).then(setSavedAudiences);
    }
  }, [userId]);

  function addLocation(loc) {
    const trimmed = loc.trim();
    if (!trimmed) return;
    const existing = [...(data.audience_regions || []), ...(data.audience_cities || [])];
    if (!existing.includes(trimmed)) {
      update({ audience_regions: [...(data.audience_regions || []), trimmed] });
    }
    setLocationInput('');
  }

  function removeLocation(loc) {
    update({
      audience_regions: (data.audience_regions || []).filter(r => r !== loc),
      audience_cities: (data.audience_cities || []).filter(c => c !== loc),
    });
  }

  function loadAudience(audience) {
    update({
      audience_countries: audience.countries || [],
      audience_regions: audience.regions || [],
      audience_cities: audience.cities || [],
      audience_worldwide: false,
      audience_age_min: audience.age_min || 18,
      audience_age_max: audience.age_max || 65,
      audience_gender: audience.gender || 'all',
    });
    setShowSaved(false);
  }

  const allLocations = [...(data.audience_regions || []), ...(data.audience_cities || [])];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading mb-1">Target Audience</h2>
        <p className="text-muted-foreground text-sm">Define who should see your ads.</p>
      </div>

      {/* Saved audiences */}
      {savedAudiences.length > 0 && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)} className="gap-2 mb-3">
            <BookmarkPlus className="w-3.5 h-3.5" /> Use Saved Audience
          </Button>
          {showSaved && (
            <div className="border border-border rounded-xl overflow-hidden mb-2">
              {savedAudiences.map(a => (
                <button key={a.id} onClick={() => loadAudience(a)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary text-left border-b border-border last:border-0 transition-colors">
                  <span className="font-medium text-sm">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{[...(a.regions||[]), ...(a.cities||[])].slice(0,2).join(', ') || '—'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Single location field */}
      <div>
        <Label className="mb-1 block font-semibold">Location</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Type a country, city, region or district and press Enter — e.g. Malawi, Mangochi, Lusaka, Cairo
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addLocation(locationInput)}
              placeholder="e.g. Malawi, Mangochi, Lusaka..."
              className="pl-9 h-11"
            />
          </div>
          <Button type="button" variant="outline" onClick={() => addLocation(locationInput)} disabled={!locationInput.trim()}>
            Add
          </Button>
        </div>
        {allLocations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {allLocations.map(loc => (
              <Badge key={loc} variant="secondary" className="gap-1 pr-1 py-1">
                <MapPin className="w-3 h-3" />
                {loc}
                <button onClick={() => removeLocation(loc)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Age range */}
      <div>
        <Label className="mb-3 block">
          Age Range: <span className="font-bold">{data.audience_age_min} – {data.audience_age_max}</span>
        </Label>
        <div className="px-2">
          <Slider
            value={[data.audience_age_min, data.audience_age_max]}
            onValueChange={([min, max]) => update({ audience_age_min: min, audience_age_max: max })}
            min={13} max={65} step={1}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>13</span><span>65+</span>
        </div>
      </div>

      {/* Gender */}
      <div>
        <Label className="mb-2 block">Gender</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ].map(g => (
            <button
              key={g.value}
              onClick={() => update({ audience_gender: g.value })}
              className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                data.audience_gender === g.value
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]'
                  : 'border-border hover:border-[hsl(var(--primary))]/40'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save audience */}
      <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Save this audience for later?</Label>
          <Switch
            checked={data.save_audience}
            onCheckedChange={v => update({ save_audience: v })}
          />
        </div>
        {data.save_audience && (
          <Input
            value={data.audience_name}
            onChange={e => update({ audience_name: e.target.value })}
            placeholder="Audience name (e.g. Malawi Young Adults)"
          />
        )}
      </div>
    </div>
  );
}