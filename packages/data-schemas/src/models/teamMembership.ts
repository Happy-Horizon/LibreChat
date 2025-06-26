import mongoose from 'mongoose';
import teamMembershipSchema, { IMongoTeamMembership } from '~/schema/teamMembership';

export const createTeamMembershipModel = (connection: mongoose.Connection) => {
  return connection.models.TeamMembership || connection.model<IMongoTeamMembership>('TeamMembership', teamMembershipSchema);
};

export default function createTeamMembership(mongoose: typeof import('mongoose')) {
  return mongoose.models.TeamMembership || mongoose.model<IMongoTeamMembership>('TeamMembership', teamMembershipSchema);
}