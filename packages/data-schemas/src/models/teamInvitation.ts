import mongoose from 'mongoose';
import teamInvitationSchema, { IMongoTeamInvitation } from '~/schema/teamInvitation';

export const createTeamInvitationModel = (connection: mongoose.Connection) => {
  return connection.models.TeamInvitation || connection.model<IMongoTeamInvitation>('TeamInvitation', teamInvitationSchema);
};

export default function createTeamInvitation(mongoose: typeof import('mongoose')) {
  return mongoose.models.TeamInvitation || mongoose.model<IMongoTeamInvitation>('TeamInvitation', teamInvitationSchema);
}