import type { APIEvent } from '@solidjs/start/server'
import { addReview, getReviews } from '~/lib/review'
import { requireAuth } from '~/lib/auth/middleware'

export async function GET(event: APIEvent) {
  // Check if user is authenticated
  await requireAuth()
  return await getReviews()
}

export async function POST(event: APIEvent) {
  return await addReview(await event.request.formData())
}