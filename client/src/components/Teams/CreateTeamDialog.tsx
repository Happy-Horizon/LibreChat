import React, { useState } from 'react';
import { useCreateTeamMutation } from '~/data-provider/teams';
import { useToast } from '~/hooks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Textarea } from '~/components/ui/Textarea';
import { Label } from '~/components/ui/Label';

interface CreateTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '',
  });

  const createTeamMutation = useCreateTeamMutation({
    onSuccess: () => {
      showToast({ message: 'Team created successfully', status: 'success' });
      setFormData({ name: '', description: '', avatar: '' });
      onSuccess();
    },
    onError: (error: any) => {
      showToast({
        message: error?.response?.data?.error || 'Failed to create team',
        status: 'error',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast({ message: 'Team name is required', status: 'error' });
      return;
    }

    createTeamMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      avatar: formData.avatar.trim() || undefined,
    });
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Describe your team's purpose"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              value={formData.avatar}
              onChange={handleChange('avatar')}
              placeholder="https://example.com/avatar.jpg"
              type="url"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createTeamMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTeamMutation.isLoading || !formData.name.trim()}
              className="min-w-20"
            >
              {createTeamMutation.isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamDialog;