import { Schema, Document, Types } from 'mongoose';

export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export interface IMongoTeamMembership extends Document {
  teamId: Types.ObjectId;
  userId: Types.ObjectId;
  role: TeamRole;
  invitedBy?: Types.ObjectId;
  joinedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const teamMembershipSchema = new Schema<IMongoTeamMembership>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(TeamRole),
      required: true,
      default: TeamRole.MEMBER,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure one membership per user per team
teamMembershipSchema.index({ teamId: 1, userId: 1 }, { unique: true });

// Index for querying user's teams
teamMembershipSchema.index({ userId: 1, role: 1 });

export default teamMembershipSchema;