import * as DOM from './dom.js';
import state from './state.js';
import { saveTasksToStorage } from './storage.js';
import { renderBoard } from './ui.js';

/**
 * @description 渲染侧边栏的标签筛选器
 */
export function renderLabelFilters() {
    DOM.labelFilterContainer.innerHTML = '';
    if (Object.keys(state.labels).length === 0) {
        DOM.labelFilterContainer.textContent = '暂无标签';
        return;
    }
    Object.keys(state.labels).forEach(labelName => {
        const tagWrapper = document.createElement('div');
        tagWrapper.className = 'label-filter-tag-wrapper';

        const tag = document.createElement('span');
        tag.className = 'label-filter-tag';
        tag.textContent = labelName;
        tag.dataset.label = labelName;
        tag.style.backgroundColor = state.labels[labelName];
        
        if (state.activeFilters.labels.includes(labelName)) {
            tag.classList.add('active');
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'label-delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.setAttribute('aria-label', `删除标签 ${labelName}`);
        deleteBtn.dataset.label = labelName;

        tagWrapper.appendChild(tag);
        tagWrapper.appendChild(deleteBtn);
        DOM.labelFilterContainer.appendChild(tagWrapper);
    });
}

/**
 * @description 在模态框中渲染标签建议
 */
export function renderLabelSuggestions() {
    DOM.labelSuggestionsContainer.innerHTML = '';
    Object.keys(state.labels).forEach(labelName => {
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
        DOM.labelSuggestionsContainer.appendChild(suggestionWrapper);
    });
}

/**
 * @description 删除标签
 * @param {string} labelNameToDelete - 要删除的标签名
 */
export function deleteLabel(labelNameToDelete) {
    if (!confirm(`确定要删除标签 "${labelNameToDelete}" 吗？这会从所有任务中移除该标签。`)) {
        return;
    }

    delete state.labels[labelNameToDelete];

    state.tasks.forEach(task => {
        if (task.labels && task.labels.includes(labelNameToDelete)) {
            task.labels = task.labels.filter(l => l !== labelNameToDelete);
        }
    });
    
    state.activeFilters.labels = state.activeFilters.labels.filter(l => l !== labelNameToDelete);

    saveTasksToStorage();

    renderBoard();
    renderLabelFilters();
    renderLabelSuggestions();
}
