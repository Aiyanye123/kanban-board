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

// 移动端拖拽回退提示（仅在小屏触控设备，且未关闭过时显示一次）
function initMobileDragHint() {
    try {
        const isSmall = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const dismissed = localStorage.getItem('kanban_mobile_hint_dismissed') === '1';
        if (!isSmall || !isTouch || dismissed) return;

        const hint = document.createElement('div');
        hint.className = 'mobile-dnd-hint';
        hint.innerHTML = `
            <span class="mobile-dnd-hint__text">提示：部分移动浏览器不支持拖拽。可通过卡片“⋮ → 移动”更改列。</span>
            <button class="mobile-dnd-hint__close" aria-label="关闭提示">×</button>
        `;

        const insertTarget = document.getElementById('board-toolbar') || document.querySelector('.main-content');
        if (insertTarget) {
            insertTarget.insertAdjacentElement('afterend', hint);
        } else {
            document.body.appendChild(hint);
        }

        hint.addEventListener('click', (e) => {
            if (e.target.classList.contains('mobile-dnd-hint__close')) {
                localStorage.setItem('kanban_mobile_hint_dismissed', '1');
                hint.remove();
            }
        });
    } catch (_) {
        // 忽略非关键错误
    }
}

function initApp() {
    // 1. 加载数据和设置
    const theme = loadThemeFromStorage();
    DOM.themeSwitcher?.setAttribute('aria-label', theme === 'light' ? '切换到深色' : '切换到浅色');
    loadTasksFromStorage();

    // 2. 绑定所有事件
    addEventListeners();

    // 3. 渲染初始UI
    renderBoard();
    renderLabelFilters();
    renderSavedViewsList();
    bindSavedViewsEvents();
    initMultiPanelToggle();

    // 注入统一的 SVG 图标
    import('./modules/icons.js')
        .then(({ injectIcons }) => injectIcons())
        .catch(e => console.warn('图标注入失败', e));

    // 4. 设置初始视图
    const savedView = loadViewFromStorage();
    setView(savedView, true);

    // 5. 初始化提醒功能
    updateActiveReminders();
    requestNotificationPermission();

    // 6. 暴露必要的函数到全局 (如果其他脚本需要)
    // window.openModal = openModal;

    // 7. 移动端拖拽回退提示
    initMobileDragHint();
}

// 启动应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
