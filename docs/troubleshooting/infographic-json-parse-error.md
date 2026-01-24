# Infographic JSON 解析错误 - 调试指南

## 错误信息

```
SyntaxError: Unexpected token 'i', "infographi"... is not valid JSON
```

## 可能的原因

### 1. HTML 实体转义问题 ✅ 已排除
- `escapeHtml` 会把 `"` 转义为 `&quot;`
- 但 `textContent` 会自动反转义
- 测试确认：`textContent` 可以正确解析 JSON

### 2. 选择器问题 ⚠️ 待确认
- 选择器：`pre.infographic code`
- 可能选中了错误的元素
- 需要检查实际选中的元素

### 3. 代码内容问题 ⚠️ 待确认
- 错误信息显示：`"infographi"...`
- 这看起来像是字符串 `"infographic"`（语言名称）
- 而不是 JSON 代码内容

## 调试步骤

### 1. 查看浏览器控制台
打开包含 infographic 代码块的页面，查看控制台输出：

```
[Infographic] Starting render...
[Infographic] Found blocks: X
[Infographic] Processing block: <code>...</code>
[Infographic] Block HTML: ...
[Infographic] Code length: ...
[Infographic] Code preview: ...
```

### 2. 检查 HTML 结构
在浏览器开发者工具中检查：

```javascript
// 查找 infographic 代码块
document.querySelectorAll('pre.infographic')

// 查看第一个代码块的内容
const block = document.querySelector('pre.infographic code');
console.log('textContent:', block.textContent);
console.log('innerHTML:', block.innerHTML);
```

### 3. 手动测试 JSON 解析
```javascript
const block = document.querySelector('pre.infographic code');
const code = block.textContent;
try {
  const spec = JSON.parse(code);
  console.log('✅ JSON parsed successfully:', spec);
} catch (e) {
  console.error('❌ JSON parse failed:', e.message);
  console.log('Code:', code);
}
```

## 已添加的调试日志

在 `createInfographicRenderer` 中添加了详细的日志：

1. `[Infographic] Starting render...` - 开始渲染
2. `[Infographic] Found blocks: X` - 找到的代码块数量
3. `[Infographic] Processing block` - 正在处理的元素
4. `[Infographic] Block HTML` - 元素的 HTML
5. `[Infographic] Code length` - 代码长度
6. `[Infographic] Code preview` - 代码预览（前 50 个字符）
7. `[Infographic] Original code` - 原始代码
8. `[Infographic] Unescaped code` - 反转义后的代码
9. `[Infographic] Parsed spec` - 解析后的 JSON 对象

## 测试文件

### 复杂测试
`test-infographic.md` - 包含完整的 JSON 配置

### 简单测试
`test-infographic-simple.md` - 单行 JSON，便于调试

## 下一步

1. **打开测试页面**
   ```
   http://localhost:3009/test-infographic-simple.md
   ```

2. **查看控制台输出**
   - 记录所有 `[Infographic]` 开头的日志
   - 特别注意 `Code preview` 的内容

3. **手动测试**
   - 在控制台运行上面的手动测试代码
   - 确认 `textContent` 的实际内容

4. **报告结果**
   - 控制台显示了什么？
   - `Code preview` 是什么？
   - 手动测试能否解析 JSON？
