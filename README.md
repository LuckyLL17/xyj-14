# 加密日记 - 离线优先的安全日记应用

一个完全离线运行的加密日记应用，支持富文本编辑、Markdown、天气情绪联动、情感分析和详细的统计功能。

---

## ✨ 功能特性

### 🔐 安全加密
- **AES-GCM 256位加密**：使用 Web Crypto API (Crypto.subtle) 进行端到端加密
- **密码派生密钥**：使用 PBKDF2 + SHA-256 从密码派生加密密钥
- **本地存储**：所有数据只保存在浏览器本地，不上传任何服务器
- **会话恢复**：刷新页面自动恢复加密会话，无需重新输入密码

### 📝 编辑器功能
- **双模式编辑**：
  - 富文本模式（支持加粗、斜体、标题、列表、链接、图片）
  - Markdown 模式（支持实时预览）

- **快捷输入**：
  - 一键插入当前日期、时间
  - 一键插入天气描述和心情标签
  - 支持在光标位置插入（而不是末尾）

- **工具栏状态**：
  - 粗体、斜体等按钮有选中状态反馈（蓝色高亮）
  - 键盘快捷键：`Ctrl+B` 粗体，`Ctrl+I` 斜体，`Ctrl+U` 下划线

- **图片上传**：
  - 支持从本地选择图片文件
  - 自动转换为 Base64 格式存储
  - 自适应宽度显示

- **链接功能**：
  - 支持设置显示文本和链接地址
  - 有选中文本时，选中文本作为显示文本
  - 无选中文本时，依次输入显示文本和URL
  - **`Ctrl/Cmd + 点击`** 直接在新窗口打开
  - 普通点击弹出确认对话框

### 🌤️ 天气情绪联动
- 自动获取当天天气信息（Mock数据）
- 显示天气图标、温度、空气质量
- 一键插入天气描述文本
- 根据天气类型推荐写作心情

### 🧠 TensorFlow.js 情感分析
- 实时分析文本情感
- 输出积极、中性、消极三个维度的概率
- 使用规则分析 + 随机因子模拟 ML 模型
- 分析结果实时可视化

### 📊 统计功能
- **四个统计维度**：日、周、月、年
- 统计内容：
  - 日记数量
  - 总字数
  - 平均字数
  - 连续写作天数（Streak）
- **可视化图表**：
  - 柱状图：写作频率统计
  - 饼图：情绪分布

---

## 🛠️ 技术栈

| 类型 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + 原生 JavaScript |
| 加密 | Web Crypto API (Crypto.subtle) |
| 机器学习 | TensorFlow.js |
| Markdown | marked.js + DOMPurify |
| 存储 | localStorage + sessionStorage |

---

## 🚀 快速开始

### 安装和运行

1. **进入项目目录**：
   ```bash
   cd /Volumes/ExMac/traeProject/xyj-14
   ```

2. **启动本地服务器**：
   ```bash
   npx http-server -p 3000
   ```

3. **访问应用**：
   
   打开浏览器访问：**http://localhost:3000**

### 使用流程

#### 1. 注册账户
1. 打开应用，点击"注册"标签
2. 输入用户名（至少2位）
3. 输入密码（至少6位）
4. 确认密码
5. 点击"注册"按钮

#### 2. 登录系统
1. 输入注册的用户名和密码
2. 点击"登录"按钮
3. 登录成功后进入主界面

#### 3. 写日记
1. 点击顶部的"新日记"按钮
2. 输入标题
3. 在编辑器中输入内容
   - **富文本模式**：使用工具栏按钮格式化文本
   - **Markdown模式**：点击右上角下拉菜单切换
4. 快捷输入：
   - 点击日期图标：插入当前日期
   - 点击时间图标：插入当前时间
   - 点击天气图标：插入天气描述
   - 点击表情图标：打开快捷心情面板

#### 4. 保存日记
1. 点击"保存"按钮
2. 日记会被加密后保存到本地存储

#### 5. 查看统计
1. 点击"统计"按钮
2. 选择统计周期（日/周/月/年）
3. 查看写作频率和情绪分布图表

---

## 📁 项目结构

