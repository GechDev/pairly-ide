import {
  canWrite,
  canExecute,
  canComment,
  canManageRoom,
  type RoomRole,
} from '@pairly/contracts';

export type RealtimeAction =
  | 'DOCUMENT_UPDATE'
  | 'EXECUTE_CODE'
  | 'ADD_COMMENT'
  | 'CHANGE_ROLE'
  | 'TOGGLE_ROOM_LOCK'
  | 'KICK_PARTICIPANT';

export interface RBACCheckResult {
  allowed: boolean;
  code?: 'UNAUTHORIZED_ACTION' | 'ROOM_LOCKED' | 'FORBIDDEN';
  message?: string;
}

export interface RBACContext {
  role: RoomRole;
  isRoomLocked?: boolean;
}

/**
 * Server-side authorization guard enforcing RBAC per SRS SEC-01, SEC-03, and FR-ROOM-05..07.
 * Prevents unauthorized document updates, executions, and administrative mutations.
 */
export function authorizeAction(
  action: RealtimeAction,
  context: RBACContext
): RBACCheckResult {
  const { role, isRoomLocked = false } = context;

  // 1. If room is locked, only HOST can perform write/execute mutations
  if (isRoomLocked && role !== 'HOST') {
    if (action === 'DOCUMENT_UPDATE' || action === 'EXECUTE_CODE') {
      return {
        allowed: false,
        code: 'ROOM_LOCKED',
        message: 'The room is currently locked by the host. Edits and executions are disabled.',
      };
    }
  }

  // 2. Action-specific permission checks
  switch (action) {
    case 'DOCUMENT_UPDATE':
      if (!canWrite(role)) {
        return {
          allowed: false,
          code: 'UNAUTHORIZED_ACTION',
          message: `Role ${role} is not permitted to perform document updates. Write permission required.`,
        };
      }
      return { allowed: true };

    case 'EXECUTE_CODE':
      if (!canExecute(role)) {
        return {
          allowed: false,
          code: 'UNAUTHORIZED_ACTION',
          message: `Role ${role} is not permitted to execute code. Execute permission required.`,
        };
      }
      return { allowed: true };

    case 'ADD_COMMENT':
      if (!canComment(role)) {
        return {
          allowed: false,
          code: 'UNAUTHORIZED_ACTION',
          message: `Role ${role} is not permitted to add comments.`,
        };
      }
      return { allowed: true };

    case 'CHANGE_ROLE':
    case 'TOGGLE_ROOM_LOCK':
    case 'KICK_PARTICIPANT':
      if (!canManageRoom(role)) {
        return {
          allowed: false,
          code: 'UNAUTHORIZED_ACTION',
          message: `Administrative action ${action} requires HOST role.`,
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}
