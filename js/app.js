// 使用 IIFE (立即调用函数表达式) 封装代码，避免污染全局作用域
(function() {
    'use strict';

    // --- 1. DOM 元素获取 ---
    const themeSwitcher = document.getElementById('theme-switcher');
    const navToggle = document.getElementById('nav-toggle');
    const appNav = document.getElementById('app-nav');
    const kanbanBoard = document.getElementById('kanban-board');
    const viewButtons = document.getElementById('view-buttons');
    const taskModal = document.getElementById('task-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const taskSubmitBtn = document.getElementById('task-submit-btn');
    const searchInput = document.getElementById('search-input');
    const filterBtn = document.getElementById('filter-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const priorityFilter = document.getElementById('priority-filter');
    const labelFilterContainer = document.getElementById('label-filter-container');
    const taskPriorityInput = document.getElementById('task-priority');
    const taskLabelsInput = document.getElementById('task-labels');
    const labelSuggestionsContainer = document.getElementById('label-suggestions');
    
    // 日历视图相关元素
    const calendarView = document.getElementById('calendar-view');
    const calendarTitle = document.getElementById('calendar-title');
    const calendarPrevBtn = document.getElementById('calendar-prev-month');
    const calendarNextBtn = document.getElementById('calendar-next-month');
    const calendarDays = document.getElementById('calendar-days');
    
    // 提醒相关元素
    const reminderBanner = document.getElementById('reminder-banner');
    const reminderBannerText = document.getElementById('reminder-banner-text');
    const reminderBannerClose = document.getElementById('reminder-banner-close');
    const taskReminderInput = document.getElementById('task-reminder');
    
    // 模态框相关元素
    const taskDetailModal = document.getElementById('task-detail-modal');
    const taskDetailCloseBtn = document.getElementById('task-detail-close-btn');
    const taskDetailContent = document.getElementById('task-detail-content');
    const jumpToKanbanBtn = document.getElementById('jump-to-kanban-btn');
    const dayTasksModal = document.getElementById('day-tasks-modal');
    const dayTasksCloseBtn = document.getElementById('day-tasks-close-btn');
    const dayTasksTitle = document.getElementById('day-tasks-title');
    const dayTasksContent = document.getElementById('day-tasks-content');


    // --- 2. 应用状态管理 ---
    let tasks = []; // 存储所有任务的核心数组
    let labels = {}; // 存储所有标签和它们的颜色 e.g. { "重要": "#ff0000" }
    let draggedTaskId = null; // 当前拖拽的任务ID
    let currentView = 'all'; // 'all', 'todo', 'in-progress', 'done', 'calendar'
    let isAnimating = false; // 防止动画期间重复点击
    let multiPanelMode = true; // 默认开启多面板模式
    let activeFilters = {
        status: ['todo', 'in-progress', 'done'],
        date: null,
        priority: 'all',
        labels: [] // 存储激活的标签名
    };
    const TAG_STYLE_COUNT = 8; // 预定义的颜色变量数量
    
    // 日历视图状态
    let currentCalendarDate = new Date(); // 当前显示的月份
    let selectedTaskForDetail = null; // 选中查看详情的任务
    
    // 提醒功能状态
    let notificationPermission = false; // 通知权限状态
    let reminderCheckInterval = null; // 提醒检查定时器
    let activeReminders = []; // 活跃的提醒列表


    // --- 3. 本地存储 (LocalStorage) ---

    /**
     * @description 从 localStorage 加载任务和标签
     */
    function loadTasksFromStorage() {
        const storedTasks = localStorage.getItem('kanban_tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
        const storedLabels = localStorage.getItem('kanban_labels');
        if (storedLabels) {
            labels = JSON.parse(storedLabels);
        }
    }

    /**
     * @description 保存任务和标签到 localStorage
     */
    function saveTasksToStorage() {
        localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
        localStorage.setItem('kanban_labels', JSON.stringify(labels));
    }

    /**
     * @description 从 localStorage 加载主题
     */
    function loadThemeFromStorage() {
        const storedTheme = localStorage.getItem('kanban_theme') || 'light';
        document.documentElement.setAttribute('data-theme', storedTheme);
        themeSwitcher.textContent = storedTheme === 'light' ? '切换深色' : '切换浅色';
    }

    /**
     * @description 保存主题到 localStorage
     * @param {string} theme - 'light' 或 'dark'
     */
    function saveThemeToStorage(theme) {
        localStorage.setItem('kanban_theme', theme);
    }

    /**
     * @description 从 localStorage 加载视图状态
     */
    function loadViewFromStorage() {
        return localStorage.getItem('kanban_view') || 'all';
    }

    /**
     * @description 保存当前视图状态到 localStorage
     * @param {string} view - 'all', 'todo', 'in-progress', or 'done'
     */
    function saveViewToStorage(view) {
        localStorage.setItem('kanban_view', view);
    }

    // --- 4. 核心渲染与DOM操作 ---

    /**
     * @description 创建任务卡片的 HTML 元素
     * @param {object} task - 任务对象
     * @returns {HTMLElement} - 创建的卡片元素
     */
    function createTaskCardElement(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('draggable', 'true');
        card.dataset.id = task.id;
        card.setAttribute('tabindex', '0'); // 为了键盘导航

        // 使用本地时间计算
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();
        
        let dueDate = null;
        if (task.dueDate) {
            const due = new Date(task.dueDate);
            due.setHours(0, 0, 0, 0);
            dueDate = due.getTime();
        }
        const isOverdue = dueDate && dueDate < today;

        // 子任务相关计算
        const subtasks = task.subtasks || [];
        const totalSubtasks = subtasks.length;
        const completedSubtasks = subtasks.filter(st => st.status === 'done').length;
        const allSubtasksDone = totalSubtasks > 0 && completedSubtasks === totalSubtasks;

        if (allSubtasksDone) {
            card.classList.add('task-completed');
        }

        // 优先级视觉指示
        card.classList.add(`priority--${task.priority || 'medium'}`);

        // 标签渲染
        const labelsHTML = (task.labels || []).map(label => 
            `<span class="task-card__label" style="background-color: ${labels[label] || '#cccccc'}">${label}</span>`
        ).join('');

        card.innerHTML = `
            ${(task.labels && task.labels.length > 0) ? `<div class="task-card__labels">${labelsHTML}</div>` : ''}
            <div class="task-card__header">
                <h3 class="task-card__title">${task.title}</h3>
                ${allSubtasksDone ? '<span class="task-card__checkmark" aria-label="所有子任务已完成">✔</span>' : ''}
            </div>
            <p class="task-card__description">${task.description || '没有描述'}</p>
            <p class="task-card__due-date ${isOverdue ? 'overdue' : ''}">
                ${task.dueDate ? `截止: ${task.dueDate}` : ''}
            </p>
            
            <!-- 子任务进度条 -->
            ${totalSubtasks > 0 ? `
            <div class="subtask-progress">
                <span class="subtask-progress__text">${completedSubtasks}/${totalSubtasks}</span>
                <div class="subtask-progress__bar">
                    <div class="subtask-progress__bar-inner" style="width: ${(completedSubtasks / totalSubtasks) * 100}%"></div>
                </div>
            </div>
            ` : ''}

            <button class="task-card__menu-btn" aria-label="更多操作">⋮</button>
            <ul class="task-card__menu">
                <li class="task-card__menu-item"><button class="edit-task-btn">编辑</button></li>
                <li class="task-card__menu-item"><button class="view-details-btn">查看详情</button></li>
                <li class="task-card__menu-item"><button class="view-subtasks-btn">查看子任务</button></li>
                <li class="task-card__menu-item task-card__menu-item--delete"><button class="delete-task-btn">删除</button></li>
            </ul>

            <!-- 子任务折叠面板 -->
            <div class="subtask-panel">
                <h4 class="subtask-panel__title">子任务</h4>
                <ul class="subtask-list">
                    <!-- 子任务将由JS动态渲染 -->
                </ul>
                <div class="add-subtask-form">
                    <input type="text" class="add-subtask-input" placeholder="添加新子任务...">
                    <button class="add-subtask-btn" aria-label="添加子任务">+</button>
                </div>
            </div>
        `;

        // 为新创建的元素添加事件监听器
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('keydown', handleCardKeydown);
        
        // 点击卡片展开/收起子任务
        card.addEventListener('click', (e) => {
            // 防止点击按钮时触发
            if (e.target.closest('button') || e.target.closest('.subtask-panel')) return;
            toggleSubtaskPanel(card);
        });


        return card;
    }

    /**
     * @description 渲染整个看板
     */
    function renderBoard() {
        // 清空所有列
        const cardContainers = document.querySelectorAll('.kanban-column__cards');
        cardContainers.forEach(container => container.innerHTML = '');

        // 应用筛选逻辑
        const filteredTasks = tasks.filter(task => {
            // 状态筛选
            const statusMatch = activeFilters.status.includes(task.status);
            
            // 日期筛选
            let dateMatch = true;
            if (activeFilters.date === 'upcoming') {
                if (!task.dueDate) {
                    dateMatch = false;
                } else {
                    const dueDate = new Date(task.dueDate);
                    const today = new Date();
                    const sevenDaysFromNow = new Date();
                    sevenDaysFromNow.setDate(today.getDate() + 7);
                    dateMatch = dueDate >= today && dueDate <= sevenDaysFromNow;
                }
            }

            // 优先级筛选
            const priorityMatch = activeFilters.priority === 'all' || task.priority === activeFilters.priority;

            // 标签筛选 (并集逻辑)
            const labelMatch = activeFilters.labels.length === 0 || 
                               (task.labels && task.labels.some(label => activeFilters.labels.includes(label)));

            return statusMatch && dateMatch && priorityMatch && labelMatch;
        });

        // 渲染任务
        filteredTasks.forEach(task => {
            const cardElement = createTaskCardElement(task);
            const columnContainer = document.querySelector(`.kanban-column__cards[data-status="${task.status}"]`);
            if (columnContainer) {
                columnContainer.appendChild(cardElement);
            }
        });

        // 更新每列的任务计数
        updateTaskCounts();
        
        // 应用搜索（在渲染后操作DOM）
        applySearch();
    }

    /**
     * @description 更新每列头部的任务计数
     */
    function updateTaskCounts() {
        const columns = document.querySelectorAll('.kanban-column');
        columns.forEach(column => {
            const status = column.dataset.status;
            const count = tasks.filter(task => task.status === status).length;
            column.querySelector('.task-count').textContent = count;
        });
    }


    // --- 5. 任务 CRUD (创建, 读取, 更新, 删除) ---

    /**
     * @description 打开模态框
     * @param {string} mode - 'add' 或 'edit'
     * @param {string|null} status - 如果是 'add' 模式，任务所属的列状态
     * @param {string|null} taskId - 如果是 'edit' 模式，要编辑的任务ID
     */
    function openModal(mode, status = null, taskId = null) {
        taskForm.reset();
        taskForm.querySelector('#task-id').value = '';
        document.querySelectorAll('.form-group.invalid').forEach(el => el.classList.remove('invalid'));
        
        if (mode === 'add') {
            modalTitle.textContent = '添加新任务';
            taskSubmitBtn.textContent = '创建任务';
            taskForm.dataset.mode = 'add';
            taskForm.dataset.status = status;
            // 设置默认优先级
            taskPriorityInput.value = 'medium';
            // 设置默认提醒
            taskReminderInput.value = '';
        } else if (mode === 'edit' && taskId) {
            modalTitle.textContent = '编辑任务';
            taskSubmitBtn.textContent = '保存更改';
            taskForm.dataset.mode = 'edit';
            
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                taskForm.querySelector('#task-id').value = task.id;
                taskForm.querySelector('#task-title').value = task.title;
                taskForm.querySelector('#task-description').value = task.description;
                taskForm.querySelector('#task-due-date').value = task.dueDate;
                taskPriorityInput.value = task.priority || 'medium';
                taskLabelsInput.value = (task.labels || []).join(', ');
                taskReminderInput.value = task.reminderType || '';
            }
        }
        
        renderLabelSuggestions();
        taskModal.showModal();
        taskForm.querySelector('#task-title').focus(); // 自动聚焦到第一个输入框
    }

    /**
     * @description 关闭模态框
     */
    function closeModal() {
        taskModal.close();
    }

    /**
     * @description 处理表单提交（新增或编辑）
     * @param {Event} e - 表单提交事件
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        if (!validateForm()) return;

        const id = taskForm.querySelector('#task-id').value;
        const title = taskForm.querySelector('#task-title').value.trim();
        const description = taskForm.querySelector('#task-description').value.trim();
        const dueDate = taskForm.querySelector('#task-due-date').value;
        const priority = taskPriorityInput.value;
        const reminderType = taskReminderInput.value;
        const labelNames = taskLabelsInput.value.split(',')
            .map(l => l.trim())
            .filter(l => l);

        // 处理新标签
        labelNames.forEach(name => {
            if (!labels[name]) {
                // 从预定义样式中随机选择颜色
                const randomIndex = Math.floor(Math.random() * TAG_STYLE_COUNT) + 1;
                labels[name] = `var(--Tags--styles${randomIndex})`;
            }
        });

        // 计算提醒时间
        let remindAt = null;
        if (reminderType && dueDate) {
            remindAt = calculateReminderTime(dueDate, reminderType);
        }

        const now = new Date().toISOString();

        if (taskForm.dataset.mode === 'add') {
            const newTask = {
                id: `task-${Date.now()}`,
                title,
                description,
                dueDate,
                priority,
                labels: labelNames,
                status: taskForm.dataset.status,
                createdAt: now,
                updatedAt: now,
                subtasks: [], // 初始化子任务数组
                reminderType,
                remindAt
            };
            tasks.push(newTask);
            
            // 处理附件上传
            handleTaskAttachments(newTask.id);
        } else {
            const task = tasks.find(t => t.id === id);
            if (task) {
                // 如果提醒时间改变了，需要移除旧的提醒
                if (task.remindAt !== remindAt) {
                    removeTaskReminder(task.id);
                }
                
                task.title = title;
                task.description = description;
                task.dueDate = dueDate;
                task.priority = priority;
                task.labels = labelNames;
                task.reminderType = reminderType;
                task.remindAt = remindAt;
                task.updatedAt = now;
                
                // 处理附件上传
                handleTaskAttachments(task.id);
            }
        }

        saveTasksToStorage();
        updateActiveReminders(); // 更新提醒列表
        renderBoard();
        renderLabelFilters(); // 更新侧边栏的标签筛选器
        closeModal();
    }

    /**
     * @description 处理任务附件上传
     * @param {string} taskId - 任务ID
     */
    function handleTaskAttachments(taskId) {
        const fileInput = document.getElementById('task-attachments');
        if (fileInput && fileInput.files.length > 0 && window.TaskDetails) {
            // 确保IndexedDB已初始化后再保存附件
            setTimeout(() => {
                const uploadPromises = Array.from(fileInput.files).map(file => {
                    if (file.size > 10 * 1024 * 1024) {
                        alert(`文件 "${file.name}" 超过10MB限制`);
                        return Promise.resolve(null);
                    }
                    return window.TaskDetails.saveAttachmentFromModal(taskId, file);
                });

                Promise.all(uploadPromises).then(results => {
                    const successCount = results.filter(r => r !== null).length;
                    if (successCount > 0) {
                        console.log(`成功保存 ${successCount} 个附件到任务 ${taskId}`);
                        // 显示成功提示
                        showAttachmentSuccessMessage(successCount);
                    }
                }).catch(error => {
                    console.error('附件保存失败:', error);
                    alert('附件保存失败，请重试');
                });
            }, 100); // 延迟100ms确保IndexedDB已初始化

            // 清空文件选择以便下次使用
            fileInput.value = '';
            updateFilePreview();
        }
    }

    /**
     * @description 显示附件保存成功消息
     * @param {number} count - 成功保存的附件数量
     */
    function showAttachmentSuccessMessage(count) {
        // 创建临时提示消息
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: var(--accent-color);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-weight: 500;
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;
        message.textContent = `成功保存 ${count} 个附件`;
        document.body.appendChild(message);

        // 3秒后自动移除
        setTimeout(() => {
            if (document.body.contains(message)) {
                message.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(message)) {
                        document.body.removeChild(message);
                    }
                }, 300);
            }
        }, 3000);
    }

    /**
     * @description 更新文件预览
     */
    function updateFilePreview() {
        const fileInput = document.getElementById('task-attachments');
        const preview = document.getElementById('selected-files-preview');
        
        if (!fileInput || !preview) return;
        
        preview.innerHTML = '';
        
        if (fileInput.files.length > 0) {
            Array.from(fileInput.files).forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'selected-file-item';
                fileItem.innerHTML = `
                    <span>${file.name}</span>
                    <span class="selected-file-remove" data-index="${index}">×</span>
                `;
                preview.appendChild(fileItem);
            });
        }
    }

    /**
     * @description 表单校验
     * @returns {boolean} - 是否通过校验
     */
    function validateForm() {
        let isValid = true;
        const titleInput = taskForm.querySelector('#task-title');
        const dueDateInput = taskForm.querySelector('#task-due-date');

        // 校验标题
        if (titleInput.value.trim() === '') {
            titleInput.parentElement.classList.add('invalid');
            isValid = false;
        } else {
            titleInput.parentElement.classList.remove('invalid');
        }

        // 校验日期
        if (dueDateInput.value) {
            const selectedDate = new Date(dueDateInput.value);
            selectedDate.setHours(0,0,0,0);
            const today = new Date();
            today.setHours(0,0,0,0);
            if (selectedDate < today) {
                dueDateInput.parentElement.classList.add('invalid');
                isValid = false;
            } else {
                dueDateInput.parentElement.classList.remove('invalid');
            }
        } else {
                dueDateInput.parentElement.classList.remove('invalid');
        }

        return isValid;
    }

    /**
     * @description 删除任务
     * @param {string} taskId - 要删除的任务ID
     */