```
xyj-14/
├── index.html              # 主页面
├── README.md               # 本文档
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── app.js              # 主应用入口
│   ├── services/           # 服务层
│   │   ├── storage.service.js      # 本地存储服务
│   │   ├── crypto.service.js       # 加密服务 (AES-GCM)
│   │   ├── mock-api.service.js     # Mock API 服务
│   │   ├── auth.service.js         # 认证服务
│   │   ├── weather.service.js      # 天气服务
│   │   ├── sentiment.service.js    # 情感分析服务
│   │   ├── stats.service.js        # 统计服务
│   │   └── diary.service.js        # 日记服务
│   ├── utils/              # 工具函数
│   │   ├── date.utils.js           # 日期工具
│   │   └── markdown.utils.js       # Markdown 工具
│   └── components/         # 组件
│       └── editor.component.js     # 编辑器组件
└── docs/                   # 测试文档
    ├── TEST-CRYPTO-KEY-WRAP.md    # 加密密钥包装测试
    └── TEST-EDITOR-FEATURES.md    # 编辑器功能测试
```

---

## 🔒 安全设计

### 加密流程

```
用户密码 → PBKDF2 派生 → 密码密钥
主密钥 → 密码密钥加密 → 加密的主密钥 (wrappedMasterKey)
日记内容 → 主密钥加密 → 加密的日记数据
```

### 存储结构

**localStorage（持久化存储）**：
| Key | 内容 | 加密状态 |
|-----|------|----------|
| `mock_users` | 用户列表（含密码哈希和 keyStore） | 密码哈希，keyStore 已加密 |
| `diaries_{username}` | 用户的日记数据 | AES-GCM 256位加密 |
| `weather_{date}` | 天气数据缓存 | 明文 |
| `current_user` | 当前用户信息（会话恢复用） | 明文（不含密码） |

**sessionStorage（会话存储，关闭浏览器清除）**：
| Key | 内容 | 说明 |
|-----|------|------|
| `session_user` | 当前用户会话 | 登录状态 |
| `session_key` | 临时会话密钥 | 用于会话恢复 |
| `session_master_key` | 加密的主密钥 | 使用会话密钥加密 |
| `session_keystore` | 用户 keyStore（可选） | 备用 |

### 会话恢复机制

1. **登录时**：
   - 验证密码 → 解锁 keyStore → 获取 masterKey
   - 生成临时 sessionKey
   - 用 sessionKey 加密 masterKey
   - 存储到 sessionStorage

2. **刷新页面时**：
   - 检查 sessionStorage 中的会话数据
   - 使用 sessionKey 解密 masterKey
   - 自动恢复加密能力
   - 无需重新输入密码

3. **关闭浏览器时**：
   - sessionStorage 自动清除
   - 下次打开需要重新登录

---

## 📈 可扩展功能模块（新功能）

以下功能模块基于现有架构设计，可独立实现，无需依赖外部API：

### 1. 日记模板系统
- **功能描述**：提供多种预设日记模板（晨间日记、感恩日记、反思日记、旅行日记等）
- **交互方式**：点击模板按钮自动插入预设格式和引导问题
- **实现思路**：
  - 创建 `template.service.js` 服务
  - 在编辑器工具栏添加模板选择下拉菜单
  - 模板内容存储在本地 JSON 文件中
  - 支持用户自定义模板并保存到 localStorage

### 2. 日记标签与分类系统
- **功能描述**：为日记添加多层级标签和分类，支持标签云展示
- **交互方式**：编辑时添加标签，侧边栏显示标签筛选器
- **实现思路**：
  - 扩展日记数据结构，添加 `tags` 和 `category` 字段
  - 创建标签输入组件（支持自动完成）
  - 侧边栏添加标签云和分类树形菜单
  - 支持按标签和分类筛选日记列表

### 3. 日记时间轴视图
- **功能描述**：以时间轴形式展示日记历史，支持缩放和快速导航
- **交互方式**：切换视图模式，点击时间点快速跳转
- **实现思路**：
  - 创建 `timeline.component.js` 组件
  - 使用 CSS Grid 或 Flexbox 实现时间轴布局
  - 支持年/月/日三级缩放
  - 在时间轴上显示情绪颜色标记

