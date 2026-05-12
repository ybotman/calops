import { redirect } from 'next/navigation';

// CALOPS-57: Login Activity moved under USER ACTIVITY section.
// Old bookmarks/links to /dashboard/user-logins now redirect to the new path.
export default function UserLoginsRedirect() {
  redirect('/dashboard/analytics/logins');
}
