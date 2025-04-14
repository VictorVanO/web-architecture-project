import { action, query } from '@solidjs/router'
import { z } from 'zod'
import { db } from '../db'
import { getSession } from './session'
import { hashPassword, comparePasswords } from './bcrypt'
import { redirect } from '@solidjs/router'

export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerAction = action(async (formData: FormData) => {
  'use server'
  const user = userSchema.parse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  
  // Hash the password
  const hashedPassword = await hashPassword(user.password)
  
  // Add user to database
  await db.user.create({
    data: {
      email: user.email,
      password: hashedPassword,
    }
  })
  
  return { success: true }
}, 'register')

export const loginAction = action(async (formData: FormData) => {
  'use server'
  const { email, password } = userSchema.parse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  
  try {
    const record = await db.user.findUniqueOrThrow({ where: { email } })
    const loggedIn = await comparePasswords(password, record.password)
    
    if (loggedIn) {
      const session = await getSession()
      await session.update({ email })
      return { success: true }
    }
    
    return { success: false, error: 'Invalid credentials' }
  } catch (error) {
    return { success: false, error: 'User not found' }
  }
}, 'login')

export const getUser = query(async () => {
  'use server'
  try {
    const session = await getSession()
    if (!session.data.email) {
      return null
    }
    return await db.user.findUniqueOrThrow({
      where: { email: session.data.email },
    })
  } catch {
    return null
  }
}, 'getUser')

export const logoutAction = action(async () => {
  'use server'
  const session = await getSession()
  await session.clear()
  throw redirect('/')
}, 'logout')