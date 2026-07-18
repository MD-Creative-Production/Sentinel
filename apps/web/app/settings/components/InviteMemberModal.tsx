'use client';

import { useState } from 'react';
import { inviteMember } from '../actions';

export function InviteMemberModal() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  return (
    <div className="space-y-2">
      <h3>Invite Member</h3>

      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />

      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="admin">Admin</option>
        <option value="member">Member</option>
        <option value="viewer">Viewer</option>
      </select>

      <button onClick={() => inviteMember(email, role)}>Send Invite</button>
    </div>
  );
}
