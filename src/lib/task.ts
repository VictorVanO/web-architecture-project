import { action, query } from '@solidjs/router'
import { db } from './db'
import { z } from 'zod'

export const getTasks = query(async () => {
  'use server'
  return await db.task.findMany()
}, 'getTasks')

const taskSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
})

export const addTask = async (form: FormData) => {
  'use server'
  const task = taskSchema.parse({
    title: form.get('title'),
    completed: false,
  })
  return await db.task.create({ data: task })
}

export const addTaskAction = action(addTask)

export const removeTask = action(async (id: number) => {
  'use server'
  return await db.task.delete({ where: { id } })
})