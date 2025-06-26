import React, { useState } from 'react';
import { Plus, Users, Settings, Trash2, UserPlus, Crown, Shield, Eye } from 'lucide-react';
import { useUserTeamsQuery, useDeleteTeamMutation, Team } from '~/data-provider/teams';
import { useLocalize, useToast } from '~/hooks';
import { Button } from '~/components/ui';
import { cn } from '~/utils';
import CreateTeamDialog from './CreateTeamDialog';
import InviteToTeamDialog from './InviteToTeamDialog';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

interface TeamsPageProps {
  className?: string;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'owner':
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case 'admin':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'member':
      return <Users className="h-4 w-4 text-green-500" />;
    case 'viewer':
      return <Eye className="h-4 w-4 text-gray-500" />;
    default:
      return <Users className="h-4 w-4 text-gray-500" />;
  }
};

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    viewer: 'Viewer',
  };
  return labels[role] || role;
};

const TeamsPage: React.FC<TeamsPageProps> = ({ className }) => {
  const localize = useLocalize();
  const { showToast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);

  const { data: teamsData, isLoading, refetch } = useUserTeamsQuery();
  const teams = teamsData?.teams || [];

  const deleteTeamMutation = useDeleteTeamMutation({
    onSuccess: () => {
      showToast({ message: 'Team deleted successfully', status: 'success' });
      setDeleteTeamId(null);
      refetch();
    },
    onError: (error: any) => {
      showToast({ 
        message: error?.response?.data?.error || 'Failed to delete team', 
        status: 'error' 
      });
    },
  });

  const handleDeleteTeam = (teamId: string) => {
    deleteTeamMutation.mutate(teamId);
  };

  const canDeleteTeam = (team: Team) => {
    return team.userRole === 'owner';
  };

  const canInviteToTeam = (team: Team) => {
    return ['owner', 'admin'].includes(team.userRole || '');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {localize('com_ui_teams')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your teams and collaborate on projects
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Team</span>
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No teams yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first team to start collaborating
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Team Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {team.avatar ? (
                    <img
                      src={team.avatar}
                      alt={team.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {team.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {team.name}
                    </h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                      {getRoleIcon(team.userRole || 'member')}
                      <span>{getRoleLabel(team.userRole || 'member')}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1">
                  {canInviteToTeam(team) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInviteTeamId(team._id)}
                      className="h-8 w-8 p-0"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                  {canDeleteTeam(team) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTeamId(team._id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Team Description */}
              {team.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {team.description}
                </p>
              )}

              {/* Team Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Created {formatDate(team.createdAt)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Navigate to team details
                    window.location.href = `/teams/${team._id}`;
                  }}
                  className="text-xs"
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateTeamDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />

      {inviteTeamId && (
        <InviteToTeamDialog
          teamId={inviteTeamId}
          open={!!inviteTeamId}
          onClose={() => setInviteTeamId(null)}
          onSuccess={() => {
            setInviteTeamId(null);
            // Could refresh team members if needed
          }}
        />
      )}

      {deleteTeamId && (
        <ConfirmDeleteDialog
          open={!!deleteTeamId}
          onClose={() => setDeleteTeamId(null)}
          onConfirm={() => handleDeleteTeam(deleteTeamId)}
          isLoading={deleteTeamMutation.isLoading}
          title="Delete Team"
          message="Are you sure you want to delete this team? This action cannot be undone and will remove all team data including projects and members."
        />
      )}
    </div>
  );
};

export default TeamsPage;