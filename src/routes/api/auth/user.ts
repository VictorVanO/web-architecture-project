import type { APIEvent } from '@solidjs/start/server'
import { getUser } from '~/lib/auth/user'
import { db } from '~/lib/db'

export async function GET(event: APIEvent) {
  try {
    // Try to get user from current session first
    let user = await getUser()
    
    // If no session user, try to get by email header (for mobile app)
    if (!user) {
      const userEmail = event.request.headers.get('X-User-Email')
      if (userEmail) {
        user = await db.user.findUnique({
          where: { email: userEmail },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            admin: true,
            createdAt: true,
            updatedAt: true,
          }
        })
      }
    }
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
    
    return new Response(JSON.stringify(user), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
      },
    })
  } catch (error) {
    console.error('API get user error:', error)
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
    },
  })
}