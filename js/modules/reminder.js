import * as DOM from './dom.js';
import state from './state.js';
import { saveTasksToStorage } from './storage.js';

/**
 * @description 显示提醒横幅
 * @param {string} message - 提醒消息
 */
function showReminderBanner(message) {
    DOM.reminderBannerText.textContent = message;
    DOM.reminderBanner.style.display = 'block';
    
    setTimeout(() => {
        hideReminderBanner();
    }, 5000);
}

/**
 * @description 隐藏提醒横幅
 */
export function hideReminderBanner() {
    DOM.reminderBanner.style.display = 'none';
}

/**
 * @description 显示提醒
 * @param {Object} task - 任务对象
 */
function showReminder(task) {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const isOverdue = dueDate < now;
    
    const message = isOverdue ? `任务 "${task.title}" 已到期` : `任务 "${task.title}" 即将截止`;
    
    if (state.notificationPermission) {
        new Notification('任务提醒', {
            body: message,
            icon: '/favicon.ico'
        });
    }
    
    showReminderBanner(message);
}

/**
 * @description 检查提醒
 */
function checkReminders() {
    const now = new Date();
    
    state.activeReminders.forEach(task => {
        const reminderTime = new Date(task.remindAt);
        if (reminderTime <= now) {
            showReminder(task);
            task.reminded = true;
            saveTasksToStorage();
        }
    });
    
    updateActiveReminders();
}

/**
 * @description 检查错过的提醒
 */
function checkMissedReminders() {
    const now = new Date();
    const missedTasks = state.tasks.filter(task =>
        task.remindAt &&
        new Date(task.remindAt) < now &&
        !task.reminded &&
        task.status !== 'done'
    );
    
    if (missedTasks.length > 0) {
        const messages = missedTasks.map(task => {
            const reminderTime = new Date(task.remindAt);
            return `任务 "${task.title}" 的提醒时间：${reminderTime.toLocaleString()}`;
        });
        
        const message = `您错过了 ${missedTasks.length} 个提醒：\n${messages.join('\n')}`;
        alert(message);
        
        missedTasks.forEach(task => {
            task.reminded = true;
        });
        saveTasksToStorage();
    }
}

/**
 * @description 开始提醒检查
 */
function startReminderCheck() {
    if (state.reminderCheckInterval) {
        clearInterval(state.reminderCheckInterval);
    }
    
    state.reminderCheckInterval = setInterval(checkReminders, 60000);
    
    checkReminders();
    checkMissedReminders();
}

/**
 * @description 请求通知权限
 */
export function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            state.notificationPermission = permission === 'granted';
            if (state.notificationPermission) {
                console.log('通知权限已获得');
                startReminderCheck();
            } else {
                console.log('通知权限被拒绝');
            }
        });
    }
}

/**
 * @description 计算提醒时间
 * @param {string} dueDate - 截止日期
 * @param {string} reminderType - 提醒类型
 * @returns {string|null} - 提醒时间ISO字符串
 */
export function calculateReminderTime(dueDate, reminderType) {
    if (!dueDate || !reminderType) return null;
    
    const due = new Date(dueDate);
    let reminderTime;
    
    switch (reminderType) {
        case 'same-day-09':
            reminderTime = new Date(due);
            reminderTime.setHours(9, 0, 0, 0);
            break;
        case 'same-day-18':
            reminderTime = new Date(due);
            reminderTime.setHours(18, 0, 0, 0);
            break;
        case 'one-day-before-18':
            reminderTime = new Date(due);
            reminderTime.setDate(reminderTime.getDate() - 1);
            reminderTime.setHours(18, 0, 0, 0);
            break;
        default:
            return null;
    }
    
    return reminderTime.toISOString();
}

/**
 * @description 更新活跃提醒列表
 */
export function updateActiveReminders() {
    state.activeReminders = state.tasks.filter(task =>
        task.remindAt &&
        new Date(task.remindAt) > new Date() &&
        task.status !== 'done'
    );
}

/**
 * @description 移除任务提醒
 * @param {string} taskId - 任务ID
 */
export function removeTaskReminder(taskId) {
    state.activeReminders = state.activeReminders.filter(task => task.id !== taskId);
}
