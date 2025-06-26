const { GLOBAL_PROJECT_NAME } = require('librechat-data-provider').Constants;
const { Project } = require('~/db/models');

/**
 * Retrieve a project by ID and convert the found project document to a plain object.
 *
 * @param {string} projectId - The ID of the project to find and return as a plain object.
 * @param {string|string[]} [fieldsToSelect] - The fields to include or exclude in the returned document.
 * @returns {Promise<IMongoProject>} A plain object representing the project document, or `null` if no project is found.
 */
const getProjectById = async function (projectId, fieldsToSelect = null) {
  const query = Project.findById(projectId);

  if (fieldsToSelect) {
    query.select(fieldsToSelect);
  }

  return await query.lean();
};

/**
 * Retrieve a project by name and convert the found project document to a plain object.
 * If the project with the given name doesn't exist and the name is "instance", create it and return the lean version.
 *
 * @param {string} projectName - The name of the project to find or create.
 * @param {string|string[]} [fieldsToSelect] - The fields to include or exclude in the returned document.
 * @returns {Promise<IMongoProject>} A plain object representing the project document.
 */
const getProjectByName = async function (projectName, fieldsToSelect = null) {
  const query = { name: projectName };
  const update = { $setOnInsert: { name: projectName } };
  const options = {
    new: true,
    upsert: projectName === GLOBAL_PROJECT_NAME,
    lean: true,
    select: fieldsToSelect,
  };

  return await Project.findOneAndUpdate(query, update, options);
};

/**
 * Add an array of prompt group IDs to a project's promptGroupIds array, ensuring uniqueness.
 *
 * @param {string} projectId - The ID of the project to update.
 * @param {string[]} promptGroupIds - The array of prompt group IDs to add to the project.
 * @returns {Promise<IMongoProject>} The updated project document.
 */
const addGroupIdsToProject = async function (projectId, promptGroupIds) {
  return await Project.findByIdAndUpdate(
    projectId,
    { $addToSet: { promptGroupIds: { $each: promptGroupIds } } },
    { new: true },
  );
};

/**
 * Remove an array of prompt group IDs from a project's promptGroupIds array.
 *
 * @param {string} projectId - The ID of the project to update.
 * @param {string[]} promptGroupIds - The array of prompt group IDs to remove from the project.
 * @returns {Promise<IMongoProject>} The updated project document.
 */
const removeGroupIdsFromProject = async function (projectId, promptGroupIds) {
  return await Project.findByIdAndUpdate(
    projectId,
    { $pull: { promptGroupIds: { $in: promptGroupIds } } },
    { new: true },
  );
};

/**
 * Remove a prompt group ID from all projects.
 *
 * @param {string} promptGroupId - The ID of the prompt group to remove from projects.
 * @returns {Promise<void>}
 */
const removeGroupFromAllProjects = async (promptGroupId) => {
  await Project.updateMany({}, { $pull: { promptGroupIds: promptGroupId } });
};

/**
 * Add an array of agent IDs to a project's agentIds array, ensuring uniqueness.
 *
 * @param {string} projectId - The ID of the project to update.
 * @param {string[]} agentIds - The array of agent IDs to add to the project.
 * @returns {Promise<IMongoProject>} The updated project document.
 */
const addAgentIdsToProject = async function (projectId, agentIds) {
  return await Project.findByIdAndUpdate(
    projectId,
    { $addToSet: { agentIds: { $each: agentIds } } },
    { new: true },
  );
};

/**
 * Remove an array of agent IDs from a project's agentIds array.
 *
 * @param {string} projectId - The ID of the project to update.
 * @param {string[]} agentIds - The array of agent IDs to remove from the project.
 * @returns {Promise<IMongoProject>} The updated project document.
 */
const removeAgentIdsFromProject = async function (projectId, agentIds) {
  return await Project.findByIdAndUpdate(
    projectId,
    { $pull: { agentIds: { $in: agentIds } } },
    { new: true },
  );
};

/**
 * Remove an agent ID from all projects.
 *
 * @param {string} agentId - The ID of the agent to remove from projects.
 * @returns {Promise<void>}
 */
const removeAgentFromAllProjects = async (agentId) => {
  await Project.updateMany({}, { $pull: { agentIds: agentId } });
};

/**
 * Get projects for a user (owned + shared + team projects)
 * @param {string} userId - User ID
 * @param {Object} [options] - Query options
 * @returns {Promise<Array>} User's accessible projects
 */
