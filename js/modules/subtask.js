import state from './state.js';
import { saveTasksToStorage } from './storage.js';
import { renderBoard } from './ui.js';

/**
 * @description Creates a DOM element for a single subtask.
 * @param {object} subtask - The subtask object.
 * @returns {HTMLElement} The created subtask list item element.
 */
function createSubtaskElement(subtask) {
    const item = document.createElement('li');
    item.className = 'subtask-item';
    item.dataset.id = subtask.id;
    item.dataset.status = subtask.status;
    item.setAttribute('draggable', 'true');

    item.innerHTML = `
        <div class="subtask-item__status" role="checkbox" aria-checked="${subtask.status === 'done'}" tabindex="0"></div>
        <span class="subtask-item__title" contenteditable="true">${subtask.title}</span>
        <div class="subtask-item__actions">
            <button class="subtask-item__delete-btn" aria-label="删除子任务">&times;</button>
        </div>
    `;
    return item;
}

/**
 * @description Renders the subtasks for a given task card.
 * @param {HTMLElement} cardElement - The parent task card element.
 */
export function renderSubtasks(cardElement) {
    const taskId = cardElement.dataset.id;
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const subtaskListEl = cardElement.querySelector('.subtask-list');
    subtaskListEl.innerHTML = ''; // Clear existing subtasks

    task.subtasks.forEach(subtask => {
        const subtaskEl = createSubtaskElement(subtask);
        subtaskListEl.appendChild(subtaskEl);
    });
}

/**
 * @description Toggles the visibility of the subtask panel.
 * @param {HTMLElement} cardElement - The parent task card element.
 */
export function toggleSubtaskPanel(cardElement) {
    const panel = cardElement.querySelector('.subtask-panel');
    const isVisible = panel.classList.contains('show');
    
    if (!state.multiPanelMode && !isVisible) {
        document.querySelectorAll('.subtask-panel.show').forEach(p => {
            if (p !== panel) {
                p.classList.remove('show');
                p.querySelector('.subtask-list').innerHTML = '';
            }
        });
    }

    if (isVisible) {
        panel.classList.remove('show');
        panel.querySelector('.subtask-list').innerHTML = '';
    } else {
        panel.classList.add('show');
        renderSubtasks(cardElement);
        setTimeout(() => panel.querySelector('.add-subtask-input').focus(), 0);
    }
}

/**
 * @description Adds a new subtask to a parent task.
 * @param {string} taskId - The ID of the parent task.
 * @param {string} title - The title of the new subtask.
 */
export function addSubtask(taskId, title) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task && title.trim()) {
        const newSubtask = {
            id: `subtask-${Date.now()}`,
            title: title.trim(),
            status: 'todo'
        };
        if (!task.subtasks) {
            task.subtasks = [];
        }
        task.subtasks.push(newSubtask);
        saveTasksToStorage();
        renderBoard(); 
        
        setTimeout(() => {
            const cardElement = document.querySelector(`.task-card[data-id="${taskId}"]`);
            if (cardElement) {
                const panel = cardElement.querySelector('.subtask-panel');
                if (!panel.classList.contains('show')) {
                    toggleSubtaskPanel(cardElement);
                } else {
                    renderSubtasks(cardElement);
                }
                cardElement.querySelector('.add-subtask-input').focus();
            }
        }, 0);
    }
}

/**
 * @description Updates a subtask (title or status).
 * @param {string} taskId - The ID of the parent task.
 * @param {string} subtaskId - The ID of the subtask to update.
 * @param {object} updates - An object with properties to update (e.g., { title, status }).
 */
export function updateSubtask(taskId, subtaskId, updates) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (subtask) {
            Object.assign(subtask, updates);
            saveTasksToStorage();
            renderBoard();
            
            setTimeout(() => {
                const cardElement = document.querySelector(`.task-card[data-id="${taskId}"]`);
                if (cardElement) {
                    const panel = cardElement.querySelector('.subtask-panel');
                    if (!panel.classList.contains('show')) {
                       toggleSubtaskPanel(cardElement);
                    } else {
                       renderSubtasks(cardElement);
                    }
                }
            }, 0);
        }
    }
}

/**
 * @description Deletes a subtask.
 * @param {string} taskId - The ID of the parent task.
 * @param {string} subtaskId - The ID of the subtask to delete.
 */
export function deleteSubtask(taskId, subtaskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
        task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
        saveTasksToStorage();
        renderBoard();
        
        setTimeout(() => {
            const cardElement = document.querySelector(`.task-card[data-id="${taskId}"]`);
            if (cardElement) {
                const panel = cardElement.querySelector('.subtask-panel');
                if (!panel.classList.contains('show')) {
                   toggleSubtaskPanel(cardElement);
                } else {
                   renderSubtasks(cardElement);
                }
            }
        }, 0);
    }
}

export function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.subtask-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
