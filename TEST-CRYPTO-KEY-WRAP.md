# 加密服务密钥包装问题测试用例

## 问题描述

### 错误信息
```
InvalidAccessError: key.algorithm does not match that of operation
```

### 发生场景
点击注册按钮时，在 `CryptoService.createUserKeyStore()` 函数中调用 `wrapKey()` 时发生错误。

---

## 问题分析

### 原代码逻辑

1. **密钥派生** (`deriveKeyFromPassword`)
```javascript
// 从密码派生密钥，使用 AES-GCM 算法
return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', ... },
    passwordKey,
    { name: 'AES-GCM', length: 256 },  // 算法：AES-GCM
    true,
    ['encrypt', 'decrypt']                // 用途：加密/解密
);
```

2. **密钥包装** (`wrapKey`)
```javascript
// 使用 AES-KW 算法包装密钥
const wrappedKey = await crypto.subtle.wrapKey(
    'raw',
    keyToWrap,
    wrappingKey,
    { name: 'AES-KW' }  // 算法：AES-KW
);
```

### 根本原因

| 组件 | 算法 | 用途 |
|------|------|------|
| `passwordKey` (包装密钥) | AES-GCM | `['encrypt', 'decrypt']` |
| `wrapKey` 操作要求 | AES-KW | `['wrapKey', 'unwrapKey']` |

**Web Crypto API 要求**：使用 `wrapKey` API 时，包装密钥必须：
1. 使用 `AES-KW` 算法（而非 `AES-GCM`）
2. 密钥用途必须包含 `'wrapKey'`

原代码中两个条件都不满足，导致 `InvalidAccessError`。

---

## 修复方案

### 修复思路

不使用 `wrapKey`/`unwrapKey` API，改用已有的 `AES-GCM` 加密/解密逻辑来实现密钥包装：

1. **包装密钥**：导出密钥 → AES-GCM 加密 → 返回加密数据
2. **解包密钥**：AES-GCM 解密 → 导入密钥 → 返回 CryptoKey

### 修复后的代码

```javascript
async function wrapKey(keyToWrap, wrappingKey) {
    // 1. 导出要包装的密钥为原始字节
    const exportedKey = await crypto.subtle.exportKey('raw', keyToWrap);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // 2. 使用 AES-GCM 加密密钥数据
    const encryptedKeyBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        wrappingKey,
        exportedKey
    );
    
    // 3. 组合 IV 和加密数据
    const result = new Uint8Array(iv.length + encryptedKeyBuffer.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedKeyBuffer), iv.length);
    
    return arrayBufferToBase64(result);
}

async function unwrapKey(wrappedKeyData, unwrappingKey) {
    const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKeyData);
    
    // 1. 分离 IV 和加密数据
    const iv = wrappedKeyBuffer.slice(0, IV_LENGTH);
    const encryptedKey = wrappedKeyBuffer.slice(IV_LENGTH);
    
    // 2. 使用 AES-GCM 解密
    const decryptedKeyBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        unwrappingKey,
        new Uint8Array(encryptedKey)
    );
    
    // 3. 导入为 CryptoKey
    return await crypto.subtle.importKey(
        'raw',
        decryptedKeyBuffer,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}
```

---

## 测试用例

### 测试环境
- **浏览器**：Chrome/Firefox/Safari (支持 Web Crypto API)
- **协议**：HTTPS 或 localhost (Web Crypto API 要求安全上下文)
- **测试页面**：http://localhost:3000

---

### 单元测试用例

#### 测试用例 1: 密钥派生测试
**目标**：验证 `deriveKeyFromPassword` 正确派生密钥

**测试步骤**：
1. 生成随机盐值
2. 使用密码和盐值派生密钥
3. 验证返回的是有效 CryptoKey

**预期结果**：
- ✅ 密钥算法为 `AES-GCM`
- ✅ 密钥可提取 (`extractable: true`)
- ✅ 密钥用途为 `['encrypt', 'decrypt']`

**测试代码**：
```javascript
async function testDeriveKey() {
    const password = 'testPassword123';
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    const key = await CryptoService.deriveKeyFromPassword(password, salt);
    
    console.log('算法:', key.algorithm.name);           // 应为 "AES-GCM"
    console.log('可提取:', key.extractable);            // 应为 true
    console.log('用途:', key.usages);                    // 应为 ["encrypt", "decrypt"]
    
    return key.algorithm.name === 'AES-GCM' && 
           key.extractable === true &&
           JSON.stringify(key.usages) === '["encrypt","decrypt"]';
}
```

