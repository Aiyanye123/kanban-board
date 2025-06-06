import * as dom from './dom.js';
import { state } from './state.js';
import { loadTasksFromStorage, loadThemeFromStorage, loadViewFromStorage, saveTasksToStorage } from './storage.js';
import { renderBoard } from './render.js';
import { setView } from './view.js';
import { handleFormSubmit, openModal } from './tasks.js';
import { renderLabelFilters, applySearch, applyFilters } from './searchFilter.js';
import { renderCalendar } from './calendar.js';
import { requestNotificationPermission, checkMissedReminders } from './reminder.js';

function init() {
    loadTasksFromStorage();
    loadThemeFromStorage();
    state.currentView = loadViewFromStorage();
    renderLabelFilters();
    renderBoard();
    setView(state.currentView, true);
    requestNotificationPermission();
    checkMissedReminders();
}

dom.taskForm.addEventListener('submit', handleFormSubmit);
dom.modalCloseBtn.addEventListener('click', () => dom.taskModal.close());

dom.viewButtons.addEventListener('click', e => {
    const btn = e.target.closest('.nav__view-btn');
    if (btn) setView(btn.dataset.view);
});

dom.searchInput.addEventListener('input', applySearch);
dom.filterBtn.addEventListener('click', applyFilters);

document.addEventListener('DOMContentLoaded', init);
