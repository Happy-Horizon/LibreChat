import { Document, Types } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description?: string;
  avatar?: string;
  ownerId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export interface ITeamMembership extends Document {
  teamId: Types.ObjectId;
  userId: Types.ObjectId;
  role: TeamRole;
  invitedBy?: Types.ObjectId;
  joinedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITeamInvitation extends Document {
  teamId: Types.ObjectId;
  inviterUserId: Types.ObjectId;
  inviteeEmail: string;
  inviteeUserId?: Types.ObjectId;
  role: TeamRole;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TeamCreateData {
  name: string;
  description?: string;
  avatar?: string;
}

export interface TeamUpdateData {
  name?: string;
  description?: string;
  avatar?: string;
}

export interface TeamInvitationCreateData {
  teamId: string;
  inviteeEmail: string;
  role: TeamRole;
  expiresAt?: Date;
}

export interface ProjectSharingData {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
}