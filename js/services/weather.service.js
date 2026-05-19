
/**
 * 天气服务
 * 处理天气数据获取和缓存
 */
const WeatherService = (function() {
    const CACHE_TTL = 12 * 60 * 60 * 1000;
    
    const weatherEmotions = {
        '晴': {
            emotions: ['开心', '快乐', '兴奋', '积极'],
            influence: 0.8,
            description: '晴朗的天气让人心情愉悦'
        },
        '多云': {
            emotions: ['平静', '温和', '中性'],
            influence: 0.5,
            description: '多云天气适合平静思考'
        },
        '阴': {
            emotions: ['平静', '思考', '中性'],
            influence: 0.3,
            description: '阴天让人更加沉静'
        },
        '小雨': {
            emotions: ['平静', '放松', '思考'],
            influence: 0.4,
            description: '小雨天气适合静心写作'
        },
        '中雨': {
            emotions: ['平静', '忧郁', '思考'],
            influence: 0.3,
            description: '雨声让人思绪万千'
        },
        '大雨': {
            emotions: ['烦躁', '焦虑', '平静'],
            influence: 0.2,
            description: '大雨可能影响心情'
        },
        '雷阵雨': {
            emotions: ['紧张', '兴奋', '不安'],
            influence: 0.1,
            description: '雷雨天气让人情绪波动'
        },
        '雪': {
            emotions: ['开心', '惊喜', '平静'],
            influence: 0.7,
            description: '雪景让人心情愉悦'
        },
        '雾': {
            emotions: ['迷茫', '平静', '思考'],
            influence: 0.3,
            description: '雾气朦胧，适合沉思'
        },
        '霾': {
            emotions: ['压抑', '烦躁', '不安'],
            influence: 0.1,
            description: '雾霾天气可能影响心情'
        }
    };
    
    async function getCurrentWeather() {
        const response = await MockApiService.getWeather();
        return response.data;
    }
    
    async function getWeatherByDate(date) {
        const response = await MockApiService.getWeather(date);
        return response.data;
    }
    
    function formatWeatherDisplay(weatherData) {
        if (!weatherData) {
            return '未知';
        }
        
        const parts = [];
        parts.push(`${weatherData.emoji} ${weatherData.weather}`);
        
        if (weatherData.temperature) {
            parts.push(`${weatherData.temperature.current}°C`);
            parts.push(`(${weatherData.temperature.min}°C ~ ${weatherData.temperature.max}°C)`);
        }
        
        if (weatherData.airQuality) {
            parts.push(`空气: ${weatherData.airQuality}`);
        }
        
        return parts.join(' ');
    }
    
    function getWeatherEmotionInfluence(weatherType) {
        const influence = weatherEmotions[weatherType];
        if (influence) {
            return influence;
        }
        
        return {
            emotions: ['中性'],
            influence: 0.5,
            description: '普通天气'
        };
    }
    
    function getWeatherSuggestion(weatherData) {
        if (!weatherData) {
            return '享受写作时光吧！';
        }
        
        const influence = getWeatherEmotionInfluence(weatherData.weather);
        
        let suggestion = influence.description;
        
        if (influence.influence >= 0.6) {
            suggestion += ' 这是个适合记录美好心情的好日子。';
        } else if (influence.influence >= 0.4) {
            suggestion += ' 这样的天气适合平静地记录生活。';
        } else {
            suggestion += ' 即使天气不好，写作也能帮助你调节心情。';
        }
        
        return suggestion;
    }
    
    function getQuickWeatherText(weatherData) {
        if (!weatherData) {
            return '今天天气不错。';
        }
        
        const texts = [
            `今天天气${weatherData.weather}，${weatherData.description}。`,
            `${weatherData.emoji} 今天是${weatherData.weather}天，气温${weatherData.temperature?.current || '适中'}°C。`,
            `现在外面${weatherData.weather}，感觉${weatherData.airQuality === '优' ? '很舒服' : '一般'}。`
        ];
        
        return texts[Math.floor(Math.random() * texts.length)];
    }
    
    function generateWeatherEmotionTags(weatherData) {
        if (!weatherData) {
            return [];
        }
        
        const influence = getWeatherEmotionInfluence(weatherData.weather);
        const tags = influence.emotions.map(emotion => ({
            text: emotion,
            type: 'weather',
            confidence: influence.influence
        }));
        
        return tags;
    }
    
    return {
        getCurrentWeather,
        getWeatherByDate,
        formatWeatherDisplay,
        getWeatherEmotionInfluence,
        getWeatherSuggestion,
        getQuickWeatherText,
        generateWeatherEmotionTags
    };
})();
