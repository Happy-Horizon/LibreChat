const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const {
  createTeamController,
  getUserTeamsController,
  getTeamController,
  updateTeamController,
  deleteTeamController,
  getTeamMembersController,
  inviteToTeamController,
  acceptInvitationController,
  removeTeamMemberController,
} = require('~/server/controllers/TeamController');

const router = express.Router();

// Team management routes
router.post('/', requireJwtAuth, createTeamController);
router.get('/', requireJwtAuth, getUserTeamsController);
router.get('/:teamId', requireJwtAuth, getTeamController);
router.put('/:teamId', requireJwtAuth, updateTeamController);
router.delete('/:teamId', requireJwtAuth, deleteTeamController);

// Team member management routes
router.get('/:teamId/members', requireJwtAuth, getTeamMembersController);
router.post('/:teamId/invite', requireJwtAuth, inviteToTeamController);
router.delete('/:teamId/members/:userId', requireJwtAuth, removeTeamMemberController);

// Invitation management routes
router.post('/invitations/accept', requireJwtAuth, acceptInvitationController);

module.exports = router;