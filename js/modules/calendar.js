import * as DOM from './dom.js';
import state from './state.js';
import { setView } from './view.js';
import { STATUS_NAMES, PRIORITY_NAMES } from './constants.js';
import { normalizeDate, escapeHtml } from './utils.js';

/**
 * @description 获取指定日期的任务
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @param {number} day - 日期
 * @returns {Array} - 任务列表
 */
function getTasksForDate(year, month, day) {
    const targetDate = normalizeDate(new Date(year, month, day));
    
    return state.tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = normalizeDate(task.dueDate);
        return taskDate.getTime() === targetDate.getTime();
    });
}

/**
 * @description 渲染日历中的任务
 * @param {Array} dayTasks - 当天的任务列表
 * @returns {string} - 任务HTML
 */
function renderCalendarTasks(dayTasks) {
    if (dayTasks.length === 0) return '';
    
    const maxVisible = 3;
    let html = '';
    
    for (let i = 0; i < Math.min(dayTasks.length, maxVisible); i++) {
        const task = dayTasks[i];
        const shortTitle = task.title.length > 8 ? task.title.substring(0, 8) + '...' : task.title;
        html += `<div class="calendar-task-item status-${task.status}" data-task-id="${task.id}">${shortTitle}</div>`;
    }
    
    if (dayTasks.length > maxVisible) {
        const remaining = dayTasks.length - maxVisible;
        html += `<div class="calendar-more-tasks">+${remaining}条</div>`;
    }
    
    return html;
}

/**
 * @description 显示任务详情
 * @param {string} taskId - 任务ID
 */
function showTaskDetail(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !DOM.taskDetailContent || !DOM.taskDetailModal) return;
    
    state.selectedTaskForDetail = task;
    
    const statusNames = STATUS_NAMES;
    const priorityNames = PRIORITY_NAMES;
    
    DOM.taskDetailContent.innerHTML = `
        <div class="task-detail-item"><div class="task-detail-label">任务标题</div><div class="task-detail-value">${escapeHtml(task.title)}</div></div>
        <div class="task-detail-item"><div class="task-detail-label">任务描述</div><div class="task-detail-value">${escapeHtml(task.description || '无描述')}</div></div>
        <div class="task-detail-item"><div class="task-detail-label">所属状态</div><div class="task-detail-value">${statusNames[task.status]}</div></div>
        <div class="task-detail-item"><div class="task-detail-label">优先级</div><div class="task-detail-value">${priorityNames[task.priority]}</div></div>
        <div class="task-detail-item"><div class="task-detail-label">到期时间</div><div class="task-detail-value">${escapeHtml(task.dueDate || '无截止日期')}</div></div>
        ${task.labels && task.labels.length > 0 ? `<div class="task-detail-item"><div class="task-detail-label">标签</div><div class="task-detail-value">${task.labels.map(l => escapeHtml(l)).join(', ')}</div></div>` : ''}
    `;
    
    DOM.taskDetailModal.showModal();
}

/**
 * @description 显示当天任务列表
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 */
function showDayTasks(dateStr) {
    if (!DOM.dayTasksTitle || !DOM.dayTasksContent || !DOM.dayTasksModal) return;

    const date = new Date(dateStr);
    const dayTasks = state.tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toISOString().split('T')[0] === dateStr;
    });
    
    DOM.dayTasksTitle.textContent = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日的任务`;
    
    const statusNames = STATUS_NAMES;
    
    DOM.dayTasksContent.innerHTML = `<div class="day-tasks-list">
        ${dayTasks.map(task => `
            <div class="day-task-item status-${task.status}" data-task-id="${task.id}">
                <div class="day-task-title">${task.title}</div>
                <div class="day-task-status">${statusNames[task.status]}</div>
            </div>
        `).join('')}
    </div>`;
    
    DOM.dayTasksContent.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.day-task-item');
        if (taskItem) {
            const taskId = taskItem.dataset.taskId;
            if (DOM.dayTasksModal) DOM.dayTasksModal.close();
            showTaskDetail(taskId);
        }
    }, { once: true }); // Use { once: true } to avoid multiple listeners

    if (DOM.dayTasksModal) DOM.dayTasksModal.showModal();
}

/**
 * @description 创建日历日期元素
 * @param {number} day - 日期
 * @param {boolean} isOtherMonth - 是否是其他月份
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {HTMLElement} - 日期元素
 */
function createCalendarDayElement(day, isOtherMonth, year, month) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (isOtherMonth) dayElement.classList.add('other-month');
    
    const today = new Date();
    const dayDate = new Date(year, month, day);
    if (!isOtherMonth && dayDate.getDate() === today.getDate() && dayDate.getMonth() === today.getMonth() && dayDate.getFullYear() === today.getFullYear()) {
        dayElement.classList.add('today');
    }
    
    const dayTasks = getTasksForDate(year, month, day);
    
    dayElement.innerHTML = `
        <div class="calendar-day-number">${day}</div>
        <div class="calendar-tasks" data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}">
            ${renderCalendarTasks(dayTasks)}
        </div>
    `;
    
    dayElement.addEventListener('click', (e) => {
        if (e.target.closest('.calendar-task-item')) {
            const taskId = e.target.closest('.calendar-task-item').dataset.taskId;
            showTaskDetail(taskId);
        } else if (e.target.closest('.calendar-more-tasks')) {
            const dateStr = e.target.closest('.calendar-tasks').dataset.date;
            showDayTasks(dateStr);
        }
    });
    
    return dayElement;
}

/**
 * @description 渲染日历视图
 */
export function renderCalendar() {
    const year = state.currentCalendarDate.getFullYear();
    const month = state.currentCalendarDate.getMonth();
    
    DOM.calendarTitle.textContent = `${year}年${month + 1}月`;
    DOM.calendarDays.innerHTML = '';
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
        const dayNumber = daysInPrevMonth - i;
        const dayElement = createCalendarDayElement(dayNumber, true, year, month - 1);
        DOM.calendarDays.appendChild(dayElement);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createCalendarDayElement(day, false, year, month);
        DOM.calendarDays.appendChild(dayElement);
    }
    
    const totalCells = DOM.calendarDays.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createCalendarDayElement(day, true, year, month + 1);
        DOM.calendarDays.appendChild(dayElement);
    }
}

/**
 * @description 跳转到看板并高亮任务
 */
export function jumpToKanban() {
    if (!state.selectedTaskForDetail) return;
    
    if (DOM.taskDetailModal) DOM.taskDetailModal.close();
    
    setView(state.selectedTaskForDetail.status);
    
    setTimeout(() => {
        const taskCard = document.querySelector(`.task-card[data-id="${state.selectedTaskForDetail.id}"]`);
        if (taskCard) {
            taskCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            taskCard.style.boxShadow = '0 0 20px var(--accent-color)';
            setTimeout(() => {
                taskCard.style.boxShadow = '';
            }, 2000);
        }
    }, 500);
}
