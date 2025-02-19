import {
  createAsyncStore,
  useSubmissions,
  type RouteDefinition,
} from "@solidjs/router";
import { For, Show } from "solid-js";
import { addTaskAction, getTasks, removeTask } from "~/lib/task";

export const route = {
  preload() {
    getTasks();
  },
} satisfies RouteDefinition;

export default function Todo() {
  const tasks = createAsyncStore(() => getTasks(), {
    initialValue: [],
  });
  const addingTask = useSubmissions(addTaskAction);
  const removingTask = useSubmissions(removeTask);
  const filtered = () =>
    tasks().filter((task) => {
      return !removingTask.some((d) => d.input[0] === task.id);
    });
  return (
    <>
      <form action={addTaskAction} method="post">
        <input name="title" />
      </form>
      <ul>
        <For each={filtered()}>
          {(task) => (
            <li>
              {task.title}
              <form method="post">
                <button formAction={removeTask.with(task.id)}>Delete</button>
              </form>
            </li>
          )}
        </For>
        <For each={addingTask}>
          {(sub) => (
            <Show when={sub.pending}>
              <li>{String(sub.input[0].get("title"))} (pending)</li>
            </Show>
          )}
        </For>
      </ul>
    </>
  );
}