const getUserProjects = async function (userId, options = {}) {
  const { limit = 50, skip = 0 } = options;
  
  // Get user's team IDs
  const { TeamMembership } = require('~/db/models');
  const userTeams = await TeamMembership.find({ userId }).select('teamId');
  const teamIds = userTeams.map(membership => membership.teamId);
  
  const query = {
    $or: [
      { ownerId: userId }, // Owned projects
      { teamId: { $in: teamIds } }, // Team projects
      { 'sharedWith.userId': userId }, // Shared projects
      { isPublic: true } // Public projects
    ]
  };
  
  return await Project.find(query)
    .populate('ownerId', 'name email username avatar')
    .populate('teamId', 'name description avatar')
    .skip(skip)
    .limit(limit)
    .sort({ updatedAt: -1 });
};

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @param {string} projectData.name - Project name
 * @param {string} [projectData.description] - Project description
 * @param {string} projectData.ownerId - Project owner ID
 * @param {string} [projectData.teamId] - Team ID (optional)
 * @returns {Promise<Object>} Created project
 */
const createProject = async function (projectData) {
  const project = new Project(projectData);
  return await project.save();
};

/**
 * Share project with users
 * @param {string} projectId - Project ID
 * @param {string} ownerId - Project owner ID
 * @param {Array} shareData - Array of {userId, role} objects
 * @returns {Promise<Object>} Updated project
 */
const shareProject = async function (projectId, ownerId, shareData) {
  const project = await Project.findOne({ _id: projectId, ownerId });
  if (!project) {
    throw new Error('Project not found or access denied');
  }
  
  // Add new shares, avoiding duplicates
  for (const share of shareData) {
    const existingShare = project.sharedWith.find(
      s => s.userId.toString() === share.userId
    );
    
    if (existingShare) {
      existingShare.role = share.role; // Update role if already shared
    } else {
      project.sharedWith.push({
        userId: share.userId,
        role: share.role,
        sharedAt: new Date()
      });
    }
  }
  
  return await project.save();
};

/**
 * Remove project sharing
 * @param {string} projectId - Project ID
 * @param {string} ownerId - Project owner ID
 * @param {string} userId - User ID to remove sharing from
 * @returns {Promise<Object>} Updated project
 */
const unshareProject = async function (projectId, ownerId, userId) {
  const project = await Project.findOne({ _id: projectId, ownerId });
  if (!project) {
    throw new Error('Project not found or access denied');
  }
  
  project.sharedWith = project.sharedWith.filter(
    share => share.userId.toString() !== userId
  );
  
  return await project.save();
};

/**
 * Check if user can access project
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @returns {Promise<{canAccess: boolean, role: string|null, project: Object|null}>}
 */
const checkProjectAccess = async function (projectId, userId) {
  const project = await Project.findById(projectId)
    .populate('ownerId', 'name email username')
    .populate('teamId', 'name');
  
  if (!project) {
    return { canAccess: false, role: null, project: null };
  }
  
  // Owner has full access
  if (project.ownerId._id.toString() === userId) {
    return { canAccess: true, role: 'owner', project };
  }
  
  // Check if public
  if (project.isPublic) {
    return { canAccess: true, role: 'viewer', project };
  }
  
  // Check direct sharing
  const sharedWith = project.sharedWith.find(
    share => share.userId.toString() === userId
  );
  if (sharedWith) {
    return { canAccess: true, role: sharedWith.role, project };
  }
  
  // Check team access
  if (project.teamId) {
    const { TeamMembership } = require('~/db/models');
    const membership = await TeamMembership.findOne({ 
      teamId: project.teamId, 
      userId 
    });
    if (membership) {
      return { canAccess: true, role: 'member', project };
    }
  }
  
  return { canAccess: false, role: null, project: null };
};

/**
 * Update project
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated project
 */
const updateProject = async function (projectId, userId, updateData) {
  const accessCheck = await checkProjectAccess(projectId, userId);
  
  if (!accessCheck.canAccess || !['owner', 'admin', 'editor'].includes(accessCheck.role)) {
    throw new Error('Insufficient permissions to update project');
  }
  
  return await Project.findByIdAndUpdate(projectId, updateData, { new: true });
};

/**
 * Delete project
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID (must be owner)
 * @returns {Promise<boolean>} Success status
 */
const deleteProject = async function (projectId, userId) {
  const project = await Project.findOne({ _id: projectId, ownerId: userId });
  if (!project) {
    throw new Error('Project not found or access denied');
  }
  
  await Project.findByIdAndDelete(projectId);
  return true;
};

module.exports = {
  getProjectById,
  getProjectByName,
  /* new project methods */
  getUserProjects,
  createProject,
  shareProject,
  unshareProject,
  checkProjectAccess,
  updateProject,
  deleteProject,
  /* prompts */
  addGroupIdsToProject,
  removeGroupIdsFromProject,
  removeGroupFromAllProjects,
  /* agents */
  addAgentIdsToProject,
  removeAgentIdsFromProject,
  removeAgentFromAllProjects,
};
