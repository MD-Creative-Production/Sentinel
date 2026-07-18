'use client';

import { SecuritySettings as S } from '../types';
import { useState } from 'react';
import { updateSecuritySettings } from '../actions';

export function SecuritySettings({ settings }: { settings: S }) {
  const [state, setState] = useState(settings);

  return (
    <section id="security" className="space-y-3">
      <h2>Security</h2>

      <label>
        <input
          type="checkbox"
          checked={state.requireMfa}
          onChange={e => setState({ ...state, requireMfa: e.target.checked })}
        />
        Require MFA
      </label>

      <button onClick={() => updateSecuritySettings(state)}>Save Security Settings</button>
    </section>
  );
}
