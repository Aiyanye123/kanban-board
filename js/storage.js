import { state } from './state.js';
import { themeSwitcher } from './dom.js';

// --- 3. 本地存储 (LocalStorage) ---
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

export function saveTasksToStorage() {
    localStorage.setItem('kanban_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('kanban_labels', JSON.stringify(state.labels));
}

export function loadThemeFromStorage() {
    const storedTheme = localStorage.getItem('kanban_theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);
    themeSwitcher.textContent = storedTheme === 'light' ? '切换深色' : '切换浅色';
}

export function saveThemeToStorage(theme) {
    localStorage.setItem('kanban_theme', theme);
}

export function loadViewFromStorage() {
    return localStorage.getItem('kanban_view') || 'all';
}

export function saveViewToStorage(view) {
    localStorage.setItem('kanban_view', view);
}
