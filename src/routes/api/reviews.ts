import type { APIEvent } from '@solidjs/start/server'
import { action, query } from '@solidjs/router'
import { db } from '~/lib/db'
import { z } from 'zod'
import { requireAuth } from '~/lib/auth/middleware'

// Schema for validating review data
const reviewSchema = z.object({
  restaurantId: z.coerce.number(),
  review: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  price: z.string().optional(),
  companions: z.array(z.coerce.number()).optional(),
  visitedAt: z.coerce.date().optional().default(() => new Date()),
})

// Schema for validating image data
const imageSchema = z.object({
  url: z.string(),
  caption: z.string().optional(),
  visitId: z.coerce.number(),
})

// Get all reviews for the current user
export const getUserReviews = query(async () => {
  'use server'
  const user = await requireAuth()
  
  return await db.visit.findMany({
    where: { userId: user.id },
    include: {
      restaurant: true,
      images: true,
      companions: true,
    },
    orderBy: { visitedAt: 'desc' },
  })
}, 'getUserReviews')

// Get reviews for a specific restaurant
export const getRestaurantReviews = query(async (restaurantId: number) => {
  'use server'
  return await db.visit.findMany({
    where: { restaurantId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      },
      images: true,
      companions: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      },
    },
    orderBy: { visitedAt: 'desc' },
  })
}, 'getRestaurantReviews')

// Get a single review by ID
export const getReview = query(async (id: number) => {
  'use server'
  return await db.visit.findUnique({
    where: { id },
    include: {
      restaurant: true,
      user: true,
      images: true,
      companions: true,
    },
  })
}, 'getReview')

// Create a new review
export const createReview = action(async (formData: FormData) => {
  'use server'
  const user = await requireAuth()
  
  // Parse and validate form data
  const data = reviewSchema.parse({
    restaurantId: formData.get('restaurantId'),
    review: formData.get('review'),
    rating: formData.get('rating'),
    price: formData.get('price'),
    visitedAt: formData.get('visitedAt') ? new Date(formData.get('visitedAt') as string) : new Date(),
    companions: formData.getAll('companions').map(id => Number(id)),
  })
  
  // Create the visit record
  const visit = await db.visit.create({
    data: {
      userId: user.id,
      restaurantId: data.restaurantId,
      review: data.review,
      rating: data.rating,
      price: data.price,
      visitedAt: data.visitedAt,
    },
  })
  
  // Connect companions if specified
  if (data.companions && data.companions.length > 0) {
    await db.visit.update({
      where: { id: visit.id },
      data: {
        companions: {
          connect: data.companions.map(id => ({ id })),
        },
      },
    })
  }
  
  return { success: true, visitId: visit.id }
}, 'createReview')

// Add an image to a review
export const addImageToReview = action(async (formData: FormData) => {
  'use server'
  await requireAuth()
  
  const data = imageSchema.parse({
    url: formData.get('url'),
    caption: formData.get('caption'),
    visitId: formData.get('visitId'),
  })
  
  return await db.image.create({
    data: {
      url: data.url,
      caption: data.caption,
      visitId: data.visitId,
    },
  })
}, 'addImageToReview')

// Update a review
export const updateReview = action(async (id: number, formData: FormData) => {
  'use server'
  const user = await requireAuth()
  
  // Make sure the review belongs to the current user
  const visit = await db.visit.findUnique({
    where: { id, userId: user.id },
  })
  
  if (!visit) {
    throw new Error('Review not found or access denied')
  }
  
  const data = reviewSchema.parse({
    restaurantId: formData.get('restaurantId'),
    review: formData.get('review'),
    rating: formData.get('rating'),
    price: formData.get('price'),
    visitedAt: formData.get('visitedAt') ? new Date(formData.get('visitedAt') as string) : undefined,
    companions: formData.getAll('companions').map(id => Number(id)),
  })
  
  // Update basic visit info
  await db.visit.update({
    where: { id },
    data: {
      restaurantId: data.restaurantId,
      review: data.review,
      rating: data.rating,
      price: data.price,
      visitedAt: data.visitedAt,
    },
  })
  
  // Update companions if specified
  if (data.companions) {
    // First disconnect all existing companions
    await db.visit.update({
      where: { id },
      data: {
        companions: {
          set: [],
        },
      },
    })
    
    // Then connect the new companions
    if (data.companions.length > 0) {
      await db.visit.update({
        where: { id },
        data: {
          companions: {
            connect: data.companions.map(id => ({ id })),
          },
        },
      })
    }
  }
  
  return { success: true }
}, 'updateReview')

// Delete a review
export const deleteReview = action(async (id: number) => {
  'use server'
  const user = await requireAuth()
  
  // Make sure the review belongs to the current user
  const visit = await db.visit.findUnique({
    where: { id, userId: user.id },
  })
  
  if (!visit) {
    throw new Error('Review not found or access denied')
  }
  
  // Delete associated images first
  await db.image.deleteMany({
    where: { visitId: id },
  })
  
  // Then delete the visit
  return await db.visit.delete({
    where: { id },
  })
}, 'deleteReview')

// API route handlers
export async function GET(event: APIEvent) {
  const url = new URL(event.request.url)
  const id = url.searchParams.get('id')
  const restaurantId = url.searchParams.get('restaurantId')
  
  if (id) {
    return await getReview(Number(id))
  } else if (restaurantId) {
    return await getRestaurantReviews(Number(restaurantId))
  } else {
    return await getUserReviews()
  }
}

export async function POST(event: APIEvent) {
  const formData = await event.request.formData()
  return await createReview(formData)
}