import { redirect } from 'next/navigation'

export default async function Home() {
  // Always send users to the login page as the entry point
  redirect('/login')
}
