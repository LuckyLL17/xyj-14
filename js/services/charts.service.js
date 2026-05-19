/**
 * 图表服务
 * 使用 ECharts.js 封装各类数据可视化图表
 * 支持鼠标缩放、框选筛选、悬停显示明细等交互功能
 */
const ChartsService = (function() {
    // 存储所有图表实例，便于后续销毁或更新
    const chartInstances = {};

    /**
     * 通用图表配置 - 应用于所有图表的基础配置
     * 包含响应式布局、主题色、动画效果等
     */
    const commonOptions = {
        // 响应式配置，根据容器大小自动调整
        responsive: true,
        maintainAspectRatio: false,
        // 动画配置
        animationDuration: 1000,
        animationEasing: 'cubicOut',
        // 提示框通用配置
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            textStyle: {
                color: '#1e293b',
                fontSize: 13
            },
            extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 12px;'
        },
        // 网格配置
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
        }
    };

    /**
     * 主题色配置
     */
    const themeColors = {
        primary: '#6366f1',
        primaryLight: '#818cf8',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#06b6d4',
        purple: '#a855f7',
        pink: '#ec4899',
        cyan: '#06b6d4'
    };

    /**
     * 初始化图表
     * @param {string} containerId - 容器元素ID
     * @returns {echarts.ECharts} - ECharts 实例
     */
    function initChart(containerId) {
        // 如果已存在实例，先销毁
        if (chartInstances[containerId]) {
            chartInstances[containerId].dispose();
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Chart container ${containerId} not found`);
            return null;
        }

        // 创建新实例
        const chart = echarts.init(container);
        chartInstances[containerId] = chart;

        // 监听窗口大小变化，自动调整图表大小
        window.addEventListener('resize', function() {
            if (chartInstances[containerId]) {
                chartInstances[containerId].resize();
            }
        });

        return chart;
    }

    /**
     * 销毁指定图表
     * @param {string} containerId - 容器元素ID
     */
    function disposeChart(containerId) {
        if (chartInstances[containerId]) {
            chartInstances[containerId].dispose();
            delete chartInstances[containerId];
        }
    }

    /**
     * 销毁所有图表
     */
    function disposeAllCharts() {
        Object.keys(chartInstances).forEach(containerId => {
            disposeChart(containerId);
        });
    }

    /**
     * 渲染柱状图 - 写作频率
     * 支持鼠标缩放、框选筛选、悬停显示明细
     * @param {string} containerId - 容器ID
     * @param {Object} data - 图表数据 { labels: [], data: [], wordData: [] }
     */
    function renderBarChart(containerId, data) {
        const chart = initChart(containerId);
        if (!chart) return;

        // 如果没有数据，显示空状态
        if (!data || !data.labels || data.labels.length === 0) {
            showEmptyState(chart, '暂无写作数据');
            return;
        }

        const option = {
            ...commonOptions,
            // 标题
            title: {
                show: false
            },
            // 图例
            legend: {
                data: ['写作次数', '字数'],
                top: 0,
                textStyle: {
                    fontSize: 12,
                    color: '#64748b'
                }
            },
            // X轴
            xAxis: {
                type: 'category',
                data: data.labels,
                axisLine: {
                    lineStyle: {
                        color: '#e2e8f0'
                    }
                },
                axisLabel: {
                    color: '#64748b',
                    fontSize: 11,
                    rotate: data.labels.length > 15 ? 45 : 0
                }
            },
            // Y轴
            yAxis: [
                {
                    type: 'value',
                    name: '次数',
                    position: 'left',
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: themeColors.primary
                        }
                    },
                    axisLabel: {
                        color: '#64748b',
                        fontSize: 11
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#f1f5f9',
                            type: 'dashed'
                        }
                    }
                },
                {
                    type: 'value',
                    name: '字数',
                    position: 'right',
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: themeColors.success
                        }
                    },
                    axisLabel: {
                        color: '#64748b',
                        fontSize: 11
                    },
                    splitLine: {
                        show: false
                    }
                }
            ],
            // 数据区域缩放 - 支持鼠标滚轮缩放和框选
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100,
                    zoomOnMouseWheel: true,
                    moveOnMouseMove: true,
                    moveOnMouseWheel: false
                },
                {
                    type: 'slider',
                    start: 0,
                    end: 100,
                    height: 20,
                    bottom: 5,
                    borderColor: 'transparent',
                    backgroundColor: '#f1f5f9',
                    fillerColor: 'rgba(99, 102, 241, 0.2)',
                    handleStyle: {
                        color: themeColors.primary
                    },
                    textStyle: {
                        color: '#64748b',
                        fontSize: 10
                    }
                }
            ],
            // 工具箱 - 支持框选筛选、数据视图、下载等
            toolbox: {
                show: true,
                top: 0,
                right: 0,
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                        title: {
                            zoom: '区域缩放',
                            back: '重置缩放'
                        }
                    },
                    restore: {
                        title: '还原'
                    },
                    saveAsImage: {
                        title: '保存图片'
                    }
                },
                iconStyle: {
                    borderColor: '#64748b'
                }
            },
            // 系列数据
            series: [
                {
                    name: '写作次数',
                    type: 'bar',
                    data: data.data,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: themeColors.primaryLight },
                            { offset: 1, color: themeColors.primary }
                        ]),
                        borderRadius: [4, 4, 0, 0]
                    },
                    emphasis: {
                        itemStyle: {
                            color: themeColors.primary
                        }
                    },
                    // 悬停显示明细
                    tooltip: {
                        formatter: function(params) {
                            return `
                                <div style="font-weight: 600; margin-bottom: 8px;">${params.name}</div>
                                <div style="display: flex; justify-content: space-between; gap: 20px;">
                                    <span>写作次数:</span>
                                    <span style="font-weight: 600; color: ${themeColors.primary};">${params.value} 次</span>
                                </div>
                            `;
                        }
                    }
                },
                {
                    name: '字数',
                    type: 'line',
                    yAxisIndex: 1,
                    data: data.wordData,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    lineStyle: {
                        width: 3,
                        color: themeColors.success
                    },
                    itemStyle: {
                        color: themeColors.success
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
                            { offset: 1, color: 'rgba(34, 197, 94, 0.05)' }
                        ])
                    },
                    // 悬停显示明细
                    tooltip: {
                        formatter: function(params) {
                            return `
                                <div style="font-weight: 600; margin-bottom: 8px;">${params.name}</div>
                                <div style="display: flex; justify-content: space-between; gap: 20px;">
                                    <span>字数:</span>
                                    <span style="font-weight: 600; color: ${themeColors.success};">${params.value.toLocaleString()} 字</span>
                                </div>
                            `;
                        }
                    }
                }
            ]
        };

        chart.setOption(option);
    }

    /**
     * 渲染饼图 - 情绪分布
     * 支持悬停高亮、点击展开、图例筛选
     * @param {string} containerId - 容器ID
     * @param {Object} data - 图表数据 { labels: [], data: [], colors: [] }
     */
    function renderPieChart(containerId, data) {
        const chart = initChart(containerId);
        if (!chart) return;

        // 如果没有数据，显示空状态
        if (!data || !data.labels || data.data.every(v => v === 0)) {
            showEmptyState(chart, '暂无情绪分析数据');
            return;
        }

        // 转换数据格式
        const pieData = data.labels.map((label, index) => ({
            value: data.data[index],
            name: label,
            itemStyle: {
                color: data.colors[index]
            }
        }));

        const option = {
            ...commonOptions,
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                textStyle: {
                    color: '#1e293b',
                    fontSize: 13
                },
                // 悬停显示明细
                formatter: function(params) {
                    const total = params.data.reduce ? params.data.reduce((sum, item) => sum + item.value, 0) : 
                                  pieData.reduce((sum, item) => sum + item.value, 0);
                    const percent = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0;
                    return `
                        <div style="font-weight: 600; margin-bottom: 8px;">${params.name}</div>
                        <div style="display: flex; justify-content: space-between; gap: 20px;">
                            <span>数量:</span>
                            <span style="font-weight: 600;">${params.value} 篇</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 20px;">
                            <span>占比:</span>
                            <span style="font-weight: 600; color: ${params.color};">${percent}%</span>
                        </div>
                    `;
                }
            },
            legend: {
                orient: 'vertical',
                right: '5%',
                top: 'center',
                textStyle: {
                    fontSize: 12,
                    color: '#64748b'
                },
                itemWidth: 14,
                itemHeight: 14,
                itemGap: 16
            },
            series: [
                {
                    name: '情绪分布',
                    type: 'pie',
                    radius: ['45%', '70%'],
                    center: ['35%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 8,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 16,
                            fontWeight: 'bold',
                            formatter: '{d}%'
                        },
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.2)'
                        },
                        scale: true,
                        scaleSize: 8
                    },
                    labelLine: {
                        show: false
                    },
                    data: pieData
                }
            ]
        };

        chart.setOption(option);
    }

    /**
     * 渲染雷达图 - 写作习惯分析
     * 展示多个维度的写作习惯数据
     * @param {string} containerId - 容器ID
     * @param {Object} data - 图表数据 { indicators: [], values: [], maxValues: [] }
     */
    function renderRadarChart(containerId, data) {
        const chart = initChart(containerId);
        if (!chart) return;

        // 如果没有数据，显示空状态
        if (!data || !data.indicators || data.indicators.length === 0) {
            showEmptyState(chart, '暂无写作习惯数据');
            return;
        }

        const option = {
            ...commonOptions,
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                textStyle: {
                    color: '#1e293b',
                    fontSize: 13
                },
                // 悬停显示明细
                formatter: function(params) {
                    let html = `<div style="font-weight: 600; margin-bottom: 8px;">${params.name}</div>`;
                    data.indicators.forEach((indicator, index) => {
                        const value = params.value[index];
                        const max = indicator.max;
                        const percent = ((value / max) * 100).toFixed(0);
                        html += `
                            <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px;">
                                <span>${indicator.name}:</span>
                                <span style="font-weight: 600;">${value} / ${max} (${percent}%)</span>
                            </div>
                        `;
                    });
                    return html;
                }
            },
            legend: {
                data: ['写作习惯'],
                top: 0,
                textStyle: {
                    fontSize: 12,
                    color: '#64748b'
                }
            },
            radar: {
                indicator: data.indicators,
                shape: 'polygon',
                splitNumber: 4,
                axisName: {
                    color: '#64748b',
                    fontSize: 11
                },
                splitLine: {
                    lineStyle: {
                        color: '#e2e8f0'
                    }
                },
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1'].reverse()
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: '#cbd5e1'
                    }
                }
            },
            series: [
                {
                    name: '写作习惯',
                    type: 'radar',
                    data: [
                        {
                            value: data.values,
                            name: '写作习惯',
                            symbol: 'circle',
                            symbolSize: 6,
                            lineStyle: {
                                width: 2,
                                color: themeColors.primary
                            },
                            itemStyle: {
                                color: themeColors.primary
                            },
                            areaStyle: {
                                color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                                    { offset: 0, color: 'rgba(99, 102, 241, 0.6)' },
                                    { offset: 1, color: 'rgba(99, 102, 241, 0.1)' }
                                ])
                            }
                        }
                    ]
                }
            ]
        };

        chart.setOption(option);
    }

    /**
     * 渲染桑基图 - 情绪变化流向
     * 展示不同情绪之间的转换关系
     * @param {string} containerId - 容器ID
     * @param {Object} data - 图表数据 { nodes: [], links: [] }
     */
    function renderSankeyChart(containerId, data) {
        const chart = initChart(containerId);
        if (!chart) return;

        // 如果没有数据或没有有效的链接，显示空状态
        if (!data || !data.nodes || data.nodes.length < 2 || !data.links || data.links.length === 0) {
            showEmptyState(chart, '暂无情绪变化数据');
            return;
        }

        const option = {
            ...commonOptions,
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                textStyle: {
                    color: '#1e293b',
                    fontSize: 13
                },
                // 悬停显示明细
                formatter: function(params) {
                    if (params.dataType === 'edge') {
                        return `
                            <div style="font-weight: 600; margin-bottom: 8px;">情绪转换</div>
                            <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px;">
                                <span>从:</span>
                                <span style="font-weight: 600;">${params.data.source}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px;">
                                <span>到:</span>
                                <span style="font-weight: 600;">${params.data.target}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; gap: 20px;">
                                <span>次数:</span>
                                <span style="font-weight: 600; color: ${themeColors.primary};">${params.data.value} 次</span>
                            </div>
                        `;
                    } else {
                        return `
                            <div style="font-weight: 600; margin-bottom: 8px;">${params.name}</div>
                            <div style="display: flex; justify-content: space-between; gap: 20px;">
                                <span>总流量:</span>
                                <span style="font-weight: 600;">${params.value} 次</span>
                            </div>
                        `;
                    }
                }
            },
            series: [
                {
                    type: 'sankey',
                    layout: 'none',
                    emphasis: {
                        focus: 'adjacency',
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.3)'
                        }
                    },
                    nodeAlign: 'left',
                    data: data.nodes,
                    links: data.links,
                    lineStyle: {
                        color: 'gradient',
                        curveness: 0.5,
                        opacity: 0.4
                    },
                    label: {
                        color: '#1e293b',
                        fontSize: 12,
                        fontWeight: 500
                    },
                    itemStyle: {
                        borderWidth: 0,
                        borderRadius: 4
                    }
                }
            ]
        };

        chart.setOption(option);
    }

    /**
     * 渲染折线图 - 词频趋势
     * 支持鼠标缩放、框选筛选、悬停显示明细
     * @param {string} containerId - 容器ID
     * @param {Object} data - 图表数据 { dates: [], words: [{ name: '', data: [] }] }
     */
    function renderLineChart(containerId, data) {
        const chart = initChart(containerId);
        if (!chart) return;

        // 如果没有数据，显示空状态
        if (!data || !data.dates || data.dates.length === 0 || !data.words || data.words.length === 0) {
            showEmptyState(chart, '暂无词频数据');
            return;
        }

        // 如果只有1个数据点，复制一个相同的点以形成线段
        let chartDates = data.dates;
        let chartWords = data.words;
        if (chartDates.length === 1) {
            chartDates = [...data.dates, data.dates[0]];
            chartWords = data.words.map(word => ({
                ...word,
                data: [...word.data, word.data[0]]
            }));
        }

        // 为每条折线分配颜色
        const lineColors = [
            themeColors.primary,
            themeColors.success,
            themeColors.warning,
            themeColors.danger,
            themeColors.info,
            themeColors.purple,
            themeColors.pink,
            themeColors.cyan
        ];

        // 构建系列数据
        const series = chartWords.map((word, index) => ({
            name: word.name,
            type: 'line',
            data: word.data,
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
                width: 3,
                color: lineColors[index % lineColors.length]
            },
            itemStyle: {
                color: lineColors[index % lineColors.length]
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: lineColors[index % lineColors.length] + '4D' },
                    { offset: 1, color: lineColors[index % lineColors.length] + '0D' }
                ])
            },
            emphasis: {
                focus: 'series',
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.3)'
                }
            }
        }));

        const option = {
            ...commonOptions,
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6366f1',
                        color: '#fff',
                        borderRadius: 4,
                        padding: [4, 8]
                    },
                    crossStyle: {
                        color: '#999',
                        width: 1,
                        type: 'dashed'
                    }
                },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                textStyle: {
                    color: '#1e293b',
                    fontSize: 13
                },
                // 悬停显示明细
                formatter: function(params) {
                    let html = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
                    params.forEach(param => {
                        html += `
                            <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px; align-items: center;">
                                <span style="display: flex; align-items: center; gap: 6px;">
                                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${param.color};"></span>
                                    ${param.seriesName}:
                                </span>
                                <span style="font-weight: 600;">${param.value} 次</span>
                            </div>
                        `;
                    });
                    return html;
                }
            },
            legend: {
                data: chartWords.map(w => w.name),
                top: 0,
                textStyle: {
                    fontSize: 12,
                    color: '#64748b'
                },
                type: 'scroll',
                pageTextStyle: {
                    color: '#64748b'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: chartDates,
                axisLine: {
                    lineStyle: {
                        color: '#e2e8f0'
                    }
                },
                axisLabel: {
                    color: '#64748b',
                    fontSize: 11,
                    rotate: chartDates.length > 15 ? 45 : 0
                }
            },
            yAxis: {
                type: 'value',
                name: '出现次数',
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#cbd5e1'
                    }
                },
                axisLabel: {
                    color: '#64748b',
                    fontSize: 11
                },
                splitLine: {
                    lineStyle: {
                        color: '#f1f5f9',
                        type: 'dashed'
                    }
                }
            },
            // 数据区域缩放 - 支持鼠标滚轮缩放和框选
            dataZoom: chartDates.length > 5 ? [
                {
                    type: 'inside',
                    start: 0,
                    end: 100,
                    zoomOnMouseWheel: true,
                    moveOnMouseMove: true,
                    moveOnMouseWheel: false
                },
                {
                    type: 'slider',
                    start: 0,
                    end: 100,
                    height: 20,
                    bottom: 5,
                    borderColor: 'transparent',
                    backgroundColor: '#f1f5f9',
                    fillerColor: 'rgba(99, 102, 241, 0.2)',
                    handleStyle: {
                        color: themeColors.primary
                    },
                    textStyle: {
                        color: '#64748b',
                        fontSize: 10
                    }
                }
            ] : undefined,
            // 工具箱 - 支持框选筛选、数据视图、下载等
            toolbox: {
                show: true,
                top: 0,
                right: 0,
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                        title: {
                            zoom: '区域缩放',
                            back: '重置缩放'
                        }
                    },
                    restore: {
                        title: '还原'
                    },
                    saveAsImage: {
                        title: '保存图片'
                    }
                },
                iconStyle: {
                    borderColor: '#64748b'
                }
            },
            series: series
        };

        chart.setOption(option);
    }

    /**
     * 显示空状态
     * 当没有数据时显示友好提示
     * @param {echarts.ECharts} chart - 图表实例
     * @param {string} message - 提示信息
     */
    function showEmptyState(chart, message) {
        chart.setOption({
            title: {
                text: message,
                left: 'center',
                top: 'center',
                textStyle: {
                    color: '#94a3b8',
                    fontSize: 14,
                    fontWeight: 'normal'
                }
            },
            backgroundColor: 'transparent'
        });
    }

    /**
     * 更新指定图表的数据
     * @param {string} containerId - 容器ID
     * @param {Object} newOption - 新的配置选项
     */
    function updateChart(containerId, newOption) {
        if (chartInstances[containerId]) {
            chartInstances[containerId].setOption(newOption, true);
        }
    }

    /**
     * 获取图表实例
     * @param {string} containerId - 容器ID
     * @returns {echarts.ECharts|null} - 图表实例
     */
    function getChartInstance(containerId) {
        return chartInstances[containerId] || null;
    }

    // 暴露公共方法
    return {
        initChart,
        disposeChart,
        disposeAllCharts,
        renderBarChart,
        renderPieChart,
        renderRadarChart,
        renderSankeyChart,
        renderLineChart,
        updateChart,
        getChartInstance,
        showEmptyState
    };
})();
