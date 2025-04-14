import { Show } from 'solid-js'
import { createAsyncStore } from '@solidjs/router'
import { getUser, logoutAction } from '~/lib/auth/user'

export default function UserProfile() {
  const user = createAsyncStore(() => getUser(), {
    initialValue: null,
  })
  
  return (
    <div class="bg-white shadow rounded-lg p-4">
      <Show when={user()} fallback={<div>Not logged in</div>}>
        {(userData) => (
          <div class="flex flex-col">
            <div class="flex items-center space-x-4 mb-4">
              <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {userData().email?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 class="font-bold text-lg">
                  {userData().firstName && userData().lastName ? 
                    `${userData().firstName} ${userData().lastName}` : 
                    userData().email}
                </h3>
                <p class="text-gray-600">{userData().email}</p>
              </div>
            </div>
            
            <form action={logoutAction} method="post">
              <button 
                type="submit" 
                class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Log Out
              </button>
            </form>
          </div>
        )}
      </Show>
    </div>
  )
}