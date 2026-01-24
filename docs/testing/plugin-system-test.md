# 自动化插件系统测试

## 测试 Markdown 文件

创建一个测试文件验证所有功能：

```markdown
# 插件系统测试

## Mermaid 图表测试

\`\`\`mermaid
graph TD
    A[开始] --> B{判断}
    B -->|是| C[执行]
    B -->|否| D[结束]
    C --> D
\`\`\`

## 代码高亮测试

\`\`\`typescript
function hello(name: string): string {
  return `Hello, ${name}!`;
}
\`\`\`

## 数学公式测试

行内公式：$E = mc^2$

块级公式：
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

## 测试步骤

1. **启动开发服务器**
   ```bash
   cd /Users/dengwenyu/Dev/AI/folder-site
   bun run dev
   ```

2. **创建测试文件**
   ```bash
   echo "# Test\n\n\`\`\`mermaid\ngraph TD\n  A-->B\n\`\`\`" > test-plugin.md
   ```

3. **在浏览器中打开**
   - 访问 http://localhost:3000
   - 打开 test-plugin.md

4. **验证功能**
   - [ ] Mermaid 图表正常渲染
   - [ ] 鼠标悬停显示工具栏
   - [ ] 点击"复制代码"按钮
   - [ ] 点击"全屏查看"按钮
   - [ ] 点击"在新标签页打开"按钮
   - [ ] 点击"下载 SVG"按钮
   - [ ] 点击"下载 PNG"按钮
   - [ ] 切换主题（亮色/暗色）

5. **检查控制台**
   - 打开浏览器开发者工具
   - 查看是否有错误信息
   - 验证插件加载日志

## 预期结果

### 控制台输出
```
[PluginRenderer] Loading plugins...
[PluginRenderer] Loaded plugins: mermaid
[PluginRenderer] Rendering mermaid...
```

### 网络请求
```
GET /api/plugins/manifests
Status: 200 OK
Response: [
  {
    "id": "mermaid-renderer",
    "capabilities": [
      {
        "name": "mermaid",
        "frontend": {
          "enabled": true,
          "codeBlockLang": ["mermaid", "mmd"],
          ...
        }
      }
    ]
  }
]
```

### 页面渲染
- Mermaid 图表显示为 SVG
- 工具栏在鼠标悬停时显示
- 所有按钮功能正常

## 故障排查

### 问题：插件未加载
**检查**：
```bash
curl http://localhost:3000/api/plugins/manifests
```

**预期**：返回插件清单 JSON

### 问题：Mermaid 未渲染
**检查**：
1. 打开浏览器控制台
2. 查看是否有错误
3. 检查 `pre.mermaid code` 元素是否存在

### 问题：工具栏不显示
**检查**：
1. 检查 CSS 是否加载
2. 验证 `group` 和 `group-hover` 类
3. 检查 Tailwind CSS 配置
