import { state } from './state.js';
import { calendarTitle, calendarDays, jumpToKanbanBtn } from './dom.js';
import { renderBoard } from './render.js';

// --- 10. 日历视图功能 ---
export function renderCalendar() {
    const year = state.currentCalendarDate.getFullYear();
    const month = state.currentCalendarDate.getMonth();

    calendarTitle.textContent = `${year}年${month + 1}月`;
    calendarDays.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();

    for (let i = firstDayWeekday - 1; i >= 0; i--) {
        const dayNumber = daysInPrevMonth - i;
        const dayElement = createCalendarDayElement(dayNumber, true, year, month - 1);
        calendarDays.appendChild(dayElement);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = createCalendarDayElement(i, false, year, month);
        calendarDays.appendChild(dayElement);
    }

    const remaining = 42 - (firstDayWeekday + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
        const dayElement = createCalendarDayElement(i, true, year, month + 1);
        calendarDays.appendChild(dayElement);
    }
}

function createCalendarDayElement(day, isOtherMonth, year, month) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const li = document.createElement('li');
    li.className = 'calendar-day' + (isOtherMonth ? ' other-month' : '');
    li.dataset.date = dateStr;
    li.textContent = day;

    const dayTasks = getTasksForDate(year, month, day);
    if (dayTasks.length > 0) {
        const badge = document.createElement('span');
        badge.className = 'calendar-day-badge';
        badge.textContent = dayTasks.length;
        li.appendChild(badge);
    }
    li.addEventListener('click', () => showDayTasks(dateStr));
    return li;
}

function getTasksForDate(year, month, day) {
    return state.tasks.filter(t => t.dueDate === `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
}

function renderCalendarTasks(dayTasks) {
    const container = document.createElement('div');
    dayTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'calendar-task-item';
        item.textContent = task.title;
        item.addEventListener('click', () => showTaskDetail(task.id));
        container.appendChild(item);
    });
    return container;
}

export function showTaskDetail(taskId) {
    const taskCard = document.querySelector(`.task-card[data-id="${taskId}"]`);
    if (taskCard) {
        taskCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        taskCard.style.boxShadow = '0 0 20px var(--accent-color)';
        setTimeout(() => { taskCard.style.boxShadow = ''; }, 2000);
    }
}

export function showDayTasks(dateStr) {
    const [year, month, day] = dateStr.split('-').map(n => parseInt(n, 10));
    const tasks = getTasksForDate(year, month - 1, day);
    const modal = document.querySelector('#day-tasks-modal');
    const title = document.querySelector('#day-tasks-title');
    const content = document.querySelector('#day-tasks-content');
    title.textContent = dateStr;
    content.innerHTML = '';
    content.appendChild(renderCalendarTasks(tasks));
    modal.showModal();
}

export function jumpToKanban() {
    renderBoard();
}

jumpToKanbanBtn.addEventListener('click', jumpToKanban);