---

#### 测试用例 2: 密钥包装/解包测试 (核心测试)
**目标**：验证修复后的 `wrapKey`/`unwrapKey` 正确工作

**测试步骤**：
1. 生成两个密钥：`keyToWrap` (待包装) 和 `wrappingKey` (包装密钥)
2. 使用 `wrapKey` 包装 `keyToWrap`
3. 使用 `unwrapKey` 解包
4. 使用解包后的密钥加密测试数据
5. 使用原始密钥解密验证

**预期结果**：
- ✅ 包装后的数据是有效的 Base64 字符串
- ✅ 解包后返回有效 CryptoKey
- ✅ 使用解包密钥加密的数据可以用原始密钥解密

**测试代码**：
```javascript
async function testWrapUnwrapKey() {
    // 1. 生成测试密钥
    const keyToWrap = await CryptoService.generateKey();
    const password = 'wrapTest123';
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const wrappingKey = await CryptoService.deriveKeyFromPassword(password, salt);
    
    // 2. 包装密钥
    const wrapped = await CryptoService.wrapKey(keyToWrap, wrappingKey);
    console.log('包装后的数据长度:', wrapped.length);
    
    // 3. 解包密钥
    const unwrappedKey = await CryptoService.unwrapKey(wrapped, wrappingKey);
    console.log('解包后密钥算法:', unwrappedKey.algorithm.name);
    
    // 4. 验证密钥功能一致性
    const testData = 'Hello, World! 测试数据';
    
    // 使用原始密钥加密
    const encryptedWithOriginal = await CryptoService.encrypt(testData, keyToWrap);
    
    // 使用解包密钥加密
    const encryptedWithUnwrapped = await CryptoService.encrypt(testData, unwrappedKey);
    
    // 使用解包密钥解密原始加密的数据
    const decrypted = await CryptoService.decrypt(encryptedWithOriginal, unwrappedKey);
    
    console.log('解密结果:', decrypted);
    console.log('数据一致性:', decrypted === testData);
    
    return decrypted === testData;
}
```

---

#### 测试用例 3: 用户密钥存储创建测试
**目标**：验证 `createUserKeyStore` 完整流程

**测试步骤**：
1. 调用 `createUserKeyStore(password)`
2. 验证返回的数据结构
3. 使用 `unlockUserKeyStore` 解锁
4. 验证 masterKey 可用

**预期结果**：
- ✅ 返回包含 `salt` 和 `wrappedMasterKey` 的对象
- ✅ `salt` 是有效的 Base64 字符串
- ✅ `wrappedMasterKey` 是有效的 Base64 字符串
- ✅ 可以成功解锁并获取 masterKey

**测试代码**：
```javascript
async function testCreateUserKeyStore() {
    const password = 'userPassword123';
    
    // 1. 创建密钥存储
    const keyStore = await CryptoService.createUserKeyStore(password);
    console.log('密钥存储结构:', Object.keys(keyStore));
    console.log('Salt 长度:', keyStore.salt.length);
    console.log('Wrapped Key 长度:', keyStore.wrappedMasterKey.length);
    
    // 2. 验证结构
    const hasValidStructure = keyStore.salt && keyStore.wrappedMasterKey;
    
    // 3. 尝试解锁
    const unlocked = await CryptoService.unlockUserKeyStore(keyStore, password);
    console.log('解锁成功:', unlocked);
    console.log('MasterKey 可用:', CryptoService.isMasterKeyAvailable());
    
    return hasValidStructure && unlocked && CryptoService.isMasterKeyAvailable();
}
```

---

#### 测试用例 4: 错误密码解锁测试
**目标**：验证错误密码无法解锁

**测试步骤**：
1. 创建密钥存储（使用正确密码）
2. 使用错误密码尝试解锁
3. 验证解锁失败

**预期结果**：
- ✅ 解锁返回 `false`
- ✅ masterKey 不可用
- ✅ 不抛出未捕获的异常

