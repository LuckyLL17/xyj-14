
/**
 * ECharts 图表服务
 * 封装所有 ECharts 图表的初始化、数据映射、交互配置
 * 包含：写作频率柱状图、情绪分布饼图、写作习惯雷达图、情绪变化桑基图、词频趋势折线图
 * 所有图表均支持鼠标缩放、框选筛选、悬停显示明细
 */
const EchartsService = (function() {

    /* ========== 实例缓存，防止重复初始化 ========== */
    const chartInstances = {};

    /* ========== 颜色主题常量 ========== */
    const COLORS = {
        primary: '#6366f1',
        primaryLight: '#818cf8',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        purple: '#8b5cf6',
        pink: '#ec4899',
        cyan: '#06b6d4',
        teal: '#14b8a6',
        orange: '#f97316',
        series: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316']
    };

    /**
     * 获取或创建 ECharts 实例
     * 如果容器已有实例则先销毁再重建，避免内存泄漏
     * @param {string} chartId - DOM 元素 id
     * @returns {Object|null} ECharts 实例
     */
    function getChartInstance(chartId) {
        const dom = document.getElementById(chartId);
        if (!dom) {
            console.warn('EchartsService: 未找到图表容器 #' + chartId);
            return null;
        }

        /* 如果已有实例先销毁 */
        if (chartInstances[chartId]) {
            chartInstances[chartId].dispose();
            delete chartInstances[chartId];
        }

        const instance = echarts.init(dom);
        chartInstances[chartId] = instance;
        return instance;
    }

    /**
     * 响应窗口大小变化，自动 resize 所有图表
     * 在页面初始化时绑定 window resize 事件
     */
    function resizeAll() {
        Object.values(chartInstances).forEach(function(instance) {
            if (instance && !instance.isDisposed()) {
                instance.resize();
            }
        });
    }

    /**
     * 将十六进制颜色转为带透明度的 rgba 字符串
     * @param {string} hex - 如 '#6366f1'
     * @param {number} alpha - 透明度 0~1
     * @returns {string} 如 'rgba(99,102,241,0.25)'
     */
    function hexToRgba(hex, alpha) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }

    /* ====================================================================
     *  1. 写作频率柱状图 —— 替代原来的 HTML 柱状图
     *  支持鼠标滚轮缩放（dataZoom）、框选筛选（brush）、悬停明细（tooltip）
     * ==================================================================== */

    /**
     * 渲染写作频率柱状图
     * @param {Object} chartData - StatsService.getFrequencyChartData 返回的数据
     *   { labels: string[], data: number[], wordData: number[] }
     */
    function renderFrequencyChart(chartData) {
        const chart = getChartInstance('frequency-chart');
        if (!chart) return;

        /* 无数据时显示空状态 */
        if (!chartData || !chartData.labels || chartData.labels.length === 0) {
            chart.setOption({
                title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#94a3b8', fontSize: 14 } }
            });
            return;
        }

        const option = {
            /* 背景透明，融入卡片 */
            backgroundColor: 'transparent',

            /* 悬停提示框：显示日记数量和字数明细 */
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function(params) {
                    let html = '<div style="font-weight:600;margin-bottom:4px;">' + params[0].axisValue + '</div>';
                    params.forEach(function(p) {
                        html += '<div style="display:flex;align-items:center;gap:6px;">'
                            + '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + p.color + ';"></span>'
                            + p.seriesName + '：<b>' + p.value + '</b></div>';
                    });
                    return html;
                }
            },

            /* 图例 */
            legend: {
                data: ['日记数量', '字数'],
                bottom: 0
            },

            /* 网格区域，底部留空间给 dataZoom */
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '10%',
                containLabel: true
            },

            /* X 轴 */
            xAxis: {
                type: 'category',
                data: chartData.labels,
                axisLabel: {
                    rotate: chartData.labels.length > 15 ? 45 : 0,
                    fontSize: 11,
                    color: '#64748b'
                },
                axisLine: { lineStyle: { color: '#e2e8f0' } }
            },

            /* Y 轴 */
            yAxis: [
                {
                    type: 'value',
                    name: '日记数量',
                    nameTextStyle: { color: '#64748b', fontSize: 11 },
                    axisLabel: { color: '#64748b' },
                    splitLine: { lineStyle: { color: '#f1f5f9' } }
                },
                {
                    type: 'value',
                    name: '字数',
                    nameTextStyle: { color: '#64748b', fontSize: 11 },
                    axisLabel: { color: '#64748b' },
                    splitLine: { show: false }
                }
            ],

            /* 鼠标滚轮缩放 / 拖拽平移 */
            dataZoom: [
                {
                    type: 'inside',   /* 滚轮缩放 */
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',   /* 底部滑动条 */
                    start: 0,
                    end: 100,
                    height: 20,
                    bottom: '2%'
                }
            ],

            /* 框选筛选工具 */
            toolbox: {
                feature: {
                    dataZoom: { yAxisIndex: 'none', title: { zoom: '区域缩放', back: '还原' } },
                    restore: { title: '重置' },
                    saveAsImage: { title: '保存图片' }
                },
                right: 10,
                top: 0
            },

            /* 系列数据 */
            series: [
                {
                    name: '日记数量',
                    type: 'bar',
                    data: chartData.data,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: COLORS.primary },
                            { offset: 1, color: COLORS.primaryLight }
                        ]),
                        borderRadius: [4, 4, 0, 0]
                    },
                    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(99,102,241,0.3)' } }
                },
                {
                    name: '字数',
                    type: 'bar',
                    yAxisIndex: 1,
                    data: chartData.wordData,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: COLORS.success },
                            { offset: 1, color: '#86efac' }
                        ]),
                        borderRadius: [4, 4, 0, 0]
                    },
                    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(34,197,94,0.3)' } }
                }
            ],

            /* 入场动画 */
            animationDuration: 800,
            animationEasing: 'cubicOut'
        };

        chart.setOption(option);
    }

    /* ====================================================================
     *  2. 情绪分布饼图 —— 替代原来的 HTML 饼图
     *  支持悬停展开、点击筛选、保存图片
     * ==================================================================== */

    /**
     * 渲染情绪分布饼图
     * @param {Object} emotionData - StatsService.getEmotionChartData 返回的数据
     *   { labels: string[], data: number[], colors: string[] }
     */
    function renderEmotionChart(emotionData) {
        const chart = getChartInstance('emotion-chart');
        if (!chart) return;

        if (!emotionData || emotionData.data.every(function(v) { return v === 0; })) {
            chart.setOption({
                title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#94a3b8', fontSize: 14 } }
            });
            return;
        }

        /* 组装饼图数据 */
        var pieData = emotionData.labels.map(function(label, i) {
            return {
                name: label,
                value: emotionData.data[i],
                itemStyle: { color: emotionData.colors[i] }
            };
        });

        var option = {
            backgroundColor: 'transparent',

            /* 悬停提示 */
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    return '<b>' + params.name + '</b><br/>'
                        + '占比：' + params.percent + '%<br/>'
                        + '数量：' + params.value + ' 篇';
                }
            },

            /* 工具栏 */
            toolbox: {
                feature: {
                    saveAsImage: { title: '保存图片' }
                },
                right: 10,
                top: 0
            },

            /* 图例 */
            legend: {
                orient: 'vertical',
                right: '5%',
                top: 'center',
                textStyle: { color: '#64748b' }
            },

            series: [
                {
                    type: 'pie',
                    radius: ['40%', '70%'],  /* 环形饼图 */
                    center: ['40%', '50%'],
                    avoidLabelOverlap: true,
                    /* 标签显示 */
                    label: {
                        show: true,
                        formatter: '{b}\n{d}%',
                        fontSize: 12,
                        color: '#475569'
                    },
                    /* 悬停时标签样式 */
                    emphasis: {
                        label: { show: true, fontSize: 14, fontWeight: 'bold' },
                        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' }
                    },
                    data: pieData
                }
            ],

            animationDuration: 800,
            animationEasing: 'cubicOut'
        };

        chart.setOption(option);
    }

    /* ====================================================================
     *  3. 写作习惯雷达图
     *  多维度展示写作习惯：写作频率、平均字数、情感积极度、写作规律性、词汇丰富度
     *  支持悬停显示各维度明细
     * ==================================================================== */

    /**
     * 渲染写作习惯雷达图
     * @param {Object} radarData - 由 StatsService.getWritingHabitRadarData 返回
     *   { indicators: [{name, max}], values: [number] }
     */
    function renderRadarChart(radarData) {
        var chart = getChartInstance('radar-chart');
        if (!chart) return;

        if (!radarData || !radarData.indicators || radarData.indicators.length === 0) {
            chart.setOption({
                title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#94a3b8', fontSize: 14 } }
            });
            return;
        }

        var option = {
            backgroundColor: 'transparent',

            /* 悬停提示：显示各维度的名称和具体数值 */
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    if (!params.data || !params.data.value) return '';
                    var indicators = radarData.indicators;
                    var vals = params.data.value;
                    var html = '<div style="font-weight:600;margin-bottom:4px;">写作习惯评分</div>';
                    indicators.forEach(function(ind, i) {
                        html += '<div>' + ind.name + '：<b>' + vals[i] + '</b> / ' + ind.max + '</div>';
                    });
                    return html;
                }
            },

            /* 工具栏 */
            toolbox: {
                feature: {
                    saveAsImage: { title: '保存图片' }
                },
                right: 10,
                top: 0
            },

            /* 雷达图坐标配置 */
            radar: {
                indicator: radarData.indicators,
                shape: 'polygon',
                radius: '65%',
                splitNumber: 5,
                axisName: {
                    color: '#475569',
                    fontSize: 12
                },
                splitArea: {
                    areaStyle: { color: ['rgba(99,102,241,0.02)', 'rgba(99,102,241,0.05)', 'rgba(99,102,241,0.08)', 'rgba(99,102,241,0.11)', 'rgba(99,102,241,0.14)'] }
                },
                splitLine: { lineStyle: { color: '#e2e8f0' } },
                axisLine: { lineStyle: { color: '#e2e8f0' } }
            },

            series: [
                {
                    type: 'radar',
                    data: [
                        {
                            value: radarData.values,
                            name: '我的写作习惯',
                            areaStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: 'rgba(99,102,241,0.35)' },
                                    { offset: 1, color: 'rgba(99,102,241,0.05)' }
                                ])
                            },
                            lineStyle: { color: COLORS.primary, width: 2 },
                            itemStyle: { color: COLORS.primary }
                        }
                    ],
                    emphasis: {
                        lineStyle: { width: 3 },
                        areaStyle: { color: 'rgba(99,102,241,0.45)' }
                    }
                }
            ],

            animationDuration: 800,
            animationEasing: 'cubicOut'
        };

        chart.setOption(option);
    }

    /* ====================================================================
     *  4. 情绪变化桑基图
     *  展示日记之间情绪的流转关系，左侧为前一篇日记的情绪，右侧为后一篇日记的情绪
     *  线条粗细代表该转换路径出现的次数
     *  支持悬停高亮路径、点击聚焦
     * ==================================================================== */

    /**
     * 渲染情绪变化桑基图
     * @param {Object} sankeyData - 由 StatsService.getEmotionSankeyData 返回
     *   { nodes: [{name}], links: [{source, target, value}] }
     */
    function renderSankeyChart(sankeyData) {
        var chart = getChartInstance('sankey-chart');
        if (!chart) return;

        if (!sankeyData || !sankeyData.nodes || sankeyData.nodes.length === 0
            || !sankeyData.links || sankeyData.links.length === 0) {
            chart.setOption({
                title: { text: '暂无数据（需要至少2篇日记）', left: 'center', top: 'center', textStyle: { color: '#94a3b8', fontSize: 14 } }
            });
            return;
        }

        /* 为节点分配颜色 */
        var nodeColorMap = {
            '积极_前': '#22c55e', '中性_前': '#f59e0b', '消极_前': '#ef4444',
            '积极_后': '#22c55e', '中性_后': '#f59e0b', '消极_后': '#ef4444'
        };

        var processedNodes = sankeyData.nodes.map(function(node) {
            return {
                name: node.name,
                itemStyle: { color: nodeColorMap[node.name] || COLORS.primary }
            };
        });

        var option = {
            backgroundColor: 'transparent',

            /* 悬停提示：显示情绪转换的次数和占比 */
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
                formatter: function(params) {
                    if (params.dataType === 'edge') {
                        return params.data.source.replace('_前', '') + ' → ' + params.data.target.replace('_后', '')
                            + '<br/>转换次数：<b>' + params.data.value + '</b> 次';
                    }
                    return '<b>' + params.name.replace(/_[前后]/, '') + '</b>';
                }
            },

            /* 工具栏 */
            toolbox: {
                feature: {
                    saveAsImage: { title: '保存图片' }
                },
                right: 10,
                top: 0
            },

            series: [
                {
                    type: 'sankey',
                    layoutIterations: 32,
                    nodeWidth: 20,
                    nodeGap: 12,
                    layout: 'orient-horizontal',
                    draggable: true,     /* 允许拖拽节点 */
                    emphasis: {
                        focus: 'adjacency'   /* 悬停时高亮相邻节点和连线 */
                    },
                    label: {
                        formatter: function(params) {
                            /* 去掉 _前/_后 后缀显示 */
                            return params.name.replace(/_[前后]$/, '');
                        },
                        fontSize: 12,
                        color: '#475569'
                    },
                    lineStyle: {
                        color: 'gradient',
                        curveness: 0.5,
                        opacity: 0.4
                    },
                    data: processedNodes,
                    links: sankeyData.links
                }
            ],

            animationDuration: 800,
            animationEasing: 'cubicOut'
        };

        chart.setOption(option);
    }

    /* ====================================================================
     *  5. 词频趋势折线图
     *  展示高频关键词在时间维度上的出现频率变化
     *  支持鼠标滚轮缩放（dataZoom）、框选筛选（brush）、悬停显示明细（tooltip）
     * ==================================================================== */

    /**
     * 渲染词频趋势折线图
     * @param {Object} wordFreqData - 由 StatsService.getWordFreqTrendData 返回
     *   { dates: string[], words: [{name, data: [number]}] }
     */
    function renderWordFreqChart(wordFreqData) {
        var chart = getChartInstance('wordfreq-chart');
        if (!chart) return;

        if (!wordFreqData || !wordFreqData.dates || wordFreqData.dates.length === 0
            || !wordFreqData.words || wordFreqData.words.length === 0) {
            chart.setOption({
                title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#94a3b8', fontSize: 14 } }
            });
            return;
        }

        /* 组装各词的 series */
        var series = wordFreqData.words.map(function(wordItem, idx) {
            return {
                name: wordItem.name,
                type: 'line',
                data: wordItem.data,
                smooth: true,             /* 平滑曲线 */
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { width: 2, color: COLORS.series[idx % COLORS.series.length] },
                itemStyle: { color: COLORS.series[idx % COLORS.series.length] },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: hexToRgba(COLORS.series[idx % COLORS.series.length], 0.25) },
                        { offset: 1, color: 'rgba(255,255,255,0)' }
                    ])
                },
                emphasis: {
                    focus: 'series',       /* 悬停时聚焦当前系列 */
                    lineStyle: { width: 3 }
                }
            };
        });

        var option = {
            backgroundColor: 'transparent',

            /* 悬停提示：显示日期、各词频次 */
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    var html = '<div style="font-weight:600;margin-bottom:4px;">' + params[0].axisValue + '</div>';
                    params.forEach(function(p) {
                        html += '<div style="display:flex;align-items:center;gap:6px;">'
                            + '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + p.color + ';"></span>'
                            + p.seriesName + '：<b>' + p.value + '</b> 次</div>';
                    });
                    return html;
                }
            },

            /* 图例 */
            legend: {
                data: wordFreqData.words.map(function(w) { return w.name; }),
                bottom: 0,
                textStyle: { color: '#64748b', fontSize: 11 }
            },

            /* 工具栏 */
            toolbox: {
                feature: {
                    dataZoom: { yAxisIndex: 'none', title: { zoom: '区域缩放', back: '还原' } },
                    restore: { title: '重置' },
                    saveAsImage: { title: '保存图片' }
                },
                right: 10,
                top: 0
            },

            grid: {
                left: '3%',
                right: '4%',
                bottom: '18%',
                top: '10%',
                containLabel: true
            },

            /* X 轴：日期 */
            xAxis: {
                type: 'category',
                data: wordFreqData.dates,
                boundaryGap: false,
                axisLabel: {
                    rotate: wordFreqData.dates.length > 15 ? 45 : 0,
                    fontSize: 11,
                    color: '#64748b'
                },
                axisLine: { lineStyle: { color: '#e2e8f0' } }
            },

            /* Y 轴：出现次数 */
            yAxis: {
                type: 'value',
                name: '出现次数',
                nameTextStyle: { color: '#64748b', fontSize: 11 },
                axisLabel: { color: '#64748b' },
                splitLine: { lineStyle: { color: '#f1f5f9' } }
            },

            /* 鼠标滚轮缩放 + 滑动条 */
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    start: 0,
                    end: 100,
                    height: 20,
                    bottom: '5%'
                }
            ],

            series: series,

            animationDuration: 800,
            animationEasing: 'cubicOut'
        };

        chart.setOption(option);
    }

    /**
     * 销毁所有图表实例，释放内存
     * 在切换页面或退出登录时调用
     */
    function disposeAll() {
        Object.keys(chartInstances).forEach(function(key) {
            if (chartInstances[key] && !chartInstances[key].isDisposed()) {
                chartInstances[key].dispose();
            }
            delete chartInstances[key];
        });
    }

    return {
        getChartInstance: getChartInstance,
        resizeAll: resizeAll,
        disposeAll: disposeAll,
        renderFrequencyChart: renderFrequencyChart,
        renderEmotionChart: renderEmotionChart,
        renderRadarChart: renderRadarChart,
        renderSankeyChart: renderSankeyChart,
        renderWordFreqChart: renderWordFreqChart
    };
})();
