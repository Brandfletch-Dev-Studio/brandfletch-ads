import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { COUNTRIES } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, BookmarkPlus, MapPin, Loader2 } from 'lucide-react';

export default function StepAudience({ data, update, userId }) {
  const [savedAudiences, setSavedAudiences] = useState([]);
  const [countryInput, setCountryInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const locationDebounce = useRef(null);

  useEffect(() => {
    if (userId) {
      base44.entities.SavedAudience.filter({ user_id: userId }).then(setSavedAudiences);
    }
  }, [userId]);

  // Debounced location search via LLM
  useEffect(() => {
    if (!locationInput || locationInput.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    clearTimeout(locationDebounce.current);
    locationDebounce.current = setTimeout(async () => {
      setLoadingLocations(true);
      const contextCountries = data.audience_countries?.length > 0
        ? `Focus on these countries if relevant: ${data.audience_countries.join(', ')}.`
        : '';
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest up to 8 real geographic locations (regions, states, provinces, districts, cities) matching "${locationInput}". ${contextCountries} Return only real places. Do not include countries themselves. Format each as "Location Name, Country".`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      const already = [...(data.audience_regions || []), ...(data.audience_cities || [])];
      setLocationSuggestions((res.suggestions || []).filter(s => !already.includes(s)));
      setLoadingLocations(false);
    }, 500);
  }, [locationInput]);

  function addCountry(country) {
    if (!data.audience_countries.includes(country)) {
      update({ audience_countries: [...data.audience_countries, country] });
    }
    setCountryInput('');
  }

  function removeCountry(country) {
    update({ audience_countries: data.audience_countries.filter(c => c !== country) });
  }

  function addLocation(loc) {
    const existing = [...(data.audience_regions || []), ...(data.audience_cities || [])];
    if (!existing.includes(loc)) {
      update({ audience_regions: [...(data.audience_regions || []), loc] });
    }
    setLocationInput('');
    setLocationSuggestions([]);
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
      audience_worldwide: audience.worldwide || false,
      audience_age_min: audience.age_min || 18,
      audience_age_max: audience.age_max || 65,
      audience_gender: audience.gender || 'all',
    });
    setShowSaved(false);
  }

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countryInput.toLowerCase()) && !data.audience_countries.includes(c)
  );

  const allLocations = [...(data.audience_regions || []), ...(data.audience_cities || [])];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading mb-1">Target Audience</h2>
        <p className="text-muted-foreground text-sm mb-4">Define who should see your ads.</p>
      </div>

      {/* Saved audiences */}
      {savedAudiences.length > 0 && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)} className="gap-2 mb-3">
            <BookmarkPlus className="w-3.5 h-3.5" /> Use Saved Audience
          </Button>
          {showSaved && (
            <div className="border border-border rounded-xl overflow-hidden mb-4">
              {savedAudiences.map(a => (
                <button key={a.id} onClick={() => loadAudience(a)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary text-left border-b border-border last:border-0 transition-colors">
                  <span className="font-medium text-sm">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{a.countries?.join(', ') || 'Worldwide'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Worldwide toggle */}
      <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
        <div>
          <p className="font-semibold text-sm">Worldwide Targeting</p>
          <p className="text-xs text-muted-foreground">Target all countries</p>
        </div>
        <Switch
          checked={data.audience_worldwide}
          onCheckedChange={v => update({ audience_worldwide: v, audience_countries: v ? [] : data.audience_countries })}
        />
      </div>

      {!data.audience_worldwide && (
        <>
          {/* Countries */}
          <div>
            <Label className="mb-2 block">Countries</Label>
            <div className="relative">
              <Input
                value={countryInput}
                onChange={e => setCountryInput(e.target.value)}
                placeholder="Search and add countries..."
              />
              {countryInput && filteredCountries.length > 0 && (
                <div className="absolute z-10 w-full top-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredCountries.slice(0, 8).map(c => (
                    <button key={c} onClick={() => addCountry(c)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors">
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {data.audience_countries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {data.audience_countries.map(c => (
                  <Badge key={c} variant="secondary" className="gap-1 pr-1">
                    {c}
                    <button onClick={() => removeCountry(c)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Regions / Districts / Cities */}
          <div>
            <Label className="mb-1 block">Regions, Districts &amp; Cities</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Narrow down to specific areas — e.g. Mangochi, Lusaka, London, California
            </p>
            <div className="relative">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  placeholder="Search regions, districts, cities..."
                  className="pl-9"
                />
                {loadingLocations && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                )}
              </div>
              {locationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full top-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto">
                  {locationSuggestions.map(s => (
                    <button key={s} onClick={() => addLocation(s)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {allLocations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {allLocations.map(loc => (
                  <Badge key={loc} variant="secondary" className="gap-1 pr-1">
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
        </>
      )}

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