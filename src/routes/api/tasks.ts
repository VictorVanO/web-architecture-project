import type { APIEvent } from '@solidjs/start/server'
import { addTask, getTasks } from '~/lib/task'

export async function GET(event: APIEvent) {
  return await getTasks()
}

export async function POST(event: APIEvent) {
  return await addTask(await event.request.formData())
}