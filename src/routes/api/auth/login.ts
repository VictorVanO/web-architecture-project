import type { APIEvent } from '@solidjs/start/server'
import { z } from 'zod'
import { db } from '~/lib/db'
import { comparePasswords } from '~/lib/auth/bcrypt'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(event: APIEvent) {
  try {
    const formData = await event.request.formData()
    
    const validatedData = loginSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    })
    
    // Find user in database
    const user = await db.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid credentials' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    if (!user.password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Please use OAuth login' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Verify password
    const isValidPassword = await comparePasswords(validatedData.password, user.password)
    
    if (!isValidPassword) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid credentials' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Return success with user data (excluding password)
    const { password, ...userWithoutPassword } = user
    
    return new Response(JSON.stringify({
      success: true,
      user: userWithoutPassword
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Login API error:', error)
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid input data' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}