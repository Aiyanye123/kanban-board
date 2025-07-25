import state from './state.js';
import { saveTasksToStorage } from './storage.js';
import { renderBoard } from './ui.js';
import { renderLabelFilters } from './label.js';

/**
 * @description 删除任务
 * @param {string} taskId - 要删除的任务ID
 */
export function deleteTask(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        const deletedTask = state.tasks.find(t => t.id === taskId);
        const deletedLabels = deletedTask?.labels || [];
        
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        
        deletedLabels.forEach(label => {
            const isLabelUsed = state.tasks.some(task => 
                task.labels && task.labels.includes(label)
            );
            
            if (!isLabelUsed) {
                delete state.labels[label];
                state.activeFilters.labels = state.activeFilters.labels.filter(l => l !== label);
            }
        });
        
        saveTasksToStorage();
        renderLabelFilters();
        renderBoard();
    }
}

/**
 * @description 移动任务到新的状态
 * @param {string} taskId - 要移动的任务ID
 * @param {string} newStatus - 新的状态
 */
export function moveTask(taskId, newStatus) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        saveTasksToStorage();
        renderBoard();
    }
}
