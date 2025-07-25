import state from './state.js';
import { saveTasksToStorage } from './storage.js';
import { renderBoard } from './ui.js';
import { renderLabelFilters } from './label.js';

/**
 * @description 导出看板数据为JSON文件
 */
export function exportBoard() {
    const boardData = {
        tasks: state.tasks,
        labels: state.labels,
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
export function importBoard() {
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
                
                if (!boardData.tasks || !boardData.labels) {
                    throw new Error('无效的看板文件格式');
                }
                
                const newBoardName = document.querySelector('.app-header__title').textContent + '_副本';
                document.querySelector('.app-header__title').textContent = newBoardName;
                
                state.tasks = boardData.tasks;
                state.labels = boardData.labels;
                
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
