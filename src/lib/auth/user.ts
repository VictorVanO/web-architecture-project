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
  
  try {
    const user = userSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    })
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: user.email }
    })
    
    if (existingUser) {
      return { success: false, error: 'User already exists' }
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(user.password)
    
    // Add user to database
    await db.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
      }
    })
    
    // Auto-login after registration
    const session = await getSession()
    await session.update({ email: user.email })
    
    throw redirect('/')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    if (error instanceof Response) {
      // This is a redirect, rethrow it
      throw error
    }
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed' }
  }
}, 'register')

export const loginAction = action(async (formData: FormData) => {
  'use server'
  
  try {
    const { email, password } = userSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    })
    
    const record = await db.user.findUnique({ where: { email } })
    
    if (!record) {
      return { success: false, error: 'User not found' }
    }
    
    if (!record.password) {
      return { success: false, error: 'Invalid login method. Please use OAuth.' }
    }
    
    const loggedIn = await comparePasswords(password, record.password)
    
    if (loggedIn) {
      const session = await getSession()
      await session.update({ email })
      throw redirect('/')
    }
    
    return { success: false, error: 'Invalid credentials' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    if (error instanceof Response) {
      // This is a redirect, rethrow it
      throw error
    }
    console.error('Login error:', error)
    return { success: false, error: 'Login failed' }
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