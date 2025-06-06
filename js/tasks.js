import { state } from './state.js';
import { taskForm, modalTitle, taskSubmitBtn, taskPriorityInput, taskLabelsInput, labelSuggestionsContainer, taskReminderInput } from './dom.js';
import { saveTasksToStorage } from './storage.js';
import { renderBoard } from './render.js';

// --- 5. 任务 CRUD (创建, 读取, 更新, 删除) ---

function openModal(mode, status = null, taskId = null) {
    taskForm.reset();
    taskForm.querySelector('#task-id').value = '';
    document.querySelectorAll('.form-group.invalid').forEach(el => el.classList.remove('invalid'));

    if (mode === 'add') {
        modalTitle.textContent = '添加新任务';
        taskSubmitBtn.textContent = '创建任务';
        taskForm.dataset.mode = 'add';
        taskForm.dataset.status = status;
        taskPriorityInput.value = 'medium';
    } else if (mode === 'edit') {
        modalTitle.textContent = '编辑任务';
        taskSubmitBtn.textContent = '保存修改';
        taskForm.dataset.mode = 'edit';
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            taskForm.querySelector('#task-id').value = task.id;
            taskForm.querySelector('#task-title').value = task.title;
            taskForm.querySelector('#task-description').value = task.description || '';
            taskForm.querySelector('#task-due-date').value = task.dueDate || '';
            taskPriorityInput.value = task.priority || 'medium';
            taskReminderInput.value = task.reminder || 'none';
            taskLabelsInput.value = (task.labels || []).join(',');
        }
    }
    taskModal.showModal();
}

function closeModal() {
    taskModal.close();
}

function handleFormSubmit(e) {
    e.preventDefault();
    const id = taskForm.querySelector('#task-id').value;
    const title = taskForm.querySelector('#task-title').value.trim();
    const description = taskForm.querySelector('#task-description').value.trim();
    const dueDate = taskForm.querySelector('#task-due-date').value;
    const priority = taskPriorityInput.value;
    const reminderType = taskReminderInput.value;
    const labelNames = taskLabelsInput.value.split(',').map(l => l.trim()).filter(l => l);

    if (!validateForm()) return;

    if (taskForm.dataset.mode === 'add') {
        const newTask = {
            id: Date.now().toString(),
            title,
            description,
            dueDate,
            priority,
            reminder: reminderType,
            status: taskForm.dataset.status,
            labels: labelNames,
            subtasks: []
        };
        state.tasks.push(newTask);
    } else if (taskForm.dataset.mode === 'edit') {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, { title, description, dueDate, priority, reminder: reminderType, labels: labelNames });
        }
    }

    saveTasksToStorage();
    renderBoard();
    closeModal();
}

function validateForm() {
    const title = taskForm.querySelector('#task-title').value.trim();
    if (!title) {
        taskForm.querySelector('#task-title').parentElement.classList.add('invalid');
        return false;
    }
    return true;
}

function deleteTask(taskId) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    saveTasksToStorage();
    renderBoard();
}

function deleteLabel(labelNameToDelete) {
    delete state.labels[labelNameToDelete];
    state.tasks.forEach(task => {
        task.labels = (task.labels || []).filter(l => l !== labelNameToDelete);
    });
    saveTasksToStorage();
    renderBoard();
}

// --- 7. Subtask Management ---
function toggleSubtaskPanel(cardElement) {
    const panel = cardElement.querySelector('.subtask-panel');
    panel.classList.toggle('show');
    if (panel.classList.contains('show')) {
        renderSubtasks(cardElement);
    }
}

function renderSubtasks(cardElement) {
    const taskId = cardElement.dataset.id;
    const task = state.tasks.find(t => t.id === taskId);
    const list = cardElement.querySelector('.subtask-list');
    list.innerHTML = '';
    if (task && task.subtasks) {
        task.subtasks.forEach(subtask => {
            const subtaskEl = createSubtaskElement(subtask);
            list.appendChild(subtaskEl);
        });
    }
}

function createSubtaskElement(subtask) {
    const li = document.createElement('li');
    li.className = 'subtask-item';
    li.dataset.id = subtask.id;
    li.textContent = subtask.title;
    if (subtask.status === 'done') {
        li.classList.add('done');
    }
    return li;
}

function addSubtask(taskId, title) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        const newSubtask = {
            id: Date.now().toString(),
            title,
            status: 'todo'
        };
        task.subtasks.push(newSubtask);
        saveTasksToStorage();
        renderBoard();
    }
}

function updateSubtask(taskId, subtaskId, updates) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (subtask) {
            Object.assign(subtask, updates);
            saveTasksToStorage();
            renderBoard();
        }
    }
}

function deleteSubtask(taskId, subtaskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
        task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
        saveTasksToStorage();
        renderBoard();
    }
}

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

export { openModal, closeModal, handleFormSubmit, deleteTask, deleteLabel, toggleSubtaskPanel, addSubtask, updateSubtask, deleteSubtask, getDragAfterElement, renderSubtasks, createSubtaskElement, validateForm };
