import { supabase } from '../config/supabase.js';

/**
 * Fire-and-forget audit logger. Never throws — logging failure must not break the main flow.
 *
 * @param {object} opts
 * @param {string} opts.actorId    - UUID of the user performing the action
 * @param {string} opts.actorName  - Display name (stored denormalised for easy reading)
 * @param {string} opts.action     - Dot-separated verb: 'employee.updated', 'leave.approved', etc.
 * @param {string} opts.entityType - 'employee' | 'leave' | 'ot' | 'announcement'
 * @param {string} [opts.entityId] - UUID or identifier of the affected record
 * @param {object} [opts.details]  - Any extra JSON context (changed fields, rejection reason, …)
 */
export function logAction({ actorId, actorName, action, entityType, entityId = null, details = null }) {
  supabase
    .from('audit_logs')
    .insert({ actor_id: actorId, actor_name: actorName, action, entity_type: entityType, entity_id: entityId, details })
    .then(() => {})
    .catch(() => {}); // silent — audit failures must never surface to the caller
}
