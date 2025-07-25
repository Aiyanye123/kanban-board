import * as DOM from './dom.js';
import state from './state.js';
import { renderBoard } from './ui.js';
import { renderLabelFilters } from './label.js';

export function applySearch() {
    const searchTerm = DOM.searchInput.value.toLowerCase().trim();
    const allCards = document.querySelectorAll('.task-card');

    allCards.forEach(card => {
        const titleEl = card.querySelector('.task-card__title');
        const descEl = card.querySelector('.task-card__description');
        const title = titleEl.textContent.toLowerCase();
        const description = descEl.textContent.toLowerCase();
        
        titleEl.innerHTML = titleEl.textContent;
        descEl.innerHTML = descEl.textContent;

        const isMatch = searchTerm === '' || title.includes(searchTerm) || description.includes(searchTerm);
        card.classList.toggle('hidden', !isMatch);

        if (isMatch && searchTerm !== '') {
            const regex = new RegExp(searchTerm, 'gi');
            titleEl.innerHTML = titleEl.textContent.replace(regex, match => `<mark>${match}</mark>`);
            descEl.innerHTML = descEl.textContent.replace(regex, match => `<mark>${match}</mark>`);
        }
    });
}

export function applyFilters() {
    const statusCheckboxes = DOM.filterDropdown.querySelectorAll('input[name="status"]');
    state.activeFilters.status = Array.from(statusCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    const dateCheckboxes = DOM.filterDropdown.querySelectorAll('input[name="date"]');
    const upcomingCheckbox = Array.from(dateCheckboxes).find(cb => cb.value === 'upcoming');
    state.activeFilters.date = upcomingCheckbox.checked ? 'upcoming' : null;
    
    state.activeFilters.priority = DOM.priorityFilter.value;

    renderBoard();
}

export function clearFilters() {
    DOM.filterDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.name === 'status') cb.checked = true;
        else cb.checked = false;
    });
    DOM.priorityFilter.value = 'all';
    state.activeFilters.labels = [];
    renderLabelFilters();
    applyFilters();
}
