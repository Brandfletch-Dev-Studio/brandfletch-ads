import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building2 } from 'lucide-react';
import { format } from 'date-fns';

const STAGE_CONFIG = {
  new_lead: { label: 'New Lead', color: 'bg-blue-500', icon: '🆕' },
  contacted: { label: 'Contacted', color: 'bg-amber-500', icon: '📞' },
  qualified: { label: 'Qualified', color: 'bg-purple-500', icon: '✅' },
  proposal_sent: { label: 'Proposal', color: 'bg-indigo-500', icon: '📄' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500', icon: '🤝' },
  won: { label: 'Won', color: 'bg-green-500', icon: '🎉' },
  lost: { label: 'Lost', color: 'bg-red-500', icon: '❌' },
};

const GRADES = {
  A: { color: 'from-red-500 to-red-600', bg: 'bg-red-50 text-red-700' },
  B: { color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 text-orange-700' },
  C: { color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50 text-yellow-700' },
  D: { color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 text-blue-700' },
};

function LeadCard({ lead, index }) {
  const grade = GRADES[lead.grade] || GRADES.B;

  const formatValue = (amount) => {
    if (!amount) return null;
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return null;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
            snapshot.isDragging ? 'shadow-xl rotate-2 scale-105' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-800 truncate flex-1">{lead.lead_name}</h4>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${grade.color} text-white`}>
              {lead.grade || 'B'}
            </span>
          </div>

          {lead.company && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
              <Building2 className="w-3 h-3" />
              <span className="truncate">{lead.company}</span>
            </div>
          )}

          <div className="space-y-1 mb-2">
            {lead.lead_email && (
              <a href={`mailto:${lead.lead_email}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600">
                <Mail className="w-3 h-3" />
                <span className="truncate">{lead.lead_email}</span>
              </a>
            )}
            {lead.lead_phone && (
              <a href={`tel:${lead.lead_phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600">
                <Phone className="w-3 h-3" />
                <span>{lead.lead_phone}</span>
              </a>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {lead.estimated_value && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${grade.bg}`}>
                ${formatValue(lead.estimated_value)}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {format(new Date(lead.created_date), 'MMM d')}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function KanbanColumn({ stage, leads }) {
  const config = STAGE_CONFIG[stage];
  const columnLeads = leads.filter(l => l.stage === stage);

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{config.icon}</span>
              <h3 className="font-semibold text-gray-800">{config.label}</h3>
              <Badge className={`${config.color} text-white text-xs`}>
                {columnLeads.length}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <Droppable droppableId={stage}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-[200px] p-2 rounded-lg transition-colors ${
                  snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                {columnLeads.map((lead, index) => (
                  <LeadCard key={lead.id} lead={lead} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>
    </div>
  );
}

export default function KanbanBoard({ leads, onStageChange }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;
    const lead = leads.find(l => l.id === draggableId);
    
    if (lead && lead.stage !== newStage) {
      onStageChange(lead, newStage);
    }
  };

  const stages = Object.keys(STAGE_CONFIG);

  return (
    <div className="overflow-x-auto pb-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4">
          {stages.map(stage => (
            <KanbanColumn
              key={stage}
              stage={stage}
              leads={leads}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}