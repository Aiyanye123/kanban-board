import { state } from './state.js';
import { reminderBanner, reminderBannerText, reminderBannerClose } from './dom.js';

// --- 11. 提醒功能 ---
export function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            state.notificationPermission = permission === 'granted';
            if (state.notificationPermission) {
                startReminderCheck();
            }
        });
    }
}

function calculateReminderTime(dueDate, reminderType) {
    if (!dueDate || !reminderType) return null;

    const due = new Date(dueDate);
    let reminderTime;
    switch (reminderType) {
        case 'same-day-09':
            reminderTime = new Date(due); reminderTime.setHours(9,0,0,0); break;
        case 'same-day-18':
            reminderTime = new Date(due); reminderTime.setHours(18,0,0,0); break;
        case 'one-day-before':
            reminderTime = new Date(due); reminderTime.setDate(due.getDate()-1); break;
        default:
            reminderTime = null;
    }
    return reminderTime ? reminderTime.toISOString() : null;
}

function updateActiveReminders() {
    state.activeReminders = state.tasks.filter(t => t.reminder && t.dueDate);
}

function startReminderCheck() {
    updateActiveReminders();
    if (state.reminderCheckInterval) clearInterval(state.reminderCheckInterval);
    state.reminderCheckInterval = setInterval(checkReminders, 60000);
    checkReminders();
}

function checkReminders() {
    const now = new Date().toISOString();
    state.activeReminders.forEach(task => {
        if (task.reminderTime && task.reminderTime <= now) {
            showReminder(task);
            removeTaskReminder(task.id);
        }
    });
}

function showReminder(task) {
    if (state.notificationPermission) {
        new Notification(`任务提醒: ${task.title}`);
    }
    showReminderBanner(`任务 "${task.title}" 到期`);
}

function showReminderBanner(message) {
    reminderBannerText.textContent = message;
    reminderBanner.style.display = 'block';
    setTimeout(hideReminderBanner, 5000);
}

function hideReminderBanner() {
    reminderBanner.style.display = 'none';
}

export function checkMissedReminders() {
    const now = new Date().toISOString();
    state.activeReminders.forEach(task => {
        if (task.reminderTime && task.reminderTime <= now) {
            showReminder(task);
            removeTaskReminder(task.id);
        }
    });
}

function removeTaskReminder(taskId) {
    state.activeReminders = state.activeReminders.filter(task => task.id !== taskId);
}

reminderBannerClose.addEventListener('click', hideReminderBanner);
