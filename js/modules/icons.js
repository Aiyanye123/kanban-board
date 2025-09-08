// 注入统一的 SVG 图标到按钮（保存视图 / 导入 / 导出 / 工具栏）
export function injectIcons() {
    // 保存为视图（侧边栏）
    const saveBtn = document.getElementById('save-view-btn');
    if (saveBtn) {
        saveBtn.innerHTML = `
            <span class="nav__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 3h12a1 1 0 0 1 1 1v16l-7-4-7 4V4a1 1 0 0 1 1-1z"></path>
                </svg>
            </span>
            <span class="nav__text nav__list-text">保存为视图</span>
        `;
        saveBtn.title = '保存为视图';
    }

    // 导出（侧边栏）
    const exportNavBtn = document.getElementById('export-board-btn');
    if (exportNavBtn) {
        exportNavBtn.innerHTML = `
            <span class="nav__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v12"></path>
                    <path d="M7 8l5-5 5 5"></path>
                    <rect x="4" y="15" width="16" height="6" rx="2"></rect>
                </svg>
            </span>
            <span class="nav__text nav__list-text">导出看板</span>
        `;
        exportNavBtn.title = '导出看板';
    }

    // 导入（侧边栏）
    const importNavBtn = document.getElementById('import-board-btn');
    if (importNavBtn) {
        importNavBtn.innerHTML = `
            <span class="nav__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 21V9"></path>
                    <path d="M7 14l5 5 5-5"></path>
                    <rect x="4" y="3" width="16" height="6" rx="2"></rect>
                </svg>
            </span>
            <span class="nav__text nav__list-text">导入看板</span>
        `;
        importNavBtn.title = '导入看板';
    }

    // 工具栏 导出/导入
    const toolbarExport = document.querySelector('.board-action-btn[data-action="export"]');
    if (toolbarExport) {
        toolbarExport.innerHTML = `
            <span class="btn__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v12"></path>
                    <path d="M7 8l5-5 5 5"></path>
                    <rect x="4" y="15" width="16" height="6" rx="2"></rect>
                </svg>
            </span>
            导出`;
        toolbarExport.setAttribute('aria-label', '导出看板');
    }

    const toolbarImport = document.querySelector('.board-action-btn[data-action="import"]');
    if (toolbarImport) {
        toolbarImport.innerHTML = `
            <span class="btn__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 21V9"></path>
                    <path d="M7 14l5 5 5-5"></path>
                    <rect x="4" y="3" width="16" height="6" rx="2"></rect>
                </svg>
            </span>
            导入`;
        toolbarImport.setAttribute('aria-label', '导入看板');
    }

    // 修复多面板按钮的文案与无障碍
    const multiToggle = document.getElementById('multi-panel-toggle');
    if (multiToggle) {
        multiToggle.setAttribute('aria-label', '多面板模式');
        const text = multiToggle.querySelector('.toggle-text');
        if (text) text.textContent = '多面板切换';
    }
}

