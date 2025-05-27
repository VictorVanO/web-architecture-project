import { createSignal, Show, createEffect, For, onCleanup } from 'solid-js'
import { useLocation, useNavigate, type RouteDefinition } from '@solidjs/router'
import { createAsyncStore, useSubmission } from '@solidjs/router'
import { requireAuth } from '~/lib/auth/middleware'
import { addReviewAction, getFriends, getAllUsers } from '~/lib/review'
import Button from '~/components/Button'

export const route = {
  preload: async () => {
    await requireAuth()
  },
} satisfies RouteDefinition

export default function New() {
  const location = useLocation()
  const navigate = useNavigate()
  const reviewSubmission = useSubmission(addReviewAction)
  
  // Get the current user's friends for companion selection
  const friends = createAsyncStore(() => getFriends(), {
    initialValue: [],
  })
  
  // For admins, get all users
  const allUsers = createAsyncStore(() => getAllUsers(), {
    initialValue: [],
  })
  
  // Form state
  const [restaurantName, setRestaurantName] = createSignal('')
  const [latitude, setLatitude] = createSignal(0)
  const [longitude, setLongitude] = createSignal(0)
  const [address, setAddress] = createSignal('')
  const [rating, setRating] = createSignal(0)
  const [review, setReview] = createSignal('')
  const [price, setPrice] = createSignal('')
  const [selectedCompanions, setSelectedCompanions] = createSignal<number[]>([])
  const [error, setError] = createSignal('')
  const [images, setImages] = createSignal<string[]>([])
  
  // For image preview
  const [imagePreviewUrls, setImagePreviewUrls] = createSignal<string[]>([])
  
  // Get restaurant info from the location state if coming from map
  createEffect(() => {
    const locationState = location.state
    if (locationState && locationState.placeInfo) {
      setRestaurantName(locationState.placeInfo.name || '')
      setLatitude(locationState.placeInfo.latitude || 0)
      setLongitude(locationState.placeInfo.longitude || 0)
      setAddress(locationState.placeInfo.address || '')
    }
  })
  
  // Handle successful submission
  createEffect(() => {
    if (reviewSubmission.result && !reviewSubmission.pending) {
      if (reviewSubmission.result.success) {
        // Navigate to home after successful submission
        navigate('/', { replace: true })
      }
    }
  })
  
  // Handle companion selection toggle
  const toggleCompanion = (id: number) => {
    setSelectedCompanions(prev => {
      if (prev.includes(id)) {
        return prev.filter(companionId => companionId !== id)
      } else {
        return [...prev, id]
      }
    })
  }
  
  // Handle image upload
  const handleImageUpload = (e: Event) => {
    const input = e.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return
    
    // Create preview URLs for the images
    const fileArray = Array.from(input.files)
    const newPreviews = fileArray.map(file => URL.createObjectURL(file))
    
    // Store image URLs and update previews
    setImages(prev => [...prev, ...fileArray.map(file => {
      // In a real application, you would upload the file to a server
      // and get a URL back. For now, we'll use a placeholder URL
      return `/uploads/${file.name}`
    })])
    setImagePreviewUrls(prev => [...prev, ...newPreviews])
  }
  
  // Clean up object URLs on component cleanup
  onCleanup(() => {
    imagePreviewUrls().forEach(url => URL.revokeObjectURL(url))
  })
  
  // Remove an image from the preview
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    
    // Also revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviewUrls()[index])
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index))
  }
  
  // Decide which user list to show (friends or all users for admins)
  const usersToDisplay = () => {
    if (allUsers().length > 0) {
      // User is admin, show all users
      return allUsers()
    }
    return friends()
  }
  
  // Price options
  const priceOptions = [
    { value: '€', label: '€ (Inexpensive)' },
    { value: '€€', label: '€€ (Moderate)' },
    { value: '€€€', label: '€€€ (Expensive)' },
    { value: '€€€€', label: '€€€€ (Very Expensive)' },
  ]
  
  return (
    <main class="container mx-auto p-4 max-w-3xl">
      <h1 class="text-4xl font-bold text-center my-8">Add a Restaurant Review</h1>
      
      <form 
        action={addReviewAction} 
        method="post"
        class="bg-white shadow-lg rounded-lg p-6"
        onSubmit={(e) => {
          if (rating() === 0) {
            e.preventDefault()
            setError('Please select a rating')
            return
          }
          setError('')
        }}
      >
        {/* Restaurant Info Section */}
        <div class="mb-8">
          <h2 class="text-xl font-semibold mb-4 pb-2 border-b">Restaurant Information</h2>
          
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="restaurantName">
              Restaurant Name*
            </label>
            <input 
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
              id="restaurantName" 
              type="text" 
              name="restaurantName" 
              value={restaurantName()}
              onInput={(e) => setRestaurantName(e.currentTarget.value)}
              required
            />
          </div>
          
          <div class="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2" for="latitude">
                Latitude*
              </label>
              <input 
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                id="latitude" 
                type="number" 
                name="latitude" 
                step="any"
                value={latitude()}
                onInput={(e) => setLatitude(parseFloat(e.currentTarget.value))}
                required
              />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2" for="longitude">
                Longitude*
              </label>
              <input 
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                id="longitude" 
                type="number" 
                name="longitude" 
                step="any"
                value={longitude()}
                onInput={(e) => setLongitude(parseFloat(e.currentTarget.value))}
                required
              />
            </div>
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="address">
              Address
            </label>
            <input 
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
              id="address" 
              type="text" 
              name="address" 
              value={address()}
              onInput={(e) => setAddress(e.currentTarget.value)}
            />
          </div>
        </div>

        {/* Review Section */}
        <div class="mb-8">
          <h2 class="text-xl font-semibold mb-4 pb-2 border-b">Your Review</h2>
          
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Rating*
            </label>
            <div class="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  type="button"
                  onClick={() => setRating(star)}
                  class="text-3xl focus:outline-none"
                >
                  <span class={star <= rating() ? "text-yellow-400" : "text-gray-300"}>★</span>
                </button>
              ))}
            </div>
            <input type="hidden" name="rating" value={rating()} />
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="price">
              Price Range
            </label>
            <select
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="price"
              name="price"
              value={price()}
              onInput={(e) => setPrice(e.currentTarget.value)}
            >
              <option value="">-- Select price range --</option>
              {priceOptions.map((option) => (
                <option value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="review">
              Your Review
            </label>
            <textarea 
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32" 
              id="review" 
              name="review" 
              value={review()}
              onInput={(e) => setReview(e.currentTarget.value)}
              placeholder="Share your experience at this restaurant..."
            />
          </div>
          
          {/* Image Upload Section */}
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Food Images
            </label>
            <input 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handleImageUpload}
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <p class="text-xs text-gray-500 mt-1">You can upload multiple images of your meal</p>
            
            {/* Image Previews */}
            <Show when={imagePreviewUrls().length > 0}>
              <div class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <For each={imagePreviewUrls()}>
                  {(url, index) => (
                    <div class="relative">
                      <img 
                        src={url} 
                        alt={`Food image ${index() + 1}`}
                        class="w-full h-32 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index())}
                        class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </Show>
            
            {/* Hidden inputs for image URLs */}
            <For each={images()}>
              {(imageUrl) => (
                <input type="hidden" name="imageUrls" value={imageUrl} />
              )}
            </For>
          </div>
        </div>
        
        {/* Companions Section */}
        <Show when={usersToDisplay().length > 0}>
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4 pb-2 border-b">Who Did You Go With?</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <For each={usersToDisplay()}>
                {(user) => (
                  <div class="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      id={`companion-${user.id}`}
                      name="companions" 
                      value={user.id}
                      checked={selectedCompanions().includes(user.id)}
                      onChange={() => toggleCompanion(user.id)}
                      class="h-4 w-4 text-green-600"
                    />
                    <label for={`companion-${user.id}`} class="flex-1 cursor-pointer">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.email}
                    </label>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
        
        {/* Error message */}
        <Show when={error() || (reviewSubmission.result && reviewSubmission.result.success)}>
          <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error() || reviewSubmission.result?.error || 'An error occurred while submitting your review'}</p>
          </div>
        </Show>
        
        {/* Submission buttons */}
        <div class="flex justify-between">
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
            class="px-6"
          >
            Cancel
          </Button>
          
          <Button 
            type="submit"
            disabled={reviewSubmission.pending}
            class="px-6"
          >
            {reviewSubmission.pending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </main>
  )
}