import { action, query } from '@solidjs/router'
import { db } from './db'
import { z } from 'zod'
import { requireAuth } from './auth/middleware'

const reviewSchema = z.object({
  restaurantId: z.coerce.number().int().positive(),
  review: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  price: z.string().optional(),
  companions: z.array(z.coerce.number().int()).optional(),
})

const restaurantSchema = z.object({
  name: z.string().min(1),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  address: z.string().optional(),
})

// Get all reviews
export const getReviews = query(async () => {
  'use server'
  return await db.visit.findMany({
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
}, 'getReviews')

// Get reviews for specific user
export const getUserReviews = query(async (userId?: number) => {
  'use server'
  const user = await requireAuth()
  
  return await db.visit.findMany({
    where: {
      userId: userId || user.id
    },
    include: {
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
}, 'getUserReviews')

// Get a single review by ID
export const getReview = query(async (id: number) => {
  'use server'
  return await db.visit.findUnique({
    where: { id },
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
}, 'getReview')

// Get friends for companion selector
export const getFriends = query(async () => {
  'use server'
  const user = await requireAuth()
  
  const friends = await db.user.findMany({
    where: {
      OR: [
        { friendOf: { some: { id: user.id } } },
        { friends: { some: { id: user.id } } },
      ]
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    }
  })
  
  return friends
}, 'getFriends')

// Get all users for admin companion selector
export const getAllUsers = query(async () => {
  'use server'
  const user = await requireAuth()
  
  // 
  if (!user.admin) {
    return []
  }
  
  return await db.user.findMany({
    where: {
      id: { not: user.id }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    }
  })
}, 'getAllUsers')

// Add a new review
export const addReview = async (form: FormData) => {
  'use server'
  const user = await requireAuth()
  
  // Parse companion IDs from form data
  const companionIds = form.getAll('companions')
    .map(id => typeof id === 'string' ? parseInt(id) : null)
    .filter((id): id is number => id !== null)
  
  // Get or create restaurant
  let restaurantId: number
  const existingRestaurantId = form.get('restaurantId')
  
  if (existingRestaurantId && typeof existingRestaurantId === 'string') {
    restaurantId = parseInt(existingRestaurantId)
  } else {
    // Create new restaurant
    const restaurant = restaurantSchema.parse({
      name: form.get('restaurantName'),
      latitude: form.get('latitude'),
      longitude: form.get('longitude'),
      address: form.get('address'),
    })
    
    const newRestaurant = await db.restaurant.create({
      data: restaurant
    })
    
    restaurantId = newRestaurant.id
  }
  
  // Create the review
  const reviewData = reviewSchema.parse({
    restaurantId,
    review: form.get('review'),
    rating: form.get('rating'),
    price: form.get('price'),
    companions: companionIds,
  })
  
  const review = await db.visit.create({
    data: {
      userId: user.id,
      restaurantId: reviewData.restaurantId,
      review: reviewData.review,
      rating: reviewData.rating,
      price: reviewData.price,
      companions: {
        connect: reviewData.companions?.map(id => ({ id })) || []
      }
    },
    include: {
      restaurant: true,
      companions: true
    }
  })
  
  return review
}

// Action for adding a review
export const addReviewAction = action(addReview, 'addReview')

// Delete a review
export const deleteReview = action(async (id: number) => {
  'use server'
  const user = await requireAuth()
  
  // Get the review to check ownership
  const review = await db.visit.findUnique({
    where: { id }
  })
  
  // Only allow review owner or admin to delete
  if (!review || (review.userId !== user.id && !user.admin)) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // Delete images first
  await db.image.deleteMany({
    where: { visitId: id }
  })
  
  // Now delete the review
  await db.visit.delete({
    where: { id }
  })
  
  return { success: true }
}, 'deleteReview')