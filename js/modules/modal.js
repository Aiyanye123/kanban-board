import * as DOM from './dom.js';
import state, { TAG_STYLE_COUNT } from './state.js';
import { saveTasksToStorage } from './storage.js';
import { renderBoard, updateFilePreview, showAttachmentSuccessMessage } from './ui.js';
import { renderLabelFilters, renderLabelSuggestions } from './label.js';
import { calculateReminderTime, updateActiveReminders, removeTaskReminder } from './reminder.js';

/**
 * @description 表单校验
 * @returns {boolean} - 是否通过校验
 */
function validateForm() {
    let isValid = true;
    const titleInput = DOM.taskForm.querySelector('#task-title');
    const dueDateInput = DOM.taskForm.querySelector('#task-due-date');

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
 * @description 处理任务附件上传
 * @param {string} taskId - 任务ID
 */
function handleTaskAttachments(taskId) {
    if (DOM.taskAttachmentsInput && DOM.taskAttachmentsInput.files.length > 0 && window.TaskDetails) {
        setTimeout(() => {
            const uploadPromises = Array.from(DOM.taskAttachmentsInput.files).map(file => {
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
                    showAttachmentSuccessMessage(successCount);
                }
            }).catch(error => {
                console.error('附件保存失败:', error);
                alert('附件保存失败，请重试');
            });
        }, 100); 

        DOM.taskAttachmentsInput.value = '';
        updateFilePreview();
    }
}

/**
 * @description 打开模态框
 * @param {string} mode - 'add' 或 'edit'
 * @param {string|null} status - 如果是 'add' 模式，任务所属的列状态
 * @param {string|null} taskId - 如果是 'edit' 模式，要编辑的任务ID
 */
export function openModal(mode, status = null, taskId = null) {
    DOM.taskForm.reset();
    DOM.taskForm.querySelector('#task-id').value = '';
    document.querySelectorAll('.form-group.invalid').forEach(el => el.classList.remove('invalid'));
    
    if (mode === 'add') {
        DOM.modalTitle.textContent = '添加新任务';
        DOM.taskSubmitBtn.textContent = '创建任务';
        DOM.taskForm.dataset.mode = 'add';
        DOM.taskForm.dataset.status = status;
        DOM.taskPriorityInput.value = 'medium';
        DOM.taskReminderInput.value = '';
    } else if (mode === 'edit' && taskId) {
        DOM.modalTitle.textContent = '编辑任务';
        DOM.taskSubmitBtn.textContent = '保存更改';
        DOM.taskForm.dataset.mode = 'edit';
        
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            DOM.taskForm.querySelector('#task-id').value = task.id;
            DOM.taskForm.querySelector('#task-title').value = task.title;
            DOM.taskForm.querySelector('#task-description').value = task.description;
            DOM.taskForm.querySelector('#task-due-date').value = task.dueDate;
            DOM.taskPriorityInput.value = task.priority || 'medium';
            DOM.taskLabelsInput.value = (task.labels || []).join(', ');
            DOM.taskReminderInput.value = task.reminderType || '';
        }
    }
    
    renderLabelSuggestions();
    DOM.taskModal.showModal();
    DOM.taskForm.querySelector('#task-title').focus();
}

/**
 * @description 关闭模态框
 */
export function closeModal() {
    DOM.taskModal.close();
}

/**
 * @description 处理表单提交（新增或编辑）
 * @param {Event} e - 表单提交事件
 */
export function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const id = DOM.taskForm.querySelector('#task-id').value;
    const title = DOM.taskForm.querySelector('#task-title').value.trim();
    const description = DOM.taskForm.querySelector('#task-description').value.trim();
    const dueDate = DOM.taskForm.querySelector('#task-due-date').value;
    const priority = DOM.taskPriorityInput.value;
    const reminderType = DOM.taskReminderInput.value;
    const labelNames = DOM.taskLabelsInput.value.split(',')
        .map(l => l.trim())
        .filter(l => l);

    labelNames.forEach(name => {
        if (!state.labels[name]) {
            const randomIndex = Math.floor(Math.random() * TAG_STYLE_COUNT) + 1;
            state.labels[name] = `var(--Tags--styles${randomIndex})`;
        }
    });

    let remindAt = null;
    if (reminderType && dueDate) {
        remindAt = calculateReminderTime(dueDate, reminderType);
    }

    const now = new Date().toISOString();

    if (DOM.taskForm.dataset.mode === 'add') {
        const newTask = {
            id: `task-${Date.now()}`,
            title,
            description,
            dueDate,
            priority,
            labels: labelNames,
            status: DOM.taskForm.dataset.status,
            createdAt: now,
            updatedAt: now,
            subtasks: [],
            reminderType,
            remindAt
        };
        state.tasks.push(newTask);
        handleTaskAttachments(newTask.id);
    } else {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
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
            
            handleTaskAttachments(task.id);
        }
    }

    saveTasksToStorage();
    updateActiveReminders();
    renderBoard();
    renderLabelFilters();
    closeModal();
}
