import { createSignal, Show, createEffect, For, onCleanup } from 'solid-js'
import { useParams, useSearchParams, useNavigate, type RouteDefinition } from '@solidjs/router'
import { createAsyncStore, useSubmission, action, revalidate } from '@solidjs/router'
import { requireAuth } from '~/lib/auth/middleware'
import { getReview } from '~/lib/review'
import { db } from '~/lib/db'
import { z } from 'zod'
import Button from '~/components/Button'

export const route = {
  preload: async () => {
    await requireAuth()
  },
} satisfies RouteDefinition

// Schema for validating review update data
const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().optional(),
  price: z.string().optional(),
})

// Update review action
const updateReviewAction = action(async (form: FormData) => {
  'use server'
  
  try {
    const user = await requireAuth()
    const reviewId = parseInt(form.get('reviewId') as string)
    
    if (!reviewId) {
      return { success: false, error: 'Invalid review ID' }
    }

    // Check if review exists and user owns it
    const existingReview = await db.visit.findUnique({
      where: { id: reviewId },
      include: { user: true }
    })

    if (!existingReview) {
      return { success: false, error: 'Review not found' }
    }

    if (existingReview.userId !== user.id && !user.admin) {
      return { success: false, error: 'Unauthorized to edit this review' }
    }

    // Validate the review data
    const reviewData = updateReviewSchema.parse({
      rating: form.get('rating'),
      review: form.get('review') || '',
      price: form.get('price') || '',
    })

    // Update the review
    await db.visit.update({
      where: { id: reviewId },
      data: {
        rating: reviewData.rating,
        review: reviewData.review,
        price: reviewData.price,
      }
    })

    // Handle image updates if any
    const imageUrls = form.getAll('imageUrls')
    if (imageUrls.length > 0) {
      // Delete existing images
      await db.image.deleteMany({
        where: { visitId: reviewId }
      })

      // Add new images (filter out empty strings)
      const validImageUrls = imageUrls.filter(url => url && url.toString().trim())
      if (validImageUrls.length > 0) {
        const imageData = validImageUrls.map(url => ({
          url: url.toString(),
          visitId: reviewId
        }))
        
        await db.image.createMany({
          data: imageData
        })
      }
    }

    // Revalidate relevant queries
    await Promise.all([
      revalidate('getReviews'),
      revalidate('getUserReviews'),
      revalidate('getRestaurantReviews'),
      revalidate('getReview')
    ])

    return { success: true }
  } catch (error) {
    console.error('Update review error:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    
    return { success: false, error: 'Failed to update review' }
  }
}, 'updateReview')

export default function EditReview() {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const updateSubmission = useSubmission(updateReviewAction)
  
  // Get review ID from URL params
  const reviewId = () => parseInt(params.id || '0')
  
  // Load review data
  const review = createAsyncStore(() => getReview(reviewId()), {
    initialValue: null,
    deferStream: true,
  })
  
  // Form state - initialize with URL params or review data
  const [rating, setRating] = createSignal(0)
  const [reviewText, setReviewText] = createSignal('')
  const [price, setPrice] = createSignal('')
  const [images, setImages] = createSignal<string[]>([])
  const [error, setError] = createSignal('')
  
  // For image preview - using base64 data URLs instead of object URLs
  const [imagePreviewUrls, setImagePreviewUrls] = createSignal<string[]>([])
  
  // Initialize form data from URL params or review data
  createEffect(() => {
    // First try to load from URL params (fallback)
    if (searchParams.rating) {
      setRating(parseInt(searchParams.rating) || 0)
    }
    if (searchParams.review) {
      setReviewText(decodeURIComponent(searchParams.review))
    }
    if (searchParams.price) {
      setPrice(decodeURIComponent(searchParams.price))
    }
    
    // Then override with actual review data when loaded
    const reviewData = review()
    if (reviewData) {
      setRating(reviewData.rating || 0)
      setReviewText(reviewData.review || '')
      setPrice(reviewData.price || '')
      
      if (reviewData.images && reviewData.images.length > 0) {
        const imageUrls = reviewData.images.map(img => img.url)
        setImages(imageUrls)
        setImagePreviewUrls(imageUrls)
      }
    }
  })
  
  // Handle successful submission
  createEffect(() => {
    if (updateSubmission.result && !updateSubmission.pending) {
      if (updateSubmission.result.success) {
        navigate('/profile', { replace: true })
      }
    }
  })
  
  // Convert file to base64 data URL
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  // Handle image upload - convert to base64 data URLs for storage
  const handleImageUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return
    
    const fileArray = Array.from(input.files)
    
    try {
      // Convert all files to base64 data URLs
      const dataUrls = await Promise.all(fileArray.map(file => fileToDataURL(file)))
      
      // Store the data URLs for both preview and form submission
      setImages(prev => [...prev, ...dataUrls])
      setImagePreviewUrls(prev => [...prev, ...dataUrls])
    } catch (error) {
      console.error('Error processing images:', error)
      setError('Failed to process images. Please try again.')
    }
  }
  
  // Remove an image from the preview
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index))
  }
  
  // Price options
  const priceOptions = [
    { value: '€', label: '€ (Inexpensive)' },
    { value: '€€', label: '€€ (Moderate)' },
    { value: '€€€', label: '€€€ (Expensive)' },
    { value: '€€€€', label: '€€€€ (Very Expensive)' },
  ]

  // Restaurant info from URL params or review data
  const restaurantInfo = () => {
    const reviewData = review()
    if (reviewData) {
      return {
        name: reviewData.restaurant.name,
        address: reviewData.restaurant.address
      }
    }
    
    // Fallback to URL params
    return {
      name: searchParams.restaurantName ? decodeURIComponent(searchParams.restaurantName) : 'Restaurant',
      address: searchParams.address ? decodeURIComponent(searchParams.address) : ''
    }
  }
  
  return (
    <main class="container mx-auto p-4 max-w-3xl">
      <div class="flex items-center mb-8">
        <button
          onClick={() => navigate('/profile')}
          class="mr-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Profile
        </button>
        <h1 class="text-4xl font-bold">Edit Review</h1>
      </div>
      
      <Show 
        when={review() || searchParams.restaurantName}
        fallback={
          <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p class="mt-4 text-gray-500">Loading review...</p>
          </div>
        }
      >
        <form 
          action={updateReviewAction} 
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
          {/* Hidden review ID */}
          <input type="hidden" name="reviewId" value={reviewId()} />
          
          {/* Restaurant Info Display */}
          <div class="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 class="text-xl font-semibold mb-2">Restaurant</h2>
            <h3 class="text-lg font-medium text-gray-900">{restaurantInfo().name}</h3>
            <Show when={restaurantInfo().address}>
              <p class="text-gray-600">{restaurantInfo().address}</p>
            </Show>
          </div>

          {/* Review Section */}
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4 pb-2 border-b">Update Your Review</h2>
            
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
                value={reviewText()}
                onInput={(e) => setReviewText(e.currentTarget.value)}
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
          
          {/* Error message */}
          <Show when={error() || (updateSubmission.result && !updateSubmission.result.success)}>
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p>{error() || updateSubmission.result?.error || 'An error occurred while updating your review'}</p>
            </div>
          </Show>
          
          {/* Submission buttons */}
          <div class="flex justify-between">
            <Button 
              variant="outlined" 
              onClick={() => navigate('/profile')}
              class="px-6"
            >
              Cancel
            </Button>
            
            <Button 
              type="submit"
              disabled={updateSubmission.pending}
              class="px-6"
            >
              {updateSubmission.pending ? 'Updating...' : 'Update Review'}
            </Button>
          </div>
        </form>
      </Show>
    </main>
  )
}