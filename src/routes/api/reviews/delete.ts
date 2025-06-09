import type { APIEvent } from '@solidjs/start/server'
import { db } from '~/lib/db'
import { getUser } from '~/lib/auth/user'

export async function POST(event: APIEvent) {
  try {
    console.log('Delete review API called')
    
    // Get the current user from session
    const user = await getUser()
    if (!user) {
      console.log('No user found in session')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User not authenticated' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse the request body to get review ID
    const body = await event.request.json()
    const reviewId = parseInt(body.reviewId)
    
    if (!reviewId || isNaN(reviewId)) {
      console.log('Invalid review ID:', body.reviewId)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid review ID' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('Attempting to delete review:', reviewId, 'for user:', user.id)

    // Get the review to check ownership
    const review = await db.visit.findUnique({
      where: { id: reviewId },
      include: { user: true }
    })

    if (!review) {
      console.log('Review not found:', reviewId)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Review not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check ownership
    if (review.userId !== user.id && !user.admin) {
      console.log('Unauthorized delete attempt:', { 
        reviewUserId: review.userId, 
        currentUserId: user.id, 
        isAdmin: user.admin 
      })
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'You can only delete your own reviews' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('Deleting images for review:', reviewId)
    // Delete associated images first
    await db.image.deleteMany({
      where: { visitId: reviewId }
    })

    console.log('Deleting review:', reviewId)
    // Delete the review
    await db.visit.delete({
      where: { id: reviewId }
    })

    console.log('Review deleted successfully:', reviewId)

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Review deleted successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Delete review API error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to delete review: ${error.message}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}