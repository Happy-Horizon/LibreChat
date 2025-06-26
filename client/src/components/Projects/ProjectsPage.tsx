import React, { useState } from 'react';
import { Plus, Share2, Settings, Trash2, Users, Globe, Lock, Eye } from 'lucide-react';
import { useUserProjectsQuery, useDeleteProjectMutation, Project } from '~/data-provider/projects';
import { useUserTeamsQuery } from '~/data-provider/teams';
import { useLocalize, useToast } from '~/hooks';
import { Button } from '~/components/ui';
import { cn } from '~/utils';
import CreateProjectDialog from './CreateProjectDialog';
import ShareProjectDialog from './ShareProjectDialog';
import ConfirmDeleteDialog from '../Teams/ConfirmDeleteDialog';

interface ProjectsPageProps {
  className?: string;
}

const getProjectIcon = (project: Project) => {
  if (project.isPublic) {
    return <Globe className="h-4 w-4 text-green-500" />;
  }
  if (project.teamId) {
    return <Users className="h-4 w-4 text-blue-500" />;
  }
  if (project.sharedWith.length > 0) {
    return <Share2 className="h-4 w-4 text-purple-500" />;
  }
  return <Lock className="h-4 w-4 text-gray-500" />;
};

const getProjectTypeLabel = (project: Project) => {
  if (project.isPublic) return 'Public';
  if (project.teamId) return 'Team';
  if (project.sharedWith.length > 0) return 'Shared';
  return 'Private';
};

const ProjectsPage: React.FC<ProjectsPageProps> = ({ className }) => {
  const localize = useLocalize();
  const { showToast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [shareProjectId, setShareProjectId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const { data: projectsData, isLoading: isProjectsLoading, refetch } = useUserProjectsQuery();
  const { data: teamsData } = useUserTeamsQuery();
  const projects = projectsData?.projects || [];
  const teams = teamsData?.teams || [];

  const deleteProjectMutation = useDeleteProjectMutation({
    onSuccess: () => {
      showToast({ message: 'Project deleted successfully', status: 'success' });
      setDeleteProjectId(null);
      refetch();
    },
    onError: (error: any) => {
      showToast({ 
        message: error?.response?.data?.error || 'Failed to delete project', 
        status: 'error' 
      });
    },
  });

  const handleDeleteProject = (projectId: string) => {
    deleteProjectMutation.mutate(projectId);
  };

  const canDeleteProject = (project: Project, userId: string) => {
    return project.ownerId === userId;
  };

  const canShareProject = (project: Project, userId: string) => {
    return project.ownerId === userId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isProjectsLoading) {
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
            Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your projects and collaborate with teams
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Project</span>
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first project to get started
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {project.name}
                    </h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                      {getProjectIcon(project)}
                      <span>{getProjectTypeLabel(project)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1">
                  {canShareProject(project, 'current-user-id') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShareProjectId(project._id)}
                      className="h-8 w-8 p-0"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}
                  {canDeleteProject(project, 'current-user-id') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteProjectId(project._id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Project Description */}
              {project.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Project Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-4">
                  <span>{project.promptGroupIds.length} prompts</span>
                  <span>{project.agentIds.length} agents</span>
                </div>
                {project.sharedWith.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{project.sharedWith.length} shared</span>
                  </div>
                )}
              </div>

              {/* Project Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Created {formatDate(project.createdAt)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Navigate to project details
                    window.location.href = `/projects/${project._id}`;
                  }}
                  className="text-xs"
                >
                  Open Project
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateProjectDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
        teams={teams}
      />

      {shareProjectId && (
        <ShareProjectDialog
          projectId={shareProjectId}
          open={!!shareProjectId}
          onClose={() => setShareProjectId(null)}
          onSuccess={() => {
            setShareProjectId(null);
            refetch();
          }}
        />
      )}

      {deleteProjectId && (
        <ConfirmDeleteDialog
          open={!!deleteProjectId}
          onClose={() => setDeleteProjectId(null)}
          onConfirm={() => handleDeleteProject(deleteProjectId)}
          isLoading={deleteProjectMutation.isLoading}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone and will remove all project data including prompts and agents."
        />
      )}
    </div>
  );
};

export default ProjectsPage;