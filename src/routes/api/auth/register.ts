import type { APIEvent } from '@solidjs/start/server'
import { z } from 'zod'
import { db } from '~/lib/db'
import { hashPassword } from '~/lib/auth/bcrypt'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export async function POST(event: APIEvent) {
  try {
    const formData = await event.request.formData()
    
    const validatedData = registerSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      firstName: formData.get('firstName') || undefined,
      lastName: formData.get('lastName') || undefined,
    })
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User already exists' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)
    
    // Create user
    const newUser = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      }
    })
    
    // Return success with user data (excluding password)
    const { password, ...userWithoutPassword } = newUser
    
    return new Response(JSON.stringify({
      success: true,
      user: userWithoutPassword
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Registration API error:', error)
    
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