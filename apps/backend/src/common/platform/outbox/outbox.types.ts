export const OutboxEventTypes = {
  NOTIFICATION_USER: 'notification.user',
  NOTIFICATION_ADMIN_ROLES: 'notification.admin_roles',
} as const;

export type OutboxEventType =
  (typeof OutboxEventTypes)[keyof typeof OutboxEventTypes];
