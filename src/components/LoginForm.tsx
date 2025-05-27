import { createSignal, Show, createEffect } from 'solid-js'
import { useSubmission, useNavigate } from '@solidjs/router'
import { loginAction } from '~/lib/auth/user'
import LoginButton from './LoginButton'

export default function LoginForm() {
  const navigate = useNavigate()
  const loginSubmission = useSubmission(loginAction)
  const [error, setError] = createSignal('')
  
  // Handle successful login
  createEffect(() => {
    if (loginSubmission.result && !loginSubmission.pending) {
      if (loginSubmission.result.success) {
        // Redirect to home on successful login
        navigate('/', { replace: true })
      }
    }
  })
  
  return (
    <div class="w-full max-w-md mx-auto">
      <form 
        action={loginAction} 
        method="post"
        class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        onSubmit={(e) => {
          // Reset error messages on new submission
          setError('')
        }}
      >
        <h2 class="text-2xl font-bold mb-6 text-center">Log In</h2>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="email">
            Email
          </label>
          <input 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            id="email" 
            type="email" 
            name="email" 
            required
          />
        </div>
        
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
            Password
          </label>
          <input 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
            id="password" 
            type="password" 
            name="password" 
            required
          />
        </div>
        
        <Show when={error() || (loginSubmission.result && !loginSubmission.result.success)}>
          <div class="mb-4 text-red-500 text-sm">
            {error() || loginSubmission.result?.error || 'Authentication failed'}
          </div>
        </Show>
        
        <div class="flex flex-col gap-4">
          <button 
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            type="submit"
            disabled={loginSubmission.pending}
          >
            {loginSubmission.pending ? 'Logging in...' : 'Login'}
          </button>
          
          <div class="text-center text-gray-500">or</div>
          
          <LoginButton />
        </div>
      </form>
    </div>
  )
}