import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, MoveUp, MoveDown } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'date', label: 'Date' },
  { value: 'file', label: 'File Upload' },
  { value: 'number', label: 'Number' },
  { value: 'url', label: 'Website URL' },
];

export default function FieldEditor({ field, index, onUpdate, onRemove, onMove, onAddOption, onUpdateOption, onRemoveOption }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
              <Input
                value={field.label}
                onChange={(e) => onUpdate(index, { label: e.target.value })}
                placeholder="Field Label"
                className="w-48"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Field Type</Label>
                <Select
                  value={field.field_type}
                  onValueChange={(value) => onUpdate(index, { field_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Placeholder</Label>
                <Input
                  value={field.placeholder || ''}
                  onChange={(e) => onUpdate(index, { placeholder: e.target.value })}
                  placeholder="Enter placeholder"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={field.required || false}
                    onCheckedChange={(checked) => onUpdate(index, { required: checked })}
                  />
                  <Label className="text-sm cursor-pointer">Required</Label>
                </div>
              </div>
            </div>

            {(field.field_type === 'dropdown' || field.field_type === 'radio' || field.field_type === 'checkbox') && (
              <div className="space-y-2">
                <Label className="text-xs">Options</Label>
                <div className="space-y-2">
                  {(field.options || []).map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => onUpdateOption(index, optIndex, e.target.value)}
                        placeholder={`Option ${optIndex + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveOption(index, optIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onAddOption(index)}
                    className="gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onMove(index, 'up')}
              disabled={index === 0}
            >
              <MoveUp className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onMove(index, 'down')}
              disabled={false}
            >
              <MoveDown className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onRemove(index)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}