import { For, Show } from 'solid-js'
import { createAsyncStore } from '@solidjs/router'
import { getUserReviews } from '~/lib/review'

interface UserReviewListProps {
  userId?: number
}

export default function UserReviewList(props: UserReviewListProps) {
  const reviews = createAsyncStore(() => getUserReviews(props.userId), {
    initialValue: [],
    deferStream: true, // This helps with SSR/hydration issues
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
              <div class="bg-white rounded-lg shadow-md p-6 border">
                <div class="flex justify-between items-start mb-4">
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