function deleteTask(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        // 获取被删除任务的标签
        const deletedTask = tasks.find(t => t.id === taskId);
        const deletedLabels = deletedTask?.labels || [];
        
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasksToStorage();
        
        // 清理不再使用的标签
        deletedLabels.forEach(label => {
            // 检查标签是否还被其他任务使用
            const isLabelUsed = tasks.some(task => 
                task.labels && task.labels.includes(label)
            );
            
            if (!isLabelUsed) {
                // 从全局标签中移除
                delete labels[label];
                // 从激活筛选中移除
                activeFilters.labels = activeFilters.labels.filter(l => l !== label);
            }
        });
        
        saveTasksToStorage(); // 保存更新后的标签
        renderLabelFilters(); // 更新侧边栏标签
        renderBoard();
    }
}

    /**
     * @description 删除标签
     * @param {string} labelNameToDelete - 要删除的标签名
     */
    function deleteLabel(labelNameToDelete) {
        if (!confirm(`确定要删除标签 "${labelNameToDelete}" 吗？这会从所有任务中移除该标签。`)) {
            return;
        }

        // 1. 从全局 labels 对象中删除
        delete labels[labelNameToDelete];

        // 2. 从所有任务中移除该标签
        tasks.forEach(task => {
            if (task.labels && task.labels.includes(labelNameToDelete)) {
                task.labels = task.labels.filter(l => l !== labelNameToDelete);
            }
        });
        
        // 3. 从激活的筛选器中移除
        activeFilters.labels = activeFilters.labels.filter(l => l !== labelNameToDelete);

        // 4. 保存更改
        saveTasksToStorage();

        // 5. 重新渲染UI
        renderBoard();
        renderLabelFilters();
        renderLabelSuggestions(); // 更新模态框中的建议
    }

    // --- 6. 视图切换 ---

    /**
     * @description 设置看板的视图
     * @param {string} view - 'all', 'todo', 'in-progress', 'done', 'calendar'
     * @param {boolean} [isInitialLoad=false] - 是否是首次加载
     */
    function setView(view, isInitialLoad = false) {
        if (isAnimating && !isInitialLoad) return;

        currentView = view;
        isAnimating = !isInitialLoad;

        // 更新按钮状态
        const buttons = viewButtons.querySelectorAll('.nav__view-btn');
        buttons.forEach(btn => {
            const isPressed = btn.dataset.view === view;
            btn.setAttribute('aria-pressed', isPressed);
        });

        const columns = document.querySelectorAll('.kanban-column');
        
        if (view === 'calendar') {
            // 显示日历视图，隐藏看板
            kanbanBoard.style.display = 'none';
            calendarView.style.display = 'flex';
            renderCalendar();
        } else {
            // 显示看板，隐藏日历视图
            kanbanBoard.style.display = 'flex';
            calendarView.style.display = 'none';
            
            if (view === 'all') {
                kanbanBoard.classList.remove('zoomed-in');
                columns.forEach(col => {
                    col.classList.remove('is-hidden', 'is-zoomed');
                });
            } else {
                kanbanBoard.classList.add('zoomed-in');
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

        if (isAnimating) {
            // 在动画结束后解除禁用
            setTimeout(() => {
                isAnimating = false;
            }, 400); // 动画时长为 0.4s
        }
    }

    // --- 6. 拖拽交互 (Drag & Drop) ---

    function handleDragStart(e) {
        draggedTaskId = e.target.dataset.id;
        e.dataTransfer.setData('text/plain', draggedTaskId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => e.target.classList.add('dragging'), 0); // 使用setTimeout确保拖拽镜像已创建
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        draggedTaskId = null;
    }

    function handleDragOver(e) {
        e.preventDefault(); // 必须阻止默认行为才能触发drop事件
        const column = e.target.closest('.kanban-column');
        if (column) {
            column.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
            const column = e.target.closest('.kanban-column');
        if (column) {
            column.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        const column = e.target.closest('.kanban-column');
        if (column) {
            column.classList.remove('drag-over');
            const newStatus = column.dataset.status;
            const taskId = e.dataTransfer.getData('text/plain');
            
            const task = tasks.find(t => t.id === taskId);
            if (task && task.status !== newStatus) {
                task.status = newStatus;
                const now = new Date().toISOString();
                task.updatedAt = now;
                // Set completion time only once when moved to 'done'
                if (newStatus === 'done' && !task.completedAt) {
                    task.completedAt = now;
                }
                saveTasksToStorage();
                renderBoard();
            }
        }
    }

    // --- 7. Subtask Management ---

    /**
     * @description Toggles the visibility of the subtask panel.
     * @param {HTMLElement} cardElement - The parent task card element.
     */
    function toggleSubtaskPanel(cardElement) {
        const panel = cardElement.querySelector('.subtask-panel');
        const isVisible = panel.classList.contains('show');
        
        // 如果不在多面板模式，关闭所有其他面板
        if (!multiPanelMode && !isVisible) {
            document.querySelectorAll('.subtask-panel.show').forEach(p => {
                if (p !== panel) {
                    p.classList.remove('show');
                    p.querySelector('.subtask-list').innerHTML = '';
                }
            });
        }

        if (isVisible) {
            panel.classList.remove('show');
            panel.querySelector('.subtask-list').innerHTML = '';
        } else {
            panel.classList.add('show');
            renderSubtasks(cardElement);
        }
    }

    /**
     * @description Renders the subtasks for a given task card.
     * @param {HTMLElement} cardElement - The parent task card element.
     */
    function renderSubtasks(cardElement) {
        const taskId = cardElement.dataset.id;
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.subtasks) return;

        const subtaskListEl = cardElement.querySelector('.subtask-list');
        subtaskListEl.innerHTML = ''; // Clear existing subtasks

        task.subtasks.forEach(subtask => {
            const subtaskEl = createSubtaskElement(subtask);
            subtaskListEl.appendChild(subtaskEl);
        });
    }

    /**
     * @description Creates a DOM element for a single subtask.
     * @param {object} subtask - The subtask object.
     * @returns {HTMLElement} The created subtask list item element.
     */
    function createSubtaskElement(subtask) {
        const item = document.createElement('li');
        item.className = 'subtask-item';
        item.dataset.id = subtask.id;
        item.dataset.status = subtask.status;
        item.setAttribute('draggable', 'true');

        item.innerHTML = `
            <div class="subtask-item__status" role="checkbox" aria-checked="${subtask.status === 'done'}" tabindex="0"></div>
            <span class="subtask-item__title" contenteditable="true">${subtask.title}</span>
            <div class="subtask-item__actions">
                <button class="subtask-item__delete-btn" aria-label="删除子任务">&times;</button>
            </div>
        `;
        return item;
    }

    /**
     * @description Adds a new subtask to a parent task.
     * @param {string} taskId - The ID of the parent task.
     * @param {string} title - The title of the new subtask.
     */
    function addSubtask(taskId, title) {
        const task = tasks.find(t => t.id === taskId);
        if (task && title.trim()) {
            const newSubtask = {
                id: `subtask-${Date.now()}`,
                title: title.trim(),
                status: 'todo' // 'todo' or 'done'
            };
            if (!task.subtasks) {
                task.subtasks = [];
            }
            task.subtasks.push(newSubtask);
            saveTasksToStorage();
            renderBoard(); // Re-render to show progress bar update
            
            // After re-rendering, find the card and re-open the panel
            setTimeout(() => {
                const cardElement = document.querySelector(`.task-card[data-id="${taskId}"]`);
                if (cardElement) {
                    const panel = cardElement.querySelector('.subtask-panel');
                    if (!panel.classList.contains('show')) {
                        toggleSubtaskPanel(cardElement);
                    } else {
                        renderSubtasks(cardElement);
                    }
                    // Focus the new subtask input
                    cardElement.querySelector('.add-subtask-input').focus();
                }
            }, 0);
        }
    }

    /**
     * @description Updates a subtask (title or status).
     * @param {string} taskId - The ID of the parent task.
     * @param {string} subtaskId - The ID of the subtask to update.
     * @param {object} updates - An object with properties to update (e.g., { title, status }).
     */
    function updateSubtask(taskId, subtaskId, updates) {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.subtasks) {
            const subtask = task.subtasks.find(st => st.id === subtaskId);
            if (subtask) {
                Object.assign(subtask, updates);
                saveTasksToStorage();
                renderBoard();
                
                setTimeout(() => {
                    const cardElement = document.querySelector(`.task-card[data-id="${taskId}"]`);
                    if (cardElement) {
                        const panel = cardElement.querySelector('.subtask-panel');
                        if (!panel.classList.contains('show')) {
                           toggleSubtaskPanel(cardElement);
                        } else {
                           renderSubtasks(cardElement);
                        }
                    }
                }, 0);
            }
        }
    }

    /**
     * @description Deletes a subtask.
     * @param {string} taskId - The ID of the parent task.
     * @param {string} subtaskId - The ID of the subtask to delete.
     */
    function deleteSubtask(taskId, subtaskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.subtasks) {
            task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
            saveTasksToStorage();
            renderBoard();
            
            setTimeout(() => {
                const cardElement = document.querySelector(`.task-card[data-id="${taskId}"]`);
                if (cardElement) {
                    const panel = cardElement.querySelector('.subtask-panel');
                    if (!panel.classList.contains('show')) {
                       toggleSubtaskPanel(cardElement);
                    } else {
                       renderSubtasks(cardElement);
                    }
                }
            }, 0);
        }
    }

    // Drag and drop for subtasks
    let draggedSubtaskInfo = null;

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.subtask-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- 8. 搜索与筛选 ---

    /**
     * @description 渲染侧边栏的标签筛选器
     */
    function renderLabelFilters() {
        labelFilterContainer.innerHTML = '';
        if (Object.keys(labels).length === 0) {
            labelFilterContainer.textContent = '暂无标签';
            return;
        }
        Object.keys(labels).forEach(labelName => {
            const tagWrapper = document.createElement('div');
            tagWrapper.className = 'label-filter-tag-wrapper';

            const tag = document.createElement('span');
            tag.className = 'label-filter-tag';
            tag.textContent = labelName;
            tag.dataset.label = labelName;
            tag.style.backgroundColor = labels[labelName];
            
            if (activeFilters.labels.includes(labelName)) {
                tag.classList.add('active');
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'label-delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.setAttribute('aria-label', `删除标签 ${labelName}`);
            deleteBtn.dataset.label = labelName;

            tagWrapper.appendChild(tag);
            tagWrapper.appendChild(deleteBtn);
            labelFilterContainer.appendChild(tagWrapper);
        });
    }

    /**
     * @description 在模态框中渲染标签建议
     */
    function renderLabelSuggestions() {
        labelSuggestionsContainer.innerHTML = '';
        Object.keys(labels).forEach(labelName => {
            const suggestionWrapper = document.createElement('div');
            suggestionWrapper.className = 'label-suggestion-item-wrapper';

            const suggestion = document.createElement('span');
            suggestion.className = 'label-suggestion-item';
            suggestion.textContent = labelName;
            suggestion.dataset.label = labelName;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'label-delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.setAttribute('aria-label', `删除标签 ${labelName}`);
            deleteBtn.dataset.label = labelName;

            suggestionWrapper.appendChild(suggestion);
            suggestionWrapper.appendChild(deleteBtn);
            labelSuggestionsContainer.appendChild(suggestionWrapper);
        });
    }
    
    function applySearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const allCards = document.querySelectorAll('.task-card');

        allCards.forEach(card => {
            const titleEl = card.querySelector('.task-card__title');
            const descEl = card.querySelector('.task-card__description');
            const title = titleEl.textContent.toLowerCase();
            const description = descEl.textContent.toLowerCase();
            
            // 清除旧的高亮
            titleEl.innerHTML = titleEl.textContent;
            descEl.innerHTML = descEl.textContent;

            const isMatch = searchTerm === '' || title.includes(searchTerm) || description.includes(searchTerm);
            card.classList.toggle('hidden', !isMatch);

            if (isMatch && searchTerm !== '') {
                // 添加新的高亮
                const regex = new RegExp(searchTerm, 'gi');
                titleEl.innerHTML = titleEl.textContent.replace(regex, match => `<mark>${match}</mark>`);
                descEl.innerHTML = descEl.textContent.replace(regex, match => `<mark>${match}</mark>`);
            }
        });
    }
    
    function applyFilters() {
        // 状态筛选
        const statusCheckboxes = filterDropdown.querySelectorAll('input[name="status"]');
        activeFilters.status = Array.from(statusCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // 日期筛选
        const dateCheckboxes = filterDropdown.querySelectorAll('input[name="date"]');
        const upcomingCheckbox = Array.from(dateCheckboxes).find(cb => cb.value === 'upcoming');
        activeFilters.date = upcomingCheckbox.checked ? 'upcoming' : null;
        
        // 优先级筛选
        activeFilters.priority = priorityFilter.value;

        // 标签筛选状态由其自己的点击事件处理，这里只需重新渲染
        renderBoard();
    }

    // --- 9. 可访问性与键盘操作 ---
    
    function handleCardKeydown(e) {
        const card = e.currentTarget;
        let focusTarget = null;
        
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            focusTarget = card.previousElementSibling;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            focusTarget = card.nextElementSibling;
        }
        
        if (focusTarget) {
            focusTarget.focus();
        }
    }

    // --- 9. 事件监听器设置 ---
    function addEventListeners() {
        // 主题切换
        themeSwitcher.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            themeSwitcher.textContent = newTheme === 'light' ? '切换深色' : '切换浅色';
            saveThemeToStorage(newTheme);
        });

        // 导航栏折叠
        navToggle.addEventListener('click', () => {
            appNav.classList.toggle('collapsed');
            const isCollapsed = appNav.classList.contains('collapsed');
            navToggle.querySelector('.nav__list-text').textContent = isCollapsed ? '展开导航' : '收起导航';
            navToggle.setAttribute('aria-label', isCollapsed ? '展开导航栏' : '折叠导航栏');
        });

        // 视图切换按钮 (事件委托)
        viewButtons.addEventListener('click', e => {
            const targetButton = e.target.closest('.nav__view-btn');
            if (targetButton) {
                const newView = targetButton.dataset.view;
                // 如果点击当前已放大的视图，则返回“全部”视图
                if (currentView !== 'all' && currentView === newView) {
                    setView('all');
                } else {
                    setView(newView);
                }
            }
        });

        // 添加任务按钮 (事件委托)
        kanbanBoard.addEventListener('click', e => {
            if (e.target.matches('.add-task-btn')) {
                const status = e.target.dataset.status;
                openModal('add', status);
            }
        });

        // 模态框
        modalCloseBtn.addEventListener('click', closeModal);
        taskModal.addEventListener('close', () => {
            // 当通过 Esc 键关闭时，也需要处理
            // 焦点将自动返回到触发元素，<dialog> 元素已处理
        });
        taskForm.addEventListener('submit', handleFormSubmit);

        // 卡片菜单、编辑、删除、子任务 (事件委托)
        kanbanBoard.addEventListener('click', e => {
            // --- Main task card actions ---
            const menuBtn = e.target.closest('.task-card__menu-btn');
            if (menuBtn) {
                document.querySelectorAll('.task-card__menu.show').forEach(menu => {
                    if (menu !== menuBtn.nextElementSibling) menu.classList.remove('show');
                });
                menuBtn.nextElementSibling.classList.toggle('show');
                return;
            }

            const editBtn = e.target.closest('.edit-task-btn');
            if (editBtn) {
                const taskId = editBtn.closest('.task-card').dataset.id;
                openModal('edit', null, taskId);
                return;
            }

            const deleteBtn = e.target.closest('.delete-task-btn');
            if (deleteBtn) {
                const taskId = deleteBtn.closest('.task-card').dataset.id;
                deleteTask(taskId);
                return;
            }

            const viewDetailsBtn = e.target.closest('.view-details-btn');
            if (viewDetailsBtn) {
                const taskId = viewDetailsBtn.closest('.task-card').dataset.id;
                if (window.TaskDetails) {
                    window.TaskDetails.openTaskDetail(taskId);
                }
                return;
            }

            // --- Subtask actions ---
            const viewSubtasksBtn = e.target.closest('.view-subtasks-btn');
            if (viewSubtasksBtn) {
                const card = viewSubtasksBtn.closest('.task-card');
                toggleSubtaskPanel(card);
                return;
            }

            const addSubtaskBtn = e.target.closest('.add-subtask-btn');
            if (addSubtaskBtn) {
                const card = addSubtaskBtn.closest('.task-card');
                const input = card.querySelector('.add-subtask-input');
                const taskId = card.dataset.id;
                if (input.value) {
                    addSubtask(taskId, input.value);
                    input.value = '';
                }
                return;
            }

            const subtaskStatus = e.target.closest('.subtask-item__status');
            if (subtaskStatus) {
                const subtaskItem = subtaskStatus.closest('.subtask-item');
                const card = subtaskStatus.closest('.task-card');
                const taskId = card.dataset.id;
                const subtaskId = subtaskItem.dataset.id;
                const newStatus = subtaskItem.dataset.status === 'done' ? 'todo' : 'done';
                updateSubtask(taskId, subtaskId, { status: newStatus });
                return;
            }

            const deleteSubtaskBtn = e.target.closest('.subtask-item__delete-btn');
            if (deleteSubtaskBtn) {
                const subtaskItem = deleteSubtaskBtn.closest('.subtask-item');
                const card = deleteSubtaskBtn.closest('.task-card');
                const taskId = card.dataset.id;
                const subtaskId = subtaskItem.dataset.id;
                if (confirm('确定要删除这个子任务吗？')) {
                    deleteSubtask(taskId, subtaskId);
                }
                return;
            }
            
            // 点击卡片菜单以外的区域关闭菜单
            if (!e.target.closest('.task-card__menu')) {
                document.querySelectorAll('.task-card__menu.show').forEach(menu => menu.classList.remove('show'));
            }
        });

        // --- Subtask specific listeners (for keydown, blur, drag) ---
        kanbanBoard.addEventListener('keydown', e => {
            // Add subtask on Enter key
            if (e.key === 'Enter' && e.target.matches('.add-subtask-input')) {
                e.preventDefault();
                const card = e.target.closest('.task-card');
                const taskId = card.dataset.id;
                if (e.target.value) {
                    addSubtask(taskId, e.target.value);
                    e.target.value = '';
                }
            }
            // Toggle subtask status on Enter/Space key
            if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.subtask-item__status')) {
                 e.preventDefault();
                 e.target.click(); // Trigger the click handler
            }
        });

        kanbanBoard.addEventListener('blur', e => {
            // Save subtask title on blur
            if (e.target.matches('.subtask-item__title')) {
                const subtaskItem = e.target.closest('.subtask-item');
                const card = e.target.closest('.task-card');
                const taskId = card.dataset.id;
                const subtaskId = subtaskItem.dataset.id;
                const newTitle = e.target.textContent.trim();
                
                const task = tasks.find(t => t.id === taskId);
                const subtask = task?.subtasks.find(st => st.id === subtaskId);

                if (subtask && subtask.title !== newTitle) {
                    if (!newTitle) {
                        // If title is empty, revert to old title
                        e.target.textContent = subtask.title;
                    } else {
                        updateSubtask(taskId, subtaskId, { title: newTitle });
                    }
                }
            }
        }, true); // Use capture phase to catch blur event reliably

        // --- Subtask Drag and Drop Listeners ---
        kanbanBoard.addEventListener('dragstart', e => {
            if (e.target.matches('.subtask-item')) {
                e.stopPropagation(); // Prevent card drag from firing
                const card = e.target.closest('.task-card');
                draggedSubtaskInfo = {
                    element: e.target,
                    taskId: card.dataset.id,
                    subtaskId: e.target.dataset.id
                };
                setTimeout(() => e.target.classList.add('dragging'), 0);
            }
        });

        kanbanBoard.addEventListener('dragover', e => {
            if (draggedSubtaskInfo) {
                e.preventDefault();
                const list = e.target.closest('.subtask-list');
                if (list) {
                    const afterElement = getDragAfterElement(list, e.clientY);
                    const draggable = draggedSubtaskInfo.element;
                    if (afterElement == null) {
                        list.appendChild(draggable);
                    } else {
                        list.insertBefore(draggable, afterElement);
                    }
                }
            }
        });

        kanbanBoard.addEventListener('drop', e => {
            if (draggedSubtaskInfo) {
                e.preventDefault();
                e.stopPropagation(); // Prevent column drop from firing
                
                const { element, taskId } = draggedSubtaskInfo;
                element.classList.remove('dragging');

                const task = tasks.find(t => t.id === taskId);
                const subtaskListEl = element.closest('.subtask-list');

                if (task && subtaskListEl) {
                    const newOrderIds = [...subtaskListEl.querySelectorAll('.subtask-item')].map(item => item.dataset.id);
                    task.subtasks.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
                    saveTasksToStorage();
                }
                draggedSubtaskInfo = null;
            }
        });
        // 点击页面任何地方关闭菜单
        document.addEventListener('click', e => {
                if (!e.target.closest('.task-card__menu-btn')) {
                document.querySelectorAll('.task-card__menu.show').forEach(menu => menu.classList.remove('show'));
                }
        });


        // 拖拽事件监听器 (添加到列容器)
        document.querySelectorAll('.kanban-column').forEach(col => {
            col.addEventListener('dragover', handleDragOver);
            col.addEventListener('dragleave', handleDragLeave);
            col.addEventListener('drop', handleDrop);
        });
        
        // 搜索
        searchInput.addEventListener('input', applySearch);

        // 筛选
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('show');
        });
        document.addEventListener('click', e => {
            if (!filterDropdown.contains(e.target) && e.target !== filterBtn) {
                filterDropdown.classList.remove('show');
            }
        });
        filterDropdown.addEventListener('change', applyFilters);
        clearFiltersBtn.addEventListener('click', () => {
            // 重置状态和日期筛选
            filterDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                if (cb.name === 'status') cb.checked = true;
                else cb.checked = false;
            });
            // 重置优先级和标签筛选
            priorityFilter.value = 'all';
            activeFilters.labels = [];
            renderLabelFilters(); // 更新UI
            applyFilters();
        });

        // 新增的筛选监听器
        priorityFilter.addEventListener('change', applyFilters);

        labelFilterContainer.addEventListener('click', e => {
            const deleteBtn = e.target.closest('.label-delete-btn');
            const tag = e.target.closest('.label-filter-tag');

            if (deleteBtn) {
                e.stopPropagation(); // 防止触发标签点击事件
                const label = deleteBtn.dataset.label;
                deleteLabel(label);
                return;
            }

            if (tag) {
                const label = tag.dataset.label;
                tag.classList.toggle('active');
                
                // 更新 activeFilters.labels
                const activeLabels = new Set(activeFilters.labels);
                if (activeLabels.has(label)) {
                    activeLabels.delete(label);
                } else {
                    activeLabels.add(label);
                }
                activeFilters.labels = Array.from(activeLabels);
                
                renderBoard();
            }
        });

        // 模态框内标签建议的点击事件
        labelSuggestionsContainer.addEventListener('click', e => {
            const deleteBtn = e.target.closest('.label-delete-btn');
            const suggestion = e.target.closest('.label-suggestion-item');

            if (deleteBtn) {
                e.stopPropagation();
                const label = deleteBtn.dataset.label;
                deleteLabel(label);
                return;
            }

            if (suggestion) {
                const labelToAdd = suggestion.dataset.label;
                const currentLabels = new Set(taskLabelsInput.value.split(',').map(l => l.trim()).filter(l => l));
                
                if (!currentLabels.has(labelToAdd)) {
                    currentLabels.add(labelToAdd);
                    taskLabelsInput.value = Array.from(currentLabels).join(', ');
                }
            }
        });

        // 日历视图相关事件监听器
        calendarPrevBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        });

        calendarNextBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        });

        // 任务详情模态框事件监听器
        if (taskDetailCloseBtn && taskDetailModal) {
            taskDetailCloseBtn.addEventListener('click', () => {
                taskDetailModal.close();
            });
        }

        if (jumpToKanbanBtn) {
            jumpToKanbanBtn.addEventListener('click', jumpToKanban);
        }

        // 当天任务列表模态框事件监听器
        if (dayTasksCloseBtn && dayTasksModal) {
            dayTasksCloseBtn.addEventListener('click', () => {
                dayTasksModal.close();
            });
        }

        // 提醒横幅事件监听器
        reminderBannerClose.addEventListener('click', hideReminderBanner);

        // 文件上传预览事件监听器
        const taskAttachmentsInput = document.getElementById('task-attachments');
        if (taskAttachmentsInput) {
            taskAttachmentsInput.addEventListener('change', updateFilePreview);
        }

        // 文件预览删除事件监听器
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('selected-file-remove')) {
                const index = parseInt(e.target.dataset.index);
                const fileInput = document.getElementById('task-attachments');
                if (fileInput) {
                    // 创建新的文件列表，排除被删除的文件
                    const dt = new DataTransfer();
                    Array.from(fileInput.files).forEach((file, i) => {
                        if (i !== index) {
                            dt.items.add(file);
                        }
                    });
                    fileInput.files = dt.files;
                    updateFilePreview();
                }
            }
        });
    }

    // --- 10. 日历视图功能 ---
    
    /**
     * @description 渲染日历视图
     */
    function renderCalendar() {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        // 更新标题
        calendarTitle.textContent = `${year}年${month + 1}月`;
        
        // 清空日历
        calendarDays.innerHTML = '';
        
        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayWeekday = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        
        // 获取上个月的最后几天
        const prevMonth = new Date(year, month, 0);
        const daysInPrevMonth = prevMonth.getDate();
        
        // 渲染上个月的尾部日期
        for (let i = firstDayWeekday - 1; i >= 0; i--) {
            const dayNumber = daysInPrevMonth - i;
            const dayElement = createCalendarDayElement(dayNumber, true, year, month - 1);
            calendarDays.appendChild(dayElement);
        }
        
        // 渲染当月日期
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = createCalendarDayElement(day, false, year, month);
            calendarDays.appendChild(dayElement);
        }
        
        // 渲染下个月的开头日期
        const totalCells = calendarDays.children.length;
        const remainingCells = 42 - totalCells; // 6行 × 7列 = 42个格子
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = createCalendarDayElement(day, true, year, month + 1);
            calendarDays.appendChild(dayElement);
        }
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
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        // 检查是否是今天
        const today = new Date();
        const dayDate = new Date(year, month, day);
        if (!isOtherMonth &&
            dayDate.getDate() === today.getDate() &&
            dayDate.getMonth() === today.getMonth() &&
            dayDate.getFullYear() === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        // 获取当天的任务
        const dayTasks = getTasksForDate(year, month, day);
        
        dayElement.innerHTML = `
            <div class="calendar-day-number">${day}</div>
            <div class="calendar-tasks" data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}">
                ${renderCalendarTasks(dayTasks)}
            </div>
        `;
        
        // 添加点击事件
        dayElement.addEventListener('click', (e) => {
            if (e.target.closest('.calendar-task-item')) {
                // 点击任务项
                const taskId = e.target.closest('.calendar-task-item').dataset.taskId;
                showTaskDetail(taskId);
            } else if (e.target.closest('.calendar-more-tasks')) {
                // 点击"更多任务"
                const dateStr = e.target.closest('.calendar-tasks').dataset.date;
                showDayTasks(dateStr);
            }
        });
        
        return dayElement;
    }
    
    /**
     * @description 获取指定日期的任务
     * @param {number} year - 年份
     * @param {number} month - 月份
     * @param {number} day - 日期
     * @returns {Array} - 任务列表
     */
    function getTasksForDate(year, month, day) {
        // 创建本地日期对象 (00:00:00)
        const targetDate = new Date(year, month, day);
        targetDate.setHours(0,0,0,0);
        
        return tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0,0,0,0);
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
        
        const maxVisible = 3; // 最多显示3个任务
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
        const task = tasks.find(t => t.id === taskId);
        if (!task || !taskDetailContent || !taskDetailModal) return;
        
        selectedTaskForDetail = task;
        
        const statusNames = {
            'todo': '待办事项',
            'in-progress': '进行中',
            'done': '已完成'
        };
        
        const priorityNames = {
            'high': '高',
            'medium': '中',
            'low': '低'
        };
        
        taskDetailContent.innerHTML = `
            <div class="task-detail-item">
                <div class="task-detail-label">任务标题</div>
                <div class="task-detail-value">${task.title}</div>
            </div>
            <div class="task-detail-item">
                <div class="task-detail-label">任务描述</div>
                <div class="task-detail-value">${task.description || '无描述'}</div>
            </div>
            <div class="task-detail-item">
                <div class="task-detail-label">所属状态</div>
                <div class="task-detail-value">${statusNames[task.status]}</div>
            </div>
            <div class="task-detail-item">
                <div class="task-detail-label">优先级</div>
                <div class="task-detail-value">${priorityNames[task.priority]}</div>
            </div>
            <div class="task-detail-item">
                <div class="task-detail-label">到期时间</div>
                <div class="task-detail-value">${task.dueDate || '无截止日期'}</div>
            </div>
            ${task.labels && task.labels.length > 0 ? `
            <div class="task-detail-item">
                <div class="task-detail-label">标签</div>
                <div class="task-detail-value">${task.labels.join(', ')}</div>
            </div>
            ` : ''}
        `;
        
        taskDetailModal.showModal();
    }
    
    /**
     * @description 显示当天任务列表
     * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
     */
    function showDayTasks(dateStr) {
        if (!dayTasksTitle || !dayTasksContent || !dayTasksModal) return;

        const date = new Date(dateStr);
        const dayTasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate.toISOString().split('T')[0] === dateStr;
        });
        
        dayTasksTitle.textContent = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日的任务`;
        
        const statusNames = {
            'todo': '待办事项',
            'in-progress': '进行中',
            'done': '已完成'
        };
        
        dayTasksContent.innerHTML = `
            <div class="day-tasks-list">
                ${dayTasks.map(task => `
                    <div class="day-task-item status-${task.status}" data-task-id="${task.id}">
                        <div class="day-task-title">${task.title}</div>
                        <div class="day-task-status">${statusNames[task.status]}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // 添加点击事件
        dayTasksContent.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.day-task-item');
            if (taskItem) {
                const taskId = taskItem.dataset.taskId;
                if (dayTasksModal) {
                    dayTasksModal.close();
                }
                showTaskDetail(taskId);
            }
        });

        if (dayTasksModal) {
            dayTasksModal.showModal();
        }
    }
    
    /**
     * @description 跳转到看板并高亮任务
     */
    function jumpToKanban() {
        if (!selectedTaskForDetail) return;
        
        if (taskDetailModal) {
            taskDetailModal.close();
        }
        setView(selectedTaskForDetail.status);
        
        // 高亮任务卡片
        setTimeout(() => {
            const taskCard = document.querySelector(`.task-card[data-id="${selectedTaskForDetail.id}"]`);
            if (taskCard) {
                taskCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                taskCard.style.boxShadow = '0 0 20px var(--accent-color)';
                setTimeout(() => {
                    taskCard.style.boxShadow = '';
                }, 2000);
            }
        }, 500);
    }
    
    // --- 11. 提醒功能 ---
    
    /**
     * @description 请求通知权限
     */
    function requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                notificationPermission = permission === 'granted';
                if (notificationPermission) {
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
    function calculateReminderTime(dueDate, reminderType) {
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
    function updateActiveReminders() {
        activeReminders = tasks.filter(task =>
            task.remindAt &&
            new Date(task.remindAt) > new Date() &&
            task.status !== 'done'
        );
    }
    
    /**
     * @description 开始提醒检查
     */
    function startReminderCheck() {
        if (reminderCheckInterval) {
            clearInterval(reminderCheckInterval);
        }
        
        // 每分钟检查一次
        reminderCheckInterval = setInterval(checkReminders, 60000);
        
        // 立即检查一次
        checkReminders();
        
        // 检查错过的提醒
        checkMissedReminders();
    }
    
    /**
     * @description 检查提醒
     */
    function checkReminders() {
        const now = new Date();
        
        activeReminders.forEach(task => {
            const reminderTime = new Date(task.remindAt);
            if (reminderTime <= now) {
                showReminder(task);
                // 标记为已提醒
                task.reminded = true;
                saveTasksToStorage();
            }
        });
        
        // 更新活跃提醒列表
        updateActiveReminders();
    }
    
    /**
     * @description 显示提醒
     * @param {Object} task - 任务对象
     */
    function showReminder(task) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const isOverdue = dueDate < now;
        
        const message = isOverdue ?
            `任务 "${task.title}" 已到期` :
            `任务 "${task.title}" 即将截止`;
        
        // 显示系统通知
        if (notificationPermission) {
            new Notification('任务提醒', {
                body: message,
                icon: '/favicon.ico'
            });
        }
        
        // 显示横幅提醒
        showReminderBanner(message);
    }
    
    /**
     * @description 显示提醒横幅
     * @param {string} message - 提醒消息
     */
    function showReminderBanner(message) {
        reminderBannerText.textContent = message;
        reminderBanner.style.display = 'block';
        
        // 5秒后自动隐藏
        setTimeout(() => {
            hideReminderBanner();
        }, 5000);
    }
    
    /**
     * @description 隐藏提醒横幅
     */
    function hideReminderBanner() {
        reminderBanner.style.display = 'none';
    }
    
    /**
     * @description 检查错过的提醒
     */
    function checkMissedReminders() {
        const now = new Date();
        const missedTasks = tasks.filter(task =>
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
            
            // 标记为已提醒
            missedTasks.forEach(task => {
                task.reminded = true;
            });
            saveTasksToStorage();
        }
    }
    
    /**
     * @description 移除任务提醒
     * @param {string} taskId - 任务ID
     */
    function removeTaskReminder(taskId) {
        activeReminders = activeReminders.filter(task => task.id !== taskId);
    }

    // --- 12. 应用初始化 ---
    // 初始化多面板按钮状态
    function initMultiPanelToggle() {
        const toggleBtn = document.getElementById('multi-panel-toggle');
        if (!toggleBtn) return;
        
        // 设置初始状态
        if (multiPanelMode) {
            toggleBtn.classList.add('active');
        }
        
        toggleBtn.addEventListener('click', () => {
            multiPanelMode = !multiPanelMode;
            toggleBtn.classList.toggle('active');
            
            // 添加视觉反馈
            toggleBtn.style.animation = 'none';
            setTimeout(() => {
                toggleBtn.style.animation = 'bounce 0.6s ease';
            }, 10);
        });
    }

    function initApp() {
        const startApp = () => {
            loadThemeFromStorage();
            loadTasksFromStorage();
            addEventListeners();
            renderBoard();
            renderLabelFilters();
            initMultiPanelToggle(); // 初始化多面板模式按钮

            // 初始化视图
            const savedView = loadViewFromStorage();
            setView(savedView, true); // 初始加载，无动画

            // 初始化提醒功能
            updateActiveReminders();
            requestNotificationPermission();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startApp);
        } else {
            startApp();
        }
    }

    // 启动应用
    initApp();

    /**
     * @description 导出看板数据为JSON文件
     */
    function exportBoard() {
        const boardData = {
            tasks: tasks,
            labels: labels,
            version: '1.0'
        };
        
        const boardName = document.querySelector('.app-header__title').textContent || '看板';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `kanban-${boardName}-${timestamp}.json`;
        
        const blob = new Blob([JSON.stringify(boardData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * @description 导入看板数据
     */
    function importBoard() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const boardData = JSON.parse(e.target.result);
                    
                    // 基本验证
                    if (!boardData.tasks || !boardData.labels) {
                        throw new Error('无效的看板文件格式');
                    }
                    
                    // 处理重名看板
                    const existingBoardNames = new Set();
                    // 实际项目中这里需要从存储中获取已有看板列表
                    // 此处简化处理：假设只有一个看板，导入后添加"副本"后缀
                    const newBoardName = document.querySelector('.app-header__title').textContent + '_副本';
                    document.querySelector('.app-header__title').textContent = newBoardName;
                    
                    // 导入数据
                    tasks = boardData.tasks;
                    labels = boardData.labels;
                    
                    // 保存并刷新
                    saveTasksToStorage();
                    renderBoard();
                    renderLabelFilters();
                    
                    alert('看板导入成功！');
                } catch (error) {
                    console.error('导入失败:', error);
                    alert(`导入失败: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    /**
     * @description 添加导入导出功能的事件监听
     */
    function addImportExportListeners() {
        document.getElementById('export-board-btn').addEventListener('click', exportBoard);
        document.getElementById('import-board-btn').addEventListener('click', importBoard);
    }

    // 初始化导入导出功能
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addImportExportListeners);
    } else {
        addImportExportListeners();
    }

    // --- 暴露必要的函数到全局作用域，供键盘快捷键模块使用 ---
    window.openModal = openModal;
    window.deleteTask = deleteTask;
})();
