import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { createAsyncStore } from '@solidjs/router';
import Counter from "~/components/Counter";
import ReviewList from "~/components/ReviewList";
import { getUser } from '~/lib/auth/user';

export default function Home() {
  const user = createAsyncStore(() => getUser(), {
    initialValue: null,
    deferStream: true, // This helps with SSR/hydration issues
  });

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

      <Show when={user()}>
        <ReviewList />
      </Show>
      
      <Show when={!user()}>
        <div class="text-center">
          <Counter />
          <p class="mt-8">
            Visit{" "}
            <a href="https://solidjs.com" target="_blank" class="text-sky-600 hover:underline">
              solidjs.com
            </a>{" "}
            to learn how to build Solid apps.
          </p>
          <p class="my-4">
            <span>Home</span>
            {" - "}
            <A href="/about" class="text-sky-600 hover:underline">
              About Page
            </A>
          </p>
        </div>
      </Show>
    </main>
  );
}