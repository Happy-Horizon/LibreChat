import { QueryKeys, dataService } from 'librechat-data-provider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationResult } from '@tanstack/react-query';

// Types for Projects
export interface Project {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  teamId?: string;
  isPublic: boolean;
  sharedWith: Array<{
    userId: string;
    role: 'viewer' | 'editor' | 'admin';
    sharedAt: string;
  }>;
  promptGroupIds: string[];
  agentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  teamId?: string;
  isPublic?: boolean;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface ShareProjectData {
  shares: Array<{
    userId: string;
    role: 'viewer' | 'editor' | 'admin';
  }>;
}

export interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ProjectSharingInfo {
  isPublic: boolean;
  teamId?: string;
  sharedWith: Array<{
    userId: string;
    role: string;
    sharedAt: string;
  }>;
}

// Data service functions
const projectsService = {
  // Projects
  getUserProjects: (params: { page?: number; limit?: number } = {}): Promise<ProjectsResponse> =>
    dataService.get('/api/projects', { params }),

  createProject: (data: CreateProjectData): Promise<{ project: Project }> =>
    dataService.post('/api/projects', data),

  getProject: (projectId: string): Promise<{ project: Project; userRole: string }> =>
    dataService.get(`/api/projects/${projectId}`),

  updateProject: (projectId: string, data: UpdateProjectData): Promise<{ project: Project }> =>
    dataService.put(`/api/projects/${projectId}`, data),

  deleteProject: (projectId: string): Promise<{ message: string }> =>
    dataService.delete(`/api/projects/${projectId}`),

  // Project Sharing
  getProjectSharing: (projectId: string): Promise<ProjectSharingInfo> =>
    dataService.get(`/api/projects/${projectId}/sharing`),

  shareProject: (projectId: string, data: ShareProjectData): Promise<{ project: Project }> =>
    dataService.post(`/api/projects/${projectId}/share`, data),

  unshareProject: (projectId: string, userId: string): Promise<{ project: Project }> =>
    dataService.delete(`/api/projects/${projectId}/share/${userId}`),
};

// React Query Hooks

// Get user's projects
export const useUserProjectsQuery = (
  params?: { page?: number; limit?: number },
  config?: UseQueryOptions<ProjectsResponse>
): any => {
  return useQuery<ProjectsResponse>(
    [QueryKeys.projects, params],
    () => projectsService.getUserProjects(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...config,
    }
  );
};

// Get project by ID
export const useProjectQuery = (
  projectId: string,
  config?: UseQueryOptions<{ project: Project; userRole: string }>
): any => {
  return useQuery<{ project: Project; userRole: string }>(
    [QueryKeys.project, projectId],
    () => projectsService.getProject(projectId),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      enabled: !!projectId,
      ...config,
    }
  );
};

// Get project sharing info
export const useProjectSharingQuery = (
  projectId: string,
  config?: UseQueryOptions<ProjectSharingInfo>
): any => {
  return useQuery<ProjectSharingInfo>(
    [QueryKeys.projectSharing, projectId],
    () => projectsService.getProjectSharing(projectId),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      enabled: !!projectId,
      ...config,
    }
  );
};

// Create project mutation
export const useCreateProjectMutation = (
  options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }
): UseMutationResult<{ project: Project }, unknown, CreateProjectData, unknown> => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: CreateProjectData) => projectsService.createProject(data),
    {
      onSuccess: (data) => {
        // Invalidate projects list
        queryClient.invalidateQueries([QueryKeys.projects]);
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    }
  );
};

// Update project mutation
export const useUpdateProjectMutation = (
  projectId: string,
  options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }
): UseMutationResult<{ project: Project }, unknown, UpdateProjectData, unknown> => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: UpdateProjectData) => projectsService.updateProject(projectId, data),
    {
      onSuccess: (data) => {
        // Update project in cache
        queryClient.setQueryData([QueryKeys.project, projectId], (oldData: any) => ({
          ...oldData,
          project: data.project,
        }));
        // Invalidate projects list
        queryClient.invalidateQueries([QueryKeys.projects]);
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    }
  );
};

// Delete project mutation
export const useDeleteProjectMutation = (
  options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }
): UseMutationResult<{ message: string }, unknown, string, unknown> => {
  const queryClient = useQueryClient();

  return useMutation(
    (projectId: string) => projectsService.deleteProject(projectId),
    {
      onSuccess: (data, projectId) => {
        // Remove project from cache
        queryClient.removeQueries([QueryKeys.project, projectId]);
        queryClient.removeQueries([QueryKeys.projectSharing, projectId]);
        // Invalidate projects list
        queryClient.invalidateQueries([QueryKeys.projects]);
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    }
  );
};

// Share project mutation
export const useShareProjectMutation = (
  projectId: string,
  options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }
): UseMutationResult<{ project: Project }, unknown, ShareProjectData, unknown> => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: ShareProjectData) => projectsService.shareProject(projectId, data),
    {
      onSuccess: (data) => {
        // Update project in cache
        queryClient.setQueryData([QueryKeys.project, projectId], (oldData: any) => ({
          ...oldData,
          project: data.project,
        }));
        // Refresh sharing info
        queryClient.invalidateQueries([QueryKeys.projectSharing, projectId]);
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    }
  );
};

// Unshare project mutation
export const useUnshareProjectMutation = (
  projectId: string,
  options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }
): UseMutationResult<{ project: Project }, unknown, string, unknown> => {
  const queryClient = useQueryClient();

  return useMutation(
    (userId: string) => projectsService.unshareProject(projectId, userId),
    {
      onSuccess: (data) => {
        // Update project in cache
        queryClient.setQueryData([QueryKeys.project, projectId], (oldData: any) => ({
          ...oldData,
          project: data.project,
        }));
        // Refresh sharing info
        queryClient.invalidateQueries([QueryKeys.projectSharing, projectId]);
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    }
  );
};

export default projectsService;