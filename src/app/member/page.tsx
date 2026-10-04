import { redirect } from 'next/navigation';

// User login / member space is temporarily disabled as requested.
// Can be re-enabled whenever user accounts / subscriber features are needed in the future.
export default function MemberSpacePage() {
  redirect('/');
}
