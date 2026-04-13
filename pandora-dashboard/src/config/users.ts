/**
 * Config-based user credentials.
 *
 * To add a new user:
 * 1. Add an entry to the SEED_USERS array below
 * 2. Set a plaintext password (it will be hashed during seeding)
 * 3. Run: npm run db:seed
 *
 * Roles: "admin" | "editor" | "viewer"
 *
 * In production, migrate to database-managed user creation
 * through the admin panel instead of this config file.
 */

export interface SeedUser {
  username: string;
  fullName: string;
  email: string;
  password: string; // Plain text — hashed during seed
  role: "admin" | "editor" | "viewer";
  active: boolean;
  workspaceAccess: string[]; // workspace slugs
}

export const SEED_USERS: SeedUser[] = [
  {
    username: "omar.abuhassan",
    fullName: "Omar Abuhassan",
    email: "omar.abuhassan@sciglob.com",
    password: "Omar@123",
    role: "admin",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  {
    username: "william.lo",
    fullName: "William Lo",
    email: "william.lo@sciglob.com",
    password: "William@123",
    role: "editor",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  {
    username: "brett.padfield",
    fullName: "Brett Padfield",
    email: "brett.padfield@sciglob.com",
    password: "Brett@123",
    role: "editor",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  {
    username: "chris.rader",
    fullName: "Chris Rader",
    email: "chris.rader@sciglob.com",
    password: "Chris@123",
    role: "editor",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  {
    username: "ashutosh.joshi",
    fullName: "Ashutosh Joshi",
    email: "ajoshi@sciglob.com",
    password: "Ashu@123",
    role: "admin",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  {
    username: "matthew.nance",
    fullName: "Matthew Nance",
    email: "matthew.nance@sciglob.com",
    password: "Matthew@123",
    role: "editor",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
];

export const CONTACT_EMAIL = "admin@sciglob.com";
