const { logger } = require('~/config');
const {
  createTeam,
  getUserTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  inviteToTeam,
  acceptTeamInvitation,
  removeTeamMember,
} = require('~/models/Team');

/**
 * Create a new team
 */
const createTeamController = async (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const ownerId = req.user.id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const teamData = {
      name: name.trim(),
      description: description?.trim(),
      avatar,
      ownerId,
    };

    const team = await createTeam(teamData);
    logger.info(`Team created: ${team._id} by user: ${ownerId}`);

    res.status(201).json({
      message: 'Team created successfully',
      team,
    });
  } catch (error) {
    logger.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

/**
 * Get user's teams
 */
const getUserTeamsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const teams = await getUserTeams(userId, { skip, limit: parseInt(limit) });

    res.json({
      teams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: teams.length === parseInt(limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching user teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};

/**
 * Get team by ID
 */
const getTeamController = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await getTeamById(teamId, userId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    res.json({ team });
  } catch (error) {
    logger.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};

/**
 * Update team
 */
const updateTeamController = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    const { name, description, avatar } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (avatar !== undefined) updateData.avatar = avatar;

    const team = await updateTeam(teamId, userId, updateData);
    logger.info(`Team updated: ${teamId} by user: ${userId}`);

    res.json({
      message: 'Team updated successfully',
      team,
    });
  } catch (error) {
    logger.error('Error updating team:', error);
    if (error.message.includes('Insufficient permissions')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update team' });
  }
};

/**
 * Delete team
 */
const deleteTeamController = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    await deleteTeam(teamId, userId);
    logger.info(`Team deleted: ${teamId} by user: ${userId}`);

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    logger.error('Error deleting team:', error);
    if (error.message.includes('Only team owner')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete team' });
  }
};

/**
 * Get team members
 */
const getTeamMembersController = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const members = await getTeamMembers(teamId, userId);

    res.json({ members });
  } catch (error) {
    logger.error('Error fetching team members:', error);
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};

/**
 * Invite user to team
 */
const inviteToTeamController = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email, role = 'member' } = req.body;
    const inviterUserId = req.user.id;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const validRoles = ['member', 'admin', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const invitationData = {
      teamId,
      inviterUserId,
      inviteeEmail: email.toLowerCase().trim(),
      role,
    };

    const invitation = await inviteToTeam(invitationData);
    logger.info(`Team invitation sent: ${invitation._id} to ${email}`);

    // Here you would typically send an email notification
    // For now, we'll return the invitation token for testing
    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        email: invitation.inviteeEmail,
        role: invitation.role,
        token: invitation.token, // Remove this in production
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Error inviting to team:', error);
    if (error.message.includes('Insufficient permissions') || 
        error.message.includes('already a team member') ||
        error.message.includes('already sent')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to send invitation' });
  }
};

/**
 * Accept team invitation
 */
const acceptInvitationController = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }

    const membership = await acceptTeamInvitation(token, userId);
    logger.info(`Team invitation accepted: ${token} by user: ${userId}`);

    res.json({
      message: 'Team invitation accepted successfully',
      membership: {
        teamId: membership.teamId,
        role: membership.role,
        joinedAt: membership.joinedAt,
      },
    });
  } catch (error) {
    logger.error('Error accepting invitation:', error);
    if (error.message.includes('Invalid or expired') || 
        error.message.includes('Email mismatch')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
};

/**
 * Remove team member
 */
const removeTeamMemberController = async (req, res) => {
  try {
    const { teamId, userId: memberUserId } = req.params;
    const requesterUserId = req.user.id;

    await removeTeamMember(teamId, memberUserId, requesterUserId);
    logger.info(`Team member removed: ${memberUserId} from team: ${teamId}`);

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    logger.error('Error removing team member:', error);
    if (error.message.includes('Insufficient permissions') || 
        error.message.includes('User not found') ||
        error.message.includes('Cannot remove the last owner')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to remove team member' });
  }
};

module.exports = {
  createTeamController,
  getUserTeamsController,
  getTeamController,
  updateTeamController,
  deleteTeamController,
  getTeamMembersController,
  inviteToTeamController,
  acceptInvitationController,
  removeTeamMemberController,
};