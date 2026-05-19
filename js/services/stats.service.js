
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
     * 生成写作习惯雷达图数据
     * 五个维度：
     *   1. 写作频率 —— 在选定周期内写了多少天（满分按周期最大天数）
     *   2. 平均字数 —— 每篇日记的平均字数（满分 1000）
     *   3. 情感积极度 —— 积极情绪占比（满分 100）
     *   4. 写作规律性 —— 连续写作天数在周期内的表现（满分按周期天数）
     *   5. 词汇丰富度 —— 不同词汇数占中文字符总数的比例（满分 100）
     *
     * @param {Object} stats - calculateStats 返回的统计对象
     * @param {string} period - 'day' | 'week' | 'month' | 'year'
     * @param {Array}  diaries - 当前用户的日记列表（需要读取 content 提取词汇）
     * @returns {{ indicators: [{name,max}], values: [number] }}
     */
    function getWritingHabitRadarData(stats, period, diaries) {
        /* 各周期对应的最大天数，用于归一化 */
        var periodMaxDays = { day: 1, week: 7, month: 31, year: 365 };
        var maxDays = periodMaxDays[period] || 30;

        /* 维度 1：写作频率 = 有写作记录的天数 / 周期总天数 * 100 */
        var writingDays = Object.keys(stats.frequency).length;
        var frequencyScore = Math.min(100, Math.round((writingDays / maxDays) * 100));

        /* 维度 2：平均字数，归一化到 100 分（1000 字满分） */
        var avgWordScore = Math.min(100, Math.round((stats.avgWords / 1000) * 100));

        /* 维度 3：情感积极度 = 积极占比 * 100 */
        var emotionTotal = stats.emotionStats.positive + stats.emotionStats.neutral + stats.emotionStats.negative;
        var positiveScore = emotionTotal > 0
            ? Math.round((stats.emotionStats.positive / emotionTotal) * 100)
            : 50;

        /* 维度 4：写作规律性 = 连续天数 / 周期总天数 * 100 */
        var regularityScore = Math.min(100, Math.round((stats.streak / maxDays) * 100));

        /* 维度 5：词汇丰富度 —— 从日记内容中提取不重复词汇数占比 */
        var uniqueChars = new Set();
        var totalChars = 0;
        var filteredDiaries = period === 'all' ? diaries : filterDiariesByPeriod(diaries, period);
        filteredDiaries.forEach(function(diary) {
            if (!diary.content) return;
            var chars = diary.content.match(/[\u4e00-\u9fa5]/g) || [];
            chars.forEach(function(c) { uniqueChars.add(c); });
            totalChars += chars.length;
        });
        var diversityScore = totalChars > 0
            ? Math.min(100, Math.round((uniqueChars.size / totalChars) * 100 * 5))
            : 0;

        return {
            indicators: [
                { name: '写作频率', max: 100 },
                { name: '平均字数', max: 100 },
                { name: '情感积极度', max: 100 },
                { name: '写作规律性', max: 100 },
                { name: '词汇丰富度', max: 100 }
            ],
            values: [frequencyScore, avgWordScore, positiveScore, regularityScore, diversityScore]
        };
    }

    /**
     * 生成情绪变化桑基图数据
     * 按时间顺序遍历日记，统计「前一篇情绪 → 后一篇情绪」的转换次数
     * 节点名使用 "_前" / "_后" 后缀区分左右两侧
     *
     * @param {Array} diaries - 日记列表（需按时间排序）
     * @returns {{ nodes: [{name}], links: [{source, target, value}] }}
     */
    function getEmotionSankeyData(diaries) {
        /* 按创建时间升序排列 */
        var sorted = [].concat(diaries).sort(function(a, b) {
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        /* 仅保留有情感分析结果的日记 */
        var withSentiment = sorted.filter(function(d) {
            return d.sentiment && d.sentiment.dominant;
        });

        /* 少于 2 篇无法形成转换 */
        if (withSentiment.length < 2) {
            return { nodes: [], links: [] };
        }

        /* 情绪标签映射为中文 */
        var labelMap = { positive: '积极', neutral: '中性', negative: '消极' };

        /* 统计转换计数 */
        var transitionCount = {};
        for (var i = 1; i < withSentiment.length; i++) {
            var src = labelMap[withSentiment[i - 1].sentiment.dominant] + '_前';
            var tgt = labelMap[withSentiment[i].sentiment.dominant] + '_后';
            var key = src + '→' + tgt;
            transitionCount[key] = (transitionCount[key] || 0) + 1;
        }

        /* 构建节点和连线 */
        var nodeSet = {};
        var nodes = [];
        var links = [];

        Object.keys(transitionCount).forEach(function(k) {
            var parts = k.split('→');
            var source = parts[0];
            var target = parts[1];

            if (!nodeSet[source]) {
                nodeSet[source] = true;
                nodes.push({ name: source });
            }
            if (!nodeSet[target]) {
                nodeSet[target] = true;
                nodes.push({ name: target });
            }

            links.push({
                source: source,
                target: target,
                value: transitionCount[k]
            });
        });

        return { nodes: nodes, links: links };
    }

    /**
     * 生成词频趋势折线图数据
     * 从日记内容中提取高频关键词，按日期统计每个关键词的出现次数
     * 取 Top N 个关键词作为折线系列
     *
     * @param {Array}  diaries - 日记列表
     * @param {number} topN    - 取前 N 个高频词（默认 5）
     * @returns {{ dates: string[], words: [{name, data: [number]}] }}
     */
    function getWordFreqTrendData(diaries, topN) {
        topN = topN || 5;

        /* 按创建时间升序 */
        var sorted = [].concat(diaries).sort(function(a, b) {
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        if (sorted.length === 0) {
            return { dates: [], words: [] };
        }

        /* 合并所有文本，统计词频 */
        var wordCount = {};
        sorted.forEach(function(diary) {
            if (!diary.content) return;
            var tokens = extractKeywords(diary.content);
            tokens.forEach(function(t) {
                wordCount[t] = (wordCount[t] || 0) + 1;
            });
        });

        /* 取 TopN 关键词 */
        var sortedWords = Object.keys(wordCount).sort(function(a, b) {
            return wordCount[b] - wordCount[a];
        });
        var topWords = sortedWords.slice(0, topN);

        if (topWords.length === 0) {
            return { dates: [], words: [] };
        }

        /* 按日期统计每个关键词的出现次数 */
        var dates = [];
        var wordDateCount = {};

        sorted.forEach(function(diary) {
            var dateKey = formatDate(diary.createdAt);
            if (dates.indexOf(dateKey) === -1) {
                dates.push(dateKey);
            }

            var tokens = diary.content ? extractKeywords(diary.content) : [];
            tokens.forEach(function(t) {
                if (topWords.indexOf(t) === -1) return;
                if (!wordDateCount[t]) wordDateCount[t] = {};
                wordDateCount[t][dateKey] = (wordDateCount[t][dateKey] || 0) + 1;
            });
        });

        /* 组装数据 */
        var words = topWords.map(function(w) {
            return {
                name: w,
                data: dates.map(function(d) { return wordDateCount[w][d] || 0; })
            };
        });

        return { dates: dates, words: words };
    }

    /**
     * 从文本中提取关键词（简易中文分词）
     * 提取 2-4 字的中文词组，过滤停用词
     *
     * @param {string} text - 原始文本
     * @returns {Array} 关键词数组
     */
    function extractKeywords(text) {
        if (!text) return [];

        /* 常见停用词 */
        var stopWords = ['今天', '昨天', '明天', '这个', '那个', '什么', '怎么',
            '没有', '可以', '已经', '因为', '所以', '但是', '虽然', '如果',
            '就是', '不是', '还是', '一些', '这些', '那些', '自己', '他们',
            '我们', '你们', '一个', '现在', '这样', '那样', '的话', '之后',
            '之前', '然后', '觉得', '知道', '时候', '起来', '出来', '过来',
            '下去', '应该', '可能', '需要', '开始', '其实', '一直', '比较',
            '非常', '真的', '很多', '这样', '那样', '这里', '那里', '我的',
            '你的', '他的', '她的', '它们', '只是', '只有', '而且', '或者',
            '以及', '还是', '对于', '关于', '通过', '进行', '作为', '目前'];

        /* 提取所有中文片段 */
        var chineseBlocks = text.match(/[\u4e00-\u9fa5]+/g) || [];
        var keywords = [];

        chineseBlocks.forEach(function(block) {
            /* 滑动窗口提取 2~4 字词组 */
            for (var len = 2; len <= 4; len++) {
                for (var i = 0; i <= block.length - len; i++) {
                    var word = block.substring(i, i + len);
                    if (stopWords.indexOf(word) === -1) {
                        keywords.push(word);
                    }
                }
            }
        });

        return keywords;
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
        getWritingHabitRadarData,
        getEmotionSankeyData,
        getWordFreqTrendData,
        extractKeywords,
        generateChartHTML,
        generatePieChartHTML
    };
})();
