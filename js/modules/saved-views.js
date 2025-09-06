import * as DOM from './dom.js';
import state from './state.js';
import { renderBoard } from './ui.js';
import { renderLabelFilters } from './label.js';
import { setView } from './view.js';

const STORAGE_KEY = 'kanban_saved_views';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function listSavedViews() {
  const map = readAll();
  return Object.keys(map).map(name => ({ name, config: map[name] }));
}

export function saveCurrentAsView(name) {
  if (!name) return false;
  const map = readAll();
  map[name] = {
    view: state.currentView,
    filters: { ...state.activeFilters },
    search: (DOM.searchInput?.value || '').trim(),
  };
  writeAll(map);
  return true;
}

export function deleteSavedView(name) {
  const map = readAll();
  if (name in map) {
    delete map[name];
    writeAll(map);
  }
}

export function applySavedView(name) {
  const map = readAll();
  const cfg = map[name];
  if (!cfg) return;

  // 1) 视图切换
  setView(cfg.view || 'all');

  // 2) 恢复筛选状态 -> 驱动 UI 控件
  const filters = cfg.filters || {};
  state.activeFilters.status = filters.status || ['todo', 'in-progress', 'done'];
  state.activeFilters.date = filters.date || null;
  state.activeFilters.priority = filters.priority || 'all';
  state.activeFilters.labels = filters.labels || [];

  // 同步到控件
  if (DOM.filterDropdown) {
    // 状态
    DOM.filterDropdown.querySelectorAll('input[name="status"]').forEach(cb => {
      cb.checked = state.activeFilters.status.includes(cb.value);
    });
    // 日期
    const upcoming = DOM.filterDropdown.querySelector('input[name="date"][value="upcoming"]');
    if (upcoming) upcoming.checked = state.activeFilters.date === 'upcoming';
  }
  if (DOM.priorityFilter) DOM.priorityFilter.value = state.activeFilters.priority;

  // 标签筛选器需要重新渲染以附着 active 状态
  renderLabelFilters();

  // 3) 恢复搜索
  if (DOM.searchInput) DOM.searchInput.value = cfg.search || '';

  // 4) 渲染
  renderBoard();
}

export function renderSavedViewsList() {
  if (!DOM.savedViewsList) return;
  DOM.savedViewsList.innerHTML = '';
  const all = listSavedViews();
  all.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'nav__view-btn saved-view-item';
    btn.textContent = item.name;
    btn.dataset.viewName = item.name;
    DOM.savedViewsList.appendChild(btn);
  });
  if (all.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color: var(--text-secondary); font-size: 12px; padding: 4px 0;';
    empty.textContent = '暂无已保存视图';
    DOM.savedViewsList.appendChild(empty);
  }
}

export function bindSavedViewsEvents() {
  if (DOM.saveViewBtn) {
    DOM.saveViewBtn.addEventListener('click', () => {
      const name = prompt('保存为视图名称：');
      if (!name) return;
      saveCurrentAsView(name.trim());
      renderSavedViewsList();
    });
  }
  if (DOM.savedViewsList) {
    DOM.savedViewsList.addEventListener('click', (e) => {
      const btn = e.target.closest('.saved-view-item');
      if (btn) {
        applySavedView(btn.dataset.viewName);
      }
    });
  }
}

