
/**
 * 日记服务
 * 处理日记的CRUD操作
 */
const DiaryService = (function() {
    let diaries = [];
    let currentDiary = null;
    
    function generateId() {
        return 'diary_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    function getDiaries() {
        return [...diaries];
    }
    
    function setDiaries(newDiaries) {
        diaries = Array.isArray(newDiaries) ? newDiaries : [];
        return diaries;
    }
    
    function getDiaryById(id) {
        return diaries.find(diary => diary.id === id) || null;
    }
    
    function getCurrentDiary() {
        return currentDiary;
    }
    
    function setCurrentDiary(diary) {
        currentDiary = diary;
        return currentDiary;
    }
    
    async function createDiary(options = {}) {
        const now = new Date();
        
        const weatherData = await WeatherService.getCurrentWeather();
        
        const diary = {
            id: generateId(),
            title: options.title || '',
            content: options.content || '',
            editorMode: options.editorMode || 'rich',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            date: now.toDateString(),
            weather: weatherData,
            sentiment: null,
            wordCount: 0,
            emotionTags: options.emotionTags || [],
            isDraft: true
        };
        
        diaries.unshift(diary);
        currentDiary = diary;
        
        await saveToStorage();
        
        return diary;
    }
    
    async function updateDiary(id, updates) {
        const index = diaries.findIndex(diary => diary.id === id);
        
        if (index === -1) {
            return null;
        }
        
        const now = new Date();
        
        diaries[index] = {
            ...diaries[index],
            ...updates,
            updatedAt: now.toISOString(),
            wordCount: StatsService.countWords(updates.content || diaries[index].content)
        };
        
        if (updates.content) {
            const sentiment = await SentimentService.analyze(updates.content);
            diaries[index].sentiment = sentiment;
        }
        
        diaries[index].isDraft = false;
        
        if (currentDiary && currentDiary.id === id) {
            currentDiary = diaries[index];
        }
        
        await saveToStorage();
        
        return diaries[index];
    }
    
    async function deleteDiary(id) {
        const index = diaries.findIndex(diary => diary.id === id);
        
        if (index === -1) {
            return false;
        }
        
        diaries.splice(index, 1);
        
        if (currentDiary && currentDiary.id === id) {
            currentDiary = null;
        }
        
        await saveToStorage();
        
        return true;
    }
    
    function searchDiaries(query) {
        if (!query || query.trim() === '') {
            return [...diaries];
        }
        
        const lowerQuery = query.toLowerCase();
        
        return diaries.filter(diary => {
            return (
                (diary.title && diary.title.toLowerCase().includes(lowerQuery)) ||
                (diary.content && diary.content.toLowerCase().includes(lowerQuery))
            );
        });
    }
    
    function getDiariesByDateRange(startDate, endDate) {
        return diaries.filter(diary => {
            const diaryDate = new Date(diary.createdAt);
            return diaryDate >= startDate && diaryDate <= endDate;
        });
    }
    
    function sortDiaries(diariesToSort, sortBy = 'date', order = 'desc') {
        const sorted = [...diariesToSort];
        
        sorted.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
                case 'title':
                    comparison = (a.title || '').localeCompare(b.title || '');
                    break;
                case 'words':
                    comparison = (a.wordCount || 0) - (b.wordCount || 0);
                    break;
                default:
                    comparison = 0;
            }
            
            return order === 'desc' ? -comparison : comparison;
        });
        
        return sorted;
    }
    
    async function saveToStorage() {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            return await AuthService.saveUserDiaries(currentUser.username, diaries);
        }
        return false;
    }
    
    async function loadFromStorage() {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            return await AuthService.loadUserDiaries(currentUser.username);
        }
        return false;
    }
    
    function clearCache() {
        diaries = [];
        currentDiary = null;
    }
    
    function getStats(period = 'all') {
        return StatsService.calculateStats(diaries, period);
    }
    
    async function analyzeDiarySentiment(diaryId) {
        const diary = getDiaryById(diaryId);
        if (!diary) {
            return null;
        }
        
        const sentiment = await SentimentService.analyze(diary.content);
        diary.sentiment = sentiment;
        
        await saveToStorage();
        
        return sentiment;
    }
    
    function getRecentDiaries(limit = 10) {
        return sortDiaries(diaries, 'date', 'desc').slice(0, limit);
    }
    
    function getDrafts() {
        return diaries.filter(diary => diary.isDraft);
    }
    
    return {
        generateId,
        getDiaries,
        setDiaries,
        getDiaryById,
        getCurrentDiary,
        setCurrentDiary,
        createDiary,
        updateDiary,
        deleteDiary,
        searchDiaries,
        getDiariesByDateRange,
        sortDiaries,
        saveToStorage,
        loadFromStorage,
        clearCache,
        getStats,
        analyzeDiarySentiment,
        getRecentDiaries,
        getDrafts
    };
})();
