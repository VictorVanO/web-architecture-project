import type { APIEvent } from '@solidjs/start/server'
import { db } from '~/lib/db'
import { z } from 'zod'

// Schema for validating review update data
const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().optional(),
  price: z.string().optional(),
})

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

    // Find the review
    const review = await db.visit.findUnique({
      where: { id: reviewId },
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
      }
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

    return new Response(JSON.stringify(review), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
      },
    })

  } catch (error) {
    console.error('Error fetching review:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch review' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

export async function PUT(event: APIEvent) {
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
    const existingReview = await db.visit.findUnique({
      where: { id: reviewId },
      include: { user: true }
    })

    if (!existingReview) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Check if user owns the review or is admin
    if (existingReview.userId !== user.id && !user.admin) {
      return new Response(JSON.stringify({ error: 'Unauthorized to edit this review' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Parse the form data
    const formData = await event.request.formData()
    
    // Validate the review data
    const reviewData = updateReviewSchema.parse({
      rating: formData.get('rating'),
      review: formData.get('review') || '',
      price: formData.get('price') || '',
    })

    // Update the review
    const updatedReview = await db.visit.update({
      where: { id: reviewId },
      data: {
        rating: reviewData.rating,
        review: reviewData.review,
        price: reviewData.price,
      }
    })

    // Handle image updates if any
    const imageUrls = formData.getAll('imageUrls')
    if (imageUrls.length > 0) {
      // Delete existing images
      await db.image.deleteMany({
        where: { visitId: reviewId }
      })

      // Add new images
      const imageData = imageUrls.map(url => ({
        url: url.toString(),
        visitId: reviewId
      }))
      
      await db.image.createMany({
        data: imageData
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Review updated successfully',
      reviewId: updatedReview.id 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
      },
    })

  } catch (error) {
    console.error('Error updating review:', error)
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input data',
        details: error.errors 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return new Response(JSON.stringify({ error: 'Failed to update review' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

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
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
    },
  })
}