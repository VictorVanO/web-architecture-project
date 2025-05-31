import { Show, createEffect } from 'solid-js'
import { redirect, type RouteDefinition } from "@solidjs/router"
import { createAsyncStore } from '@solidjs/router'
import { getUser } from '~/lib/auth/user'
import { getUserReviews } from '~/lib/review'
import UserReviewList from '~/components/UserReviewList'

export const route = {
  preload() {
    getUser()
  },
} satisfies RouteDefinition

export default function Profile() {
  const user = createAsyncStore(() => getUser(), {
    initialValue: null,
    deferStream: true,
  })
  
  // Get user's reviews for statistics
  const userReviews = createAsyncStore(() => {
    const currentUser = user()
    if (!currentUser) return []
    return getUserReviews(currentUser.id)
  }, {
    initialValue: [],
    deferStream: true,
  })
  
  // Redirect to login if not authenticated
  createEffect(() => {
    if (user() === null && !user.loading) {
      throw redirect('/login')
    }
  })
  
  // Calculate user statistics
  const userStats = () => {
    const reviews = userReviews()
    if (reviews.length === 0) return { totalReviews: 0, averageRating: 0, uniqueRestaurants: 0 }
    
    const totalReviews = reviews.length
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
    const averageRating = totalRating / totalReviews
    const uniqueRestaurants = new Set(reviews.map(review => review.restaurant.id)).size
    
    return {
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      uniqueRestaurants
    }
  }
  
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span class={i < rating ? "text-yellow-400" : "text-gray-300"}>★</span>
    ))
  }
  
  return (
    <main class="container mx-auto p-4 max-w-6xl">
      <Show when={user()}>
        {(userData) => (
          <>
            {/* Profile Header */}
            <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div class="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                {/* Avatar */}
                <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {userData().email?.[0]?.toUpperCase() || '?'}
                </div>
                
                {/* User Info */}
                <div class="flex-1">
                  <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    {userData().firstName && userData().lastName ? 
                      `${userData().firstName} ${userData().lastName}` : 
                      'Anonymous User'}
                  </h1>
                  <p class="text-gray-600 text-lg mb-2">{userData().email}</p>
                  <p class="text-gray-500 text-sm">
                    Member since {formatDate(userData().createdAt)}
                  </p>
                  <Show when={userData().admin}>
                    <span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mt-2">
                      Administrator
                    </span>
                  </Show>
                </div>
                
                {/* Quick Actions */}
                <div class="flex flex-col space-y-2">
                  <a
                    href="/new"
                    class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-center"
                  >
                    Write Review
                  </a>
                  <a
                    href="/map"
                    class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-center"
                  >
                    Find Restaurants
                  </a>
                </div>
              </div>
            </div>
            
            {/* Statistics Cards */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="bg-white rounded-lg shadow p-6 text-center">
                <div class="text-3xl font-bold text-blue-600 mb-2">
                  {userStats().totalReviews}
                </div>
                <div class="text-gray-600">
                  Total Review{userStats().totalReviews !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div class="bg-white rounded-lg shadow p-6 text-center">
                <div class="flex items-center justify-center mb-2">
                  {renderStars(Math.round(userStats().averageRating))}
                </div>
                <div class="text-2xl font-bold text-gray-600 mb-1">
                  {userStats().averageRating}/5
                </div>
                <div class="text-gray-600">Average Rating</div>
              </div>
              
              <div class="bg-white rounded-lg shadow p-6 text-center">
                <div class="text-3xl font-bold text-green-600 mb-2">
                  {userStats().uniqueRestaurants}
                </div>
                <div class="text-gray-600">
                  Restaurant{userStats().uniqueRestaurants !== 1 ? 's' : ''} Visited
                </div>
              </div>
            </div>
            
            {/* Reviews Section */}
            <div class="mb-6">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">My Reviews</h2>
                <Show when={userReviews().length > 0}>
                  <span class="text-gray-500">
                    {userReviews().length} review{userReviews().length !== 1 ? 's' : ''}
                  </span>
                </Show>
              </div>
              
              <UserReviewList userId={userData().id} />
            </div>
          </>
        )}
      </Show>
    </main>
  )
}