### 4. 日记导出与导入系统
- **功能描述**：支持将日记导出为多种格式（PDF、Markdown、JSON），支持数据备份和恢复
- **交互方式**：设置页面提供导出/导入按钮
- **实现思路**：
  - 创建 `export.service.js` 服务
  - 使用浏览器原生打印功能生成 PDF
  - Markdown 导出直接转换内容格式
  - JSON 导出包含完整元数据，支持加密备份
  - 导入时支持合并或覆盖现有数据

### 5. 写作目标与提醒系统
- **功能描述**：设置每日/每周写作目标，本地定时提醒
- **交互方式**：设置目标字数，浏览器通知提醒
- **实现思路**：
  - 创建 `goal.service.js` 服务
  - 使用 Web Notification API 发送提醒
  - 在统计页面显示目标完成进度条
  - 支持连续写作天数奖励徽章系统

### 6. 日记关联与引用系统
- **功能描述**：在日记中引用其他日记，建立知识网络图谱
- **交互方式**：输入 `@` 符号触发日记引用选择器
- **实现思路**：
  - 扩展日记数据结构，添加 `references` 字段
  - 创建引用选择器组件（类似 GitHub 的 @mention）
  - 在日记详情页显示"相关日记"推荐
  - 提供网络图谱可视化视图（使用 Canvas 或 SVG）

---

## 🔄 可迭代功能模块（现有功能增强）

以下功能基于现有模块进行增强迭代：

### 1. 编辑器增强（基于 editor.component.js）
- **当前状态**：支持富文本和 Markdown 基础格式
- **迭代方向**：
  - 添加代码块语法高亮（使用 Prism.js）
  - 支持表格编辑（可视化表格操作）
  - 添加待办事项列表（可勾选的任务列表）
  - 支持数学公式渲染（使用 KaTeX）
  - 添加全文搜索和高亮功能

### 2. 统计功能增强（基于 stats.service.js）
- **当前状态**：基础字数统计和情绪分布
- **迭代方向**：
  - 添加写作热力图（类似 GitHub Contributions）
  - 词汇云展示高频词汇
  - 情绪趋势折线图（时间维度）
  - 写作时段分析（统计用户喜欢在什么时间写作）
  - 字数达标率统计

### 3. 情感分析增强（基于 sentiment.service.js）
- **当前状态**：基于规则的关键词匹配
- **迭代方向**：
  - 扩展情感词典，支持更多情绪维度（愤怒、恐惧、惊讶等）
  - 添加情感强度评分（1-10分）
  - 实现日记情感趋势分析
  - 基于情感数据推荐相似日记
  - 添加情感关键词提取功能

### 4. 天气系统增强（基于 weather.service.js）
- **当前状态**：Mock 天气数据，基础情绪关联
- **迭代方向**：
  - 添加季节变化模拟（春夏秋冬不同场景）
  - 支持手动选择天气（不仅限于自动获取）
  - 天气与写作内容关联分析
  - 添加节气、节日特殊主题
  - 天气动画背景效果

### 5. 搜索功能增强（基于 diary.service.js）
- **当前状态**：基础标题和内容文本搜索
- **迭代方向**：
  - 添加高级搜索过滤器（日期范围、情绪类型、标签）
  - 实现搜索结果高亮显示
  - 添加搜索历史记录
  - 支持正则表达式搜索
  - 搜索结果排序选项（相关度、日期、字数）

### 6. 用户配置系统（基于 auth.service.js）
- **当前状态**：基础登录注册功能
- **迭代方向**：
  - 添加用户偏好设置（主题、字体、编辑器默认模式）
  - 支持深色/浅色主题切换
  - 字体大小和行间距调整
  - 自动保存间隔配置
  - 数据清理和归档选项

### 7. 日记加密增强（基于 crypto.service.js）
- **当前状态**：单一AES-GCM加密算法
- **迭代方向**：
  - 支持多种加密算法选择（AES-256-CBC、ChaCha20-Poly1305等）
  - 添加密钥派生强度选项（迭代次数可调）
  - 实现密钥备份与恢复机制（助记词方式）
  - 添加加密文件导出功能（独立加密容器格式）
  - 支持日记级别的独立加密密钥

