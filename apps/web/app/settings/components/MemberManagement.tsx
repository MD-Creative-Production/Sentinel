'use client';

import { Member } from '../types';
import { removeMember, updateMemberRole } from '../actions';

export function MemberManagement({ members }: { members: Member[] }) {
  return (
    <section id="members" className="space-y-3">
      <h2>Members</h2>

      {members.map(m => (
        <div key={m.id} className="flex gap-3 items-center">
          <div>
            {m.name} ({m.email})
          </div>

          <select value={m.role} onChange={e => updateMemberRole(m.id, e.target.value)}>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>

          <button onClick={() => removeMember(m.id)}>Remove</button>
        </div>
      ))}
    </section>
  );
}
