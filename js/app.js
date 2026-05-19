
/**
 * 主应用入口
 * 协调各个组件和服务，处理页面导航和用户交互
 */
(function() {
    let currentPeriod = 'day';
    
    document.addEventListener('DOMContentLoaded', function() {
        initApp();
    });
    
    async function initApp() {
        showLoading('初始化应用...');
        
        try {
            await SentimentService.loadModel();
            
            if (AuthService.isLoggedIn()) {
                const user = AuthService.getCurrentUser();
                
                if (!CryptoService.isMasterKeyAvailable()) {
                    const sessionRestored = await CryptoService.restoreSession();
                    
                    if (!sessionRestored) {
                        console.log('Session restore failed, need re-login');
                        AuthService.logout();
                        showAuthPage();
                        hideLoading();
                        showToast('会话已过期，请重新登录', 'info');
                        return;
                    }
                }
                
                await DiaryService.loadFromStorage();
                showMainPage(user);
            } else {
                showAuthPage();
            }
            
            bindAppEvents();
            
            EditorComponent.init();
            
            hideLoading();
            
        } catch (e) {
            console.error('App initialization error:', e);
            hideLoading();
            showToast('应用初始化失败，请刷新页面重试', 'error');
        }
    }
    
    function bindAppEvents() {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginTab) {
            loginTab.addEventListener('click', function() {
                switchAuthTab('login');
            });
        }
        
        if (registerTab) {
            registerTab.addEventListener('click', function() {
                switchAuthTab('register');
            });
        }
        
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        const newDiaryBtn = document.getElementById('new-diary-btn');
        if (newDiaryBtn) {
            newDiaryBtn.addEventListener('click', handleNewDiary);
        }
        
        const saveDiaryBtn = document.getElementById('save-diary-btn');
        if (saveDiaryBtn) {
            saveDiaryBtn.addEventListener('click', handleSaveDiary);
        }
        
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', handleCancelEdit);
        }
        
        const statsBtn = document.getElementById('stats-btn');
        if (statsBtn) {
            statsBtn.addEventListener('click', handleShowStats);
        }
        
        const backFromStats = document.getElementById('back-from-stats');
        if (backFromStats) {
            backFromStats.addEventListener('click', handleBackFromStats);
        }
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }
        
        const periodBtns = document.querySelectorAll('.period-btn');
        periodBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const period = this.getAttribute('data-period');
                switchPeriod(period);
            });
        });
    }
    
    function showLoading(text = '加载中...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (overlay) {
            overlay.classList.remove('hidden');
        }
        if (loadingText) {
            loadingText.textContent = text;
        }
    }
    
    function hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
    
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.classList.remove('hidden');
        
        toast.style.background = type === 'error' ? '#ef4444' : 
                                 type === 'success' ? '#22c55e' : '#6366f1';
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
    
    function showAuthPage() {
        const authPage = document.getElementById('auth-page');
        const mainPage = document.getElementById('main-page');
        
        if (authPage) {
            authPage.classList.remove('hidden');
            authPage.classList.add('active');
        }
        if (mainPage) {
            mainPage.classList.add('hidden');
            mainPage.classList.remove('active');
        }
    }
    
    function showMainPage(user) {
        const authPage = document.getElementById('auth-page');
        const mainPage = document.getElementById('main-page');
        const userDisplay = document.getElementById('user-display');
        
        if (authPage) {
            authPage.classList.add('hidden');
            authPage.classList.remove('active');
        }
        if (mainPage) {
            mainPage.classList.remove('hidden');
            mainPage.classList.add('active');
        }
        if (userDisplay && user) {
            userDisplay.textContent = `欢迎, ${user.username}`;
        }
        
        showView('welcome');
        updateDiaryList();
    }
    
    function switchAuthTab(tab) {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginTab.classList.remove('active');
            registerTab.classList.add('active');
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error');
        
        if (!username || !password) {
            if (errorMsg) {
                errorMsg.textContent = '请输入用户名和密码';
            }
            return;
        }
        
        showLoading('登录中...');
        
        try {
            const result = await AuthService.login(username, password);
            
            if (result.success) {
                hideLoading();
                showToast('登录成功！', 'success');
                showMainPage(AuthService.getCurrentUser());
            } else {
                hideLoading();
                if (errorMsg) {
                    errorMsg.textContent = result.message;
                }
            }
        } catch (e) {
            hideLoading();
            console.error('Login error:', e);
            if (errorMsg) {
                errorMsg.textContent = '登录失败，请重试';
            }
        }
    }
    
    async function handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        const errorMsg = document.getElementById('register-error');
        
        if (!username || !password || !confirmPassword) {
            if (errorMsg) {
                errorMsg.textContent = '请填写所有字段';
            }
            return;
        }
        
        if (password !== confirmPassword) {
            if (errorMsg) {
                errorMsg.textContent = '两次密码输入不一致';
            }
            return;
        }
        
        if (password.length < 6) {
            if (errorMsg) {
                errorMsg.textContent = '密码长度至少为6位';
            }
            return;
        }
        
        showLoading('注册中...');
        
        try {
            const result = await AuthService.register(username, password, confirmPassword);
            
            if (result.success) {
                hideLoading();
                showToast('注册成功！请登录', 'success');
                switchAuthTab('login');
                
                const loginUsername = document.getElementById('login-username');
                if (loginUsername) {
                    loginUsername.value = username;
                }
            } else {
                hideLoading();
                if (errorMsg) {
                    errorMsg.textContent = result.message;
                }
            }
        } catch (e) {
            hideLoading();
            console.error('Register error:', e);
            if (errorMsg) {
                errorMsg.textContent = '注册失败，请重试';
            }
        }
    }
    
    function handleLogout() {
        if (confirm('确定要退出登录吗？')) {
            AuthService.logout();
            showAuthPage();
            showToast('已退出登录', 'info');
        }
    }
    
    async function handleNewDiary() {
        showLoading('创建新日记...');
        
        try {
            const diary = await DiaryService.createDiary();
            
            EditorComponent.reset();
            EditorComponent.updateMetaDisplay(diary);
            
            showView('editor');
            hideLoading();
            
        } catch (e) {
            hideLoading();
            console.error('Create diary error:', e);
            showToast('创建日记失败', 'error');
        }
    }
    
    async function handleSaveDiary() {
        const currentDiary = DiaryService.getCurrentDiary();
        
        if (!currentDiary) {
            showToast('没有可保存的日记', 'error');
            return;
        }
        
        const title = EditorComponent.getTitle();
        const content = EditorComponent.getContent();
        const mode = EditorComponent.getCurrentMode();
        
        if (!title && !content) {
            showToast('请输入标题或内容', 'error');
            return;
        }
        
        showLoading('保存中...');
        
        try {
            const updatedDiary = await DiaryService.updateDiary(currentDiary.id, {
                title: title || '无标题',
                content: content,
                editorMode: mode
            });
            
            hideLoading();
            showToast('保存成功！', 'success');
            
            updateDiaryList();
            
        } catch (e) {
            hideLoading();
            console.error('Save diary error:', e);
            showToast('保存失败，请重试', 'error');
        }
    }
    
    function handleCancelEdit() {
        const currentDiary = DiaryService.getCurrentDiary();
        
        if (currentDiary && !currentDiary.isDraft) {
            if (confirm('确定要取消编辑吗？未保存的更改将丢失。')) {
                loadDiaryToEditor(currentDiary);
            }
        } else {
            DiaryService.setCurrentDiary(null);
            showView('welcome');
        }
    }
    
    function handleShowStats() {
        showView('stats');
        updateStatsDisplay();
    }
    
    function handleBackFromStats() {
        // 退出统计页时销毁所有 ECharts 实例，释放占用的 canvas 内存
        if (typeof EChartsService !== 'undefined' && typeof EChartsService.disposeAll === 'function') {
            EChartsService.disposeAll();
        }
        const currentDiary = DiaryService.getCurrentDiary();
        if (currentDiary) {
            showView('editor');
        } else {
            showView('welcome');
        }
    }
    
    function handleSearch(e) {
        const query = e.target.value;
        const filteredDiaries = DiaryService.searchDiaries(query);
        renderDiaryList(filteredDiaries);
    }
    
    function switchPeriod(period) {
        currentPeriod = period;
        
        const periodBtns = document.querySelectorAll('.period-btn');
        periodBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-period') === period) {
                btn.classList.add('active');
            }
        });
        
        updateStatsDisplay();
    }
    
    function showView(viewName) {
        const welcomeView = document.getElementById('welcome-view');
        const editorView = document.getElementById('editor-view');
        const statsView = document.getElementById('stats-view');
        
        welcomeView.classList.add('hidden');
        welcomeView.classList.remove('active');
        editorView.classList.add('hidden');
        editorView.classList.remove('active');
        statsView.classList.add('hidden');
        statsView.classList.remove('active');
        
        switch (viewName) {
            case 'welcome':
                welcomeView.classList.remove('hidden');
                welcomeView.classList.add('active');
                break;
            case 'editor':
                editorView.classList.remove('hidden');
                editorView.classList.add('active');
                break;
            case 'stats':
                statsView.classList.remove('hidden');
                statsView.classList.add('active');
                break;
        }
    }
    
    function updateDiaryList() {
        const diaries = DiaryService.getDiaries();
        const sortedDiaries = DiaryService.sortDiaries(diaries, 'date', 'desc');
        renderDiaryList(sortedDiaries);
    }
    
    function renderDiaryList(diaries) {
        const diaryList = document.getElementById('diary-list');
        if (!diaryList) return;
        
        if (diaries.length === 0) {
            diaryList.innerHTML = `
                <div class="empty-list">
                    <p>暂无日记</p>
                    <p>点击"新日记"开始写作</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        const currentDiary = DiaryService.getCurrentDiary();
        
        diaries.forEach(diary => {
            const isActive = currentDiary && currentDiary.id === diary.id;
            const preview = getPreviewText(diary.content, diary.editorMode);
            const emotionEmoji = diary.sentiment ? SentimentService.getEmotionEmoji(diary.sentiment) : '';
            
            html += `
                <div class="diary-item ${isActive ? 'active' : ''}" data-id="${diary.id}">
                    <div class="diary-item-title">${escapeHtml(diary.title)}</div>
                    <div class="diary-item-meta">
                        <span>${DateUtils.getDateTimeDisplay(diary.createdAt)}</span>
                        <span class="diary-item-emotion">${emotionEmoji}</span>
                    </div>
                    <div class="diary-item-preview">${escapeHtml(preview)}</div>
                </div>
            `;
        });
        
        diaryList.innerHTML = html;
        
        const diaryItems = diaryList.querySelectorAll('.diary-item');
        diaryItems.forEach(item => {
            item.addEventListener('click', function() {
                const diaryId = this.getAttribute('data-id');
                selectDiary(diaryId);
            });
        });
    }
    
    function getPreviewText(content, mode) {
        if (!content) return '';
        
        let text = '';
        if (mode === 'rich') {
            text = MarkdownUtils.getPlainText(content);
        } else {
            text = content.replace(/[#*`\[\]()\-!]/g, ' ').replace(/\s+/g, ' ');
        }
        
        return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }
    
    function selectDiary(diaryId) {
        const diary = DiaryService.getDiaryById(diaryId);
        if (!diary) return;
        
        loadDiaryToEditor(diary);
        
        const diaryItems = document.querySelectorAll('.diary-item');
        diaryItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-id') === diaryId) {
                item.classList.add('active');
            }
        });
    }
    
    function loadDiaryToEditor(diary) {
        DiaryService.setCurrentDiary(diary);
        
        EditorComponent.setTitle(diary.title);
        EditorComponent.setContent(diary.content, diary.editorMode);
        EditorComponent.switchMode(diary.editorMode || 'rich');
        EditorComponent.updateMetaDisplay(diary);
        
        showView('editor');
    }
    
    function updateStatsDisplay() {
        const stats = DiaryService.getStats(currentPeriod);
        // 获取全部日记，用于雷达图、桑基图、词频趋势图（需要完整历史数据）
        const allDiaries = DiaryService.getDiaries();

        const statDiaries = document.getElementById('stat-diaries');
        const statWords = document.getElementById('stat-words');
        const statAvgWords = document.getElementById('stat-avg-words');
        const statStreak = document.getElementById('stat-streak');

        if (statDiaries) statDiaries.textContent = stats.totalDiaries;
        if (statWords) statWords.textContent = stats.totalWords.toLocaleString();
        if (statAvgWords) statAvgWords.textContent = stats.avgWords;
        if (statStreak) statStreak.textContent = stats.streak;

        // 使用 EChartsService 统一渲染：柱状图、饼图、雷达图、桑基图、折线图
        if (typeof EChartsService !== 'undefined' && typeof EChartsService.renderAll === 'function') {
            EChartsService.renderAll(stats, allDiaries, currentPeriod);
        } else {
            console.warn('[app] EChartsService 未定义，图表无法渲染');
        }
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
})();
