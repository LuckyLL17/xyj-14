
/**
 * ECharts 可视化服务
 * 封装所有基于 ECharts 5 的图表渲染逻辑
 * 提供：柱状图、饼图、雷达图、桑基图、词频折线图
 * 支持交互：鼠标滚轮缩放、框选筛选、悬停明细
 */
const EChartsService = (function() {

    // ECharts 库是否已加载
    const isAvailable = typeof echarts !== 'undefined';

    // 已创建的 ECharts 实例缓存，便于销毁和 resize
    const chartInstances = {};

    // 主题色板（与 style.css 中的 CSS 变量保持一致）
    const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#ec4899', '#14b8a6'];

    /**
     * 获取或初始化一个 ECharts 实例
     * @param {string} domId 容器 DOM 的 id
     * @returns {echarts.ECharts}
     */
    function getInstance(domId) {
        // 如果 ECharts 库未加载，直接返回 null
        if (!isAvailable) return null;
        const dom = document.getElementById(domId);
        if (!dom) return null;
        // 强制触发一次重排，确保浏览器已计算出容器尺寸
        // 避免在切换 tab 瞬间容器隐藏时 ECharts 读到 0 尺寸
        void dom.offsetWidth;
        void dom.offsetHeight;
        if (chartInstances[domId]) {
            return chartInstances[domId];
        }
        // 如果容器尺寸仍然为 0（还没完成布局），延迟重试最多 5 次
        if (dom.offsetWidth === 0 || dom.offsetHeight === 0) {
            return null;
        }
        chartInstances[domId] = echarts.init(dom);
        return chartInstances[domId];
    }

    /**
     * 释放指定 DOM 的 ECharts 实例
     * @param {string} domId
     */
    function disposeInstance(domId) {
        if (chartInstances[domId]) {
            chartInstances[domId].dispose();
            delete chartInstances[domId];
        }
    }

    /**
     * 释放所有已创建的实例（通常在退出统计页时调用）
     */
    function disposeAll() {
        Object.keys(chartInstances).forEach(key => {
            try { chartInstances[key].dispose(); } catch (e) {}
            delete chartInstances[key];
        });
    }

    /**
     * 响应窗口尺寸变化，自适应 resize 所有图表
     */
    function resizeAll() {
        Object.keys(chartInstances).forEach(key => {
            try {
                const chart = chartInstances[key];
                const dom = chart.getDom();
                // 再次确保容器尺寸已就绪
                void dom.offsetWidth;
                void dom.offsetHeight;
                chart.resize();
            } catch (e) {}
        });
    }

    /**
     * 渲染"写作频率"柱状图
     * @param {string} domId 容器 DOM id
     * @param {Object} chartData StatsService.getFrequencyChartData 返回的数据
     */
    function renderFrequencyBar(domId, chartData) {
        const chart = getInstance(domId);
        if (!chart) return;

        // 无数据时显示空状态提示
        if (!chartData || !chartData.labels || chartData.labels.length === 0) {
            chart.clear();
            chart.setOption({
                title: {
                    text: '暂无数据',
                    left: 'center',
                    top: 'center',
                    textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 'normal' }
                }
            });
            return;
        }

        const option = {
            // 鼠标悬停时显示详细数据
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function(params) {
                    const p = params[0];
                    const word = params[1];
                    return `${p.axisValueLabel}<br/>日记数：<b>${p.data}</b><br/>字数：<b>${word.data}</b>`;
                }
            },
            // 图例
            legend: { data: ['日记数', '字数'], top: 0 },
            // 网格配置
            grid: { left: 50, right: 20, top: 40, bottom: 60, containLabel: true },
            // 工具箱：支持鼠标缩放、框选筛选、还原、下载图片
            toolbox: {
                feature: {
                    dataZoom: { yAxisIndex: 'none' },
                    dataView: { readOnly: true },
                    restore: {},
                    saveAsImage: {}
                },
                right: 10,
                top: 0
            },
            // 区域缩放（鼠标滚轮 + 底部滑块）
            dataZoom: [
                { type: 'inside', start: 0, end: 100 },
                { type: 'slider', start: 0, end: 100, height: 20, bottom: 20 }
            ],
            xAxis: {
                type: 'category',
                data: chartData.labels,
                axisLabel: { color: '#64748b', rotate: chartData.labels.length > 15 ? 30 : 0 }
            },
            yAxis: {
                type: 'value',
                name: '数量',
                axisLabel: { color: '#64748b' }
            },
            series: [
                {
                    name: '日记数',
                    type: 'bar',
                    data: chartData.data,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#6366f1' },
                            { offset: 1, color: '#a5b4fc' }
                        ]),
                        borderRadius: [4, 4, 0, 0]
                    },
                    // 支持悬停高亮
                    emphasis: { focus: 'series' }
                },
                {
                    name: '字数',
                    type: 'bar',
                    data: chartData.wordData,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#22c55e' },
                            { offset: 1, color: '#86efac' }
                        ]),
                        borderRadius: [4, 4, 0, 0]
                    }
                }
            ]
        };

        chart.clear();
        chart.setOption(option);
    }

    /**
     * 渲染"情绪分布"饼图（环形饼 + 悬停明细）
     * @param {string} domId
     * @param {Object} emotionData StatsService.getEmotionChartData 返回的数据
     */
    function renderEmotionPie(domId, emotionData) {
        const chart = getInstance(domId);
        if (!chart) return;

        if (!emotionData || !emotionData.data || emotionData.data.every(v => v === 0)) {
            chart.clear();
            chart.setOption({
                title: {
                    text: '暂无数据',
                    left: 'center',
                    top: 'center',
                    textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 'normal' }
                }
            });
            return;
        }

        const pieData = emotionData.labels.map((label, idx) => ({
            name: label,
            value: emotionData.data[idx],
            itemStyle: { color: emotionData.colors[idx] }
        }));

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}% ({d}%)'
            },
            legend: { bottom: 0, left: 'center' },
            toolbox: {
                feature: {
                    restore: {},
                    saveAsImage: {}
                },
                right: 10,
                top: 0
            },
            series: [{
                name: '情绪分布',
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    formatter: '{b}\n{c}%'
                },
                emphasis: {
                    label: { show: true, fontSize: 14, fontWeight: 'bold' },
                    itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' }
                },
                data: pieData
            }]
        };

        chart.clear();
        chart.setOption(option);
    }

    /**
     * 渲染"写作习惯"雷达图
     * 展示六个维度的归一化指标，悬停查看具体数值
     * @param {string} domId
     * @param {Object} radarData StatsService.getWritingHabitRadarData 返回的数据
     */
    function renderWritingRadar(domId, radarData) {
        const chart = getInstance(domId);
        if (!chart) return;

        if (!radarData || !radarData.indicators || radarData.indicators.length === 0) {
            chart.clear();
            chart.setOption({
                title: {
                    text: '暂无数据',
                    left: 'center',
                    top: 'center',
                    textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 'normal' }
                }
            });
            return;
        }

        const option = {
            tooltip: {
                trigger: 'item',
                // 悬停时在气泡中展示各维度的具体分值
                formatter: function() {
                    let html = '<b>写作习惯分析</b><br/>';
                    radarData.indicators.forEach((ind, i) => {
                        html += `${ind.name}：<b>${radarData.values[i]}</b><br/>`;
                    });
                    return html;
                }
            },
            legend: { data: ['习惯指数'], top: 0 },
            radar: {
                indicator: radarData.indicators,
                shape: 'polygon',
                splitNumber: 5,
                axisName: { color: '#475569', fontSize: 12 },
                splitArea: { areaStyle: { color: ['#f8fafc', '#f1f5f9'] } },
                axisLine: { lineStyle: { color: '#cbd5e1' } },
                splitLine: { lineStyle: { color: '#e2e8f0' } }
            },
            series: [{
                name: '写作习惯',
                type: 'radar',
                data: [{
                    value: radarData.values,
                    name: '习惯指数',
                    symbol: 'circle',
                    symbolSize: 6,
                    lineStyle: { width: 2, color: '#6366f1' },
                    areaStyle: {
                        color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                            { offset: 0, color: 'rgba(99,102,241,0.5)' },
                            { offset: 1, color: 'rgba(99,102,241,0.05)' }
                        ])
                    },
                    itemStyle: { color: '#6366f1' }
                }],
                // 悬停时放大显示
                emphasis: { focus: 'series' }
            }]
        };

        chart.clear();
        chart.setOption(option);
    }

    /**
     * 渲染"情绪变化"桑基图
     * 展示相邻日期之间主导情绪的流转路径
     * @param {string} domId
     * @param {Object} sankeyData StatsService.getEmotionSankeyData 返回的数据
     */
    function renderEmotionSankey(domId, sankeyData) {
        const chart = getInstance(domId);
        if (!chart) return;

        if (!sankeyData || !sankeyData.nodes || sankeyData.nodes.length === 0) {
            chart.clear();
            chart.setOption({
                title: {
                    text: '暂无数据',
                    left: 'center',
                    top: 'center',
                    textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 'normal' }
                }
            });
            return;
        }

        // 根据节点名称中的情绪关键词分配颜色
        const getColor = (name) => {
            if (name.includes('积极')) return '#22c55e';
            if (name.includes('消极')) return '#ef4444';
            return '#f59e0b';
        };

        // 节点项加上颜色配置
        const nodes = sankeyData.nodes.map(n => ({
            name: n.name,
            itemStyle: { color: getColor(n.name) }
        }));

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    if (params.dataType === 'edge') {
                        return `${params.data.source} → ${params.data.target}<br/>次数：<b>${params.data.value}</b>`;
                    }
                    return `${params.name}`;
                }
            },
            toolbox: {
                feature: {
                    restore: {},
                    saveAsImage: {}
                },
                right: 10,
                top: 0
            },
            series: [{
                type: 'sankey',
                layout: 'none',
                emphasis: { focus: 'adjacency' },
                nodeAlign: 'justify',
                nodeWidth: 14,
                nodeGap: 8,
                layoutIterations: 0,
                data: nodes,
                links: sankeyData.links,
                lineStyle: {
                    color: 'gradient',
                    curveness: 0.5,
                    opacity: 0.5
                },
                label: { fontSize: 11, color: '#334155' }
            }]
        };

        chart.clear();
        chart.setOption(option);
    }

    /**
     * 渲染"词频趋势"折线图
     * 每条折线代表一个高频关键词，随日期变化的出现次数
     * 支持鼠标滚轮缩放、框选筛选（brush）、底部 dataZoom
     * @param {string} domId
     * @param {Object} trendData StatsService.getKeywordTrendData 返回的数据
     */
    function renderKeywordTrend(domId, trendData) {
        const chart = getInstance(domId);
        if (!chart) return;

        if (!trendData || !trendData.categories || trendData.categories.length === 0) {
            chart.clear();
            chart.setOption({
                title: {
                    text: '暂无数据',
                    left: 'center',
                    top: 'center',
                    textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 'normal' }
                }
            });
            return;
        }

        const option = {
            tooltip: {
                trigger: 'axis',
                // 悬停时以表格形式展示所有关键词当天的频次
                axisPointer: { type: 'cross' }
            },
            legend: {
                data: trendData.series.map(s => s.name),
                top: 0,
                type: 'scroll'
            },
            grid: { left: 50, right: 30, top: 50, bottom: 80, containLabel: true },
            toolbox: {
                feature: {
                    // 框选筛选
                    dataZoom: { yAxisIndex: 'none' },
                    // 还原视图
                    restore: {},
                    // 下载图片
                    saveAsImage: {}
                },
                right: 10,
                top: 0
            },
            // 鼠标滚轮 + 底部滑块区域缩放
            dataZoom: [
                { type: 'inside', start: 0, end: 100 },
                { type: 'slider', start: 0, end: 100, height: 20, bottom: 30 }
            ],
            // 支持 brush 框选高亮部分折线
            brush: {
                xAxisIndex: 0,
                brushType: 'lineX',
                brushStyle: {
                    borderWidth: 1,
                    color: 'rgba(99,102,241,0.2)',
                    borderColor: '#6366f1'
                },
                outOfBrush: { color: 'rgba(0,0,0,0.1)' },
                toolbox: ['lineX', 'clear']
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: trendData.categories,
                axisLabel: { color: '#64748b', rotate: trendData.categories.length > 15 ? 30 : 0 }
            },
            yAxis: {
                type: 'value',
                name: '出现次数',
                axisLabel: { color: '#64748b' }
            },
            color: COLORS,
            series: trendData.series.map(s => ({
                name: s.name,
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                emphasis: { focus: 'series' },
                data: s.data
            }))
        };

        chart.clear();
        chart.setOption(option);
    }

    /**
     * 统一渲染：根据已有的 stats 与 diaries 数据
     * 调用所有图表的渲染入口，支持延迟重试（等待容器布局完成）
     * @param {Object} stats StatsService.calculateStats 返回的数据
     * @param {Array} diaries 全部日记数组（用于雷达、桑基、词频趋势）
     * @param {string} period 当前选择的时间范围（day/week/month/year/all）
     */
    function renderAll(stats, diaries, period) {
        // 如果 ECharts 库没加载，退化为简易文本提示
        if (!isAvailable) {
            const ids = ['frequency-chart', 'emotion-chart', 'radar-chart', 'sankey-chart', 'keyword-trend-chart'];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:40px 0;">图表加载失败，请检查网络连接</p>';
                }
            });
            return;
        }
        // 每个图表的渲染任务列表：包含渲染函数、参数
        const tasks = [
            { name: 'frequency', fn: renderFrequencyBar, args: ['frequency-chart', StatsService.getFrequencyChartData(stats, period)] },
            { name: 'emotion', fn: renderEmotionPie, args: ['emotion-chart', StatsService.getEmotionChartData(stats)] },
            { name: 'radar', fn: renderWritingRadar, args: ['radar-chart', StatsService.getWritingHabitRadarData(diaries)] },
            { name: 'sankey', fn: renderEmotionSankey, args: ['sankey-chart', StatsService.getEmotionSankeyData(diaries)] },
            { name: 'keyword', fn: renderKeywordTrend, args: ['keyword-trend-chart', StatsService.getKeywordTrendData(diaries, 8)] }
        ];

        let remaining = tasks.slice();
        let attempts = 0;
        const MAX_ATTEMPTS = 10;

        // 逐轮尝试渲染，直到所有图表都成功，或达到最大重试次数
        const tryRender = () => {
            if (attempts >= MAX_ATTEMPTS) return;
            const stillPending = [];
            remaining.forEach(task => {
                // 调用渲染函数，传入参数
                task.fn(task.args[0], task.args[1]);
                // 如果该图表对应的 ECharts 实例仍然不存在，说明容器还没准备好
                if (!chartInstances[task.args[0]]) {
                    stillPending.push(task);
                }
            });
            remaining = stillPending;
            attempts++;
            if (remaining.length > 0) {
                setTimeout(tryRender, 100);
            }
        };
        tryRender();
    }

    return {
        getInstance,
        disposeInstance,
        disposeAll,
        resizeAll,
        renderFrequencyBar,
        renderEmotionPie,
        renderWritingRadar,
        renderEmotionSankey,
        renderKeywordTrend,
        renderAll
    };
})();

// 显式挂载到 window，确保在严格模式下也能通过 window.EChartsService 访问
window.EChartsService = EChartsService;
