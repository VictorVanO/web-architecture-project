import { For, Show, createEffect, createSignal } from 'solid-js'
import { useLocation, useNavigate, A } from '@solidjs/router'
import { createAsyncStore } from '@solidjs/router'
import { getRestaurantReviews } from '~/lib/review'

export default function RestaurantReviews() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // State for restaurant info
  const [restaurantInfo, setRestaurantInfo] = createSignal<any>(null)
  
  // Get restaurant info from location state
  createEffect(() => {
    const locationState = location.state
    if (locationState && locationState.restaurantInfo) {
      setRestaurantInfo(locationState.restaurantInfo)
    } else {
      // If no restaurant info, redirect to map
      navigate('/map')
    }
  })
  
  // Get reviews for this restaurant
  const reviews = createAsyncStore(() => {
    const info = restaurantInfo()
    if (!info) return []
    
    return getRestaurantReviews(info.name, parseFloat(info.latitude), parseFloat(info.longitude))
  }, {
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
  
  const averageRating = () => {
    const reviewsList = reviews()
    if (reviewsList.length === 0) return 0
    
    const total = reviewsList.reduce((sum, review) => sum + (review.rating || 0), 0)
    return (total / reviewsList.length).toFixed(1)
  }
  
  return (
    <main class="container mx-auto p-4 max-w-6xl">
      {/* Back button */}
      <div class="mb-6">
        <A 
          href="/map" 
          class="text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Map
        </A>
      </div>
      
      <Show when={restaurantInfo()}>
        {(info) => (
          <>
            {/* Restaurant Header */}
            <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h1 class="text-4xl font-bold text-gray-900 mb-2">
                    {info().name}
                  </h1>
                  <p class="text-gray-600 text-lg mb-4">
                    {info().address}
                  </p>
                  
                  <Show when={reviews().length > 0}>
                    <div class="flex items-center space-x-4">
                      <div class="flex items-center">
                        {renderStars(Math.round(parseFloat(averageRating())))}
                        <span class="ml-2 text-xl font-semibold text-gray-700">
                          {averageRating()}/5
                        </span>
                      </div>
                      <span class="text-gray-500">
                        ({reviews().length} review{reviews().length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </Show>
                </div>
                
                <div class="text-right">
                  <p class="text-sm text-gray-500 mb-2">Coordinates</p>
                  <p class="text-sm text-gray-700">
                    {parseFloat(info().latitude).toFixed(6)}, {parseFloat(info().longitude).toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Reviews Section */}
            <div class="mb-6">
              <h2 class="text-2xl font-bold mb-6">Reviews</h2>
              
              <Show 
                when={reviews().length > 0} 
                fallback={
                  <div class="text-center py-12 bg-white rounded-lg shadow">
                    <div class="text-gray-500 mb-4">
                      <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v10a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6" />
                      </svg>
                    </div>
                    <p class="text-lg text-gray-500 mb-4">No reviews yet for this restaurant.</p>
                    <p class="text-gray-400">Be the first to share your experience!</p>
                    
                    <div class="mt-6">
                      <button
                        onClick={() => navigate('/new', { 
                          state: { 
                            placeInfo: {
                              name: info().name,
                              latitude: info().latitude,
                              longitude: info().longitude,
                              address: info().address,
                            }
                          } 
                        })}
                        class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg"
                      >
                        Add the First Review
                      </button>
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
            
            {/* Add Review Button */}
            <Show when={reviews().length > 0}>
              <div class="text-center">
                <button
                  onClick={() => navigate('/new', { 
                    state: { 
                      placeInfo: {
                        name: info().name,
                        latitude: info().latitude,
                        longitude: info().longitude,
                        address: info().address,
                      }
                    } 
                  })}
                  class="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Add Your Review
                </button>
              </div>
            </Show>
          </>
        )}
      </Show>
    </main>
  )
}