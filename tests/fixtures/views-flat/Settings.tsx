import { executeAction } from '@basemachina/view';

export default function Settings() {
  const handleSave = async () => {
    await executeAction('update-user-settings', { theme: 'dark' });
  };

  return (
    <div>
      <h1>Settings</h1>
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
