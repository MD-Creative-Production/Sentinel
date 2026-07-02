import { getOrganization, getMembers, getSecuritySettings } from './actions';
import { SettingsNav } from './components/SettingsNav';
import { OrganizationProfileForm } from './components/OrganizationProfileForm';
import { MemberManagement } from './components/MemberManagement';
import { SecuritySettings } from './components/SecuritySettings';

export default async function SettingsPage() {
  const org = await getOrganization();
  const members = await getMembers();
  const security = await getSecuritySettings();

  return (
    <div className="flex w-full gap-6">
      <SettingsNav />

      <div className="flex-1 space-y-10">
        <OrganizationProfileForm organization={org} />
        <MemberManagement members={members} />
        <SecuritySettings settings={security} />
      </div>
    </div>
  );
}