### 8. 本地存储优化（基于 storage.service.js）
- **当前状态**：仅支持localStorage存储
- **迭代方向**：
  - 添加IndexedDB支持（存储更大容量数据）
  - 实现存储配额检测与预警
  - 添加数据压缩功能（减少存储占用）
  - 支持数据分片存储（突破单条存储限制）
  - 添加自动备份到文件系统功能（使用File System Access API）

### 9. 快捷输入增强（基于 editor.component.js）
- **当前状态**：基础快捷短语和表情插入
- **迭代方向**：
  - 自定义快捷短语库（用户可添加/编辑/删除）
  - 智能联想输入（基于历史日记内容）
  - 常用词汇收藏夹
  - 快捷命令系统（如 `/date` 插入日期）
  - 文本片段模板（支持变量替换）

### 10. 数据可视化增强（基于 stats.service.js）
- **当前状态**：基础柱状图和饼图
- **迭代方向**：
  - 交互式图表（支持缩放、筛选）
  - 写作习惯雷达图（多维度分析）
  - 情绪变化桑基图（追踪情绪流转）
  - 词频趋势折线图（追踪用词变化）
  - 日记长度分布直方图

---

## 💡 代码理解与重构建议

### 建议一：服务层架构优化

**当前问题分析**：
- 服务之间耦合度较高，如 `DiaryService` 直接依赖 `AuthService`、`CryptoService` 等多个服务
- 缺乏统一的错误处理机制，各服务自行处理错误
- 服务初始化顺序隐式依赖，容易导致时序问题

**重构方案**：

1. **引入依赖注入容器**
```javascript
// 创建服务容器
const ServiceContainer = (function() {
    const services = {};
    const singletons = {};
    
    function register(name, factory, isSingleton = true) {
        services[name] = { factory, isSingleton };
    }
    
    function resolve(name) {
        const service = services[name];
        if (!service) throw new Error(`Service ${name} not found`);
        
        if (service.isSingleton) {
            if (!singletons[name]) {
                singletons[name] = service.factory();
            }
            return singletons[name];
        }
        return service.factory();
    }
    
    return { register, resolve };
})();

// 注册服务
ServiceContainer.register('storage', () => StorageService);
ServiceContainer.register('crypto', () => CryptoService);
ServiceContainer.register('auth', () => AuthService);
```

2. **统一错误处理**
```javascript
// 创建错误处理服务
const ErrorService = (function() {
    const handlers = [];
    
    function register(handler) {
        handlers.push(handler);
    }
    
    function handle(error, context = {}) {
        console.error(`[${context.service || 'Unknown'}]`, error);
        handlers.forEach(h => h(error, context));
        
        // 统一用户提示
        if (context.showToast !== false) {
            showToast(context.message || '操作失败，请重试', 'error');
        }
    }
    
    return { register, handle };
})();
```

3. **服务初始化生命周期管理**
```javascript
const AppLifecycle = (function() {
    const phases = {
        INIT: [],
        AUTH: [],
        READY: []
    };
    
    function on(phase, callback) {
        phases[phase].push(callback);
    }
    
    async function run(phase) {
        for (const callback of phases[phase]) {
            await callback();
        }
    }
    
    return { on, run };
})();

// 使用示例
AppLifecycle.on('INIT', () => StorageService.init());
AppLifecycle.on('INIT', () => CryptoService.init());
AppLifecycle.on('AUTH', () => AuthService.restoreSession());
```

### 建议二：组件化架构升级

**当前问题分析**：
- `EditorComponent` 职责过重，超过800行代码
- 缺乏组件通信机制，直接操作 DOM
- 状态管理分散，难以追踪数据流

**重构方案**：

1. **实现发布订阅模式**
```javascript
const EventBus = (function() {
    const events = {};
    
    function on(event, callback) {
        if (!events[event]) events[event] = [];
        events[event].push(callback);
    }
    
    function off(event, callback) {
        if (!events[event]) return;
        events[event] = events[event].filter(cb => cb !== callback);
    }
    
    function emit(event, data) {
        if (!events[event]) return;
        events[event].forEach(cb => {
            try {
                cb(data);
            } catch (e) {
                console.error(`Event handler error for ${event}:`, e);
            }
        });
    }
    
    return { on, off, emit };
})();

// 使用示例
EventBus.on('diary:saved', (diary) => {
    StatsService.updateStats();
    DiaryListComponent.refresh();
});
```

