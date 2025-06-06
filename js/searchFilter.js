import { state } from './state.js';
import { labelFilterContainer, labelSuggestionsContainer, priorityFilter } from './dom.js';
import { renderBoard } from './render.js';

// --- 8. 搜索与筛选 ---
export function renderLabelFilters() {
    labelFilterContainer.innerHTML = '';
    if (Object.keys(state.labels).length === 0) {
        labelFilterContainer.textContent = '暂无标签';
        return;
    }
    Object.keys(state.labels).forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'label-filter-btn';
        btn.textContent = label;
        btn.style.backgroundColor = state.labels[label];
        btn.addEventListener('click', () => {
            const idx = state.activeFilters.labels.indexOf(label);
            if (idx >= 0) {
                state.activeFilters.labels.splice(idx, 1);
                btn.classList.remove('active');
            } else {
                state.activeFilters.labels.push(label);
                btn.classList.add('active');
            }
            renderBoard();
        });
        labelFilterContainer.appendChild(btn);
    });
}

export function renderLabelSuggestions() {
    labelSuggestionsContainer.innerHTML = '';
    Object.keys(state.labels).forEach(label => {
        const item = document.createElement('div');
        item.className = 'label-suggestion';
        item.textContent = label;
        item.addEventListener('click', () => {
            const existing = labelSuggestionsContainer.previousElementSibling;
            if (existing.value) {
                existing.value += ',' + label;
            } else {
                existing.value = label;
            }
        });
        labelSuggestionsContainer.appendChild(item);
    });
}

export function applySearch() {
    const keyword = document.getElementById('search-input').value.toLowerCase();
    document.querySelectorAll('.task-card').forEach(card => {
        const title = card.querySelector('.task-card__title').textContent.toLowerCase();
        card.style.display = title.includes(keyword) ? '' : 'none';
    });
}

export function applyFilters() {
    const dateCheckboxes = document.querySelectorAll('input[name="date-filter"]');
    const upcomingCheckbox = Array.from(dateCheckboxes).find(cb => cb.value === 'upcoming');
    state.activeFilters.date = upcomingCheckbox.checked ? 'upcoming' : null;

    state.activeFilters.priority = priorityFilter.value;
    renderBoard();
}