**测试代码**：
```javascript
async function testWrongPasswordUnlock() {
    const correctPassword = 'correct123';
    const wrongPassword = 'wrong456';
    
    const keyStore = await CryptoService.createUserKeyStore(correctPassword);
    
    CryptoService.setMasterKey(null);
    
    const unlocked = await CryptoService.unlockUserKeyStore(keyStore, wrongPassword);
    
    console.log('错误密码解锁结果:', unlocked);  // 应为 false
    console.log('MasterKey 可用:', CryptoService.isMasterKeyAvailable());  // 应为 false
    
    return unlocked === false && !CryptoService.isMasterKeyAvailable();
}
```

---

#### 测试用例 5: 加密/解密完整性测试
**目标**：验证使用 masterKey 加密/解密的数据完整性

**测试步骤**：
1. 创建并解锁密钥存储
2. 使用 `encryptWithMasterKey` 加密测试数据
3. 使用 `decryptWithMasterKey` 解密
4. 验证数据一致性

**预期结果**：
- ✅ 加密后的数据与原始数据不同
- ✅ 解密后的数据与原始数据完全一致
- ✅ 支持字符串、对象等多种数据类型

**测试代码**：
```javascript
async function testEncryptDecryptIntegrity() {
    const password = 'test123';
    
    // 1. 设置 masterKey
    const keyStore = await CryptoService.createUserKeyStore(password);
    await CryptoService.unlockUserKeyStore(keyStore, password);
    
    // 2. 测试字符串
    const testString = '这是一个测试字符串！Hello World! 12345';
    const encryptedString = await CryptoService.encryptWithMasterKey(testString);
    const decryptedString = await CryptoService.decryptWithMasterKey(encryptedString);
    
    console.log('字符串加密前后一致:', testString === decryptedString);
    
    // 3. 测试对象
    const testObject = {
        title: '测试日记',
        content: '这是日记内容',
        date: new Date().toISOString(),
        tags: ['测试', '加密']
    };
    const encryptedObject = await CryptoService.encryptWithMasterKey(testObject);
    const decryptedObject = await CryptoService.decryptWithMasterKey(encryptedObject);
    
    const objectMatch = JSON.stringify(testObject) === JSON.stringify(decryptedObject);
    console.log('对象加密前后一致:', objectMatch);
    
    return testString === decryptedString && objectMatch;
}
```

---

### 集成测试用例

#### 测试用例 6: 完整注册流程测试
**目标**：模拟用户注册完整流程

**测试步骤**：
1. 打开注册页面
2. 输入用户名和密码
3. 点击注册按钮
4. 验证注册成功并切换到登录页面

**预期结果**：
- ✅ 不报错
- ✅ 显示"注册成功！请登录"提示
- ✅ 自动切换到登录标签
- ✅ localStorage 中存在新用户数据

**手动测试步骤**：
1. 打开浏览器访问 http://localhost:3000
2. 点击"注册"标签
3. 输入用户名：`testuser`
4. 输入密码：`testpass123`
5. 确认密码：`testpass123`
6. 点击"注册"按钮
7. 检查是否成功注册

**验证 localStorage**：
```javascript
// 在浏览器控制台执行
const users = JSON.parse(localStorage.getItem('secure_diary_mock_users') || '{}');
console.log('用户列表:', Object.keys(users));
console.log('testuser 存在:', 'testuser' in users);
```

---

#### 测试用例 7: 完整登录流程测试
**目标**：模拟用户登录完整流程

**前置条件**：已注册用户 `testuser` / `testpass123`

**测试步骤**：
1. 输入用户名 `testuser`
2. 输入密码 `testpass123`
3. 点击登录按钮
4. 验证进入主页面

**预期结果**：
- ✅ 不报错
- ✅ 显示"登录成功！"提示
- ✅ 页面切换到主界面
- ✅ sessionStorage 中存在用户会话

**验证 sessionStorage**：
```javascript
// 在浏览器控制台执行
const session = JSON.parse(sessionStorage.getItem('session_user') || 'null');
console.log('会话用户:', session);
console.log('用户名:', session?.username);
```

---

#### 测试用例 8: 日记加密存储测试
**目标**：验证日记内容被正确加密存储

**前置条件**：已登录用户

**测试步骤**：
1. 创建新日记
2. 输入标题和内容
3. 保存日记
4. 检查 localStorage 中的存储格式

**预期结果**：
- ✅ 日记内容以加密形式存储
- ✅ 无法直接从 localStorage 读取明文

