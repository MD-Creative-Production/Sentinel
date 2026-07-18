'use server';

import { Organization, Member, SecuritySettings } from './types';

export async function getOrganization(): Promise<Organization> {
  return {
    id: '1',
    name: 'Acme Inc',
    description: 'Demo org',
    website: 'https://acme.com',
    email: 'support@acme.com',
  };
}

export async function updateOrganization(data: Partial<Organization>) {
  console.log('update org', data);
}

export async function getMembers(): Promise<Member[]> {
  return [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@acme.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function inviteMember(email: string, role: string) {
  console.log('invite', email, role);
}

export async function updateMemberRole(memberId: string, role: string) {
  console.log('role update', memberId, role);
}

export async function removeMember(memberId: string) {
  console.log('remove', memberId);
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  return {
    requireMfa: false,
    allowInvites: true,
    sessionTimeout: 30,
  };
}

export async function updateSecuritySettings(data: SecuritySettings) {
  console.log('security update', data);
}
