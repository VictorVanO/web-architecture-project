// src/routes/api/reviews/[id].ts
import type { APIEvent } from '@solidjs/start/server'
import { db } from '~/lib/db'

export async function DELETE(event: APIEvent) {
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

    // Get review ID from URL
    const url = new URL(event.request.url)
    const pathParts = url.pathname.split('/')
    const reviewId = parseInt(pathParts[pathParts.length - 1])

    if (isNaN(reviewId)) {
      return new Response(JSON.stringify({ error: 'Invalid review ID' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Find the review and check ownership
    const review = await db.visit.findUnique({
      where: { id: reviewId },
      include: { user: true }
    })

    if (!review) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Check if user owns the review or is admin
    if (review.userId !== user.id && !user.admin) {
      return new Response(JSON.stringify({ error: 'Unauthorized to delete this review' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Delete associated images first
    await db.image.deleteMany({
      where: { visitId: reviewId }
    })

    // Delete the review
    await db.visit.delete({
      where: { id: reviewId }
    })

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Review deleted successfully' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
      },
    })

  } catch (error) {
    console.error('Error deleting review:', error)
    return new Response(JSON.stringify({ error: 'Failed to delete review' }), {
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
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
    },
  })
}