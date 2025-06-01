import type { APIEvent } from '@solidjs/start/server'

export async function POST(event: APIEvent) {
  // For mobile logout, we just return success since we don't maintain server-side sessions for mobile
  // The mobile app will clear its local storage
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Logged out successfully'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}