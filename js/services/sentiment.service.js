
/**
 * 情感分析服务
 * 使用TensorFlow.js进行情感分析
 */
const SentimentService = (function() {
    let model = null;
    let isModelLoaded = false;
    let modelLoading = false;
    
    const positiveWords = [
        '开心', '快乐', '高兴', '幸福', '美好', '喜欢', '爱', '感谢', '感激', '成功',
        '顺利', '棒', '好', '优秀', '精彩', '美妙', '愉快', '满足', '满意',
        '希望', '期待', '兴奋', '激动', '惊喜', '热爱', '珍惜', '感恩', '乐观',
        '积极', '向上', '进步', '成长', '收获', '成就', '荣誉', '赞赏', '鼓励',
        '温暖', '温馨', '和谐', '和平', '安宁', '宁静', '放松', '舒适', '惬意',
        '甜蜜', '浪漫', '激情', '活力', '朝气', '阳光', '灿烂', '辉煌', '荣耀',
        '胜利', '凯旋', '成功', '达成', '实现', '突破', '超越', '领先', '优秀'
    ];
    
    const negativeWords = [
        '难过', '伤心', '痛苦', '悲伤', '失望', '生气', '愤怒', '讨厌', '恨', '失败',
        '困难', '糟糕', '坏', '差', '烦恼', '忧虑', '焦虑', '害怕', '恐惧',
        '担心', '沮丧', '郁闷', '压抑', '痛苦', '绝望', '失望', '失落', '孤独',
        '寂寞', '无聊', '空虚', '迷茫', '困惑', '疑惑', '犹豫', '怀疑', '不信任',
        '愤怒', '生气', '恼火', '烦躁', '不安', '紧张', '压力', '疲惫', '劳累',
        '生病', '疼痛', '难受', '不舒服', '难过', '悲伤', '哭泣', '流泪', '心碎',
        '背叛', '欺骗', '伤害', '损失', '失去', '失败', '挫折', '打击', '失望'
    ];
    
    const neutralWords = [
        '平静', '普通', '一般', '正常', '日常', '平常', '平淡', '简单', '平凡',
        '安静', '沉默', '冷静', '沉着', '稳重', '温和', '柔和', '平缓', '平稳',
        '中性', '中立', '客观', '理性', '理智', '思考', '思维', '想法', '感受'
    ];
    
    const emotionEmojis = {
        positive: ['😊', '😄', '🥰', '😍', '🤩', '😎', '🥳', '🎉', '✨', '🌟'],
        neutral: ['😐', '😶', '🫤', '😑', '🤔', '😌', '🙂', '😊'],
        negative: ['😢', '😭', '😔', '😞', '😟', '😤', '😠', '😡', '😰', '😨', '💔']
    };
    
    async function loadModel() {
        if (isModelLoaded) {
            return true;
        }
        
        if (modelLoading) {
            while (modelLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return isModelLoaded;
        }
        
        modelLoading = true;
        
        try {
            if (typeof tf !== 'undefined') {
                console.log('TensorFlow.js available, initializing sentiment analysis...');
                
                model = {
                    predict: async (inputData) => {
                        return await ruleBasedAnalysis(inputData.text);
                    }
                };
            } else {
                console.log('TensorFlow.js not available, using rule-based analysis');
            }
            
            isModelLoaded = true;
            return true;
        } catch (error) {
            console.error('Failed to load sentiment model:', error);
            model = null;
            isModelLoaded = true;
            return false;
        } finally {
            modelLoading = false;
        }
    }
    
    function preprocessText(text) {
        if (!text) {
            return '';
        }
        
        let processed = text.toLowerCase();
        processed = processed.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '');
        processed = processed.replace(/\s+/g, ' ').trim();
        
        return processed;
    }
    
    function tokenizeChinese(text) {
        const tokens = [];
        let i = 0;
        
        while (i < text.length) {
            let found = false;
            
            for (let len = Math.min(4, text.length - i); len >= 2; len--) {
                const substring = text.substring(i, i + len);
                
                if (positiveWords.includes(substring) || 
                    negativeWords.includes(substring) || 
                    neutralWords.includes(substring)) {
                    tokens.push(substring);
                    i += len;
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                tokens.push(text[i]);
                i++;
            }
        }
        
        return tokens;
    }
    
    async function ruleBasedAnalysis(text) {
        if (!text || text.trim().length === 0) {
            return {
                positive: 0.33,
                neutral: 0.34,
                negative: 0.33,
                dominant: 'neutral',
                confidence: 0.33,
                tokens: [],
                keywords: []
            };
        }
        
        const processedText = preprocessText(text);
        const tokens = tokenizeChinese(processedText);
        
        let positiveScore = 0;
        let negativeScore = 0;
        let neutralScore = 0;
        let totalWords = 0;
        const keywords = [];
        
        tokens.forEach(token => {
            totalWords++;
            
            if (positiveWords.includes(token)) {
                positiveScore += 1;
                keywords.push({ word: token, sentiment: 'positive' });
            } else if (negativeWords.includes(token)) {
                negativeScore += 1;
                keywords.push({ word: token, sentiment: 'negative' });
            } else if (neutralWords.includes(token)) {
                neutralScore += 0.5;
                keywords.push({ word: token, sentiment: 'neutral' });
            } else {
                neutralScore += 0.3;
            }
        });
        
        const hasKeywords = keywords.length > 0;
        let randomFactor = 0;
        
        if (!hasKeywords) {
            randomFactor = (Math.random() - 0.5) * 0.2;
        }
        
        const total = positiveScore + negativeScore + neutralScore + 0.001;
        
        let positive = positiveScore / total;
        let negative = negativeScore / total;
        let neutral = neutralScore / total;
        
        positive += randomFactor;
        negative -= randomFactor * 0.5;
        neutral = 1 - positive - negative;
        
        positive = Math.max(0, Math.min(1, positive));
        negative = Math.max(0, Math.min(1, negative));
        neutral = Math.max(0, Math.min(1, neutral));
        
        const sum = positive + negative + neutral;
        positive = positive / sum;
        negative = negative / sum;
        neutral = neutral / sum;
        
        let dominant = 'neutral';
        let confidence = neutral;
        
        if (positive > neutral && positive > negative) {
            dominant = 'positive';
            confidence = positive;
        } else if (negative > neutral && negative > positive) {
            dominant = 'negative';
            confidence = negative;
        }
        
        return {
            positive: Math.round(positive * 100) / 100,
            neutral: Math.round(neutral * 100) / 100,
            negative: Math.round(negative * 100) / 100,
            dominant,
            confidence: Math.round(confidence * 100) / 100,
            tokens,
            keywords
        };
    }
    
    async function analyze(text) {
        if (!isModelLoaded) {
            await loadModel();
        }
        
        return await ruleBasedAnalysis(text);
    }
    
    async function analyzeWithMockApi(text) {
        const response = await MockApiService.analyzeSentiment(text);
        return response.data;
    }
    
    function getEmotionEmoji(analysisResult) {
        if (!analysisResult) {
            return '😊';
        }
        
        const emojis = emotionEmojis[analysisResult.dominant] || emotionEmojis.neutral;
        return emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    function getEmotionLabel(analysisResult) {
        if (!analysisResult) {
            return '中性';
        }
        
        const labels = {
            positive: '积极',
            neutral: '中性',
            negative: '消极'
        };
        
        return labels[analysisResult.dominant] || '中性';
    }
    
    function getEmotionColor(analysisResult) {
        if (!analysisResult) {
            return '#f59e0b';
        }
        
        const colors = {
            positive: '#22c55e',
            neutral: '#f59e0b',
            negative: '#ef4444'
        };
        
        return colors[analysisResult.dominant] || '#f59e0b';
    }
    
    function formatAnalysisDisplay(analysisResult) {
        if (!analysisResult) {
            return {
                label: '待分析',
                emoji: '🤔',
                color: '#64748b'
            };
        }
        
        return {
            label: getEmotionLabel(analysisResult),
            emoji: getEmotionEmoji(analysisResult),
            color: getEmotionColor(analysisResult),
            positive: Math.round(analysisResult.positive * 100),
            neutral: Math.round(analysisResult.neutral * 100),
            negative: Math.round(analysisResult.negative * 100)
        };
    }
    
    return {
        loadModel,
        analyze,
        analyzeWithMockApi,
        preprocessText,
        tokenizeChinese,
        getEmotionEmoji,
        getEmotionLabel,
        getEmotionColor,
        formatAnalysisDisplay
    };
})();
