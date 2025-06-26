import mongoose from 'mongoose';
import teamSchema, { IMongoTeam } from '~/schema/team';

export const createTeamModel = (connection: mongoose.Connection) => {
  return connection.models.Team || connection.model<IMongoTeam>('Team', teamSchema);
};

export default function createTeam(mongoose: typeof import('mongoose')) {
  return mongoose.models.Team || mongoose.model<IMongoTeam>('Team', teamSchema);
}