import state from './state.js';
import { saveTasksToStorage } from './storage.js';
import { renderBoard } from './ui.js';

export function handleDragStart(e) {
    state.draggedTaskId = e.target.dataset.id;
    e.dataTransfer.setData('text/plain', state.draggedTaskId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

export function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    state.draggedTaskId = null;
}

export function handleDragOver(e) {
    e.preventDefault();
    const column = e.target.closest('.kanban-column');
    if (column) {
        column.classList.add('drag-over');
    }
}

export function handleDragLeave(e) {
    const column = e.target.closest('.kanban-column');
    if (column) {
        column.classList.remove('drag-over');
    }
}

export function handleDrop(e) {
    e.preventDefault();
    const column = e.target.closest('.kanban-column');
    if (column) {
        column.classList.remove('drag-over');
        const newStatus = column.dataset.status;
        const taskId = e.dataTransfer.getData('text/plain');
        
        const task = state.tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            const now = new Date().toISOString();
            task.updatedAt = now;
            if (newStatus === 'done' && !task.completedAt) {
                task.completedAt = now;
            }
            saveTasksToStorage();
            renderBoard();
        }
    }
}
