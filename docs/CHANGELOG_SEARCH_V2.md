# 搜索系统 v2 更新日志

## 版本 2.0.0 (2025-01-24)

### 新增功能

#### 1. 全文检索支持
- ✅ 使用 ripgrep 实现文件内容搜索
- ✅ 支持 JSON 格式输出
- ✅ 支持上下文行提取
- ✅ 支持匹配高亮（子匹配位置）

#### 2. 搜索模式切换
- ✅ 文件名搜索模式（Files）
- ✅ 内容搜索模式（Content）
- ✅ 自动模式（Auto，同时搜索两者）
- ✅ Tab 键快速切换模式

#### 3. 高级搜索选项
- ✅ 文件扩展名过滤
- ✅ 目录排除（支持 .gitignore）
- ✅ 大小写敏感/不敏感
- ✅ 上下文行数控制
- ✅ 结果数量限制

#### 4. 性能优化
- ✅ LRU 缓存（200 条，60s TTL）
- ✅ 缓存命中统计
- ✅ 并行搜索（文件名 + 内容）
- ✅ 性能追踪（耗时统计）

#### 5. 前端组件升级
- ✅ SearchModalV2 组件
- ✅ 结果分组显示（Files / Content）
- ✅ 搜索历史（最近访问文件）
- ✅ 加载状态显示
- ✅ 错误处理

#### 6. 工具管理
- ✅ 自动下载 fd 和 ripgrep
- ✅ 支持多平台（macOS, Linux, Windows）
- ✅ 支持多架构（x86_64, arm64）
- ✅ 工具状态检查 API

### API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/search/v2/status` | GET | 检查工具状态 |
| `/api/search/v2/files` | GET | 文件名搜索 |
| `/api/search/v2/content` | GET | 内容搜索 |
| `/api/search/v2` | GET/POST | 统一搜索 |
| `/api/search/v2/cache/stats` | GET | 缓存统计 |
| `/api/search/v2/cache/clear` | POST | 清空缓存 |

### 性能提升

| 操作 | v1 | v2 | 提升 |
|------|-----|-----|------|
| 文件名搜索 | 50ms | 27ms | 1.9x |
| 内容搜索 | N/A | 34ms | - |
| 缓存命中 | N/A | ~5ms | 4-6x |
| 统一搜索 | N/A | 25ms | - |

### 文件变更

#### 新增文件
```
src/utils/tools-config.ts
src/utils/tools-manager.ts
src/server/services/search-service.ts
src/server/services/search-cache-service.ts
src/types/search.ts
src/server/routes/search-v2.ts
src/client/components/search/SearchModalV2.tsx
docs/SEARCH_V2.md
docs/SEARCH_UPGRADE_SUMMARY.md
docs/SEARCH_V2_TEST_REPORT.md
docs/SEARCH_V2_QUICKREF.md
tests/search-v2.test.ts
```

#### 修改文件
```
src/server/index.ts
src/client/App.tsx
src/client/components/search/index.ts
.gitignore
package.json
```

### 依赖更新

```json
{
  "tar": "^7.5.6"
}
```

### 向后兼容性

- ✅ v1 API (`/api/search`) 仍然可用
- ✅ SearchModal 组件保留
- ✅ 可以逐步迁移到 v2

### 使用示例

#### 文件名搜索
```bash
curl "http://localhost:3008/api/search/v2/files?q=package&limit=10"
```

#### 内容搜索
```bash
curl "http://localhost:3008/api/search/v2/content?q=export&limit=50"
```

#### 统一搜索
```bash
curl "http://localhost:3008/api/search/v2?q=search&mode=auto"
```

#### 前端组件
```tsx
import { SearchModalV2 } from './components/search/index.js';

<SearchModalV2
  open={searchOpen}
  onOpenChange={setSearchOpen}
  activePath={location.pathname}
  onSelect={(item) => navigate(`/file/${item.path}`)}
/>
```

### 已知问题

无

### 后续计划

#### 短期（1-2 周）
- [ ] 添加搜索历史记录
- [ ] 实现搜索结果预览
- [ ] 添加搜索过滤器 UI
- [ ] 实现结果分页

#### 中期（3-6 周）
- [ ] 支持正则表达式搜索
- [ ] 支持模糊搜索
- [ ] 添加搜索建议
- [ ] 支持搜索结果导出

#### 长期（2-3 月）
- [ ] 构建全文索引（MiniSearch）
- [ ] 支持多语言内容提取
- [ ] 实现搜索结果分析
- [ ] 添加搜索统计仪表板

### 迁移指南

#### 从 v1 迁移到 v2

1. **更新导入**
   ```tsx
   // 旧
   import { SearchModal } from './components/search/index.js';
   
   // 新
   import { SearchModalV2 } from './components/search/index.js';
   ```

2. **更新组件使用**
   ```tsx
   // 旧：需要提供 files 数组
   <SearchModal
     open={searchOpen}
     onOpenChange={setSearchOpen}
     files={files}  // 不再需要
   />
   
   // 新：自动获取文件列表
   <SearchModalV2
     open={searchOpen}
     onOpenChange={setSearchOpen}
   />
   ```

3. **更新 API 调用**
   ```js
   // 旧
   const response = await fetch('/api/search?q=test');
   
   // 新
   const response = await fetch('/api/search/v2?q=test&mode=auto');
   ```

### 测试

- ✅ 单元测试：19/19 通过
- ✅ 集成测试：全部通过
- ✅ 性能测试：全部达标
- ✅ 缓存测试：全部通过

测试报告：[SEARCH_V2_TEST_REPORT.md](./docs/SEARCH_V2_TEST_REPORT.md)

### 文档

- [搜索系统 v2 文档](./docs/SEARCH_V2.md)
- [快速参考](./docs/SEARCH_V2_QUICKREF.md)
- [升级总结](./docs/SEARCH_UPGRADE_SUMMARY.md)
- [测试报告](./docs/SEARCH_V2_TEST_REPORT.md)

### 致谢

感谢以下开源项目：
- [fd](https://github.com/sharkdp/fd) - 快速文件搜索
- [ripgrep](https://github.com/BurntSushi/ripgrep) - 高性能内容搜索
- [lru-cache](https://github.com/isaacs/node-lru-cache) - LRU 缓存实现

---

**发布日期**: 2025-01-24
**版本**: 2.0.0
**维护者**: folder-site team