**验证加密存储**：
```javascript
// 在浏览器控制台执行
const diariesKey = 'secure_diary_diaries_testuser';
const encrypted = localStorage.getItem(diariesKey);

console.log('存储的数据是加密字符串:', typeof encrypted === 'string');
console.log('数据长度:', encrypted?.length);

// 尝试直接解析（应该失败）
try {
    const parsed = JSON.parse(encrypted);
    console.log('警告：数据未加密！', parsed);
} catch (e) {
    console.log('正确：数据已加密，无法直接解析');
}
```

---

#### 测试用例 9: 会话保存测试
**目标**：验证登录后会话正确保存到 sessionStorage

**前置条件**：已注册用户

**测试步骤**：
1. 登录用户
2. 检查 sessionStorage 中的会话数据
3. 验证会话密钥和加密的主密钥已保存

**预期结果**：
- ✅ `session_key` 存在于 sessionStorage
- ✅ `session_master_key` 存在于 sessionStorage
- ✅ 两者都是有效的 Base64 字符串

**测试代码**：
```javascript
// 登录后在浏览器控制台执行
console.log('session_key 存在:', sessionStorage.getItem('session_key') !== null);
console.log('session_master_key 存在:', sessionStorage.getItem('session_master_key') !== null);

console.log('session_key 长度:', sessionStorage.getItem('session_key')?.length);
console.log('session_master_key 长度:', sessionStorage.getItem('session_master_key')?.length);

// 检查是否为有效 Base64（包含等号结尾等特征）
const sessionKey = sessionStorage.getItem('session_key');
const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(sessionKey);
console.log('session_key 是 Base64:', isBase64);
```

---

#### 测试用例 10: 会话恢复测试
**目标**：验证刷新页面后会话可以正确恢复

**前置条件**：
1. 已注册并登录用户
2. 已创建并保存至少一篇日记

**测试步骤**：
1. 登录用户
2. 创建一篇日记并保存
3. 刷新页面（F5 或 Cmd+R）
4. 验证：
   - 是否自动保持登录状态
   - 日记列表是否显示之前保存的日记
   - `masterKey` 是否可用

**预期结果**：
- ✅ 刷新后自动进入主页面（无需重新登录）
- ✅ 日记列表显示之前保存的日记
- ✅ `CryptoService.isMasterKeyAvailable()` 返回 `true`
- ✅ 可以创建新日记并保存

**手动测试步骤**：
1. 打开浏览器访问 http://localhost:3000
2. 登录已有账户
3. 点击"新日记"，输入标题和内容，点击"保存"
4. 确认左侧列表显示了新日记
5. **刷新页面**（F5）
6. 验证：
   - 页面显示主界面（不是登录页）
   - 左侧日记列表仍然显示之前的日记
   - 可以继续创建和保存新日记

**验证代码（刷新后在控制台执行）**：
```javascript
console.log('是否登录:', AuthService.isLoggedIn());
console.log('masterKey 可用:', CryptoService.isMasterKeyAvailable());
console.log('日记数量:', DiaryService.getDiaries().length);
console.log('日记列表:', DiaryService.getDiaries().map(d => d.title));
```

---

#### 测试用例 11: 会话清除测试（登出）
**目标**：验证登出后会话数据被正确清除

**前置条件**：已登录用户

**测试步骤**：
1. 确认已登录
2. 检查 sessionStorage 中有会话数据
3. 点击"退出登录"按钮
4. 验证会话数据已清除

**预期结果**：
- ✅ 点击退出后跳转到登录页面
- ✅ `session_key` 从 sessionStorage 移除
- ✅ `session_master_key` 从 sessionStorage 移除
- ✅ `CryptoService.isMasterKeyAvailable()` 返回 `false`

**测试代码**：
```javascript
// 登出后执行
console.log('是否登录:', AuthService.isLoggedIn());
console.log('masterKey 可用:', CryptoService.isMasterKeyAvailable());
console.log('session_key 存在:', sessionStorage.getItem('session_key') !== null);
console.log('session_master_key 存在:', sessionStorage.getItem('session_master_key') !== null);
```

---

#### 测试用例 12: 会话过期测试
**目标**：验证无效或损坏的会话数据被正确处理

**测试步骤**：
1. 登录用户
2. 使用开发者工具修改或删除 sessionStorage 中的会话数据
3. 刷新页面
4. 验证应用如何处理

