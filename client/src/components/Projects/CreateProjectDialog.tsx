import React, { useState } from 'react';
import { useCreateProjectMutation } from '~/data-provider/projects';
import { Team } from '~/data-provider/teams';
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
import { Switch } from '~/components/ui/Switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/Select';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teams: Team[];
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onClose,
  onSuccess,
  teams,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamId: '',
    isPublic: false,
  });

  const createProjectMutation = useCreateProjectMutation({
    onSuccess: () => {
      showToast({ message: 'Project created successfully', status: 'success' });
      setFormData({ name: '', description: '', teamId: '', isPublic: false });
      onSuccess();
    },
    onError: (error: any) => {
      showToast({
        message: error?.response?.data?.error || 'Failed to create project',
        status: 'error',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast({ message: 'Project name is required', status: 'error' });
      return;
    }

    createProjectMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      teamId: formData.teamId || undefined,
      isPublic: formData.isPublic,
    });
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleTeamChange = (teamId: string) => {
    setFormData(prev => ({ ...prev, teamId }));
  };

  const handlePublicToggle = (isPublic: boolean) => {
    setFormData(prev => ({ ...prev, isPublic }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Describe your project"
              rows={3}
            />
          </div>

          {teams.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="team">Team (Optional)</Label>
              <Select value={formData.teamId} onValueChange={handleTeamChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Personal Project</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team._id} value={team._id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="isPublic">Public Project</Label>
              <p className="text-xs text-gray-500">
                Anyone can view and access this project
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={handlePublicToggle}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createProjectMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProjectMutation.isLoading || !formData.name.trim()}
              className="min-w-20"
            >
              {createProjectMutation.isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;