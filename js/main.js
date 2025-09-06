import * as DOM from './modules/dom.js';
import state from './modules/state.js';
import { loadTasksFromStorage, loadThemeFromStorage, loadViewFromStorage } from './modules/storage.js';
import { renderBoard } from './modules/ui.js';
import { renderLabelFilters } from './modules/label.js';
import { setView } from './modules/view.js';
import { requestNotificationPermission, updateActiveReminders } from './modules/reminder.js';
import { addEventListeners } from './modules/events.js';
import { renderSavedViewsList, bindSavedViewsEvents } from './modules/saved-views.js';

// 初始化多面板按钮状态
function initMultiPanelToggle() {
    if (!DOM.multiPanelToggle) return;
    
    if (state.multiPanelMode) {
        DOM.multiPanelToggle.classList.add('active');
    }
}

function initApp() {
    // 1. 加载数据和设置
    const theme = loadThemeFromStorage();
    DOM.themeSwitcher.textContent = theme === 'light' ? '切换深色' : '切换浅色';
    loadTasksFromStorage();

    // 2. 绑定所有事件
    addEventListeners();

    // 3. 渲染初始UI
    renderBoard();
    renderLabelFilters();
    renderSavedViewsList();
    bindSavedViewsEvents();
    initMultiPanelToggle();

    // 4. 设置初始视图
    const savedView = loadViewFromStorage();
    setView(savedView, true);

    // 5. 初始化提醒功能
    updateActiveReminders();
    requestNotificationPermission();

    // 6. 暴露必要的函数到全局 (如果其他脚本需要)
    // window.openModal = openModal;
}

// 启动应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
