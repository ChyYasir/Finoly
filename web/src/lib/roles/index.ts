// lib/roles/index.ts
export {
  useTeamRoles,
  useRoleSearch,
  type TeamRole,
  type RolesSummary,
  type CreateRoleInput,
  type UpdateRoleInput,
  type RolePermission,
  PERMISSION_GROUPS,
  ROLE_TEMPLATES,
  getPermissionLabel,
  getResourceLabel,
  formatPermissionSummary,
  formatRoleStats,
  getPermissionsByResource,
  getRoleTemplate,
  validatePermissions,
} from "./hooks";
