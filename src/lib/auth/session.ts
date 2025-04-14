import { useSession } from 'vinxi/http'

type SessionData = {
  email?: string
  state?: string
  codeVerifier?: string
}

export function getSession() {
  'use server'
  return useSession<SessionData>({
    password: import.meta.env.VITE_SESSION_SECRET,
  })
}

export const saveAuthState = async (state: string, codeVerifier: string) => {
  'use server'
  const session = await getSession()
  await session.update({ state, codeVerifier })
}