2. **拆分 EditorComponent**
```javascript
// 拆分为多个子组件
const EditorComponent = (function() {
    // 只负责协调
    function init() {
        ToolbarComponent.init();
        RichEditorComponent.init();
        MarkdownEditorComponent.init();
        EmotionPanelComponent.init();
        
        // 绑定事件
        EventBus.on('toolbar:action', handleToolbarAction);
        EventBus.on('content:changed', handleContentChange);
    }
    
    return { init };
})();

// 工具栏组件
const ToolbarComponent = (function() {
    function init() {
        bindEvents();
    }
    
    function bindEvents() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                EventBus.emit('toolbar:action', {
                    action: btn.dataset.action,
                    button: btn
                });
            });
        });
    }
    
    return { init };
})();
```

3. **引入虚拟 DOM 或模板引擎**
```javascript
// 简单的模板渲染器
const TemplateEngine = (function() {
    function render(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? escapeHtml(data[key]) : '';
        });
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    return { render };
})();

// 使用示例
const diaryItemTemplate = `
    <div class="diary-item {{activeClass}}" data-id="{{id}}">
        <div class="diary-item-title">{{title}}</div>
        <div class="diary-item-meta">
            <span>{{date}}</span>
            <span class="diary-item-emotion">{{emoji}}</span>
        </div>
    </div>
`;
```

---

## 🧪 代码测试与工程化建议

### 建议一：测试体系建设

**当前状态**：缺乏自动化测试，仅有手动测试文档

**测试方案**：

1. **单元测试框架搭建**
```javascript
// 简单的测试框架
const TestRunner = (function() {
    const tests = [];
    let passCount = 0;
    let failCount = 0;
    
    function describe(name, fn) {
        console.group(name);
        fn();
        console.groupEnd();
    }
    
    function it(name, fn) {
        tests.push({ name, fn });
    }
    
    function expect(actual) {
        return {
            toBe(expected) {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected} but got ${actual}`);
                }
            },
            toEqual(expected) {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
                }
            },
            toBeDefined() {
                if (actual === undefined) {
                    throw new Error(`Expected value to be defined`);
                }
            }
        };
    }
    
    async function run() {
        for (const test of tests) {
            try {
                await test.fn();
                console.log(`✓ ${test.name}`);
                passCount++;
            } catch (e) {
                console.error(`✗ ${test.name}`);
                console.error(e.message);
                failCount++;
            }
        }
        console.log(`\nTotal: ${passCount + failCount}, Passed: ${passCount}, Failed: ${failCount}`);
    }
    
    return { describe, it, expect, run };
})();

// 测试示例
describe('CryptoService', () => {
    it('should encrypt and decrypt data', async () => {
        const key = await CryptoService.generateKey();
        const data = 'test data';
        const encrypted = await CryptoService.encrypt(data, key);
        const decrypted = await CryptoService.decrypt(encrypted, key);
        expect(decrypted).toBe(data);
    });
});
```

2. **服务层测试**
```javascript
// tests/services/diary.service.test.js
describe('DiaryService', () => {
    beforeEach(() => {
        DiaryService.clearCache();
    });
    
    it('should create a new diary', async () => {
        const diary = await DiaryService.createDiary({ title: 'Test' });
        expect(diary.title).toBe('Test');
        expect(diary.id).toBeDefined();
    });
    
    it('should search diaries by keyword', () => {
        DiaryService.setDiaries([
            { id: '1', title: 'Hello World', content: 'Test content' },
            { id: '2', title: 'Another', content: 'Different' }
        ]);
        
        const results = DiaryService.searchDiaries('Hello');
        expect(results.length).toBe(1);
        expect(results[0].title).toBe('Hello World');
    });
});
```

3. **集成测试**
```javascript
// 端到端测试场景
describe('User Flow', () => {
    it('should complete full user journey', async () => {
        // 注册
        const registerResult = await AuthService.register('testuser', 'password123', 'password123');
        expect(registerResult.success).toBe(true);
        
        // 登录
        const loginResult = await AuthService.login('testuser', 'password123');
        expect(loginResult.success).toBe(true);
        
        // 创建日记
        const diary = await DiaryService.createDiary();
        expect(diary).toBeDefined();
        
        // 更新日记
        const updated = await DiaryService.updateDiary(diary.id, {
            title: 'My Diary',
            content: 'Today was a good day.'
        });
        expect(updated.title).toBe('My Diary');
        
        // 获取统计
        const stats = DiaryService.getStats('all');
        expect(stats.totalDiaries).toBe(1);
    });
});
```

### 建议二：工程化与构建优化

**当前状态**：纯静态文件，无构建流程

**工程化方案**：

1. **模块化改造**
```javascript
// 使用 ES6 模块替代 IIFE
// js/services/crypto.service.js
export class CryptoService {
    static ALGORITHM = 'AES-GCM';
    static KEY_LENGTH = 256;
    
