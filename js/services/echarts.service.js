
/**
 * ECharts 可视化服务
 * 封装所有基于 ECharts 5 的图表渲染逻辑
 * 提供：柱状图、饼图、雷达图、桑基图、词频折线图
 * 支持交互：鼠标滚轮缩放、框选筛选、悬停明细
 */
// 将 EChartsService 暴露到 window，确保在 app.js 的 IIFE 中也能访问
window.EChartsService = (function() {

    // 已创建的 ECharts 实例缓存，便于销毁和 resize
    const chartInstances = {};

    // 主题色板（与 style.css 中的 CSS 变量保持一致）
    const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#ec4899', '#14b8a6'];

    /**
     * 检查 ECharts 全局对象是否可用
     * @returns {boolean}
     */
    function isEChartsAvailable() {
        return typeof window.echarts !== 'undefined' && window.echarts !== null;
    }

    /**
     * 获取或初始化一个 ECharts 实例
     * @param {string} domId 容器 DOM 的 id
     * @returns {echarts.ECharts}
     */
    function getInstance(domId) {
        if (!isEChartsAvailable()) {
            console.warn('[EChartsService] echarts 尚未加载，无法初始化图表');
            return null;
        }
        const dom = document.getElementById(domId);
        if (!dom) {
            console.warn('[EChartsService] 未找到容器:', domId);
            return null;
        }
        if (chartInstances[domId]) {
            return chartInstances[domId];
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
            try { chartInstances[key].resize(); } catch (e) {}
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
     * 调用所有图表的渲染入口
     * @param {Object} stats StatsService.calculateStats 返回的数据
     * @param {Array} diaries 全部日记数组（用于雷达、桑基、词频趋势）
     * @param {string} period 当前选择的时间范围（day/week/month/year/all）
     */
    function renderAll(stats, diaries, period) {
        // 若 ECharts 未可用，延迟重试（CDN 可能尚未加载完成）
        if (!isEChartsAvailable()) {
            console.warn('[EChartsService] ECharts 未加载，500ms 后重试...');
            setTimeout(() => renderAll(stats, diaries, period), 500);
            return;
        }
        // 确保统计页已经显示（否则 DOM 宽度为 0，ECharts 无法渲染）
        const statsView = document.getElementById('stats-view');
        if (statsView && statsView.classList.contains('hidden')) {
            setTimeout(() => renderAll(stats, diaries, period), 50);
            return;
        }

        // 1. 写作频率柱状图
        const freqData = StatsService.getFrequencyChartData(stats, period);
        renderFrequencyBar('frequency-chart', freqData);

        // 2. 情绪分布饼图
        const emoData = StatsService.getEmotionChartData(stats);
        renderEmotionPie('emotion-chart', emoData);

        // 3. 写作习惯雷达图
        const radarData = StatsService.getWritingHabitRadarData(diaries);
        renderWritingRadar('radar-chart', radarData);

        // 4. 情绪变化桑基图（需要所有历史日记的情绪）
        const sankeyData = StatsService.getEmotionSankeyData(diaries);
        renderEmotionSankey('sankey-chart', sankeyData);

        // 5. 词频趋势折线图
        const trendData = StatsService.getKeywordTrendData(diaries, 8);
        renderKeywordTrend('keyword-trend-chart', trendData);

        // 初始化完成后触发一次 resize，保证 canvas 与容器尺寸对齐
        setTimeout(() => resizeAll(), 50);
    }

    return {
        getInstance,
        disposeInstance,
        disposeAll,
        resizeAll,
        isEChartsAvailable,
        renderFrequencyBar,
        renderEmotionPie,
        renderWritingRadar,
        renderEmotionSankey,
        renderKeywordTrend,
        renderAll
    };
})();
// 兼容：同时在 window 和全局作用域暴露，方便 app.js 访问
const EChartsService = window.EChartsService;
