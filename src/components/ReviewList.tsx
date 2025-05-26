import { For, Show } from 'solid-js'
import { createAsyncStore } from '@solidjs/router'
import { getReviews } from '~/lib/review'

export default function ReviewList() {
  const reviews = createAsyncStore(() => getReviews(), {
    initialValue: [],
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
      <h2 class="text-2xl font-bold mb-6">Recent Reviews</h2>
      
      <Show 
        when={reviews().length > 0} 
        fallback={
          <div class="text-center py-8 text-gray-500">
            <p>No reviews yet. Be the first to add one!</p>
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
                    <span>
                      By {review.user.firstName && review.user.lastName 
                        ? `${review.user.firstName} ${review.user.lastName}` 
                        : review.user.email}
                    </span>
                    <Show when={review.companions && review.companions.length > 0}>
                      <span>
                        with {review.companions.map(c => 
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