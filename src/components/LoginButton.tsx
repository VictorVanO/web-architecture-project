import { action } from '@solidjs/router'
import { redirect } from '@solidjs/router'
import { getLoginUrl } from '~/lib/auth/azure'

const startLoginAction = action(async () => {
  'use server'
  throw redirect(await getLoginUrl())
}, 'startLogin')

export default function LoginButton() {
  return (
    <form method="post" action={startLoginAction}>
      <button 
        type="submit"
        class="rounded-xl p-2 bg-sky-600 text-white hover:bg-sky-700"
      >
        Log in with Microsoft
      </button>
    </form>
  )
}