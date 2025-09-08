// 全局键盘快捷键功能模块
(function() {
    'use strict';

    // --- 状态管理 ---
    let currentHighlightedColumn = null; // 当前高亮的列
    let currentHighlightedTask = null; // 当前高亮的任务卡片
    let isHelpPanelOpen = false; // 快捷键帮助面板是否打开

    // --- DOM 元素 ---
    const helpPanel = document.getElementById('keyboard-help-panel');
    const helpPanelOverlay = document.getElementById('keyboard-help-overlay');
    const searchInput = document.getElementById('search-input');
    const themeSwitcher = document.getElementById('theme-switcher');
    const taskModal = document.getElementById('task-modal');

    // 列的顺序映射
    const columnOrder = ['todo', 'in-progress', 'done'];

    /**
     * @description 初始化键盘快捷键功能
     */
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', handleGlobalKeydown);
        
        // 初始化帮助面板事件
        if (helpPanelOverlay) {
            helpPanelOverlay.addEventListener('click', closeHelpPanel);
        }
        
        // 监听模态框状态变化
        if (taskModal) {
            taskModal.addEventListener('close', () => {
                // 模态框关闭后，恢复键盘快捷键
                document.addEventListener('keydown', handleGlobalKeydown);
            });
        }
        
        // 添加鼠标选择监听器
        initMouseSelectionListeners();
    }

    /**
     * @description 全局键盘事件处理
     * @param {KeyboardEvent} e - 键盘事件
     */
    function handleGlobalKeydown(e) {
        // 如果焦点在输入框、文本域或模态框内，则不处理快捷键（除了特殊情况）
        const activeElement = document.activeElement;
        const isInInput = activeElement.tagName === 'INPUT' || 
                         activeElement.tagName === 'TEXTAREA' || 
                         activeElement.contentEditable === 'true';
        const isInModal = activeElement.closest('dialog');

        // 特殊处理：F键总是可以跳转到搜索框
        if (e.key === 'f' || e.key === 'F') {
            if (!isInModal) {
                e.preventDefault();
                focusSearchBox();
                return;
            }
        }

        // 特殊处理：?键总是可以打开帮助面板
        if (e.key === '?' && !isInInput) {
            e.preventDefault();
            toggleHelpPanel();
            return;
        }

        // 如果帮助面板打开，任意键关闭（除了?键）
        if (isHelpPanelOpen && e.key !== '?') {
            closeHelpPanel();
            return;
        }

        // 如果在输入框或模态框内，不处理其他快捷键
        if (isInInput || isInModal) {
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'n':
                e.preventDefault();
                handleNewTaskShortcut();
                break;
            case 'e':
                e.preventDefault();
                handleEditTaskShortcut();
                break;
            case 'delete':
            case 'backspace':
                e.preventDefault();
                handleDeleteTaskShortcut();
                break;
            case 't':
                e.preventDefault();
                handleThemeToggleShortcut();
                break;
            case 'arrowleft':
                e.preventDefault();
                navigateColumns(-1);
                break;
            case 'arrowright':
                e.preventDefault();
                navigateColumns(1);
                break;
            case 'arrowup':
                e.preventDefault();
                navigateTasks(-1);
                break;
            case 'arrowdown':
                e.preventDefault();
                navigateTasks(1);
                break;
        }
    }

    /**
     * @description 处理新建任务快捷键
     */
    function handleNewTaskShortcut() {
        let targetStatus = 'todo'; // 默认状态

        // 如果有高亮的列，使用该列的状态
        if (currentHighlightedColumn) {
            targetStatus = currentHighlightedColumn.dataset.status;
        }

        // 调用现有的 openModal 函数（需要确保在全局作用域可访问）
        if (window.openModal) {
            window.openModal('add', targetStatus);
        } else {
            // 如果 openModal 不在全局作用域，通过点击按钮触发
            const addButton = document.querySelector(`.add-task-btn[data-status="${targetStatus}"]`);
            if (addButton) {
                addButton.click();
            }
        }
    }

    /**
     * @description 处理编辑任务快捷键
     */
    function handleEditTaskShortcut() {
        if (currentHighlightedTask) {
            // 通过点击编辑按钮触发
            const editButton = currentHighlightedTask.querySelector('.edit-task-btn');
            if (editButton) {
                editButton.click();
            }
        }
    }

    /**
     * @description 处理删除任务快捷键
     */
    function handleDeleteTaskShortcut() {
        if (currentHighlightedTask) {
            // 确保菜单可见
            const menuBtn = currentHighlightedTask.querySelector('.task-card__menu-btn');
            if (menuBtn) {
                menuBtn.click();
                
                // 短暂延迟确保菜单打开
                setTimeout(() => {
                    const deleteButton = currentHighlightedTask.querySelector('.delete-task-btn');
                    if (deleteButton) {
                        deleteButton.click();
                    }
                }, 50);
            }
        }
    }

    /**
     * @description 处理主题切换快捷键
     */
    function handleThemeToggleShortcut() {
        if (themeSwitcher) {
            themeSwitcher.click();
        }
    }

    /**
     * @description 焦点跳转到搜索框
     */
    function focusSearchBox() {
        if (searchInput) {
            searchInput.focus();
            searchInput.select(); // 选中所有文本，方便用户直接输入
        }
    }

    /**
     * @description 在列之间导航
     * @param {number} direction - 方向：-1 向左，1 向右
     */
    function navigateColumns(direction) {
        const columns = document.querySelectorAll('.kanban-column');
        
        if (!currentHighlightedColumn) {
            // 如果没有高亮列，高亮第一列
            highlightColumn(columns[0]);
            return;
        }

        const currentIndex = columnOrder.indexOf(currentHighlightedColumn.dataset.status);
        let newIndex = currentIndex + direction;

        // 循环导航
        if (newIndex < 0) {
            newIndex = columnOrder.length - 1;
        } else if (newIndex >= columnOrder.length) {
            newIndex = 0;
        }

        const newColumn = document.querySelector(`.kanban-column[data-status="${columnOrder[newIndex]}"]`);
        if (newColumn) {
            highlightColumn(newColumn);
        }
    }

    /**
     * @description 在当前列的任务之间导航
     * @param {number} direction - 方向：-1 向上，1 向下
     */
    function navigateTasks(direction) {
        if (!currentHighlightedColumn) {
            // 如果没有高亮列，先高亮第一列
            const firstColumn = document.querySelector('.kanban-column');
            if (firstColumn) {
                highlightColumn(firstColumn);
            }
            return;
        }

        const tasks = currentHighlightedColumn.querySelectorAll('.task-card:not(.hidden)');
        if (tasks.length === 0) return;

        if (!currentHighlightedTask) {
            // 如果没有高亮任务，高亮第一个任务
            highlightTask(tasks[0]);
            return;
        }

        const currentIndex = Array.from(tasks).indexOf(currentHighlightedTask);
        let newIndex = currentIndex + direction;

        // 循环导航
        if (newIndex < 0) {
            newIndex = tasks.length - 1;
        } else if (newIndex >= tasks.length) {
            newIndex = 0;
        }

        highlightTask(tasks[newIndex]);
    }

    /**
     * @description 高亮指定列
     * @param {HTMLElement} column - 要高亮的列
     */
    function highlightColumn(column) {
        // 移除之前的高亮
        if (currentHighlightedColumn) {
            currentHighlightedColumn.classList.remove('keyboard-highlighted');
        }

        // 清除任务高亮
        clearTaskHighlight();

        // 设置新的高亮
        currentHighlightedColumn = column;
        if (column) {
            column.classList.add('keyboard-highlighted');
            column.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * @description 高亮指定任务
     * @param {HTMLElement} task - 要高亮的任务
     */
    function highlightTask(task) {
        // 移除之前的高亮
        clearTaskHighlight();

        // 设置新的高亮
        currentHighlightedTask = task;
        if (task) {
            task.classList.add('keyboard-highlighted');
            task.focus(); // 设置焦点，便于键盘导航
            task.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * @description 清除任务高亮
     */
    function clearTaskHighlight() {
        if (currentHighlightedTask) {
            currentHighlightedTask.classList.remove('keyboard-highlighted');
            currentHighlightedTask = null;
        }
    }

    /**
     * @description 切换快捷键帮助面板
     */
    function toggleHelpPanel() {
        if (isHelpPanelOpen) {
            closeHelpPanel();
        } else {
            openHelpPanel();
        }
    }

    /**
     * @description 打开快捷键帮助面板
     */
    function openHelpPanel() {
        if (helpPanel && helpPanelOverlay) {
            helpPanelOverlay.style.display = 'flex';
            helpPanel.classList.add('show');
            isHelpPanelOpen = true;
            
            // 暂时移除全局键盘监听，避免冲突
            document.removeEventListener('keydown', handleGlobalKeydown);
            
            // 添加临时键盘监听，用于关闭面板
            document.addEventListener('keydown', handleHelpPanelKeydown);
        }
    }

    /**
     * @description 关闭快捷键帮助面板
     */
    function closeHelpPanel() {
        if (helpPanel && helpPanelOverlay) {
            helpPanel.classList.remove('show');
            setTimeout(() => {
                helpPanelOverlay.style.display = 'none';
            }, 300); // 等待动画完成
            isHelpPanelOpen = false;
            
            // 恢复全局键盘监听
            document.removeEventListener('keydown', handleHelpPanelKeydown);
            document.addEventListener('keydown', handleGlobalKeydown);
        }
    }

    /**
     * @description 帮助面板的键盘事件处理
     * @param {KeyboardEvent} e - 键盘事件
     */
    function handleHelpPanelKeydown(e) {
        // 任意键关闭帮助面板
        e.preventDefault();
        closeHelpPanel();
    }

    /**
     * @description 初始化鼠标选择监听器
     */
    function initMouseSelectionListeners() {
        // 任务卡片点击事件
        document.addEventListener('click', (e) => {
            const taskCard = e.target.closest('.task-card');
            const column = e.target.closest('.kanban-column');
            
            if (taskCard) {
                highlightTask(taskCard);
                if (column) {
                    highlightColumn(column);
                }
            } else if (column) {
                highlightColumn(column);
                clearTaskHighlight();
            } else {
                // 点击其他地方，清除所有高亮
                clearAllHighlight();
            }
        });
        
        // 搜索框获得焦点时清除所有高亮
        if (searchInput) {
            searchInput.addEventListener('focus', () => {
                clearAllHighlight();
            });
        }
    }
    
    /**
     * @description 清除所有高亮状态
     */
    function clearAllHighlight() {
        if (currentHighlightedColumn) {
            currentHighlightedColumn.classList.remove('keyboard-highlighted');
            currentHighlightedColumn = null;
        }
        clearTaskHighlight();
    }

    /**
     * @description 暴露必要的函数到全局作用域（如果需要）
     */
    function exposeGlobalFunctions() {
        // 如果 app.js 中的函数不在全局作用域，我们需要想办法访问它们
        // 这里可以通过事件或其他方式来触发相应的功能
    }

    // 初始化
    function init() {
        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initKeyboardShortcuts();
                exposeGlobalFunctions();
            });
        } else {
            initKeyboardShortcuts();
            exposeGlobalFunctions();
        }
    }

    // 启动模块
    init();

})();