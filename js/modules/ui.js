import * as DOM from './dom.js';
import state, { TAG_STYLE_COUNT } from './state.js';
import { handleDragStart, handleDragEnd } from './drag-drop.js';
import { toggleSubtaskPanel } from './subtask.js';
import { applySearch } from './filter.js';
import { STATUS_NAMES } from './constants.js';
import { isOverdueISO, isWithinNextDaysISO } from './utils.js';

/**
 * @description 更新每列头部的任务计数
 */
export function updateTaskCounts() {
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(column => {
        const status = column.dataset.status;
        const count = state.tasks.filter(task => task.status === status).length;
        const countElement = column.querySelector('.task-count');
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

/**
 * @description 创建任务卡片的 HTML 元素
 * @param {object} task - 任务对象
 * @returns {HTMLElement} - 创建的卡片元素
 */
export function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('draggable', 'true');
    card.dataset.id = task.id;
    card.setAttribute('tabindex', '0'); // 为了键盘导航

    const isOverdue = isOverdueISO(task.dueDate);

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

    const otherStatuses = Object.keys(STATUS_NAMES).filter(s => s !== task.status);
    const moveOptionsHTML = otherStatuses.map(s =>
        `<li class="task-card__submenu-item"><button class="move-task-btn" data-status="${s}">${STATUS_NAMES[s]}</button></li>`
    ).join('');

    card.innerHTML = `
        ${(task.labels && task.labels.length > 0) ? `<div class="task-card__labels">${labelsHTML}</div>` : ''}
        <div class="task-card__quick-actions">
            <button class="qa-btn view-details-btn" title="查看详情">👁️</button>
            <button class="qa-btn edit-task-btn" title="编辑">✏️</button>
        </div>
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
            <li class="task-card__menu-item"><button class="view-details-btn">查看详情</button></li>
            <li class="task-card__menu-item"><button class="view-subtasks-btn">查看子任务</button></li>
            <li class="task-card__menu-item task-card__menu-item--move">
                <button>移动</button>
                <ul class="task-card__submenu">
                    ${moveOptionsHTML}
                </ul>
            </li>
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
    
    card.addEventListener('click', (e) => {
        // 如果点击的是按钮，则让 events.js 中的委托监听器处理
        if (e.target.closest('button')) {
            return;
        }

        // 如果点击发生在子任务面板之外，则切换面板
        if (!e.target.closest('.subtask-panel')) {
            toggleSubtaskPanel(card);
        }
    });

    return card;
}

/**
 * @description 渲染整个看板
 */
export function renderBoard() {
    const cardContainers = document.querySelectorAll('.kanban-column__cards');
    cardContainers.forEach(container => container.innerHTML = '');

    const filteredTasks = state.tasks.filter(task => {
        const statusMatch = state.activeFilters.status.includes(task.status);
        
        let dateMatch = true;
        if (state.activeFilters.date === 'upcoming') {
            dateMatch = isWithinNextDaysISO(task.dueDate, 7);
        }

        const priorityMatch = state.activeFilters.priority === 'all' || task.priority === state.activeFilters.priority;
        // 标签筛选采用“交集”逻辑：选中多个标签时，任务必须同时包含所有被选标签
        const labelMatch = state.activeFilters.labels.length === 0 ||
                           (Array.isArray(task.labels) && state.activeFilters.labels.every(l => task.labels.includes(l)));

        return statusMatch && dateMatch && priorityMatch && labelMatch;
    });

    // 根据排序设置对任务排序（默认不变，支持按截止日升/降）
    const tasksToRender = [...filteredTasks];
    if (state.sortBy === 'dueAsc' || state.sortBy === 'dueDesc') {
        tasksToRender.sort((a, b) => {
            const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            return state.sortBy === 'dueAsc' ? ad - bd : bd - ad;
        });
    }

    tasksToRender.forEach(task => {
        const cardElement = createTaskCardElement(task);
        const columnContainer = document.querySelector(`.kanban-column__cards[data-status="${task.status}"]`);
        if (columnContainer) {
            columnContainer.appendChild(cardElement);
        }
    });

    updateTaskCounts();
    applySearch();
}

/**
 * @description 更新文件预览
 */
export function updateFilePreview() {
    if (!DOM.taskAttachmentsInput || !DOM.selectedFilesPreview) return;
    
    DOM.selectedFilesPreview.innerHTML = '';
    
    if (DOM.taskAttachmentsInput.files.length > 0) {
        Array.from(DOM.taskAttachmentsInput.files).forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'selected-file-item';
            fileItem.innerHTML = `
                <span>${file.name}</span>
                <span class="selected-file-remove" data-index="${index}">×</span>
            `;
            DOM.selectedFilesPreview.appendChild(fileItem);
        });
    }
}

/**
 * @description 显示附件保存成功消息
 * @param {number} count - 成功保存的附件数量
 */
export function showAttachmentSuccessMessage(count) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--accent-color);
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-weight: 500;
        z-index: 10001;
        animation: slideIn 0.3s ease;
    `;
    message.textContent = `成功保存 ${count} 个附件`;
    document.body.appendChild(message);

    setTimeout(() => {
        if (document.body.contains(message)) {
            message.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
            }, 300);
        }
    }, 3000);
}
