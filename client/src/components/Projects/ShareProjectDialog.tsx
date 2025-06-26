import React, { useState } from 'react';
import { useShareProjectMutation, useProjectSharingQuery } from '~/data-provider/projects';
import { useToast } from '~/hooks';
import { Trash2, UserPlus } from 'lucide-react';
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

interface ShareProjectDialogProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ShareProjectDialog: React.FC<ShareProjectDialogProps> = ({
  projectId,
  open,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [newShare, setNewShare] = useState({
    userId: '',
    role: 'viewer' as 'viewer' | 'editor' | 'admin',
  });

  const { data: sharingData, refetch } = useProjectSharingQuery(projectId);
  
  const shareProjectMutation = useShareProjectMutation(projectId, {
    onSuccess: () => {
      showToast({ message: 'Project shared successfully', status: 'success' });
      setNewShare({ userId: '', role: 'viewer' });
      refetch();
      onSuccess();
    },
    onError: (error: any) => {
      showToast({
        message: error?.response?.data?.error || 'Failed to share project',
        status: 'error',
      });
    },
  });

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShare.userId.trim()) {
      showToast({ message: 'User ID is required', status: 'error' });
      return;
    }

    shareProjectMutation.mutate({
      shares: [{
        userId: newShare.userId.trim(),
        role: newShare.role,
      }],
    });
  };

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewShare(prev => ({ ...prev, userId: e.target.value }));
  };

  const handleRoleChange = (role: string) => {
    setNewShare(prev => ({ ...prev, role: role as 'viewer' | 'editor' | 'admin' }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Share */}
          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID or Email</Label>
              <Input
                id="userId"
                value={newShare.userId}
                onChange={handleUserIdChange}
                placeholder="Enter user ID or email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newShare.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex flex-col">
                      <span className="font-medium">Viewer</span>
                      <span className="text-xs text-gray-500">Can view the project</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex flex-col">
                      <span className="font-medium">Editor</span>
                      <span className="text-xs text-gray-500">Can edit project content</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex flex-col">
                      <span className="font-medium">Admin</span>
                      <span className="text-xs text-gray-500">Can manage project and sharing</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={shareProjectMutation.isLoading || !newShare.userId.trim()}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {shareProjectMutation.isLoading ? 'Sharing...' : 'Share Project'}
            </Button>
          </form>

          {/* Current Shares */}
          {sharingData && sharingData.sharedWith.length > 0 && (
            <div className="space-y-2">
              <Label>Currently Shared With</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {sharingData.sharedWith.map((share) => (
                  <div
                    key={share.userId}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">User ID: {share.userId}</div>
                      <div className="text-xs text-gray-500">
                        Role: {share.role} • Shared: {formatDate(share.sharedAt)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => {
                        // Handle remove sharing - would need unshare mutation
                        showToast({ message: 'Remove sharing functionality coming soon', status: 'info' });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Status */}
          {sharingData && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <div className="text-sm">
                <strong>Project Status:</strong>
                {sharingData.isPublic && <span className="ml-2 text-green-600">Public</span>}
                {sharingData.teamId && <span className="ml-2 text-blue-600">Team Project</span>}
                {!sharingData.isPublic && !sharingData.teamId && sharingData.sharedWith.length === 0 && (
                  <span className="ml-2 text-gray-600">Private</span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProjectDialog;