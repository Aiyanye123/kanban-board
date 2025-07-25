import * as DOM from './dom.js';
import state from './state.js';
import { saveThemeToStorage } from './storage.js';
import { setView } from './view.js';
import { openModal, closeModal, handleFormSubmit } from './modal.js';
import { deleteTask } from './task.js';
import { deleteLabel } from './label.js';
import { handleDrop, handleDragOver, handleDragLeave } from './drag-drop.js';
import { toggleSubtaskPanel, addSubtask, updateSubtask, deleteSubtask, getDragAfterElement } from './subtask.js';
import { applySearch, applyFilters, clearFilters } from './filter.js';
import { renderCalendar, jumpToKanban } from './calendar.js';
import { hideReminderBanner } from './reminder.js';
import { updateFilePreview } from './ui.js';
import { importBoard, exportBoard } from './import-export.js';

export function addEventListeners() {
    // 主题切换
    DOM.themeSwitcher.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        DOM.themeSwitcher.textContent = newTheme === 'light' ? '切换深色' : '切换浅色';
        saveThemeToStorage(newTheme);
    });

    // 导航栏折叠
    DOM.navToggle.addEventListener('click', () => {
        DOM.appNav.classList.toggle('collapsed');
        const isCollapsed = DOM.appNav.classList.contains('collapsed');
        DOM.navToggle.querySelector('.nav__list-text').textContent = isCollapsed ? '展开导航' : '收起导航';
        DOM.navToggle.setAttribute('aria-label', isCollapsed ? '展开导航栏' : '折叠导航栏');
    });

    // 视图切换
    DOM.viewButtons.addEventListener('click', e => {
        const targetButton = e.target.closest('.nav__view-btn');
        if (targetButton) {
            const newView = targetButton.dataset.view;
            if (state.currentView !== 'all' && state.currentView === newView) {
                setView('all');
            } else {
                setView(newView);
            }
        }
    });

    // 添加任务按钮
    DOM.kanbanBoard.addEventListener('click', e => {
        if (e.target.matches('.add-task-btn')) {
            const status = e.target.dataset.status;
            openModal('add', status);
        }
    });

    // 模态框
    DOM.modalCloseBtn.addEventListener('click', closeModal);
    DOM.taskForm.addEventListener('submit', handleFormSubmit);

    // 卡片和子任务事件委托
    DOM.kanbanBoard.addEventListener('click', e => {
        const menuBtn = e.target.closest('.task-card__menu-btn');
        if (menuBtn) {
            document.querySelectorAll('.task-card__menu.show').forEach(menu => {
                if (menu !== menuBtn.nextElementSibling) menu.classList.remove('show');
            });
            menuBtn.nextElementSibling.classList.toggle('show');
            return;
        }

        if (e.target.closest('.edit-task-btn')) {
            openModal('edit', null, e.target.closest('.task-card').dataset.id);
            return;
        }
        if (e.target.closest('.delete-task-btn')) {
            deleteTask(e.target.closest('.task-card').dataset.id);
            return;
        }
        if (e.target.closest('.view-details-btn')) {
            if (window.TaskDetails) window.TaskDetails.openTaskDetail(e.target.closest('.task-card').dataset.id);
            return;
        }
        if (e.target.closest('.view-subtasks-btn')) {
            toggleSubtaskPanel(e.target.closest('.task-card'));
            return;
        }
        if (e.target.closest('.add-subtask-btn')) {
            const card = e.target.closest('.task-card');
            const input = card.querySelector('.add-subtask-input');
            if (input.value) {
                addSubtask(card.dataset.id, input.value);
                input.value = '';
            }
            return;
        }
        if (e.target.closest('.subtask-item__status')) {
            const subtaskItem = e.target.closest('.subtask-item');
            const card = e.target.closest('.task-card');
            const newStatus = subtaskItem.dataset.status === 'done' ? 'todo' : 'done';
            updateSubtask(card.dataset.id, subtaskItem.dataset.id, { status: newStatus });
            return;
        }
        if (e.target.closest('.subtask-item__delete-btn')) {
            if (confirm('确定要删除这个子任务吗？')) {
                const subtaskItem = e.target.closest('.subtask-item');
                const card = e.target.closest('.task-card');
                deleteSubtask(card.dataset.id, subtaskItem.dataset.id);
            }
            return;
        }
    });

    // 子任务键盘和失焦事件
    DOM.kanbanBoard.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.matches('.add-subtask-input')) {
            e.preventDefault();
            const card = e.target.closest('.task-card');
            if (e.target.value) {
                addSubtask(card.dataset.id, e.target.value);
                e.target.value = '';
            }
        }
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.subtask-item__status')) {
             e.preventDefault();
             e.target.click();
        }
    });

    DOM.kanbanBoard.addEventListener('blur', e => {
        if (e.target.matches('.subtask-item__title')) {
            const subtaskItem = e.target.closest('.subtask-item');
            const card = e.target.closest('.task-card');
            const taskId = card.dataset.id;
            const subtaskId = subtaskItem.dataset.id;
            const newTitle = e.target.textContent.trim();
            
            const task = state.tasks.find(t => t.id === taskId);
            const subtask = task?.subtasks.find(st => st.id === subtaskId);

            if (subtask && subtask.title !== newTitle) {
                if (!newTitle) {
                    e.target.textContent = subtask.title;
                } else {
                    updateSubtask(taskId, subtaskId, { title: newTitle });
                }
            }
        }
    }, true);

    // 子任务拖放
    DOM.kanbanBoard.addEventListener('dragstart', e => {
        if (e.target.matches('.subtask-item')) {
            e.stopPropagation();
            state.draggedSubtaskInfo = {
                element: e.target,
                taskId: e.target.closest('.task-card').dataset.id,
                subtaskId: e.target.dataset.id
            };
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    DOM.kanbanBoard.addEventListener('dragover', e => {
        if (state.draggedSubtaskInfo) {
            e.preventDefault();
            const list = e.target.closest('.subtask-list');
            if (list) {
                const afterElement = getDragAfterElement(list, e.clientY);
                const draggable = state.draggedSubtaskInfo.element;
                if (afterElement == null) {
                    list.appendChild(draggable);
                } else {
                    list.insertBefore(draggable, afterElement);
                }
            }
        }
    });

    DOM.kanbanBoard.addEventListener('drop', e => {
        if (state.draggedSubtaskInfo) {
            e.preventDefault();
            e.stopPropagation();
            
            const { element, taskId } = state.draggedSubtaskInfo;
            element.classList.remove('dragging');

            const task = state.tasks.find(t => t.id === taskId);
            const subtaskListEl = element.closest('.subtask-list');

            if (task && subtaskListEl) {
                const newOrderIds = [...subtaskListEl.querySelectorAll('.subtask-item')].map(item => item.dataset.id);
                task.subtasks.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
                saveTasksToStorage();
            }
            state.draggedSubtaskInfo = null;
        }
    });

    // 全局点击关闭菜单
    document.addEventListener('click', e => {
        if (!e.target.closest('.task-card__menu-btn')) {
            document.querySelectorAll('.task-card__menu.show').forEach(menu => menu.classList.remove('show'));
        }
        if (!DOM.filterDropdown.contains(e.target) && e.target !== DOM.filterBtn) {
            DOM.filterDropdown.classList.remove('show');
        }
    });

    // 列拖放
    document.querySelectorAll('.kanban-column').forEach(col => {
        col.addEventListener('dragover', handleDragOver);
        col.addEventListener('dragleave', handleDragLeave);
        col.addEventListener('drop', handleDrop);
    });
    
    // 搜索
    DOM.searchInput.addEventListener('input', applySearch);

    // 筛选
    DOM.filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.filterDropdown.classList.toggle('show');
    });
    DOM.filterDropdown.addEventListener('change', applyFilters);
    DOM.clearFiltersBtn.addEventListener('click', clearFilters);
    DOM.priorityFilter.addEventListener('change', applyFilters);

    // 标签筛选和删除
    DOM.labelFilterContainer.addEventListener('click', e => {
        if (e.target.closest('.label-delete-btn')) {
            e.stopPropagation();
            deleteLabel(e.target.dataset.label);
            return;
        }
        if (e.target.closest('.label-filter-tag')) {
            const label = e.target.dataset.label;
            e.target.classList.toggle('active');
            const activeLabels = new Set(state.activeFilters.labels);
            if (activeLabels.has(label)) {
                activeLabels.delete(label);
            } else {
                activeLabels.add(label);
            }
            state.activeFilters.labels = Array.from(activeLabels);
            renderBoard();
        }
    });

    // 模态框标签建议
    DOM.labelSuggestionsContainer.addEventListener('click', e => {
        if (e.target.closest('.label-delete-btn')) {
            e.stopPropagation();
            deleteLabel(e.target.dataset.label);
            return;
        }
        if (e.target.closest('.label-suggestion-item')) {
            const labelToAdd = e.target.dataset.label;
            const currentLabels = new Set(DOM.taskLabelsInput.value.split(',').map(l => l.trim()).filter(l => l));
            if (!currentLabels.has(labelToAdd)) {
                currentLabels.add(labelToAdd);
                DOM.taskLabelsInput.value = Array.from(currentLabels).join(', ');
            }
        }
    });

    // 日历
    DOM.calendarPrevBtn.addEventListener('click', () => {
        state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });
    DOM.calendarNextBtn.addEventListener('click', () => {
        state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    // 详情模态框
    if (DOM.taskDetailCloseBtn) DOM.taskDetailCloseBtn.addEventListener('click', () => DOM.taskDetailModal.close());
    if (DOM.jumpToKanbanBtn) DOM.jumpToKanbanBtn.addEventListener('click', jumpToKanban);
    if (DOM.dayTasksCloseBtn) DOM.dayTasksCloseBtn.addEventListener('click', () => DOM.dayTasksModal.close());

    // 提醒横幅
    DOM.reminderBannerClose.addEventListener('click', hideReminderBanner);

    // 文件上传
    if (DOM.taskAttachmentsInput) DOM.taskAttachmentsInput.addEventListener('change', updateFilePreview);
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('selected-file-remove')) {
            const index = parseInt(e.target.dataset.index);
            const dt = new DataTransfer();
            Array.from(DOM.taskAttachmentsInput.files).forEach((file, i) => {
                if (i !== index) dt.items.add(file);
            });
            DOM.taskAttachmentsInput.files = dt.files;
            updateFilePreview();
        }
    });

    // 多面板切换
    if (DOM.multiPanelToggle) {
        DOM.multiPanelToggle.addEventListener('click', () => {
            state.multiPanelMode = !state.multiPanelMode;
            DOM.multiPanelToggle.classList.toggle('active');
            DOM.multiPanelToggle.style.animation = 'none';
            setTimeout(() => {
                DOM.multiPanelToggle.style.animation = 'bounce 0.6s ease';
            }, 10);
        });
    }

    // 导入导出
    if (DOM.exportBoardBtn) DOM.exportBoardBtn.addEventListener('click', exportBoard);
    if (DOM.importBoardBtn) DOM.importBoardBtn.addEventListener('click', importBoard);
}
