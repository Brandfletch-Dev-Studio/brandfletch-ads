import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, Building2, Star, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const STAGES = {
  new_lead: { label: 'New Lead', color: 'bg-blue-500' },
  contacted: { label: 'Contacted', color: 'bg-amber-500' },
  qualified: { label: 'Qualified', color: 'bg-purple-500' },
  proposal_sent: { label: 'Proposal', color: 'bg-indigo-500' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500' },
  won: { label: 'Won', color: 'bg-green-500' },
  lost: { label: 'Lost', color: 'bg-red-500' },
};

const GRADES = {
  A: { label: 'A', color: 'from-red-500 to-red-600', bg: 'bg-red-50' },
  B: { label: 'B', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
  C: { label: 'C', color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50' },
  D: { label: 'D', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
};

export default function LeadCard({ lead, onStageChange }) {
  const stage = STAGES[lead.stage] || STAGES.new_lead;
  const grade = GRADES[lead.grade] || GRADES.B;

  const formatCurrency = (amount) => {
    if (!amount) return null;
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return null;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 group">
      <CardContent className="p-5 space-y-4">
        {/* Header with grade badge */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg truncate group-hover:text-blue-600 transition-colors">
                {lead.lead_name}
              </h3>
            </div>
            {lead.company && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{lead.company}</span>
              </div>
            )}
          </div>
          
          {/* Grade Badge */}
          <div className={`px-3 py-1.5 rounded-full text-white font-bold text-sm bg-gradient-to-r ${grade.color} shadow-md`}>
            {grade.label}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          {lead.lead_email && (
            <a
              href={`mailto:${lead.lead_email}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors group/link"
            >
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{lead.lead_email}</span>
            </a>
          )}
          {lead.lead_phone && (
            <a
              href={`tel:${lead.lead_phone}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors group/link"
            >
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{lead.lead_phone}</span>
            </a>
          )}
        </div>

        {/* Additional Info */}
        <div className="flex flex-wrap gap-2 pt-3 border-t">
          {lead.estimated_value && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${grade.bg}`}>
              <TrendingUp className="w-3.5 h-3.5" />
              <span>${formatCurrency(lead.estimated_value)}</span>
            </div>
          )}
          {lead.lead_source && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
              <Star className="w-3.5 h-3.5" />
              <span className="capitalize">{lead.lead_source}</span>
            </div>
          )}
          {lead.created_date && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(lead.created_date), 'MMM d')}</span>
            </div>
          )}
        </div>

        {/* Stage Badge and Quick Change */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t">
          <Badge className={`${stage.color} text-white font-semibold px-3 py-1`}>
            {stage.label}
          </Badge>
          
          {onStageChange && (
            <select
              value={lead.stage}
              onChange={(e) => onStageChange(lead, e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white hover:border-blue-500 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-500"
              title="Change stage"
            >
              {Object.entries(STAGES).map(([value, s]) => (
                <option key={value} value={value}>→ {s.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Notes Preview */}
        {lead.notes && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 italic line-clamp-2 bg-gray-50 p-2 rounded-lg">
              "{lead.notes}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}