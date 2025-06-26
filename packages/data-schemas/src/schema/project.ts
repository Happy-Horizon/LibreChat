import { Schema, Document, Types } from 'mongoose';

export interface IMongoProject extends Document {
  name: string;
  description?: string;
  promptGroupIds: Types.ObjectId[];
  agentIds: string[];
  ownerId: Types.ObjectId;
  teamId?: Types.ObjectId;
  isPublic: boolean;
  sharedWith: Array<{
    userId: Types.ObjectId;
    role: 'viewer' | 'editor' | 'admin';
    sharedAt: Date;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const projectSchema = new Schema<IMongoProject>(
  {
    name: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    promptGroupIds: {
      type: [Schema.Types.ObjectId],
      ref: 'PromptGroup',
      default: [],
    },
    agentIds: {
      type: [String],
      ref: 'Agent',
      default: [],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    sharedWith: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['viewer', 'editor', 'admin'],
        required: true,
        default: 'viewer',
      },
      sharedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient querying
projectSchema.index({ ownerId: 1, teamId: 1 });
projectSchema.index({ teamId: 1, isPublic: 1 });
projectSchema.index({ 'sharedWith.userId': 1 });

export default projectSchema;
