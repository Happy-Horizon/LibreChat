const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const {
  getUserProjectsController,
  createProjectController,
  getProjectController,
  updateProjectController,
  deleteProjectController,
  shareProjectController,
  unshareProjectController,
  getProjectSharingController,
} = require('~/server/controllers/ProjectController');

const router = express.Router();

// Project management routes
router.get('/', requireJwtAuth, getUserProjectsController);
router.post('/', requireJwtAuth, createProjectController);
router.get('/:projectId', requireJwtAuth, getProjectController);
router.put('/:projectId', requireJwtAuth, updateProjectController);
router.delete('/:projectId', requireJwtAuth, deleteProjectController);

// Project sharing routes
router.get('/:projectId/sharing', requireJwtAuth, getProjectSharingController);
router.post('/:projectId/share', requireJwtAuth, shareProjectController);
router.delete('/:projectId/share/:userId', requireJwtAuth, unshareProjectController);

module.exports = router;