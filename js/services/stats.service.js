
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
     * 从所有日记中提取六个维度的写作习惯指标：
     *   1. 写作频率（日记数量）
     *   2. 平均字数
     *   3. 写作连续性（连续天数）
     *   4. 情感积极度
     *   5. 关键词丰富度（去重关键词数 / 总关键词数）
     *   6. 时间分布均衡度（在一天各时段写作的分散程度）
     * 返回一个对象，包含 indicator 数组（维度定义）和 value 数组（归一化后的指标值）
     */
    function getWritingHabitRadarData(diaries) {
        if (!diaries || diaries.length === 0) {
            return {
                indicators: [
                    { name: '写作频率', max: 100 },
                    { name: '平均字数', max: 100 },
                    { name: '连续性', max: 100 },
                    { name: '积极度', max: 100 },
                    { name: '关键词丰富', max: 100 },
                    { name: '时间均衡', max: 100 }
                ],
                values: [0, 0, 0, 0, 0, 0]
            };
        }

        const stats = calculateStats(diaries, 'all');

        // 1. 写作频率：按日期数估算，最多 365 天视为满分 100
        const uniqueDates = Object.keys(stats.frequency).length;
        const frequency = Math.min(100, Math.round((uniqueDates / 365) * 100));

        // 2. 平均字数：以平均字数 1000 字为满分
        const avgWords = Math.min(100, Math.round((stats.avgWords / 1000) * 100));

        // 3. 连续性：以连续写作天数 30 天为满分
        const continuity = Math.min(100, Math.round((stats.streak / 30) * 100));

        // 4. 积极度：积极情绪占比 * 100
        const totalEmotions = stats.emotionStats.positive + stats.emotionStats.neutral + stats.emotionStats.negative;
        const positivity = totalEmotions > 0
            ? Math.round((stats.emotionStats.positive / totalEmotions) * 100)
            : 0;

        // 5. 关键词丰富度：去重关键词数 / 总关键词数
        const allKeywords = [];
        diaries.forEach(d => {
            if (d.sentiment && d.sentiment.keywords) {
                d.sentiment.keywords.forEach(k => allKeywords.push(k.word));
            }
        });
        const uniqueKeywordCount = new Set(allKeywords).size;
        const keywordRichness = allKeywords.length > 0
            ? Math.min(100, Math.round((uniqueKeywordCount / allKeywords.length) * 100 * 2))
            : 0;

        // 6. 时间均衡度：将 24 小时分为 6 个时段，统计每个时段的日记数
        const timeSlots = [0, 0, 0, 0, 0, 0];
        diaries.forEach(d => {
            const hour = new Date(d.createdAt).getHours();
            const slotIndex = Math.floor(hour / 4);
            timeSlots[Math.min(slotIndex, 5)]++;
        });
        const maxSlot = Math.max(...timeSlots, 1);
        const timeBalance = Math.round((1 - (maxSlot - 1) / diaries.length) * 100);

        return {
            indicators: [
                { name: '写作频率', max: 100 },
                { name: '平均字数', max: 100 },
                { name: '连续性', max: 100 },
                { name: '积极度', max: 100 },
                { name: '关键词丰富', max: 100 },
                { name: '时间均衡', max: 100 }
            ],
            values: [frequency, avgWords, continuity, positivity, keywordRichness, Math.max(0, timeBalance)]
        };
    }

    /**
     * 获取情绪变化桑基图数据
     * 按日期顺序，将每一天的主导情绪作为源节点，下一天的主导情绪作为目标节点
     * 统计相邻两天之间情绪变化的频次，构建 sankey 的 nodes 和 links
     */
    function getEmotionSankeyData(diaries) {
        if (!diaries || diaries.length === 0) {
            return { nodes: [], links: [] };
        }

        // 按日期排序
        const sortedDiaries = [...diaries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const dailyEmotions = [];

        // 聚合同一天的日记，取出现次数最多的情绪
        const dailyGroups = {};
        sortedDiaries.forEach(d => {
            const key = formatDate(d.createdAt);
            if (!dailyGroups[key]) dailyGroups[key] = { positive: 0, neutral: 0, negative: 0 };
            const dominant = d.sentiment && d.sentiment.dominant ? d.sentiment.dominant : 'neutral';
            dailyGroups[key][dominant]++;
        });

        Object.keys(dailyGroups).sort().forEach(date => {
            const g = dailyGroups[date];
            let dominant = 'neutral';
            if (g.positive >= g.neutral && g.positive >= g.negative) dominant = 'positive';
            else if (g.negative > g.neutral && g.negative > g.positive) dominant = 'negative';
            dailyEmotions.push({ date, emotion: dominant });
        });

        // 建立节点：按日期-情绪的唯一组合作为 sankey 的节点
        const nodeSet = new Set();
        const linksMap = {};

        for (let i = 0; i < dailyEmotions.length - 1; i++) {
            const source = `${dailyEmotions[i].date} ${emotionLabel(dailyEmotions[i].emotion)}`;
            const target = `${dailyEmotions[i + 1].date} ${emotionLabel(dailyEmotions[i + 1].emotion)}`;
            nodeSet.add(source);
            nodeSet.add(target);
            const key = `${source}->${target}`;
            linksMap[key] = (linksMap[key] || 0) + 1;
        }

        const nodes = Array.from(nodeSet).map(name => ({ name }));
        const links = Object.keys(linksMap).map(key => {
            const [source, target] = key.split('->');
            return { source, target, value: linksMap[key] };
        });

        return { nodes, links };
    }

    /**
     * 获取词频趋势折线图数据
     * 对日记中出现的关键词按日期聚合，统计 Top N 关键词在各日期的出现频次
     * 返回 categories（日期标签）和 series（每个关键词一条折线）
     */
    function getKeywordTrendData(diaries, topN = 8) {
        if (!diaries || diaries.length === 0) {
            return { categories: [], series: [] };
        }

        // 先统计所有关键词的总频次，取 topN
        const wordCount = {};
        diaries.forEach(d => {
            if (d.sentiment && d.sentiment.keywords) {
                d.sentiment.keywords.forEach(k => {
                    wordCount[k.word] = (wordCount[k.word] || 0) + 1;
                });
            }
        });

        const topWords = Object.keys(wordCount)
            .sort((a, b) => wordCount[b] - wordCount[a])
            .slice(0, topN);

        // 按日期聚合 topN 关键词的出现次数
        const dateMap = {};
        diaries.forEach(d => {
            const date = formatDate(d.createdAt);
            if (!dateMap[date]) dateMap[date] = {};
            if (d.sentiment && d.sentiment.keywords) {
                d.sentiment.keywords.forEach(k => {
                    if (topWords.includes(k.word)) {
                        dateMap[date][k.word] = (dateMap[date][k.word] || 0) + 1;
                    }
                });
            }
        });

        const categories = Object.keys(dateMap).sort();
        const series = topWords.map(word => ({
            name: word,
            data: categories.map(date => dateMap[date][word] || 0),
            type: 'line',
            smooth: true
        }));

        return { categories, series, topWords };
    }

    /**
     * 辅助：情绪英文转中文标签
     */
    function emotionLabel(key) {
        const map = { positive: '积极', neutral: '中性', negative: '消极' };
        return map[key] || '中性';
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
        getWritingHabitRadarData,
        getEmotionSankeyData,
        getKeywordTrendData
    };
})();