**场景 A：删除会话密钥**
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 登录后，在控制台执行：`sessionStorage.removeItem('session_key')` | 无立即反应 |
| 2 | 刷新页面 | 应该跳转到登录页面 |
| 3 | 显示提示 | 显示"会话已过期，请重新登录" |

**场景 B：损坏会话数据**
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 登录后，执行：`sessionStorage.setItem('session_master_key', 'invalid_data')` | 无立即反应 |
| 2 | 刷新页面 | 尝试恢复会话失败 |
| 3 | 验证 | 跳转到登录页面，显示提示信息 |

---

#### 测试用例 13: 数据持久化完整性测试
**目标**：验证保存的日记在刷新后可以完整读取

**前置条件**：
1. 已注册用户
2. 包含特殊内容的测试数据（图片、链接、格式等）

**测试步骤**：
1. 登录用户
2. 创建一篇包含以下内容的日记：
   - 富文本格式（粗体、斜体、标题）
   - 本地上传的图片
   - 可点击的链接
3. 保存日记
4. 刷新页面
5. 打开保存的日记，验证内容完整性

**预期结果**：
- ✅ 日记标题正确显示
- ✅ 富文本格式（粗体、斜体等）保持不变
- ✅ 图片正确显示（Base64 格式）
- ✅ 链接可以点击跳转
- ✅ 字数统计正确
- ✅ 情感分析结果一致

**验证代码**：
```javascript
// 刷新后，获取第一篇日记
const diaries = DiaryService.getDiaries();
const diary = diaries[0];

console.log('日记标题:', diary.title);
console.log('创建时间:', diary.createdAt);
console.log('字数:', diary.wordCount);
console.log('情绪分析:', diary.sentiment);
console.log('内容包含 <img>:', diary.content.includes('<img') || diary.content.includes('data:image'));
console.log('内容包含 <a>:', diary.content.includes('<a'));
```

---

## 测试执行清单

### 开发环境测试

| # | 测试用例 | 测试状态 | 备注 |
|---|----------|----------|------|
| 1 | 密钥派生测试 | ⬜ 待测试 | |
| 2 | 密钥包装/解包测试 | ⬜ 待测试 | **核心测试** |
| 3 | 用户密钥存储创建测试 | ⬜ 待测试 | |
| 4 | 错误密码解锁测试 | ⬜ 待测试 | |
| 5 | 加密/解密完整性测试 | ⬜ 待测试 | |
| 6 | 完整注册流程测试 | ⬜ 待测试 | 集成测试 |
| 7 | 完整登录流程测试 | ⬜ 待测试 | 集成测试 |
| 8 | 日记加密存储测试 | ⬜ 待测试 | 集成测试 |
| 9 | 会话保存测试 | ⬜ 待测试 | **新增 - 核心** |
| 10 | 会话恢复测试 | ⬜ 待测试 | **新增 - 核心** |
| 11 | 会话清除测试（登出） | ⬜ 待测试 | **新增** |
| 12 | 会话过期测试 | ⬜ 待测试 | **新增** |
| 13 | 数据持久化完整性测试 | ⬜ 待测试 | **新增** |

### 浏览器兼容性测试

| 浏览器 | 版本 | 注册测试 | 登录测试 | 加密测试 | 会话恢复 |
|--------|------|----------|----------|----------|----------|
| Chrome | 最新 | ⬜ | ⬜ | ⬜ | ⬜ |
| Firefox | 最新 | ⬜ | ⬜ | ⬜ | ⬜ |
| Safari | 最新 | ⬜ | ⬜ | ⬜ | ⬜ |
| Edge | 最新 | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 会话恢复机制设计说明

### 问题背景

之前的实现存在一个关键问题：
- `masterKey`（主密钥）只存在于内存中
- 刷新页面后，内存被清空，`masterKey` 丢失
- 虽然用户信息还在 `localStorage` 中，但没有 `masterKey` 无法解密日记
- 导致用户感觉"数据消失了"

### 解决方案：会话恢复机制

#### 存储结构

**sessionStorage 中新增的条目**：
| Key | 内容 | 说明 |
|-----|------|------|
| `session_key` | 临时会话密钥（Base64） | 用于加密 masterKey |
| `session_master_key` | 加密后的 masterKey（Base64） | 使用 sessionKey 加密 |