    static async generateKey() {
        return await crypto.subtle.generateKey(
            { name: this.ALGORITHM, length: this.KEY_LENGTH },
            true,
            ['encrypt', 'decrypt']
        );
    }
    
    static async encrypt(data, key) {
        // ...
    }
}

// js/app.js
import { CryptoService } from './services/crypto.service.js';
import { DiaryService } from './services/diary.service.js';
```

2. **构建工具配置**
```json
// package.json
{
  "name": "encrypted-diary",
  "version": "1.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "lint": "eslint js/",
    "format": "prettier --write js/ css/"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "jest": "^29.0.0"
  }
}
```

3. **代码质量工具**
```javascript
// .eslintrc.js
module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        'no-unused-vars': 'warn',
        'no-console': 'off',
        'prefer-const': 'error',
        'eqeqeq': 'error'
    }
};

// .prettierrc
{
    "semi": true,
    "singleQuote": true,
    "tabWidth": 4,
    "trailingComma": "es5"
}
```

4. **性能优化**
```javascript
// 懒加载非关键服务
async function loadSentimentService() {
    const { SentimentService } = await import('./services/sentiment.service.js');
    return SentimentService;
}

// 防抖和节流工具
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function throttle(fn, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
```

5. **持续集成配置**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

---

## 📝 API 参考

### DiaryService（日记服务）

```javascript
// 创建新日记
const diary = await DiaryService.createDiary({ title, content, editorMode });

// 获取所有日记
const diaries = DiaryService.getDiaries();

// 更新日记
const updated = await DiaryService.updateDiary(id, { title, content });

// 删除日记
const deleted = await DiaryService.deleteDiary(id);

// 搜索日记
const results = DiaryService.searchDiaries('关键词');

// 获取统计
const stats = DiaryService.getStats('month'); // 'day'|'week'|'month'|'year'
```

### CryptoService（加密服务）

```javascript
// 创建用户密钥存储（注册时）
const keyStore = await CryptoService.createUserKeyStore(password);

// 解锁密钥存储（登录时）
const unlocked = await CryptoService.unlockUserKeyStore(keyStore, password);

// 保存会话（登录后）
const saved = await CryptoService.saveSession();

// 恢复会话（刷新时）
const restored = await CryptoService.restoreSession();

// 清除会话（登出时）
CryptoService.clearSession();

// 使用主密钥加密
const encrypted = await CryptoService.encryptWithMasterKey(data);

// 使用主密钥解密
const decrypted = await CryptoService.decryptWithMasterKey(encrypted);
```

### AuthService（认证服务）

```javascript
// 登录
const result = await AuthService.login(username, password);

// 注册
const result = await AuthService.register(username, password, confirmPassword);

// 登出
AuthService.logout();

// 检查登录状态
const loggedIn = AuthService.isLoggedIn();

// 获取当前用户
const user = AuthService.getCurrentUser();
```

### EditorComponent（编辑器组件）

```javascript
// 初始化
EditorComponent.init();

// 设置内容
EditorComponent.setContent(htmlContent, 'rich');
EditorComponent.setContent(markdownContent, 'markdown');

// 获取内容
const content = EditorComponent.getContent();

// 设置/获取标题
EditorComponent.setTitle('日记标题');
const title = EditorComponent.getTitle();

// 获取当前模式
const mode = EditorComponent.getCurrentMode(); // 'rich' 或 'markdown'

// 重置编辑器
EditorComponent.reset();
```

---

## 🧪 测试文档

详细测试用例请参考：

- **[TEST-CRYPTO-KEY-WRAP.md](./docs/TEST-CRYPTO-KEY-WRAP.md)** - 加密密钥包装功能测试
- **[TEST-EDITOR-FEATURES.md](./docs/TEST-EDITOR-FEATURES.md)** - 编辑器功能测试

---

## ⚠️ 注意事项

### 安全提示

1. **密码安全**：
   - 密码不会明文存储，使用 SHA-256 哈希存储
   - 但如果忘记密码，**无法恢复**（因为没有服务器，没有密码重置功能）
   - 请妥善保管密码

2. **数据备份**：
   - 所有数据只存储在浏览器本地
   - 清除浏览器数据会**永久删除**所有日记
   - 建议定期导出重要内容备份

3. **浏览器兼容性**：
   - 推荐使用最新版 Chrome、Firefox、Safari 或 Edge
   - Web Crypto API 需要安全上下文（HTTPS 或 localhost）

4. **会话安全**：
   - sessionStorage 在关闭浏览器后自动清除
   - 公共电脑上使用后请关闭浏览器或点击"退出登录"

### 限制说明

1. **离线功能**：
   - 所有功能完全离线可用
   - 天气数据为 Mock 数据（模拟真实天气 API）
   - 情感分析使用规则匹配 + 随机因子模拟 TensorFlow 模型

2. **图片存储**：
   - 图片以 Base64 格式存储在日记中
   - 大图片会显著增加 localStorage 占用
   - localStorage 容量限制通常为 5-10MB

3. **多用户**：
   - 支持多用户注册
   - 每个用户的数据独立加密存储
   - 同一时间只能登录一个用户

---

## 📋 更新日志

### v1.1.0 (2026-04-28)

**新增功能**：
- ✅ 会话恢复机制：刷新页面自动恢复加密会话
- ✅ 本地图片上传：从本地选择图片，自动转换为 Base64
- ✅ 链接点击跳转：`Ctrl/Cmd + 点击` 直接打开，普通点击确认对话框
- ✅ 工具栏选中状态：粗体、斜体等按钮有蓝色高亮反馈
- ✅ 快捷输入光标位置：文本在光标位置插入，而不是末尾

**修复问题**：
- 🔧 修复密钥包装算法不兼容问题（AES-KW → AES-GCM）
- 🔧 修复刷新页面数据消失问题（会话恢复机制）
- 🔧 修复链接无法点击跳转问题
- 🔧 修复快捷输入总是追加到末尾的问题

### v1.0.0 (2026-04-28)

**初始版本**：
- ✅ 用户注册和登录
- ✅ AES-GCM 256位加密
- ✅ 富文本编辑器
- ✅ Markdown 编辑器
- ✅ 天气情绪联动
- ✅ 情感分析
- ✅ 统计功能（日/周/月/年）
- ✅ 本地存储持久化

---

## 🤝 贡献

这是一个本地应用项目，主要用于个人使用和学习。

---

## 📄 许可证

MIT License

---

## 📞 问题反馈

如遇到问题，请检查：

1. **浏览器控制台** (F12 → Console) 是否有错误信息
2. **localStorage** (Application → Local Storage) 数据是否正常
3. **sessionStorage** 会话数据是否存在

常见问题：

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 刷新页面数据消失 | 会话恢复失败 | 检查 sessionStorage，尝试重新登录 |
| 注册报错 `key.algorithm does not match` | 浏览器 Web Crypto API 兼容性 | 使用最新版浏览器 |
| 图片上传失败 | 文件太大或格式不支持 | 检查文件大小和格式 |
| 链接无法打开 | 安全策略阻止 | 使用 `Ctrl/Cmd + 点击` |
