// A tiny in-memory task list.
export function createTaskList() {
  const tasks = [];
  return {
    add(title) {
      tasks.push({ title, done: false });
    },
    complete(title) {
      const task = tasks.find((t) => t.title === title);
      if (!task) throw new Error(`no such task: ${title}`);
      task.done = true;
    },
    list() {
      return tasks.map((t) => ({ ...t }));
    },
  };
}
