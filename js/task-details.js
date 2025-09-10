// 任务详情、附件和评论功能模块
(function() {
    'use strict';

    // --- 1. 全局变量 ---
    let currentTaskId = null;
    let currentUser = getCurrentUser(); // 获取当前用户名
    let db = null;
    let collaborationCheckInterval = null;

    // 获取当前用户名（简化实现）
    function getCurrentUser() {
        // 尝试从localStorage获取用户名，如果没有则提示输入
        let username = localStorage.getItem('kanban_username');
        if (!username) {
            username = prompt('请输入您的用户名：') || '匿名用户';
            localStorage.setItem('kanban_username', username);
        }
        return username;
    }

    // --- 2. IndexedDB 初始化 ---
    function initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('KanbanDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                db = event.target.result;
                
                // 创建附件存储
                if (!db.objectStoreNames.contains('attachments')) {
                    const attachmentStore = db.createObjectStore('attachments', { keyPath: 'id' });
                    attachmentStore.createIndex('taskId', 'taskId', { unique: false });
                }
                
                // 创建评论存储
                if (!db.objectStoreNames.contains('comments')) {
                    const commentStore = db.createObjectStore('comments', { keyPath: 'id' });
                    commentStore.createIndex('taskId', 'taskId', { unique: false });
                }
            };
        });
    }

    // --- 3. 附件管理 ---
    function saveAttachment(taskId, file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const attachment = {
                    id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    taskId: taskId,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    data: reader.result,
                    uploadTime: new Date().toISOString(),
                    uploader: currentUser
                };

                // 如果文件小于1MB，也存储到localStorage作为备份
                if (file.size < 1024 * 1024) {
                    const localAttachments = JSON.parse(localStorage.getItem('kanban_attachments') || '[]');
                    localAttachments.push(attachment);
                    localStorage.setItem('kanban_attachments', JSON.stringify(localAttachments));
                }

                // 存储到IndexedDB
                const transaction = db.transaction(['attachments'], 'readwrite');
                const store = transaction.objectStore('attachments');
                const request = store.add(attachment);
                
                request.onsuccess = () => resolve(attachment);
                request.onerror = () => reject(request.error);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    function getAttachments(taskId) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['attachments'], 'readonly');
            const store = transaction.objectStore('attachments');
            const index = store.index('taskId');
            const request = index.getAll(taskId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function deleteAttachment(attachmentId) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['attachments'], 'readwrite');
            const store = transaction.objectStore('attachments');
            const request = store.delete(attachmentId);
            
            request.onsuccess = () => {
                // 同时从localStorage删除
                const localAttachments = JSON.parse(localStorage.getItem('kanban_attachments') || '[]');
                const filtered = localAttachments.filter(att => att.id !== attachmentId);
                localStorage.setItem('kanban_attachments', JSON.stringify(filtered));
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    // --- 4. 评论管理 ---
    function saveComment(taskId, content) {
        return new Promise((resolve, reject) => {
            const comment = {
                id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                taskId: taskId,
                content: content.trim(),
                author: currentUser,
                timestamp: new Date().toISOString()
            };

            const transaction = db.transaction(['comments'], 'readwrite');
            const store = transaction.objectStore('comments');
            const request = store.add(comment);
            
            request.onsuccess = () => resolve(comment);
            request.onerror = () => reject(request.error);
        });
    }

    function getComments(taskId) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['comments'], 'readonly');
            const store = transaction.objectStore('comments');
            const index = store.index('taskId');
            const request = index.getAll(taskId);
            
            request.onsuccess = () => {
                // 按时间倒序排列
                const comments = request.result.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                resolve(comments);
            };
            request.onerror = () => reject(request.error);
        });
    }

    function deleteComment(commentId) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['comments'], 'readwrite');
            const store = transaction.objectStore('comments');
            const request = store.delete(commentId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // --- 5. UI 渲染函数 ---
    function renderAttachments(attachments) {
        const container = document.getElementById('attachments-list');
        if (!container) return;

        if (attachments.length === 0) {
            container.innerHTML = '<p class="empty-message">暂无附件</p>';
            return;
        }

        container.innerHTML = attachments.map(attachment => `
            <div class="attachment-item" data-id="${attachment.id}">
                <div class="attachment-info">
                    <div class="attachment-icon">
                        ${getFileIcon(attachment.fileType)}
                    </div>
                    <div class="attachment-details">
                        <div class="attachment-name" title="${escapeHtml(attachment.fileName)}">${escapeHtml(attachment.fileName)}</div>
                        <div class="attachment-meta">
                            ${formatFileSize(attachment.fileSize)} • 
                            ${formatDateTime(attachment.uploadTime)} • 
                            ${escapeHtml(attachment.uploader)}
                        </div>
                    </div>
                </div>
                <div class="attachment-actions">
                    <button class="attachment-preview-btn" data-id="${attachment.id}" title="预览/下载">
                        📄
                    </button>
                    <button class="attachment-delete-btn" data-id="${attachment.id}" title="删除">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    function renderComments(comments) {
        const container = document.getElementById('comments-list');
        if (!container) return;

        if (comments.length === 0) {
            container.innerHTML = '<p class="empty-message">暂无评论</p>';
            return;
        }

        container.innerHTML = comments.map(comment => `
            <div class="comment-item" data-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(comment.author)}</span>
                    <span class="comment-time">${formatDateTime(comment.timestamp)}</span>
                    <button class="comment-delete-btn" data-id="${comment.id}" title="删除评论">×</button>
                </div>
                <div class="comment-content">${escapeHtml(comment.content)}</div>
            </div>
        `).join('');
    }

    // --- 6. 工具函数 ---
    function getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return '🖼️';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
        if (fileType.includes('text')) return '📄';
        return '📎';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- 7. 事件处理函数 ---
    function handleFileUpload(event) {
        const files = event.target.files;
        if (!files.length || !currentTaskId) return;

        const uploadPromises = Array.from(files).map(file => {
            // 检查文件大小（限制为10MB）
            if (file.size > 10 * 1024 * 1024) {
                alert(`文件 "${file.name}" 超过10MB限制`);
                return Promise.resolve(null);
            }
            
            return saveAttachment(currentTaskId, file);
        });

        Promise.all(uploadPromises).then(results => {
            const successCount = results.filter(r => r !== null).length;
            if (successCount > 0) {
                loadAttachments();
                showNotification(`成功上传 ${successCount} 个文件`);
            }
        }).catch(error => {
            console.error('文件上传失败:', error);
            alert('文件上传失败，请重试');
        });

        // 清空文件输入
        event.target.value = '';
    }

    function handleCommentSubmit() {
        const input = document.getElementById('comment-input');
        const content = input.value.trim();
        
        if (!content || !currentTaskId) return;

        saveComment(currentTaskId, content).then(() => {
            input.value = '';
            loadComments();
            showNotification('评论已添加');
        }).catch(error => {
            console.error('评论保存失败:', error);
            alert('评论保存失败，请重试');
        });
    }

    function handleAttachmentPreview(attachmentId) {
        getAttachments(currentTaskId).then(attachments => {
            const attachment = attachments.find(att => att.id === attachmentId);
            if (!attachment) return;

            if (attachment.fileType.startsWith('image/')) {
                // 图片预览
                showImagePreview(attachment);
            } else {
                // 其他文件下载
                downloadFile(attachment);
            }
        });
    }

    function showImagePreview(attachment) {
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.innerHTML = `
            <div class="image-preview-content";>
                <div class="image-preview-header">
                    <h3>${escapeHtml(attachment.fileName)}</h3>
                    <button class="image-preview-close">×</button>
                </div>
                <img src="${attachment.data}" alt="${attachment.fileName}" class="preview-image">
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 关闭事件
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('image-preview-close')) {
                document.body.removeChild(modal);
            }
        });
    }

    function downloadFile(attachment) {
        const link = document.createElement('a');
        link.href = attachment.data;
        link.download = attachment.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'task-detail-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // --- 8. 数据加载函数 ---
    function loadAttachments() {
        if (!currentTaskId) return;
        
        getAttachments(currentTaskId).then(attachments => {
            renderAttachments(attachments);
            updateAttachmentCount(attachments.length);
        }).catch(error => {
            console.error('加载附件失败:', error);
        });
    }

    function loadComments() {
        if (!currentTaskId) return;
        
        getComments(currentTaskId).then(comments => {
            renderComments(comments);
            updateCommentCount(comments.length);
        }).catch(error => {
            console.error('加载评论失败:', error);
        });
    }

    function updateAttachmentCount(count) {
        const tab = document.querySelector('[data-tab="attachments"]');
        if (tab) {
            tab.textContent = `附件 (${count})`;
        }
    }

    function updateCommentCount(count) {
        const tab = document.querySelector('[data-tab="comments"]');
        if (tab) {
            tab.textContent = `评论 (${count})`;
        }
    }

    // --- 9. 协作模式自动刷新 ---
    function startCollaborationCheck() {
        if (collaborationCheckInterval) {
            clearInterval(collaborationCheckInterval);
        }
        
        collaborationCheckInterval = setInterval(() => {
            if (currentTaskId && document.getElementById('task-detail-modal').open) {
                loadAttachments();
                loadComments();
            }
        }, 5000); // 每5秒刷新一次
    }

    function stopCollaborationCheck() {
        if (collaborationCheckInterval) {
            clearInterval(collaborationCheckInterval);
            collaborationCheckInterval = null;
        }
    }

    // --- 10. 主要接口函数 ---
    function openTaskDetail(taskId) {
        currentTaskId = taskId;
        const modal = document.getElementById('task-detail-modal');
        if (!modal) return;

        // 获取任务信息
        const tasks = JSON.parse(localStorage.getItem('kanban_tasks') || '[]');
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // 更新模态框标题
        document.getElementById('task-detail-title').textContent = task.title;
        
        // 显示基本信息
        renderTaskBasicInfo(task);
        
        // 切换到评论标签
        switchTab('comments');
        
        // 加载数据
        loadAttachments();
        loadComments();
        
        // 显示模态框
        modal.showModal();
        
        // 开始协作检查
        startCollaborationCheck();
    }

    function renderTaskBasicInfo(task) {
        const container = document.getElementById('task-basic-info');
        if (!container) return;

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

        container.innerHTML = `
            <div class="task-info-item">
                <span class="task-info-label">描述：</span>
                <span class="task-info-value">${escapeHtml(task.description || '无描述')}</span>
            </div>
            <div class="task-info-item">
                <span class="task-info-label">状态：</span>
                <span class="task-info-value">${statusNames[task.status]}</span>
            </div>
            <div class="task-info-item">
                <span class="task-info-label">优先级：</span>
                <span class="task-info-value">${priorityNames[task.priority]}</span>
            </div>
            <div class="task-info-item">
                <span class="task-info-label">截止日期：</span>
                <span class="task-info-value">${escapeHtml(task.dueDate || '无截止日期')}</span>
            </div>
            ${task.labels && task.labels.length > 0 ? `
            <div class="task-info-item">
                <span class="task-info-label">标签：</span>
                <span class="task-info-value">${task.labels.map(l => escapeHtml(l)).join(', ')}</span>
            </div>
            ` : ''}
        `;
    }

    function switchTab(tabName) {
        // 更新标签状态
        document.querySelectorAll('.task-detail-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // 更新内容显示
        document.querySelectorAll('.task-detail-content').forEach(content => {
            content.classList.toggle('active', content.dataset.content === tabName);
        });
    }

    function closeTaskDetail() {
        currentTaskId = null;
        stopCollaborationCheck();
        const modal = document.getElementById('task-detail-modal');
        if (modal) {
            modal.close();
        }
    }

    // --- 11. 事件监听器设置 ---
    function addEventListeners() {
        // 文件上传
        const fileInput = document.getElementById('attachment-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileUpload);
        }

        // 评论提交
        const commentBtn = document.getElementById('comment-submit-btn');
        if (commentBtn) {
            commentBtn.addEventListener('click', handleCommentSubmit);
        }

        const commentInput = document.getElementById('comment-input');
        if (commentInput) {
            commentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCommentSubmit();
                }
            });
        }

        // 标签切换
        document.addEventListener('click', (e) => {
            const tab = e.target.closest('.task-detail-tab');
            if (tab) {
                switchTab(tab.dataset.tab);
            }

            // 附件操作
            const previewBtn = e.target.closest('.attachment-preview-btn');
            if (previewBtn) {
                handleAttachmentPreview(previewBtn.dataset.id);
            }

            const deleteAttachmentBtn = e.target.closest('.attachment-delete-btn');
            if (deleteAttachmentBtn) {
                if (confirm('确定要删除这个附件吗？')) {
                    deleteAttachment(deleteAttachmentBtn.dataset.id).then(() => {
                        loadAttachments();
                        showNotification('附件已删除');
                    });
                }
            }

            // 评论删除
            const deleteCommentBtn = e.target.closest('.comment-delete-btn');
            if (deleteCommentBtn) {
                if (confirm('确定要删除这条评论吗？')) {
                    deleteComment(deleteCommentBtn.dataset.id).then(() => {
                        loadComments();
                        showNotification('评论已删除');
                    });
                }
            }

            // 关闭模态框
            const closeBtn = e.target.closest('.task-detail-close-btn');
            if (closeBtn) {
                closeTaskDetail();
            }
        });

        // 模态框外点击关闭
        const modal = document.getElementById('task-detail-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeTaskDetail();
                }
            });
        }
    }

    // --- 12. 初始化 ---
    function init() {
        initIndexedDB().then(() => {
            console.log('IndexedDB 初始化成功');
            addEventListeners();
        }).catch(error => {
            console.error('IndexedDB 初始化失败:', error);
            alert('数据库初始化失败，附件和评论功能可能无法正常使用');
        });
    }

    // --- 13. 暴露接口 ---
    window.TaskDetails = {
        openTaskDetail,
        closeTaskDetail,
        saveAttachmentFromModal: saveAttachment,
        init
    };

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
