import { Schema, Document, Types } from 'mongoose';

export interface IMongoTeam extends Document {
  name: string;
  description?: string;
  avatar?: string;
  ownerId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const teamSchema = new Schema<IMongoTeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    avatar: {
      type: String,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for searching teams by name
teamSchema.index({ name: 1 });

export default teamSchema;