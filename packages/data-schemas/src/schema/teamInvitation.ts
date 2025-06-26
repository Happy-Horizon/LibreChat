import { Schema, Document, Types } from 'mongoose';
import { TeamRole } from './teamMembership';

export interface IMongoTeamInvitation extends Document {
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

const teamInvitationSchema = new Schema<IMongoTeamInvitation>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    inviterUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inviteeEmail: {
      type: String,
      required: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'],
      index: true,
    },
    inviteeUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(TeamRole),
      required: true,
      default: TeamRole.MEMBER,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // TTL index, will automatically delete expired documents
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure one pending invitation per email per team
teamInvitationSchema.index(
  { teamId: 1, inviteeEmail: 1 },
  { 
    unique: true,
    partialFilterExpression: { acceptedAt: { $exists: false } }
  }
);

export default teamInvitationSchema;