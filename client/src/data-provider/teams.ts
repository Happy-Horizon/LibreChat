import { QueryKeys, dataService } from 'librechat-data-provider';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationResult, UseInfiniteQueryOptions } from '@tanstack/react-query';

// Types for Teams
export interface Team {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  userRole?: string;
}

export interface TeamMember {
  _id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
  invitedBy?: string;
  user: {
    _id: string;
    name?: string;
    email: string;
    username?: string;
    avatar?: string;
  };
}

export interface TeamInvitation {
  _id: string;
  teamId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  avatar?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  avatar?: string;
}

export interface InviteToTeamData {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface TeamsResponse {
  teams: Team[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface TeamMembersResponse {
  members: TeamMember[];
}

// Data service functions
const teamsService = {
  // Teams
  createTeam: (data: CreateTeamData): Promise<{ team: Team }> =>
    dataService.post('/api/teams', data),

  getUserTeams: (params: { page?: number; limit?: number } = {}): Promise<TeamsResponse> =>
    dataService.get('/api/teams', { params }),

  getTeam: (teamId: string): Promise<{ team: Team }> =>
    dataService.get(`/api/teams/${teamId}`),

  updateTeam: (teamId: string, data: UpdateTeamData): Promise<{ team: Team }> =>
    dataService.put(`/api/teams/${teamId}`, data),

  deleteTeam: (teamId: string): Promise<{ message: string }> =>
    dataService.delete(`/api/teams/${teamId}`),

  // Team Members
  getTeamMembers: (teamId: string): Promise<TeamMembersResponse> =>
    dataService.get(`/api/teams/${teamId}/members`),

  inviteToTeam: (teamId: string, data: InviteToTeamData): Promise<{ invitation: TeamInvitation }> =>
    dataService.post(`/api/teams/${teamId}/invite`, data),

  removeTeamMember: (teamId: string, userId: string): Promise<{ message: string }> =>
    dataService.delete(`/api/teams/${teamId}/members/${userId}`),

  // Invitations
  acceptInvitation: (token: string): Promise<{ membership: any }> =>
    dataService.post('/api/teams/invitations/accept', { token }),
};

// React Query Hooks

// Get user's teams
export const useUserTeamsQuery = (
  params?: { page?: number; limit?: number },
  config?: UseQueryOptions<TeamsResponse>
): any => {
  return useQuery<TeamsResponse>(
    [QueryKeys.teams, params],
    () => teamsService.getUserTeams(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...config,
    }
  );
};

// Get team by ID
export const useTeamQuery = (
  teamId: string,
  config?: UseQueryOptions<{ team: Team }>
): any => {
  return useQuery<{ team: Team }>(
    [QueryKeys.team, teamId],
    () => teamsService.getTeam(teamId),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      enabled: !!teamId,
      ...config,
    }
  );
};

// Get team members
export const useTeamMembersQuery = (
  teamId: string,
  config?: UseQueryOptions<TeamMembersResponse>
): any => {
  return useQuery<TeamMembersResponse>(
    [QueryKeys.teamMembers, teamId],
    () => teamsService.getTeamMembers(teamId),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      enabled: !!teamId,
      ...config,
    }
  );
};

// Create team mutation
export const useCreateTeamMutation = (
  options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }
): UseMutationResult<{ team: Team }, unknown, CreateTeamData, unknown> => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: CreateTeamData) => teamsService.createTeam(data),
    {
      onSuccess: (data) => {
        // Invalidate teams list
        queryClient.invalidateQueries([QueryKeys.teams]);
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    }
  );
};

// Update team mutation
export const useUpdateTeamMutation = (
  teamId: string,
  options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }
): UseMutationResult<{ team: Team }, unknown, UpdateTeamData, unknown> => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: UpdateTeamData) => teamsService.updateTeam(teamId, data),
    {
      onSuccess: (data) => {
        // Update team in cache
        queryClient.setQueryData([QueryKeys.team, teamId], data);
        // Invalidate teams list
        queryClient.invalidateQueries([QueryKeys.teams]);
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    }
  );
};

// Delete team mutation
export const useDeleteTeamMutation = (
  options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }
): UseMutationResult<{ message: string }, unknown, string, unknown> => {
  const queryClient = useQueryClient();

  return useMutation(
    (teamId: string) => teamsService.deleteTeam(teamId),
    {
      onSuccess: (data, teamId) => {
        // Remove team from cache
        queryClient.removeQueries([QueryKeys.team, teamId]);
        queryClient.removeQueries([QueryKeys.teamMembers, teamId]);
        // Invalidate teams list
        queryClient.invalidateQueries([QueryKeys.teams]);
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    }
  );
};

// Invite to team mutation
export const useInviteToTeamMutation = (
  teamId: string,
  options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }
): UseMutationResult<{ invitation: TeamInvitation }, unknown, InviteToTeamData, unknown> => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: InviteToTeamData) => teamsService.inviteToTeam(teamId, data),
    {
      onSuccess: (data) => {
        // Could refresh team members if needed
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    }
  );
};

// Remove team member mutation
export const useRemoveTeamMemberMutation = (
  teamId: string,
  options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }
): UseMutationResult<{ message: string }, unknown, string, unknown> => {
  const queryClient = useQueryClient();

  return useMutation(
    (userId: string) => teamsService.removeTeamMember(teamId, userId),
    {
      onSuccess: (data) => {
        // Refresh team members
        queryClient.invalidateQueries([QueryKeys.teamMembers, teamId]);
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    }
  );
};

// Accept invitation mutation
export const useAcceptInvitationMutation = (
  options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }
): UseMutationResult<{ membership: any }, unknown, string, unknown> => {
  const queryClient = useQueryClient();

  return useMutation(
    (token: string) => teamsService.acceptInvitation(token),
    {
      onSuccess: (data) => {
        // Refresh teams list
        queryClient.invalidateQueries([QueryKeys.teams]);
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    }
  );
};

export default teamsService;