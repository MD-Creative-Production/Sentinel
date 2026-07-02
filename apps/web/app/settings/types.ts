export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  website?: string;
  email?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  createdAt: string;
}

export interface SecuritySettings {
  requireMfa: boolean;
  allowInvites: boolean;
  sessionTimeout: number;
}
