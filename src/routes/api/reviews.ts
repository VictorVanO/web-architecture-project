import type { APIEvent } from '@solidjs/start/server'
import { db } from '~/lib/db'
import { z } from 'zod'

// Schema for validating review data
const reviewSchema = z.object({
  restaurantName: z.string().min(1),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  address: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().optional(),
  price: z.string().optional(),
})

export async function GET(event: APIEvent) {
  try {
    const url = new URL(event.request.url)
    const name = url.searchParams.get('name')
    const latitude = url.searchParams.get('latitude')
    const longitude = url.searchParams.get('longitude')
    
    // If restaurant-specific parameters are provided, get reviews for that restaurant
    if (name && latitude && longitude) {
      const lat = parseFloat(latitude)
      const lon = parseFloat(longitude)
      const latRange = 0.001 // approximately 100 meters
      const lonRange = 0.001
      
      const restaurants = await db.restaurant.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: name } },
                { address: { contains: name } }
              ]
            },
            {
              latitude: {
                gte: lat - latRange,
                lte: lat + latRange
              }
            },
            {
              longitude: {
                gte: lon - lonRange,
                lte: lon + lonRange
              }
            }
          ]
        }
      })

      if (restaurants.length === 0) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      const restaurantIds = restaurants.map(r => r.id)
      
      const reviews = await db.visit.findMany({
        where: {
          restaurantId: {
            in: restaurantIds
          }
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
        },
      })
    }
    
    // Otherwise, return recent reviews (limit 10)
    const reviews = await db.visit.findMany({
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
      },
      take: 10
    })

    return new Response(JSON.stringify(reviews), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch reviews' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

export async function POST(event: APIEvent) {
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

    // Parse the form data
    const formData = await event.request.formData()
    
    // Validate the review data
    const reviewData = reviewSchema.parse({
      restaurantName: formData.get('restaurantName'),
      latitude: formData.get('latitude'),
      longitude: formData.get('longitude'),
      address: formData.get('address') || '',
      rating: formData.get('rating'),
      review: formData.get('review') || '',
      price: formData.get('price') || '',
    })

    // Get or create restaurant
    let restaurant = await db.restaurant.findFirst({
      where: {
        name: reviewData.restaurantName,
        latitude: {
          gte: reviewData.latitude - 0.001,
          lte: reviewData.latitude + 0.001
        },
        longitude: {
          gte: reviewData.longitude - 0.001,
          lte: reviewData.longitude + 0.001
        }
      }
    })

    if (!restaurant) {
      restaurant = await db.restaurant.create({
        data: {
          name: reviewData.restaurantName,
          latitude: reviewData.latitude,
          longitude: reviewData.longitude,
          address: reviewData.address,
        }
      })
    }

    // Create the visit record
    const visit = await db.visit.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        review: reviewData.review,
        rating: reviewData.rating,
        price: reviewData.price,
      }
    })

    // Handle image uploads if any
    const imageUrls = formData.getAll('imageUrls')
    if (imageUrls.length > 0) {
      const imageData = imageUrls.map(url => ({
        url: url.toString(),
        visitId: visit.id
      }))
      
      await db.image.createMany({
        data: imageData
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Review submitted successfully',
      visitId: visit.id 
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Error submitting review:', error)
    
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

    return new Response(JSON.stringify({ error: 'Failed to submit review' }), {
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
    },
  })
}