import { useExecuteAction } from '@basemachina/view';

export default function Dashboard() {
  const [executeGetStats] = useExecuteAction('get-dashboard-stats');
  const [executeGetActivity] = useExecuteAction('get-recent-activity');

  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}
