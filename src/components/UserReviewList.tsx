import { For, Show, createSignal } from 'solid-js'
import { createAsyncStore, action, revalidate, useSubmission } from '@solidjs/router'
import { getUserReviews } from '~/lib/review'
import { getUser } from '~/lib/auth/user'
import { requireAuth } from '~/lib/auth/middleware'
import { db } from '~/lib/db'

interface UserReviewListProps {
  userId?: number
}

// Delete review action - simplified and more direct
const deleteReviewAction = action(async (reviewId: number) => {
  'use server'
  
  try {
    console.log('Attempting to delete review:', reviewId)
    const user = await requireAuth()
    
    // Get the review to check ownership
    const review = await db.visit.findUnique({
      where: { id: reviewId },
      include: { user: true }
    })
    
    if (!review) {
      console.log('Review not found:', reviewId)
      return { success: false, error: 'Review not found' }
    }

    // Only allow review owner or admin to delete
    if (review.userId !== user.id && !user.admin) {
      console.log('Unauthorized delete attempt:', { reviewUserId: review.userId, currentUserId: user.id, isAdmin: user.admin })
      return { success: false, error: 'You can only delete your own reviews' }
    }
    
    console.log('Deleting images for review:', reviewId)
    // Delete images first
    await db.image.deleteMany({
      where: { visitId: reviewId }
    })
    
    console.log('Deleting review:', reviewId)
    // Now delete the review
    await db.visit.delete({
      where: { id: reviewId }
    })
    
    console.log('Review deleted successfully:', reviewId)
    
    // Revalidate queries
    await Promise.all([
      revalidate('getReviews'),
      revalidate('getUserReviews'),
      revalidate('getRestaurantReviews')
    ])
    
    return { success: true }
  } catch (error) {
    console.error('Delete review error:', error)
    return { success: false, error: `Failed to delete review: ${error.message}` }
  }
}, 'deleteReview')

export default function UserReviewList(props: UserReviewListProps) {
  const deleteSubmission = useSubmission(deleteReviewAction)
  const [deletingReviewId, setDeletingReviewId] = createSignal<number | null>(null)
  
  const reviews = createAsyncStore(() => getUserReviews(props.userId), {
    initialValue: [],
    deferStream: true,
  })
  
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span class={i < rating ? "text-yellow-400" : "text-gray-300"}>★</span>
    ))
  }

  const handleEditReview = (review: any) => {
    // Navigate to edit page with review data
    window.location.href = `/edit-review/${review.id}?restaurantName=${encodeURIComponent(review.restaurant.name)}&latitude=${review.restaurant.latitude}&longitude=${review.restaurant.longitude}&address=${encodeURIComponent(review.restaurant.address || '')}&rating=${review.rating}&review=${encodeURIComponent(review.review || '')}&price=${encodeURIComponent(review.price || '')}`
  }

  const handleDeleteReview = async (reviewId: number, restaurantName: string) => {
    if (!confirm(`Are you sure you want to delete your review for ${restaurantName}? This action cannot be undone.`)) {
      return
    }

    setDeletingReviewId(reviewId)
    console.log('Starting delete process for review:', reviewId)
    
    try {
      const response = await fetch('/api/reviews/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId })
      })

      const result = await response.json()
      console.log('Delete result:', result)
      
      if (result.success) {
        alert('Review deleted successfully!')
        // Force reload the page to refresh the data
        window.location.reload()
      } else {
        alert(result.error || 'Failed to delete review')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete review. Please try again.')
    } finally {
      setDeletingReviewId(null)
    }
  }
  
  return (
    <div class="max-w-4xl mx-auto">
      <Show 
        when={reviews().length > 0} 
        fallback={
          <div class="text-center py-12 bg-white rounded-lg shadow">
            <div class="text-gray-500 mb-4">
              <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v10a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6" />
              </svg>
            </div>
            <p class="text-lg text-gray-500 mb-4">You haven't written any reviews yet.</p>
            <p class="text-gray-400 mb-6">Start sharing your dining experiences!</p>
            
            <div class="flex justify-center space-x-4">
              <a
                href="/map"
                class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg"
              >
                Find Restaurants
              </a>
              <a
                href="/new"
                class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg"
              >
                Write Your First Review
              </a>
            </div>
          </div>
        }
      >
        <div class="space-y-6">
          <For each={reviews()}>
            {(review) => (
              <div class="bg-white rounded-lg shadow-md p-6 border relative">
                {/* Action Buttons - Top Right */}
                <div class="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => handleEditReview(review)}
                    class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit review"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => handleDeleteReview(review.id, review.restaurant.name)}
                    disabled={deletingReviewId() === review.id}
                    class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete review"
                  >
                    <Show 
                      when={deletingReviewId() === review.id}
                      fallback={
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      }
                    >
                      <div class="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </Show>
                  </button>
                </div>

                <div class="flex justify-between items-start mb-4 pr-20">
                  <div>
                    <h3 class="text-xl font-semibold text-gray-900">
                      {review.restaurant.name}
                    </h3>
                    <p class="text-gray-600 text-sm">
                      {review.restaurant.address}
                    </p>
                  </div>
                  <div class="text-right">
                    <div class="flex items-center">
                      {renderStars(review.rating || 0)}
                      <span class="ml-2 text-gray-600">
                        ({review.rating}/5)
                      </span>
                    </div>
                    <Show when={review.price}>
                      <p class="text-sm text-gray-500 mt-1">
                        Price: {review.price}
                      </p>
                    </Show>
                  </div>
                </div>
                
                <Show when={review.review}>
                  <p class="text-gray-700 mb-4">
                    {review.review}
                  </p>
                </Show>
                
                <Show when={review.images && review.images.length > 0}>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    <For each={review.images}>
                      {(image) => (
                        <img 
                          src={image.url} 
                          alt="Food"
                          class="w-full h-24 object-cover rounded border"
                        />
                      )}
                    </For>
                  </div>
                </Show>
                
                <div class="flex justify-between items-center text-sm text-gray-500 border-t pt-4">
                  <div class="flex items-center space-x-4">
                    <Show when={review.companions && review.companions.length > 0}>
                      <span>
                        Visited with {review.companions.map(c => 
                          c.firstName && c.lastName 
                            ? `${c.firstName} ${c.lastName}` 
                            : c.email
                        ).join(', ')}
                      </span>
                    </Show>
                  </div>
                  <span>
                    {formatDate(review.visitedAt)}
                  </span>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}