import type { APIEvent } from '@solidjs/start/server'
import { db } from '~/lib/db'

export async function GET(event: APIEvent) {
  try {
    // Get user email from header
    const userEmail = event.request.headers.get('X-User-Email')
    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'User email required' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Get user's reviews
    const reviews = await db.visit.findMany({
      where: {
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        restaurant: true,
        images: true,
        companions: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        visitedAt: 'desc'
      }
    })

    return new Response(JSON.stringify(reviews), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
      },
    })
  } catch (error) {
    console.error('Error fetching user reviews:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch user reviews' }), {
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