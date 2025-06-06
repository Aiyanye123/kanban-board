import { state } from './state.js';
import { kanbanBoard } from './dom.js';
import { applySearch } from './searchFilter.js';

// --- 4. 核心渲染与DOM操作 ---

export function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('draggable', 'true');
    card.dataset.id = task.id;
    card.setAttribute('tabindex', '0');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    let dueDate = null;
    if (task.dueDate) {
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        dueDate = due.getTime();
    }
    const isOverdue = dueDate && dueDate < today;

    const subtasks = task.subtasks || [];
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(st => st.status === 'done').length;
    const allSubtasksDone = totalSubtasks > 0 && completedSubtasks === totalSubtasks;

    if (allSubtasksDone) {
        card.classList.add('task-completed');
    }

    card.classList.add(`priority--${task.priority || 'medium'}`);

    const labelsHTML = (task.labels || []).map(label =>
        `<span class="task-card__label" style="background-color: ${state.labels[label] || '#cccccc'}">${label}</span>`
    ).join('');

    card.innerHTML = `
        ${(task.labels && task.labels.length > 0) ? `<div class="task-card__labels">${labelsHTML}</div>` : ''}
        <div class="task-card__header">
            <h3 class="task-card__title">${task.title}</h3>
            ${allSubtasksDone ? '<span class="task-card__checkmark" aria-label="所有子任务已完成">✔</span>' : ''}
        </div>
        <p class="task-card__description">${task.description || '没有描述'}</p>
        <p class="task-card__due-date ${isOverdue ? 'overdue' : ''}">
            ${task.dueDate ? `截止: ${task.dueDate}` : ''}
        </p>

        ${totalSubtasks > 0 ? `
        <div class="subtask-progress">
            <span class="subtask-progress__text">${completedSubtasks}/${totalSubtasks}</span>
            <div class="subtask-progress__bar">
                <div class="subtask-progress__bar-inner" style="width: ${(completedSubtasks / totalSubtasks) * 100}%"></div>
            </div>
        </div>
        ` : ''}

        <button class="task-card__menu-btn" aria-label="更多操作">⋮</button>
        <ul class="task-card__menu">
            <li class="task-card__menu-item"><button class="edit-task-btn">编辑</button></li>
            <li class="task-card__menu-item"><button class="view-subtasks-btn">查看子任务</button></li>
            <li class="task-card__menu-item task-card__menu-item--delete"><button class="delete-task-btn">删除</button></li>
        </ul>

        <div class="subtask-panel">
            <h4 class="subtask-panel__title">子任务</h4>
            <ul class="subtask-list"></ul>
            <div class="add-subtask-form">
                <input type="text" class="add-subtask-input" placeholder="添加新子任务...">
                <button class="add-subtask-btn" aria-label="添加子任务">+</button>
            </div>
        </div>
    `;

    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('keydown', handleCardKeydown);
    return card;
}

export function renderBoard() {
    const cardContainers = document.querySelectorAll('.kanban-column__cards');
    cardContainers.forEach(container => container.innerHTML = '');

    state.tasks.forEach(task => {
        const card = createTaskCardElement(task);
        const columnContainer = document.querySelector(`.kanban-column__cards[data-status="${task.status}"]`);
        if (columnContainer) columnContainer.appendChild(card);
    });

    updateTaskCounts();
    applySearch();
}

export function updateTaskCounts() {
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(column => {
        const status = column.dataset.status;
        const count = state.tasks.filter(task => task.status === status).length;
        column.querySelector('.task-count').textContent = count;
    });
}
