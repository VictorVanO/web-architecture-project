import { redirect } from "@solidjs/router"
import { getUser } from "./user"

export async function requireAuth() {
  'use server'
  const user = await getUser()
  if (!user) {
    throw redirect('/login')
  }
  return user
}

export async function requireAdmin() {
  'use server'
  const user = await getUser()
  if (!user) {
    throw redirect('/login')
  }
  if (!user.admin) {
    throw redirect('/')
  }
  return user
}