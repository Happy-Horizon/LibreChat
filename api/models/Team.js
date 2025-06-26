const { Team, TeamMembership, TeamInvitation } = require('~/db/models');
const { nanoid } = require('nanoid');

/**
 * Create a new team
 * @param {Object} teamData - Team creation data
 * @param {string} teamData.name - Team name
 * @param {string} [teamData.description] - Team description
 * @param {string} [teamData.avatar] - Team avatar URL
 * @param {string} teamData.ownerId - Team owner ID
 * @returns {Promise<Object>} The created team
 */
const createTeam = async function (teamData) {
  const team = new Team(teamData);
  const savedTeam = await team.save();
  
  // Automatically add the owner as a team member with OWNER role
  const membership = new TeamMembership({
    teamId: savedTeam._id,
    userId: teamData.ownerId,
    role: 'owner',
    joinedAt: new Date(),
  });
  await membership.save();
  
  return savedTeam;
};

/**
 * Get teams for a user
 * @param {string} userId - User ID
 * @param {Object} [options] - Query options
 * @returns {Promise<Array>} User's teams with membership info
 */
const getUserTeams = async function (userId, options = {}) {
  const { limit = 50, skip = 0, fieldsToSelect = null } = options;
  
  const pipeline = [
    {
      $match: { userId: userId }
    },
    {
      $lookup: {
        from: 'teams',
        localField: 'teamId',
        foreignField: '_id',
        as: 'team'
      }
    },
    {
      $unwind: '$team'
    },
    {
      $project: {
        role: 1,
        joinedAt: 1,
        'team._id': 1,
        'team.name': 1,
        'team.description': 1,
        'team.avatar': 1,
        'team.ownerId': 1,
        'team.createdAt': 1,
        'team.updatedAt': 1,
        ...(fieldsToSelect && fieldsToSelect.split(' ').reduce((acc, field) => {
          acc[`team.${field}`] = 1;
          return acc;
        }, {}))
      }
    },
    { $skip: skip },
    { $limit: limit }
  ];
  
  return await TeamMembership.aggregate(pipeline);
};

/**
 * Get team by ID with member validation
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID to check membership
 * @returns {Promise<Object|null>} Team data if user is a member
 */
const getTeamById = async function (teamId, userId = null) {
  const team = await Team.findById(teamId).lean();
  
  if (!team) {
    return null;
  }
  
  if (userId) {
    const membership = await TeamMembership.findOne({ teamId, userId });
    if (!membership) {
      return null; // User is not a member
    }
    team.userRole = membership.role;
  }
  
  return team;
};

/**
 * Update team
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID (must be owner or admin)
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated team
 */
const updateTeam = async function (teamId, userId, updateData) {
  // Check if user can update team (owner or admin)
  const membership = await TeamMembership.findOne({ teamId, userId });
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Insufficient permissions to update team');
  }
  
  return await Team.findByIdAndUpdate(teamId, updateData, { new: true });
};

/**
 * Delete team
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID (must be owner)
 * @returns {Promise<boolean>} Success status
 */
const deleteTeam = async function (teamId, userId) {
  // Only owner can delete team
  const membership = await TeamMembership.findOne({ teamId, userId, role: 'owner' });
  if (!membership) {
    throw new Error('Only team owner can delete team');
  }
  
  // Delete all memberships and invitations
  await TeamMembership.deleteMany({ teamId });
  await TeamInvitation.deleteMany({ teamId });
  
  // Delete the team
  await Team.findByIdAndDelete(teamId);
  
  return true;
};

/**
 * Get team members
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID (must be team member)
 * @returns {Promise<Array>} Team members with user info
 */
const getTeamMembers = async function (teamId, userId) {
  // Check if user is a team member
  const userMembership = await TeamMembership.findOne({ teamId, userId });
  if (!userMembership) {
    throw new Error('Access denied: not a team member');
  }
  
  const pipeline = [
    { $match: { teamId: teamId } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        role: 1,
        joinedAt: 1,
        invitedBy: 1,
        'user._id': 1,
        'user.name': 1,
        'user.email': 1,
        'user.username': 1,
        'user.avatar': 1
      }
    }
  ];
  
  return await TeamMembership.aggregate(pipeline);
};

