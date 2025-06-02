// src/routes/index.tsx
import { A } from "@solidjs/router";
import { Show, createResource } from "solid-js";
import { createAsyncStore } from '@solidjs/router';
import Counter from "~/components/Counter";
import { getUser } from '~/lib/auth/user';

// Create a function to fetch recent reviews without authentication
const getRecentReviews = async () => {
  try {
    const response = await fetch('/api/reviews/recent');
    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent reviews:', error);
    return [];
  }
};

export default function Home() {
  const user = createAsyncStore(() => getUser(), {
    initialValue: null,
    deferStream: true,
  });

  // Fetch recent reviews without authentication requirement
  const [recentReviews] = createResource(getRecentReviews);

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span class={i < rating ? "text-yellow-400" : "text-gray-300"}>★</span>
    ));
  };

  return (
    <main class="mx-auto text-gray-700 p-4">
      <div class="text-center mb-12">
        <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">EatReal.</h1>
        <p class="text-xl mb-8">Share your restaurant experiences with friends</p>
        
        <Show when={user()}>
          <div class="flex justify-center space-x-4 mb-8">
            <A 
              href="/map" 
              class="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg"
            >
              Find Restaurants
            </A>
            <A 
              href="/new" 
              class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg"
            >
              Add Review
            </A>
          </div>
        </Show>
        
        <Show when={!user()}>
          <div class="mb-8">
            <p class="mb-4">Join EatReal to start sharing your dining experiences!</p>
            <div class="flex justify-center space-x-4">
              <A 
                href="/login" 
                class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Login
              </A>
              <A 
                href="/register" 
                class="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Sign Up
              </A>
            </div>
          </div>
        </Show>
      </div>

      {/* Recent Reviews Section - Available to everyone */}
      <div class="max-w-4xl mx-auto mb-12">
        <h2 class="text-2xl font-bold mb-6 text-center">Recent Reviews</h2>
        
        <Show 
          when={recentReviews() && recentReviews().length > 0} 
          fallback={
            <Show when={recentReviews.loading}>
              <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p class="mt-4 text-gray-500">Loading recent reviews...</p>
              </div>
            </Show>
          }
        >
          <div class="space-y-6">
            {recentReviews()?.slice(0, 10).map((review: any) => (
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
                    {review.images.slice(0, 4).map((image: any) => (
                      <img 
                        src={image.url} 
                        alt="Food"
                        class="w-full h-24 object-cover rounded border"
                      />
                    ))}
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
                        with {review.companions.map((c: any) => 
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
            ))}
          </div>
        </Show>

        <Show when={recentReviews() && recentReviews().length === 0 && !recentReviews.loading}>
          <div class="text-center py-12 bg-white rounded-lg shadow">
            <div class="text-gray-500 mb-4">
              <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v10a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6" />
              </svg>
            </div>
            <p class="text-lg text-gray-500 mb-4">No reviews yet.</p>
            <p class="text-gray-400 mb-6">Be the first to share your dining experience!</p>
            
            <div class="flex justify-center space-x-4">
              <A
                href="/map"
                class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg"
              >
                Find Restaurants
              </A>
              <Show when={user()}>
                <A
                  href="/new"
                  class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg"
                >
                  Write Your First Review
                </A>
              </Show>
              <Show when={!user()}>
                <A
                  href="/login"
                  class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg"
                >
                  Sign Up to Review
                </A>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </main>
  );
}