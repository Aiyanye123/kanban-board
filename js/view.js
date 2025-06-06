import { state } from './state.js';
import { kanbanBoard, calendarView, viewButtons } from './dom.js';
import { renderBoard } from './render.js';
import { renderCalendar } from './calendar.js';
import { saveViewToStorage, saveTasksToStorage } from './storage.js';

// --- 6. 视图切换 ---
export function setView(view, isInitialLoad = false) {
    if (state.isAnimating && !isInitialLoad) return;

    state.currentView = view;
    state.isAnimating = !isInitialLoad;

    const buttons = viewButtons.querySelectorAll('.nav__view-btn');
    buttons.forEach(btn => {
        const isPressed = btn.dataset.view === view;
        btn.setAttribute('aria-pressed', isPressed);
    });

    const columns = document.querySelectorAll('.kanban-column');

    if (view === 'calendar') {
        kanbanBoard.style.display = 'none';
        calendarView.style.display = 'flex';
        renderCalendar();
    } else {
        kanbanBoard.style.display = 'flex';
        calendarView.style.display = 'none';

        if (view === 'all') {
            kanbanBoard.classList.remove('zoomed-in');
            columns.forEach(col => col.classList.remove('is-hidden', 'is-zoomed'));
        } else {
            kanbanBoard.classList.add('zoomed-in');
            columns.forEach(col => {
                if (col.dataset.status === view) {
                    col.classList.add('is-zoomed');
                    col.classList.remove('is-hidden');
                } else {
                    col.classList.add('is-hidden');
                    col.classList.remove('is-zoomed');
                }
            });
        }
    }

    saveViewToStorage(view);

    if (state.isAnimating) {
        setTimeout(() => {
            state.isAnimating = false;
        }, 400);
    }
}

// --- 6. 拖拽交互 (Drag & Drop) ---
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
            task.updatedAt = new Date().toISOString();
            saveTasksToStorage();
            renderBoard();
        }
    }
}