/**
 * Invite user to team
 * @param {Object} invitationData - Invitation data
 * @param {string} invitationData.teamId - Team ID
 * @param {string} invitationData.inviterUserId - Inviter user ID
 * @param {string} invitationData.inviteeEmail - Invitee email
 * @param {string} invitationData.role - Role to assign
 * @returns {Promise<Object>} Created invitation
 */
const inviteToTeam = async function (invitationData) {
  const { teamId, inviterUserId, inviteeEmail, role = 'member' } = invitationData;
  
  // Check if inviter has permission (owner or admin)
  const inviterMembership = await TeamMembership.findOne({ teamId, userId: inviterUserId });
  if (!inviterMembership || !['owner', 'admin'].includes(inviterMembership.role)) {
    throw new Error('Insufficient permissions to invite users');
  }
  
  // Check if user is already a member
  const { User } = require('~/db/models');
  const existingUser = await User.findOne({ email: inviteeEmail });
  if (existingUser) {
    const existingMembership = await TeamMembership.findOne({ 
      teamId, 
      userId: existingUser._id 
    });
    if (existingMembership) {
      throw new Error('User is already a team member');
    }
  }
  
  // Check for existing pending invitation
  const existingInvitation = await TeamInvitation.findOne({ 
    teamId, 
    inviteeEmail,
    acceptedAt: { $exists: false }
  });
  if (existingInvitation) {
    throw new Error('Invitation already sent to this email');
  }
  
  // Create invitation
  const invitation = new TeamInvitation({
    teamId,
    inviterUserId,
    inviteeEmail,
    inviteeUserId: existingUser?._id,
    role,
    token: nanoid(32),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
  
  return await invitation.save();
};

/**
 * Accept team invitation
 * @param {string} token - Invitation token
 * @param {string} userId - User ID accepting the invitation
 * @returns {Promise<Object>} Team membership
 */
const acceptTeamInvitation = async function (token, userId) {
  const invitation = await TeamInvitation.findOne({ 
    token, 
    acceptedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });
  
  if (!invitation) {
    throw new Error('Invalid or expired invitation');
  }
  
  // Verify user email matches invitation
  const { User } = require('~/db/models');
  const user = await User.findById(userId);
  if (!user || user.email !== invitation.inviteeEmail) {
    throw new Error('Email mismatch');
  }
  
  // Create team membership
  const membership = new TeamMembership({
    teamId: invitation.teamId,
    userId,
    role: invitation.role,
    invitedBy: invitation.inviterUserId,
    joinedAt: new Date(),
  });
  
  const savedMembership = await membership.save();
  
  // Mark invitation as accepted
  invitation.acceptedAt = new Date();
  invitation.inviteeUserId = userId;
  await invitation.save();
  
  return savedMembership;
};

/**
 * Remove team member
 * @param {string} teamId - Team ID
 * @param {string} memberUserId - Member user ID to remove
 * @param {string} requesterUserId - User ID making the request
 * @returns {Promise<boolean>} Success status
 */
const removeTeamMember = async function (teamId, memberUserId, requesterUserId) {
  const requesterMembership = await TeamMembership.findOne({ 
    teamId, 
    userId: requesterUserId 
  });
  
  const memberMembership = await TeamMembership.findOne({ 
    teamId, 
    userId: memberUserId 
  });
  
  if (!requesterMembership || !memberMembership) {
    throw new Error('User not found in team');
  }
  
  // Owner can remove anyone, admin can remove members/viewers, members can only remove themselves
  const canRemove = requesterMembership.role === 'owner' ||
    (requesterMembership.role === 'admin' && !['owner', 'admin'].includes(memberMembership.role)) ||
    requesterUserId === memberUserId;
  
  if (!canRemove) {
    throw new Error('Insufficient permissions to remove this member');
  }
  
  // Cannot remove the last owner
  if (memberMembership.role === 'owner') {
    const ownerCount = await TeamMembership.countDocuments({ teamId, role: 'owner' });
    if (ownerCount <= 1) {
      throw new Error('Cannot remove the last owner');
    }
  }
  
  await TeamMembership.findByIdAndDelete(memberMembership._id);
  return true;
};

module.exports = {
  createTeam,
  getUserTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  inviteToTeam,
  acceptTeamInvitation,
  removeTeamMember,
};