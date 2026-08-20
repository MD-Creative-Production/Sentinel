export function SettingsNav() {
  return (
    <div className="w-56 border-r pr-4 space-y-2 flex flex-col">
      <a href="/settings#profile">Profile</a>
      <a href="/settings#members">Members</a>
      <a href="/settings#security">Security</a>
      <a href="/settings/notifications">Notifications</a>
    </div>
  );
}
