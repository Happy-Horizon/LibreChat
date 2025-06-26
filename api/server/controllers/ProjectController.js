const { logger } = require('~/config');
const {
  getUserProjects,
  createProject,
  shareProject,
  unshareProject,
  checkProjectAccess,
  updateProject,
  deleteProject,
  getProjectById,
} = require('~/models/Project');

/**
 * Get user's projects (owned + shared + team projects)
 */
const getUserProjectsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const projects = await getUserProjects(userId, { skip, limit: parseInt(limit) });

    res.json({
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: projects.length === parseInt(limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching user projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

/**
 * Create a new project
 */
const createProjectController = async (req, res) => {
  try {
    const { name, description, teamId, isPublic = false } = req.body;
    const ownerId = req.user.id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // If teamId is provided, verify user is a member of the team
    if (teamId) {
      const { TeamMembership } = require('~/db/models');
      const membership = await TeamMembership.findOne({ teamId, userId: ownerId });
      if (!membership) {
        return res.status(403).json({ error: 'Access denied: not a team member' });
      }
    }

    const projectData = {
      name: name.trim(),
      description: description?.trim(),
      ownerId,
      teamId: teamId || undefined,
      isPublic: Boolean(isPublic),
      sharedWith: [],
    };

    const project = await createProject(projectData);
    logger.info(`Project created: ${project._id} by user: ${ownerId}`);

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

/**
 * Get project by ID (with access control)
 */
const getProjectController = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const accessCheck = await checkProjectAccess(projectId, userId);

    if (!accessCheck.canAccess) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    res.json({
      project: accessCheck.project,
      userRole: accessCheck.role,
    });
  } catch (error) {
    logger.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

/**
 * Update project
 */
const updateProjectController = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { name, description, isPublic } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);

    const project = await updateProject(projectId, userId, updateData);
    logger.info(`Project updated: ${projectId} by user: ${userId}`);

    res.json({
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    logger.error('Error updating project:', error);
    if (error.message.includes('Insufficient permissions')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update project' });
  }
};

/**
 * Delete project
 */
const deleteProjectController = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    await deleteProject(projectId, userId);
    logger.info(`Project deleted: ${projectId} by user: ${userId}`);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Error deleting project:', error);
    if (error.message.includes('access denied')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

/**
 * Share project with users
 */
const shareProjectController = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { shares } = req.body; // Array of {userId, role}
    const ownerId = req.user.id;

    if (!Array.isArray(shares) || shares.length === 0) {
      return res.status(400).json({ error: 'Shares array is required' });
    }

    // Validate share data
    const validRoles = ['viewer', 'editor', 'admin'];
    const invalidShares = shares.filter(
      share => !share.userId || !validRoles.includes(share.role)
    );

    if (invalidShares.length > 0) {
      return res.status(400).json({ error: 'Invalid share data' });
    }

    const project = await shareProject(projectId, ownerId, shares);
    logger.info(`Project shared: ${projectId} with ${shares.length} users`);

    res.json({
      message: 'Project shared successfully',
      project,
    });
  } catch (error) {
    logger.error('Error sharing project:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to share project' });
  }
};

/**
 * Remove project sharing
 */
const unshareProjectController = async (req, res) => {
  try {
    const { projectId, userId: shareUserId } = req.params;
    const ownerId = req.user.id;

    const project = await unshareProject(projectId, ownerId, shareUserId);
    logger.info(`Project unshared: ${projectId} with user: ${shareUserId}`);

    res.json({
      message: 'Project sharing removed successfully',
      project,
    });
  } catch (error) {
    logger.error('Error removing project sharing:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to remove sharing' });
  }
};

/**
 * Get project sharing info
 */
const getProjectSharingController = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await getProjectById(projectId);
    if (!project || project.ownerId.toString() !== userId) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    const sharingInfo = {
      isPublic: project.isPublic,
      teamId: project.teamId,
      sharedWith: project.sharedWith.map(share => ({
        userId: share.userId,
        role: share.role,
        sharedAt: share.sharedAt,
      })),
    };

    res.json(sharingInfo);
  } catch (error) {
    logger.error('Error fetching project sharing info:', error);
    res.status(500).json({ error: 'Failed to fetch sharing info' });
  }
};

module.exports = {
  getUserProjectsController,
  createProjectController,
  getProjectController,
  updateProjectController,
  deleteProjectController,
  shareProjectController,
  unshareProjectController,
  getProjectSharingController,
};