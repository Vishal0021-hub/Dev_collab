const Activity = require("../models/Activity");

/**
 * Log an activity event.
 * @param {ObjectId|string} workspaceId
 * @param {ObjectId|string} userId
 * @param {string} type  - one of the Activity.type enum values
 * @param {object} details - legacy details object for backward compat
 * @param {object} [opts] - optional: { entityType, entityId, meta }
 */
const logActivity = async (workspaceId, userId, type, details = {}, opts = {}) => {
  try {
    await Activity.create({
      workspace: workspaceId,
      user: userId,
      type,
      details,
      entityType: opts.entityType || null,
      entityId: opts.entityId || null,
      meta: opts.meta || details || {}
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

module.exports = { logActivity };
