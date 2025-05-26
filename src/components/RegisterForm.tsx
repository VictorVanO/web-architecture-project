import { createSignal, Show } from 'solid-js'
import { useSubmission } from '@solidjs/router'
import { registerAction } from '~/lib/auth/user'

export default function RegisterForm() {
  const registerSubmission = useSubmission(registerAction)
  const [password, setPassword] = createSignal('')
  const [confirmPassword, setConfirmPassword] = createSignal('')
  const [error, setError] = createSignal('')
  
  const validatePasswords = () => {
    if (password() !== confirmPassword()) {
      setError('Passwords do not match')
      return false
    }
    if (password().length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    return true
  }
  
  return (
    <div class="w-full max-w-md mx-auto">
      <form 
        action={registerAction} 
        method="post"
        class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        onSubmit={(e) => {
          if (!validatePasswords()) {
            e.preventDefault()
            return
          }
          // Reset error messages on new submission
          setError('')
        }}
      >
        <h2 class="text-2xl font-bold mb-6 text-center">Register</h2>
        
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
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
            Password
          </label>
          <input 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
            id="password" 
            type="password" 
            name="password" 
            minLength={8}
            required
            onInput={(e) => setPassword(e.currentTarget.value)}
          />
          <p class="text-xs text-gray-500">Must be at least 8 characters</p>
        </div>
        
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="confirm-password">
            Confirm Password
          </label>
          <input 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
            id="confirm-password" 
            type="password" 
            name="confirm-password" 
            required
            onInput={(e) => setConfirmPassword(e.currentTarget.value)}
          />
        </div>
        
        <Show when={error() || (registerSubmission.result && registerSubmission.result.error)}>
          <div class="mb-4 text-red-500 text-sm">
            {error() || registerSubmission.result?.error || 'Registration failed'}
          </div>
        </Show>
        
        <div class="flex items-center justify-between">
          <button 
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            type="submit"
            disabled={registerSubmission.pending}
          >
            {registerSubmission.pending ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  )
}