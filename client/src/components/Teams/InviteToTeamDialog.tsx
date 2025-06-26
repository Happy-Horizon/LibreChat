import React, { useState } from 'react';
import { useInviteToTeamMutation } from '~/data-provider/teams';
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
import { Label } from '~/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/Select';

interface InviteToTeamDialogProps {
  teamId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InviteToTeamDialog: React.FC<InviteToTeamDialogProps> = ({
  teamId,
  open,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    role: 'member' as 'admin' | 'member' | 'viewer',
  });

  const inviteToTeamMutation = useInviteToTeamMutation(teamId, {
    onSuccess: () => {
      showToast({ message: 'Invitation sent successfully', status: 'success' });
      setFormData({ email: '', role: 'member' });
      onSuccess();
    },
    onError: (error: any) => {
      showToast({
        message: error?.response?.data?.error || 'Failed to send invitation',
        status: 'error',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      showToast({ message: 'Email is required', status: 'error' });
      return;
    }

    if (!formData.email.includes('@')) {
      showToast({ message: 'Please enter a valid email address', status: 'error' });
      return;
    }

    inviteToTeamMutation.mutate({
      email: formData.email.trim(),
      role: formData.role,
    });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, email: e.target.value }));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, role: role as 'admin' | 'member' | 'viewer' }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to Team</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleEmailChange}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  <div className="flex flex-col">
                    <span className="font-medium">Viewer</span>
                    <span className="text-xs text-gray-500">Can view team projects</span>
                  </div>
                </SelectItem>
                <SelectItem value="member">
                  <div className="flex flex-col">
                    <span className="font-medium">Member</span>
                    <span className="text-xs text-gray-500">Can access and edit team projects</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-gray-500">Can manage team and invite others</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={inviteToTeamMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteToTeamMutation.isLoading || !formData.email.trim()}
              className="min-w-20"
            >
              {inviteToTeamMutation.isLoading ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteToTeamDialog;