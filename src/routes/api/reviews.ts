import type { APIEvent } from '@solidjs/start/server'
import { addReview, getReviews, getRestaurantReviews } from '~/lib/review'
import { requireAuth } from '~/lib/auth/middleware'

export async function GET(event: APIEvent) {
  // Check if user is authenticated
  await requireAuth()
  
  const url = new URL(event.request.url)
  const name = url.searchParams.get('name')
  const latitude = url.searchParams.get('latitude')
  const longitude = url.searchParams.get('longitude')
  
  // If restaurant-specific parameters are provided, get reviews for that restaurant
  if (name && latitude && longitude) {
    try {
      return await getRestaurantReviews(
        name, 
        parseFloat(latitude), 
        parseFloat(longitude)
      )
    } catch (error) {
      console.error('Error fetching restaurant reviews:', error)
      return new Response('Error fetching restaurant reviews', { status: 500 })
    }
  }
  
  // Otherwise, return all reviews (existing behavior)
  return await getReviews()
}

export async function POST(event: APIEvent) {
  return await addReview(await event.request.formData())
}