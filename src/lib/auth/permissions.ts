export const tenantRoles = [
  "owner",
  "administrator",
  "catalogue_manager",
  "enquiries_agent",
] as const;

export type TenantRole = (typeof tenantRoles)[number];
export type Capability =
  | "access_admin"
  | "manage_members"
  | "manage_catalogue"
  | "manage_enquiries"
  | "manage_website"
  | "view_audit";

const permissions: Record<TenantRole, ReadonlySet<Capability>> = {
  owner: new Set([
    "access_admin",
    "manage_members",
    "manage_catalogue",
    "manage_enquiries",
    "manage_website",
    "view_audit",
  ]),
  administrator: new Set([
    "access_admin",
    "manage_catalogue",
    "manage_enquiries",
    "manage_website",
    "view_audit",
  ]),
  catalogue_manager: new Set(["access_admin", "manage_catalogue"]),
  enquiries_agent: new Set(["access_admin", "manage_enquiries"]),
};

export function hasCapability(role: TenantRole, capability: Capability) {
  return permissions[role].has(capability);
}

export function roleLabel(role: TenantRole) {
  return role
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}
