import { Show } from 'solid-js'
import { redirect, type RouteDefinition } from "@solidjs/router"
import { createAsyncStore } from '@solidjs/router'
import { getUser } from '~/lib/auth/user'
import LoginForm from '~/components/LoginForm'

export const route = {
  preload() {
    getUser()
  },
} satisfies RouteDefinition

export default function Login() {
  const user = createAsyncStore(() => getUser(), {
    initialValue: null,
  })
  
  // Redirect to home if already logged in
  if (user()) {
    throw redirect('/')
  }
  
  return (
    <main class="container mx-auto p-4">
      <h1 class="text-4xl font-bold text-center my-8">Login</h1>
      <LoginForm />
    </main>
  )
}