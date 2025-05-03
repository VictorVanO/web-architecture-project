import { useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import { createAsyncStore } from '@solidjs/router';
import { getUser, logoutAction } from '~/lib/auth/user';

export default function Nav() {
  const location = useLocation();
  const active = (path: string) =>
    path == location.pathname ? "border-dark-500" : "border-transparent hover:border-gray-400";
  
  const user = createAsyncStore(() => getUser(), {
    initialValue: null,
  });
  
  return (
    <nav class="bg-white text-gray-900 border-b border-gray-200 shadow-sm">
      <div class="container flex items-center justify-between p-3 text-black-900">
        <ul class="flex items-center">
          <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
            <a class="hover:text-gray-500" href="/">EatReal.</a>
          </li>
          <li class={`border-b-2 ${active("/about")} mx-1.5 sm:mx-6`}>
            <a class="hover:text-gray-500" href="/about">About</a>
          </li>
          <li class={`border-b-2 ${active("/tasks")} mx-1.5 sm:mx-6`}>
            <a class="hover:text-gray-500" href="/tasks">Tasks</a>
          </li>
          <li class={`border-b-2 ${active("/map")} mx-1.5 sm:mx-6`}>
            <a class="hover:text-gray-500" href="/map">Map</a>
          </li>
          <li class={`border-b-2 ${active("/new")} mx-1.5 sm:mx-6`}>
            <a class="hover:text-gray-500" href="/new">New</a>
          </li>
        </ul>
        
        <div class="flex items-center">
          <Show
            when={user()}
            fallback={
              <ul class="flex items-center">
                <li class={`border-b-2 ${active("/login")} mx-1.5 sm:mx-6`}>
                  <a href="/login">Login</a>
                </li>
                <li class={`border-b-2 ${active("/register")} mx-1.5 sm:mx-6`}>
                  <a href="/register">Register</a>
                </li>
              </ul>
            }
          >
            {(userData) => (
              <div class="flex items-center gap-4">
                <span class="hidden sm:inline">
                  {userData().firstName || userData().email}
                </span>
                <form action={logoutAction} method="post">
                  <button 
                    type="submit"
                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Logout
                  </button>
                </form>
              </div>
            )}
          </Show>
        </div>
      </div>
    </nav>
  );
}