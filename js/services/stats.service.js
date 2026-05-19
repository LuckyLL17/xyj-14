
/**
 * 统计服务
 * 处理写作频率、字数统计等数据分析
 */
const StatsService = (function() {
    
    function countWords(text) {
        if (!text) {
            return 0;
        }
        
        const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
        const englishWords = text.match(/[a-zA-Z]+/g) || [];
        const numbers = text.match(/\d+/g) || [];
        
        return chineseChars.length + englishWords.length + numbers.length;
    }
    
    function formatDate(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    
    function isSameDay(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }
    
    function isSameWeek(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        
        const day1 = d1.getDay();
        const day2 = d2.getDay();
        
        const monday1 = new Date(d1);
        monday1.setDate(d1.getDate() - (day1 === 0 ? 6 : day1 - 1));
        
        const monday2 = new Date(d2);
        monday2.setDate(d2.getDate() - (day2 === 0 ? 6 : day2 - 1));
        
        return monday1.getTime() === monday2.getTime();
    }
    
    function isSameMonth(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth();
    }
    
    function isSameYear(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear();
    }
    
    function getDateRange(period) {
        const now = new Date();
        const start = new Date();
        
        switch (period) {
            case 'day':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                break;
            case 'month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'year':
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                break;
            default:
                return null;
        }
        
        return {
            start: start,
            end: now
        };
    }
    
    function filterDiariesByPeriod(diaries, period) {
        const range = getDateRange(period);
        if (!range) {
            return diaries;
        }
        
        return diaries.filter(diary => {
            const diaryDate = new Date(diary.createdAt);
            return diaryDate >= range.start && diaryDate <= range.end;
        });
    }
    
    function calculateStats(diaries, period = 'all') {
        const filteredDiaries = period === 'all' ? diaries : filterDiariesByPeriod(diaries, period);
        
        if (filteredDiaries.length === 0) {
            return {
                totalDiaries: 0,
                totalWords: 0,
                avgWords: 0,
                streak: 0,
                frequency: {},
                emotionStats: {
                    positive: 0,
                    neutral: 0,
                    negative: 0
                }
            };
        }
        
        let totalWords = 0;
        const frequency = {};
        const emotionStats = {
            positive: 0,
            neutral: 0,
            negative: 0
        };
        
        filteredDiaries.forEach(diary => {
            const words = countWords(diary.content);
            totalWords += words;
            
            const dateKey = formatDate(diary.createdAt);
            if (!frequency[dateKey]) {
                frequency[dateKey] = { count: 0, words: 0 };
            }
            frequency[dateKey].count++;
            frequency[dateKey].words += words;
            
            if (diary.sentiment) {
                emotionStats[diary.sentiment.dominant] = (emotionStats[diary.sentiment.dominant] || 0) + 1;
            }
        });
        
        const streak = calculateStreak(filteredDiaries);
        
        return {
            totalDiaries: filteredDiaries.length,
            totalWords: totalWords,
            avgWords: Math.round(totalWords / filteredDiaries.length),
            streak: streak,
            frequency: frequency,
            emotionStats: emotionStats
        };
    }
    
    function calculateStreak(diaries) {
        if (diaries.length === 0) {
            return 0;
        }
        
        const dates = [...new Set(diaries.map(d => formatDate(d.createdAt)))];
        dates.sort((a, b) => new Date(b) - new Date(a));
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < dates.length; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const checkDateStr = formatDate(checkDate);
            
            if (dates.includes(checkDateStr)) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    function getFrequencyChartData(stats, period) {
        const frequency = stats.frequency;
        const dates = Object.keys(frequency).sort();
        
        if (dates.length === 0) {
            return [];
        }
        
        let labels = [];
        let data = [];
        let wordData = [];
        
        switch (period) {
            case 'day':
                const today = new Date();
                for (let i = 23; i >= 0; i--) {
                    const hour = new Date(today);
                    hour.setHours(hour.getHours() - i);
                    labels.push(`${hour.getHours()}:00`);
                    
                    const dateStr = formatDate(hour);
                    if (frequency[dateStr]) {
                        data.push(frequency[dateStr].count);
                        wordData.push(frequency[dateStr].words);
                    } else {
                        data.push(0);
                        wordData.push(0);
                    }
                }
                break;
                
            case 'week':
                const weekStart = new Date();
                const dayOfWeek = weekStart.getDay();
                const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                weekStart.setDate(diff);
                
                const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(weekStart);
                    d.setDate(weekStart.getDate() + i);
                    labels.push(dayNames[i]);
                    
                    const dateStr = formatDate(d);
                    if (frequency[dateStr]) {
                        data.push(frequency[dateStr].count);
                        wordData.push(frequency[dateStr].words);
                    } else {
                        data.push(0);
                        wordData.push(0);
                    }
                }
                break;
                
            case 'month':
                const monthStart = new Date();
                monthStart.setDate(1);
                const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
                
                for (let i = 1; i <= daysInMonth; i++) {
                    labels.push(`${i}日`);
                    
                    const d = new Date(monthStart);
                    d.setDate(i);
                    const dateStr = formatDate(d);
                    
                    if (frequency[dateStr]) {
                        data.push(frequency[dateStr].count);
                        wordData.push(frequency[dateStr].words);
                    } else {
                        data.push(0);
                        wordData.push(0);
                    }
                }
                break;
                
            case 'year':
                const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
                const yearStart = new Date();
                yearStart.setMonth(0, 1);
                
                for (let i = 0; i < 12; i++) {
                    labels.push(months[i]);
                    
                    const monthDates = dates.filter(date => {
                        const d = new Date(date);
                        return d.getMonth() === i && d.getFullYear() === yearStart.getFullYear();
                    });
                    
                    let count = 0;
                    let words = 0;
                    monthDates.forEach(date => {
                        count += frequency[date].count;
                        words += frequency[date].words;
                    });
                    data.push(count);
                    wordData.push(words);
                }
                break;
                
            default:
                labels = dates.slice(-30);
                data = labels.map(d => frequency[d].count);
                wordData = labels.map(d => frequency[d].words);
        }
        
        return {
            labels,
            data,
            wordData
        };
    }
    
    function getEmotionChartData(stats) {
        const emotionStats = stats.emotionStats;
        const total = emotionStats.positive + emotionStats.neutral + emotionStats.negative;
        
        if (total === 0) {
            return {
                labels: ['积极', '中性', '消极'],
                data: [0, 0, 0],
                colors: ['#22c55e', '#f59e0b', '#ef4444']
            };
        }
        
        return {
            labels: ['积极', '中性', '消极'],
            data: [
                Math.round((emotionStats.positive / total) * 100),
                Math.round((emotionStats.neutral / total) * 100),
                Math.round((emotionStats.negative / total) * 100)
            ],
            colors: ['#22c55e', '#f59e0b', '#ef4444']
        };
    }
    
    function generateChartHTML(chartData, type = 'bar') {
        if (!chartData || chartData.labels.length === 0) {
            return '<p>暂无数据</p>';
        }
        
        const maxValue = Math.max(...chartData.data, 1);
        
        let html = '<div class="chart-bars">';
        
        chartData.labels.forEach((label, index) => {
            const value = chartData.data[index];
            const height = (value / maxValue) * 100;
            
            html += `
                <div class="chart-bar-item">
                    <div class="chart-bar" style="height: ${height}%">
                        <span class="chart-bar-value">${value}</span>
                    </div>
                    <span class="chart-bar-label">${label}</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    function generatePieChartHTML(chartData) {
        if (!chartData || chartData.data.every(v => v === 0)) {
            return '<p>暂无数据</p>';
        }
        
        const total = chartData.data.reduce((a, b) => a + b, 0);
        
        let html = '<div class="emotion-pie-chart">';
        
        chartData.labels.forEach((label, index) => {
            const value = chartData.data[index];
            const color = chartData.colors[index];
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            
            html += `
                <div class="emotion-legend-item">
                    <div class="emotion-color-box" style="background: ${color}"></div>
                    <span class="emotion-label">${label}</span>
                    <span class="emotion-percentage">${percentage}%</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    /**
     * 获取写作习惯雷达图数据
     * 分析多个维度的写作习惯：写作频率、平均字数、最长篇幅、写作时段多样性、情绪多样性
     * @param {Array} diaries - 日记列表
     * @param {string} period - 统计周期
     * @returns {Object} - 雷达图数据 { indicators: [], values: [] }
     */
    function getWritingHabitsRadarData(diaries, period = 'all') {
        const filteredDiaries = period === 'all' ? diaries : filterDiariesByPeriod(diaries, period);
        
        if (filteredDiaries.length === 0) {
            return {
                indicators: [],
                values: []
            };
        }

        // 计算各维度数据
        const totalDiaries = filteredDiaries.length;
        const totalWords = filteredDiaries.reduce((sum, d) => sum + countWords(d.content), 0);
        const avgWords = Math.round(totalWords / totalDiaries);
        const maxWords = Math.max(...filteredDiaries.map(d => countWords(d.content)));

        // 分析写作时段多样性（按小时分布）
        const hourDistribution = {};
        filteredDiaries.forEach(diary => {
            const hour = new Date(diary.createdAt).getHours();
            hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
        });
        const uniqueHours = Object.keys(hourDistribution).length;
        const timeDiversity = Math.min(100, Math.round((uniqueHours / 24) * 100));

        // 分析情绪多样性
        const emotionTypes = new Set();
        filteredDiaries.forEach(diary => {
            if (diary.sentiment && diary.sentiment.dominant) {
                emotionTypes.add(diary.sentiment.dominant);
            }
        });
        const emotionDiversity = Math.min(100, Math.round((emotionTypes.size / 3) * 100));

        // 计算写作频率得分（基于周期内的天数覆盖率）
        const uniqueDays = new Set(filteredDiaries.map(d => formatDate(d.createdAt)));
        let frequencyScore;
        switch (period) {
            case 'day':
                frequencyScore = Math.min(100, totalDiaries * 20);
                break;
            case 'week':
                frequencyScore = Math.min(100, Math.round((uniqueDays.size / 7) * 100));
                break;
            case 'month':
                frequencyScore = Math.min(100, Math.round((uniqueDays.size / 30) * 100));
                break;
            case 'year':
                frequencyScore = Math.min(100, Math.round((uniqueDays.size / 365) * 100));
                break;
            default:
                frequencyScore = Math.min(100, Math.round((uniqueDays.size / 30) * 100));
        }

        // 平均字数得分（以500字为满分基准）
        const avgWordsScore = Math.min(100, Math.round((avgWords / 500) * 100));

        // 最长篇幅得分（以2000字为满分基准）
        const maxWordsScore = Math.min(100, Math.round((maxWords / 2000) * 100));

        // 构建雷达图数据
        return {
            indicators: [
                { name: '写作频率', max: 100 },
                { name: '平均字数', max: 100 },
                { name: '最长篇幅', max: 100 },
                { name: '时段多样性', max: 100 },
                { name: '情绪多样性', max: 100 }
            ],
            values: [
                frequencyScore,
                avgWordsScore,
                maxWordsScore,
                timeDiversity,
                emotionDiversity
            ],
            // 原始数据，用于悬停显示
            rawData: {
                totalDiaries,
                avgWords,
                maxWords,
                uniqueHours,
                emotionTypes: emotionTypes.size
            }
        };
    }

    /**
     * 获取情绪变化桑基图数据
     * 分析按时间顺序的情绪转换关系
     * @param {Array} diaries - 日记列表
     * @returns {Object} - 桑基图数据 { nodes: [], links: [] }
     */
    function getEmotionSankeyData(diaries) {
        // 情绪类型映射
        const emotionMap = {
            positive: '积极情绪',
            neutral: '中性情绪',
            negative: '消极情绪'
        };

        // 情绪颜色
        const emotionColors = {
            positive: '#22c55e',
            neutral: '#f59e0b',
            negative: '#ef4444'
        };

        // 统计各情绪的日记数量
        const emotionCounts = { positive: 0, neutral: 0, negative: 0 };
        const diariesWithSentiment = [];

        diaries.forEach(diary => {
            if (diary.sentiment && diary.sentiment.dominant) {
                const emotion = diary.sentiment.dominant;
                if (emotionCounts.hasOwnProperty(emotion)) {
                    emotionCounts[emotion]++;
                    diariesWithSentiment.push(diary);
                }
            }
        });

        // 如果有情绪的日记少于2篇，只返回节点和统计数据，不返回链接
        if (diariesWithSentiment.length < 2) {
            const nodes = Object.entries(emotionMap)
                .filter(([key]) => emotionCounts[key] > 0)
                .map(([key, name]) => ({
                    name: name,
                    itemStyle: {
                        color: emotionColors[key]
                    }
                }));
            return { nodes, links: [], emotionCounts };
        }

        // 按时间排序
        const sortedDiaries = [...diariesWithSentiment].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // 统计情绪转换
        const transitions = {};

        for (let i = 0; i < sortedDiaries.length - 1; i++) {
            const current = sortedDiaries[i];
            const next = sortedDiaries[i + 1];

            const currentEmotion = current.sentiment.dominant;
            const nextEmotion = next.sentiment.dominant;

            // 排除自循环，桑基图不支持 cycle
            if (currentEmotion !== nextEmotion) {
                const key = `${currentEmotion}->${nextEmotion}`;
                transitions[key] = (transitions[key] || 0) + 1;
            }
        }

        // 只包含有数据的节点
        const nodes = Object.entries(emotionMap)
            .filter(([key]) => emotionCounts[key] > 0)
            .map(([key, name]) => ({
                name: name,
                itemStyle: {
                    color: emotionColors[key]
                }
            }));

        // 构建链接数据
        const links = Object.entries(transitions).map(([key, value]) => {
            const [source, target] = key.split('->');
            return {
                source: emotionMap[source],
                target: emotionMap[target],
                value: value
            };
        });

        return { nodes, links, emotionCounts };
    }

    /**
     * 获取词频趋势折线图数据
     * 分析高频词汇在时间上的变化趋势
     * @param {Array} diaries - 日记列表
     * @param {string} period - 统计周期
     * @param {number} topN - 显示前N个高频词
     * @returns {Object} - 折线图数据 { dates: [], words: [{ name: '', data: [] }] }
     */
    function getWordFrequencyLineData(diaries, period = 'all', topN = 5) {
        const filteredDiaries = period === 'all' ? diaries : filterDiariesByPeriod(diaries, period);
        
        if (filteredDiaries.length === 0) {
            return { dates: [], words: [] };
        }

        // 按日期分组
        const dateGroups = {};
        filteredDiaries.forEach(diary => {
            const dateKey = formatDate(diary.createdAt);
            if (!dateGroups[dateKey]) {
                dateGroups[dateKey] = [];
            }
            dateGroups[dateKey].push(diary);
        });

        const sortedDates = Object.keys(dateGroups).sort();

        // 统计所有词汇频率
        const wordFrequency = {};
        const stopWords = ['的', '了', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '里', '在', '他', '她', '它', '们', '这个', '那个', '什么', '怎么', '为什么', '因为', '所以', '但是', '然后', '还是', '或者', '如果', '虽然', '然而', '而且', '并且', '以及', '等', '等等', '啊', '哦', '嗯', '哈', '呀', '吧', '呢', '吗'];

        filteredDiaries.forEach(diary => {
            const content = diary.content || '';
            // 提取中文字符
            const chineseChars = content.match(/[\u4e00-\u9fa5]+/g) || [];
            chineseChars.forEach(text => {
                // 简单的分词：按2-4个字符组合
                for (let len = 2; len <= Math.min(4, text.length); len++) {
                    for (let i = 0; i <= text.length - len; i++) {
                        const word = text.substring(i, i + len);
                        if (!stopWords.includes(word) && word.length >= 2) {
                            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                        }
                    }
                }
            });
            
            // 同时提取英文单词
            const englishWords = content.match(/[a-zA-Z]{3,}/g) || [];
            englishWords.forEach(word => {
                const lowerWord = word.toLowerCase();
                if (!stopWords.includes(lowerWord)) {
                    wordFrequency[lowerWord] = (wordFrequency[lowerWord] || 0) + 1;
                }
            });
        });

        // 获取TopN高频词
        const topWords = Object.entries(wordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([word]) => word);

        if (topWords.length === 0) {
            return { dates: [], words: [] };
        }

        // 构建每个词的时间序列数据
        const wordsData = topWords.map(word => {
            const data = sortedDates.map(date => {
                const diariesOnDate = dateGroups[date] || [];
                let count = 0;
                diariesOnDate.forEach(diary => {
                    const content = diary.content || '';
                    const regex = new RegExp(word, 'g');
                    const matches = content.match(regex);
                    if (matches) {
                        count += matches.length;
                    }
                });
                return count;
            });
            return { name: word, data };
        });

        // 格式化日期显示
        const formattedDates = sortedDates.map(date => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        });

        return {
            dates: formattedDates,
            words: wordsData,
            sortedDates: sortedDates
        };
    }

    /**
     * 获取详细的统计数据，包含所有新图表需要的数据
     * @param {Array} diaries - 日记列表
     * @param {string} period - 统计周期
     * @returns {Object} - 完整的统计数据
     */
    function getAdvancedStats(diaries, period = 'all') {
        const basicStats = calculateStats(diaries, period);
        const frequencyData = getFrequencyChartData(basicStats, period);
        const emotionData = getEmotionChartData(basicStats);
        const radarData = getWritingHabitsRadarData(diaries, period);
        const sankeyData = getEmotionSankeyData(diaries);
        const lineData = getWordFrequencyLineData(diaries, period);

        return {
            basicStats,
            frequencyData,
            emotionData,
            radarData,
            sankeyData,
            lineData
        };
    }

    return {
        countWords,
        formatDate,
        isSameDay,
        isSameWeek,
        isSameMonth,
        isSameYear,
        getDateRange,
        filterDiariesByPeriod,
        calculateStats,
        calculateStreak,
        getFrequencyChartData,
        getEmotionChartData,
        generateChartHTML,
        generatePieChartHTML,
        getWritingHabitsRadarData,
        getEmotionSankeyData,
        getWordFrequencyLineData,
        getAdvancedStats
    };
})();
