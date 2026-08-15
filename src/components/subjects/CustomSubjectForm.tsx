/**
 * CustomSubjectForm Component
 *
 * Shared component for adding a custom subject in both SubjectSelectionGate
 * and Settings SubjectManageSection.
 */

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export interface CustomSubjectFormValues {
  name: string;
  code?: string;
  qualificationLabel?: string;
  description?: string;
}

interface CustomSubjectFormProps {
  onSubmit: (values: CustomSubjectFormValues) => Promise<void> | void;
  isSubmitting: boolean;
  onCancel?: () => void;
  submitButtonText?: string;
}

export function CustomSubjectForm({
  onSubmit,
  isSubmitting,
  onCancel,
  submitButtonText = 'Add Custom Subject',
}: CustomSubjectFormProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [qualificationLabel, setQualificationLabel] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    await onSubmit({
      name: name.trim(),
      code: code.trim() || undefined,
      qualificationLabel: qualificationLabel.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  const handleCancel = () => {
    setName('');
    setCode('');
    setQualificationLabel('');
    setDescription('');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="custom-name">Subject Name *</Label>
        <Input
          id="custom-name"
          placeholder="e.g., Computer Science"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-code">Subject Code (optional)</Label>
        <Input
          id="custom-code"
          placeholder="e.g., 9618"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-qualification">Qualification (optional)</Label>
        <Input
          id="custom-qualification"
          placeholder="e.g., A-Level, IB"
          value={qualificationLabel}
          onChange={(e) => setQualificationLabel(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-description">Description (optional)</Label>
        <Input
          id="custom-description"
          placeholder="Brief description of the subject"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {submitButtonText}
            </>
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
