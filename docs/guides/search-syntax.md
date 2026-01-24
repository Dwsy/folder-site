# Quick Search 高级搜索语法指南

Quick Search 现在支持强大的逻辑运算符和高级搜索语法，帮助你更精确地找到需要的文件。

## 基本搜索

### 简单搜索
直接输入关键词进行模糊搜索：
```
markdown
```
匹配包含 "markdown" 的文件名或路径。

### 精确匹配
使用双引号进行精确匹配：
```
"README.md"
```
只匹配完全包含 "README.md" 的文件。

## 逻辑运算符

### AND 运算符
查找同时包含多个关键词的文件：
```
react AND tutorial
```
匹配同时包含 "react" 和 "tutorial" 的文件。

**示例**：
- ✅ `react-tutorial.md`
- ✅ `docs/react/tutorial.md`
- ❌ `react-guide.md`（缺少 "tutorial"）
- ❌ `vue-tutorial.md`（缺少 "react"）

### OR 运算符
查找包含任一关键词的文件：
```
vue OR react
```
匹配包含 "vue" 或 "react" 的文件。

**示例**：
- ✅ `react-app.js`
- ✅ `vue-component.vue`
- ✅ `react-vs-vue.md`
- ❌ `angular-guide.md`

### NOT 运算符
排除包含特定关键词的文件：
```
code AND NOT test
```
匹配包含 "code" 但不包含 "test" 的文件。

**注意**：NOT 必须与 AND 或 OR 配合使用。

**示例**：
- ✅ `code-example.js`
- ✅ `source-code.md`
- ❌ `code-test.js`（包含 "test"）
- ❌ `test-utils.js`（包含 "test"）

## 括号分组

使用括号控制运算优先级：

### 基本分组
```
(react OR vue) AND tutorial
```
匹配包含 "react" 或 "vue"，且同时包含 "tutorial" 的文件。

**示例**：
- ✅ `react-tutorial.md`
- ✅ `vue-tutorial.md`
- ❌ `react-guide.md`（缺少 "tutorial"）
- ❌ `angular-tutorial.md`（缺少 "react" 和 "vue"）

### 复杂分组
```
markdown AND (guide OR tutorial) AND NOT draft
```
匹配包含 "markdown" 和（"guide" 或 "tutorial"），但不包含 "draft" 的文件。

**示例**：
- ✅ `markdown-guide.md`
- ✅ `markdown-tutorial.md`
- ❌ `markdown-draft-guide.md`（包含 "draft"）
- ❌ `markdown-reference.md`（缺少 "guide" 和 "tutorial"）

## 组合使用

### 精确匹配 + 逻辑运算
```
"React.js" AND tutorial
```
精确匹配 "React.js" 并包含 "tutorial"。

### 多层嵌套
```
((react OR vue) AND (tutorial OR guide)) AND NOT draft
```
匹配：
- 包含 "react" 或 "vue"
- 且包含 "tutorial" 或 "guide"
- 但不包含 "draft"

## 实用示例

### 查找特定框架的教程
```
(react OR vue OR angular) AND tutorial
```

### 查找非测试的代码文件
```
component AND NOT (test OR spec)
```

### 查找文档但排除草稿
```
(doc OR documentation) AND NOT (draft OR wip)
```

### 查找配置文件
```
config OR configuration OR settings
```

### 查找特定类型的文件
```
"README" OR "CHANGELOG" OR "LICENSE"
```

## 搜索技巧

1. **大小写不敏感**：搜索不区分大小写，`React` 和 `react` 效果相同。

2. **运算符必须大写**：逻辑运算符（AND、OR、NOT）必须使用大写，小写会被当作普通搜索词。

3. **自动降级**：如果逻辑表达式无效，系统会自动降级为普通模糊搜索。

4. **模糊匹配**：即使使用逻辑运算符，每个搜索词仍然支持模糊匹配。

5. **性能优化**：搜索结果会被缓存，重复搜索会更快。

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd+P` / `Ctrl+P` | 打开快速搜索 |
| `Cmd+K` / `Ctrl+K` | 打开快速搜索 |
| `↑` / `↓` | 导航搜索结果 |
| `Enter` | 打开选中的文件 |
| `Esc` | 关闭搜索框 |

## 常见问题

### Q: 为什么我的 NOT 查询不工作？
A: NOT 必须与 AND 或 OR 配合使用。使用 `term1 AND NOT term2` 而不是 `term1 NOT term2`。

### Q: 如何搜索包含空格的词？
A: 使用双引号：`"my file name"`

### Q: 逻辑运算符可以小写吗？
A: 不可以。必须使用大写（AND、OR、NOT），小写会被当作普通搜索词。

### Q: 搜索结果是如何排序的？
A: 结果按相关性评分排序，考虑匹配位置、文件名权重、路径深度等因素。

### Q: 支持正则表达式吗？
A: 目前不支持正则表达式，但支持模糊匹配和逻辑运算符。

## 更多信息

- 搜索功能使用 [Fuse.js](https://fusejs.io/) 进行模糊匹配
- 逻辑查询解析器支持完整的布尔表达式
- 搜索结果会被 LRU 缓存优化性能
- 支持搜索历史记录和访问频率排序
