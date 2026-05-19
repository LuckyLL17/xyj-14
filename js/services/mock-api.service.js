
/**
 * Mock API 服务
 * 模拟后端API请求，用于开发和测试
 */
const MockApiService = (function() {
    const DELAY_MIN = 100;
    const DELAY_MAX = 500;
    
    const mockDelay = () => {
        return new Promise(resolve => {
            const delay = Math.random() * (DELAY_MAX - DELAY_MIN) + DELAY_MIN;
            setTimeout(resolve, delay);
        });
    };
    
    const createResponse = (success, data, message) => {
        return {
            success,
            data,
            message
        };
    };
    
    const handleError = (message) => {
        console.error('Mock API Error:', message);
        return createResponse(false, null, message);
    };
    
    async function register(username, password) {
        await mockDelay();
        
        const users = StorageService.get('mock_users', {});
        
        if (users[username]) {
            return handleError('用户名已存在');
        }
        
        const hashedPassword = await CryptoService.hash(password);
        
        const keyStore = await CryptoService.createUserKeyStore(password);
        
        users[username] = {
            username,
            password: hashedPassword,
            keyStore,
            createdAt: Date.now()
        };
        
        StorageService.set('mock_users', users);
        
        return createResponse(true, { username }, '注册成功');
    }
    
    async function login(username, password) {
        await mockDelay();
        
        const users = StorageService.get('mock_users', {});
        const user = users[username];
        
        if (!user) {
            return handleError('用户不存在');
        }
        
        const hashedPassword = await CryptoService.hash(password);
        
        if (hashedPassword !== user.password) {
            return handleError('密码错误');
        }
        
        const unlocked = await CryptoService.unlockUserKeyStore(user.keyStore, password);
        
        if (!unlocked) {
            return handleError('密钥解锁失败');
        }
        
        return createResponse(true, { username }, '登录成功');
    }
    
    async function getWeather(date = null) {
        await mockDelay();
        
        const targetDate = date || new Date();
        const dateStr = targetDate.toDateString();
        
        const cacheKey = `weather_${dateStr}`;
        const cached = StorageService.getCache(cacheKey);
        
        if (cached) {
            return createResponse(true, cached, '从缓存获取');
        }
        
        const weatherTypes = [
            { type: '晴', emoji: '☀️', description: '晴朗' },
            { type: '多云', emoji: '⛅', description: '多云转晴' },
            { type: '阴', emoji: '☁️', description: '阴天' },
            { type: '小雨', emoji: '🌧️', description: '小雨' },
            { type: '中雨', emoji: '🌧️', description: '中雨' },
            { type: '大雨', emoji: '🌧️', description: '大雨' },
            { type: '雷阵雨', emoji: '⛈️', description: '雷阵雨' },
            { type: '雪', emoji: '❄️', description: '雪' },
            { type: '雾', emoji: '🌫️', description: '雾' },
            { type: '霾', emoji: '🌫️', description: '霾' }
        ];
        
        const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        
        const minTemp = Math.floor(Math.random() * 20) - 5;
        const maxTemp = minTemp + Math.floor(Math.random() * 15) + 5;
        const currentTemp = Math.floor(Math.random() * (maxTemp - minTemp)) + minTemp;
        
        const humidity = Math.floor(Math.random() * 60) + 20;
        const windSpeed = Math.floor(Math.random() * 30) + 5;
        const uvIndex = Math.floor(Math.random() * 11);
        
        const weatherData = {
            date: dateStr,
            weather: weather.type,
            emoji: weather.emoji,
            description: weather.description,
            temperature: {
                current: currentTemp,
                min: minTemp,
                max: maxTemp
            },
            humidity: humidity,
            windSpeed: windSpeed,
            uvIndex: uvIndex,
            airQuality: ['优', '良', '轻度污染', '中度污染'][Math.floor(Math.random() * 4)]
        };
        
        StorageService.setCache(cacheKey, weatherData, 12 * 60 * 60 * 1000);
        
        return createResponse(true, weatherData, '获取天气成功');
    }
    
    async function analyzeSentiment(text) {
        await mockDelay();
        
        if (!text || text.trim().length === 0) {
            return createResponse(true, {
                positive: 0.33,
                neutral: 0.34,
                negative: 0.33,
                dominant: 'neutral'
            }, '空文本');
        }
        
        const positiveWords = ['开心', '快乐', '高兴', '幸福', '美好', '喜欢', '爱', '感谢', '感激', '成功', 
            '顺利', '棒', '好', '优秀', '精彩', '美妙', '愉快', '满足', '满意', '希望', '期待', '兴奋', '激动'];
        
        const negativeWords = ['难过', '伤心', '痛苦', '悲伤', '失望', '生气', '愤怒', '讨厌', '恨', '失败',
            '困难', '糟糕', '坏', '差', '糟糕', '烦恼', '忧虑', '焦虑', '害怕', '恐惧', '担心', '沮丧', '郁闷'];
        
        const words = text.split('');
        let positiveCount = 0;
        let negativeCount = 0;
        let neutralCount = 0;
        
        words.forEach(word => {
            if (positiveWords.some(pw => word.includes(pw) || pw.includes(word))) {
                positiveCount++;
            } else if (negativeWords.some(nw => word.includes(nw) || nw.includes(word))) {
                negativeCount++;
            }
        });
        
        const totalCount = Math.max(positiveCount + negativeCount + 1, 1);
        neutralCount = totalCount - positiveCount - negativeCount;
        
        let positive = (positiveCount + Math.random() * 0.2) / totalCount;
        let negative = (negativeCount + Math.random() * 0.2) / totalCount;
        let neutral = 1 - positive - negative;
        
        neutral = Math.max(0, neutral);
        const sum = positive + negative + neutral;
        positive = positive / sum;
        negative = negative / sum;
        neutral = neutral / sum;
        
        let dominant = 'neutral';
        if (positive > neutral && positive > negative) {
            dominant = 'positive';
        } else if (negative > neutral && negative > positive) {
            dominant = 'negative';
        }
        
        return createResponse(true, {
            positive: Math.round(positive * 100) / 100,
            neutral: Math.round(neutral * 100) / 100,
            negative: Math.round(negative * 100) / 100,
            dominant
        }, '情感分析完成');
    }
    
    async function syncDiaries(diaries) {
        await mockDelay();
        
        return createResponse(true, {
            synced: diaries.length,
            timestamp: Date.now()
        }, '同步成功');
    }
    
    async function checkConnection() {
        await mockDelay();
        
        const isOnline = Math.random() > 0.1;
        
        return createResponse(true, {
            online: isOnline,
            timestamp: Date.now()
        }, isOnline ? '网络正常' : '网络不可用');
    }
    
    return {
        register,
        login,
        getWeather,
        analyzeSentiment,
        syncDiaries,
        checkConnection
    };
})();