#### 工作流程

**1. 登录时（保存会话）**：
```
用户输入密码 → 解锁 keyStore → 获取 masterKey
    ↓
生成随机 sessionKey
    ↓
使用 sessionKey 加密 masterKey
    ↓
存储到 sessionStorage:
  - session_key = sessionKey (Base64)
  - session_master_key = encryptedMasterKey (Base64)
```

**2. 刷新页面时（恢复会话）**：
```
检查 sessionStorage 中的会话数据
    ↓
存在 session_key 和 session_master_key？
    ├── 是 → 使用 sessionKey 解密 masterKey
    │           ↓
    │       masterKey 恢复，可正常使用
    │
    └── 否 → 跳转到登录页面，提示会话过期
```

**3. 登出时（清除会话）**：
```
点击退出登录
    ↓
清除 sessionStorage:
  - session_key
  - session_master_key
  - session_keystore (可选)
    ↓
masterKey 设为 null
    ↓
跳转到登录页面
```

### 安全性考虑

#### 优点
1. **刷新保持登录**：用户体验提升，不需要每次刷新都重新输入密码
2. **关闭浏览器清除**：sessionStorage 在关闭浏览器后自动清除，安全性较高
3. **双层加密**：
   - masterKey 使用 sessionKey 加密存储
   - 日记数据使用 masterKey 加密存储

#### 限制与权衡
1. **sessionStorage 限制**：
   - 只在当前标签页有效
   - 关闭标签页或浏览器后清除
   - 不同标签页之间不共享

2. **安全权衡**：
   - sessionKey 和 encryptedMasterKey 都存储在 sessionStorage
   - 理论上，恶意脚本可以读取这些数据
   - 但对于本地应用，这是安全与体验的合理平衡

3. **替代方案对比**：

| 方案 | 安全性 | 用户体验 | 实现复杂度 |
|------|--------|----------|------------|
| 每次刷新重新输入密码 | 最高 | 最差 | 低 |
| sessionStorage 存储（当前方案） | 中等 | 好 | 中等 |
| localStorage 长期存储 | 较低 | 最好 | 低 |
| 服务器端会话管理 | 最高 | 最好 | 高 |

### 与 localStorage 的区别

| 特性 | sessionStorage | localStorage |
|------|----------------|---------------|
| 生命周期 | 当前标签页 | 持久化 |
| 关闭浏览器 | 清除 | 保留 |
| 标签页共享 | 否 | 是 |
| 容量限制 | ~5MB | ~5MB |

**为什么选择 sessionStorage？**
- 安全性：关闭浏览器后自动清除，降低长期风险
- 用户体验：刷新页面保持会话，同时关闭浏览器需要重新登录
- 符合"会话"的语义：一次浏览器会话期间有效

### 关键代码位置

| 文件 | 函数 | 功能 |
|------|------|------|
| `crypto.service.js` | `saveSession()` | 保存会话到 sessionStorage |
| `crypto.service.js` | `restoreSession()` | 从 sessionStorage 恢复会话 |
| `crypto.service.js` | `clearSession()` | 清除会话数据 |
| `auth.service.js` | `login()` | 登录后调用 `saveSession()` |
| `auth.service.js` | `logout()` | 登出时调用 `clearSession()` |
| `app.js` | `initApp()` | 初始化时尝试 `restoreSession()` |

---

## 快速测试指南

### 最关键的测试：会话恢复

**步骤**：
1. 打开 http://localhost:3000
2. 注册新用户或登录已有用户
3. 点击"新日记"，输入标题和内容
4. 点击"保存"
5. **观察左侧日记列表**：确认新日记已显示
6. **刷新页面**（按 F5 或 Cmd+R）
7. **验证**：
   - ✅ 页面显示主界面（不是登录页）
   - ✅ 左侧日记列表仍然显示刚才的日记
   - ✅ 可以继续创建新日记

**如果以上 3 点都满足，说明会话恢复机制工作正常！**

### 验证数据持久化

**步骤**：
1. 登录后创建几篇日记
2. 刷新页面
3. 打开每篇日记，确认内容完整
4. 尝试创建新日记并保存

**预期结果**：
- 所有之前的日记都应该存在
- 内容、格式、图片都应该正确显示
- 新日记可以正常保存
