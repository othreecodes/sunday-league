import { redirect } from 'next/navigation'

/** `/login` is the URL people type; the real route is `/auth/signin`. */
export default function LoginRedirect() {
  redirect('/auth/signin')
}
