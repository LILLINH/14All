const LEVELS = ['low', 'medium', 'high'];

export function rank(level) {
  return LEVELS.indexOf(level);
}

export function sortByPriority(tasks) {
  return tasks.sort((a, b) => rank(b.level) - rank(a.level));
}

export function topTask(tasks) {
  return sortByPriority(tasks)[0];
}

export function summarize(tasks) {
  return `${tasks.length} tasks, first: ${tasks[0].title}`;
}
