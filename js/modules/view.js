import * as DOM from './dom.js';
import state from './state.js';
import { saveViewToStorage } from './storage.js';
import { renderCalendar } from './calendar.js';

/**
 * @description 设置看板的视图
 * @param {string} view - 'all', 'todo', 'in-progress', 'done', 'calendar', 'stats'
 * @param {boolean} [isInitialLoad=false] - 是否是首次加载
 */
export function setView(view, isInitialLoad = false) {
    if (state.isAnimating && !isInitialLoad) return;

    state.currentView = view;
    state.isAnimating = !isInitialLoad;

    const buttons = DOM.viewButtons.querySelectorAll('.nav__view-btn');
    buttons.forEach(btn => {
        const isPressed = btn.dataset.view === view;
        btn.setAttribute('aria-pressed', isPressed);
    });

    const columns = document.querySelectorAll('.kanban-column');
    
    DOM.kanbanBoard.style.display = 'none';
    DOM.calendarView.style.display = 'none';
    if (DOM.statsView) DOM.statsView.style.display = 'none';

    if (view === 'calendar') {
        DOM.calendarView.style.display = 'flex';
        renderCalendar();
    } else if (view === 'stats') {
        if (DOM.statsView) DOM.statsView.style.display = 'block';
        if (window.StatsModule) {
            window.StatsModule.init();
        }
    } else {
        DOM.kanbanBoard.style.display = 'flex';
        
        if (view === 'all') {
            DOM.kanbanBoard.classList.remove('zoomed-in');
            columns.forEach(col => {
                col.classList.remove('is-hidden', 'is-zoomed');
            });
        } else {
            DOM.kanbanBoard.classList.add('zoomed-in');
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
