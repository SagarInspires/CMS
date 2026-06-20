import { Role, ArticleStatus } from "@prisma/client";

export type Permission =
  | "article:create"
  | "article:read-own"
  | "article:update-own-draft"
  | "article:delete-own-draft"
  | "article:submit"
  | "article:review"
  | "article:update-any"
  | "article:publish"
  | "article:schedule"
  | "taxonomy:manage"
  | "user:manage"
  | "audit:read";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  AUTHOR: [
    "article:create",
    "article:read-own",
    "article:update-own-draft",
    "article:delete-own-draft",
    "article:submit"
  ],
  EDITOR: [
    "article:create",
    "article:read-own",
    "article:update-own-draft",
    "article:delete-own-draft",
    "article:submit",
    "article:review",
    "article:update-any",
    "article:publish",
    "article:schedule"
  ],
  ADMIN: [
    "article:create",
    "article:read-own",
    "article:update-own-draft",
    "article:delete-own-draft",
    "article:submit",
    "article:review",
    "article:update-any",
    "article:publish",
    "article:schedule",
    "taxonomy:manage",
    "user:manage",
    "audit:read"
  ]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canEditArticle(role: Role, articleAuthorId: string, currentUserId: string, status: ArticleStatus): boolean {
  if (role === "ADMIN" || role === "EDITOR") return true;
  if (role === "AUTHOR" && articleAuthorId === currentUserId) {
    return status === "DRAFT" || status === "CHANGES_REQUESTED";
  }
  return false;
}
