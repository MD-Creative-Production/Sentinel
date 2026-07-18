'use client';

import { useState } from 'react';
import { Organization } from '../types';
import { updateOrganization } from '../actions';

export function OrganizationProfileForm({ organization }: { organization: Organization }) {
  const [form, setForm] = useState(organization);

  return (
    <section id="profile" className="space-y-3">
      <h2>Organization Profile</h2>

      <input
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        placeholder="Name"
      />

      <input
        value={form.website || ''}
        onChange={e => setForm({ ...form, website: e.target.value })}
        placeholder="Website"
      />

      <button onClick={() => updateOrganization(form)}>Save</button>
    </section>
  );
}
