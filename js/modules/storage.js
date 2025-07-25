import state from './state.js';

/**
 * @description 从 localStorage 加载任务和标签
 */
export function loadTasksFromStorage() {
    const storedTasks = localStorage.getItem('kanban_tasks');
    if (storedTasks) {
        state.tasks = JSON.parse(storedTasks);
    }
    const storedLabels = localStorage.getItem('kanban_labels');
    if (storedLabels) {
        state.labels = JSON.parse(storedLabels);
    }
}

/**
 * @description 保存任务和标签到 localStorage
 */
export function saveTasksToStorage() {
    localStorage.setItem('kanban_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('kanban_labels', JSON.stringify(state.labels));
}

/**
 * @description 从 localStorage 加载主题
 */
export function loadThemeFromStorage() {
    const storedTheme = localStorage.getItem('kanban_theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);
    return storedTheme;
}

/**
 * @description 保存主题到 localStorage
 * @param {string} theme - 'light' 或 'dark'
 */
export function saveThemeToStorage(theme) {
    localStorage.setItem('kanban_theme', theme);
}

/**
 * @description 从 localStorage 加载视图状态
 */
export function loadViewFromStorage() {
    return localStorage.getItem('kanban_view') || 'all';
}

/**
 * @description 保存当前视图状态到 localStorage
 * @param {string} view - 'all', 'todo', 'in-progress', or 'done'
 */
export function saveViewToStorage(view) {
    localStorage.setItem('kanban_view', view);
}
