# 迁移到 Folder-Site CLI

本指南帮助你从其他静态站点生成工具迁移到 Folder-Site CLI，包括配置转换、目录结构调整和功能映射。

## 概述

Folder-Site CLI 是一个一键式本地网站生成器，专为文档和知识库设计。相比其他静态站点生成器，它具有以下优势：

### 核心优势

- **零配置启动** - 无需复杂配置文件，直接运行即可
- **VS Code 风格体验** - 熟悉的文件树导航和快捷键
- **实时预览** - 文件修改后自动刷新，无需重新构建
- **插件化架构** - 支持 Mermaid、Graphviz、Vega 等图表渲染
- **快速搜索** - < 100ms 的模糊文件搜索
- **简单部署** - 支持白名单模式，轻松控制可见内容

### 迁移收益

| 收益 | 说明 |
|------|------|
| **开发效率** | 无需重新构建，保存即预览 |
| **学习成本低** | 配置简单，文档结构直观 |
| **性能优越** - 基于 Bun 运行时，启动速度极快 |
| **灵活性强** | 支持任意目录结构，无需预设模板 |
| **集成方便** | 可与现有工作流无缝集成 |

---

## 从 MkDocs 迁移

MkDocs 是基于 Python 的静态站点生成器，使用 `mkdocs.yml` 配置文件。

### 配置对比

#### MkDocs 配置示例

```yaml
site_name: My Documentation
site_url: https://example.com
site_author: Your Name
site_description: Project documentation

theme:
  name: material
  features:
    - navigation.sections
    - search.highlight
  palette:
    - media: "(prefers-color-scheme: light)"
      scheme: default
    - media: "(prefers-color-scheme: dark)"
      scheme: slate

plugins:
  - search
  - mermaid2

nav:
  - Home: index.md
  - Getting Started:
    - Installation: getting-started/installation.md
    - Quick Start: getting-started/quick-start.md
```

#### Folder-Site CLI 配置示例

```json
{
  "version": "1.0.0",
  "site": {
    "title": "My Documentation",
    "url": "https://example.com",
    "description": "Project documentation",
    "language": "en"
  },
  "theme": {
    "mode": "auto",
    "primaryColor": "#3b82f6"
  },
  "navigation": {
    "showSidebar": true
  },
  "search": {
    "enabled": true,
    "hotkey": "Cmd+P"
  }
}
```

### 配置项映射表

| MkDocs 配置 | Folder-Site CLI 配置 | 说明 |
|-------------|---------------------|------|
| `site_name` | `site.title` | 站点标题 |
| `site_url` | `site.url` | 站点 URL |
| `site_author` | `site.author` | 作者信息 |
| `site_description` | `site.description` | 站点描述 |
| `theme.name` | - | Folder-Site 使用内置主题 |
| `theme.palette` | `theme.mode` | 主题模式（light/dark/auto） |
| `plugins` | 插件系统 | Folder-Site 支持插件扩展 |
| `nav` | 目录结构 | Folder-Site 自动从文件树生成导航 |
| `markdown_extensions` | 内置支持 | GFM、数学公式等内置支持 |

### 目录结构转换

#### MkDocs 目录结构

```
my-docs/
├── mkdocs.yml
├── docs/
│   ├── index.md
│   ├── getting-started/
│   │   ├── installation.md
│   │   └── quick-start.md
│   └── api/
│       └── reference.md
└── overrides/
    └── custom.css
```

#### Folder-Site CLI 目录结构

```
my-docs/
├── .folder-siterc.json
├── README.md
├── getting-started/
│   ├── installation.md
│   └── quick-start.md
└── api/
    └── reference.md
```

### 迁移步骤

1. **安装 Folder-Site CLI**
   ```bash
   npm install -g folder-site
   ```

2. **创建配置文件**
   ```bash
   cd my-docs
   touch .folder-siterc.json
   ```

3. **转换配置**
   - 将 `mkdocs.yml` 中的配置转换为 `.folder-siterc.json` 格式
   - 参考上面的配置示例

4. **调整目录结构**
   ```bash
   # 将 docs/ 目录下的文件移到根目录
   mv docs/* .
   # 或使用白名单模式保持原结构
   ```

5. **启动服务**
   ```bash
   folder-site
   ```

### 功能映射

| MkDocs 功能 | Folder-Site CLI 功能 | 迁移说明 |
|-------------|---------------------|----------|
| Material Design 主题 | 内置主题 | Folder-Site 使用现代简洁设计 |
| 导航配置 | 自动文件树 | 从目录结构自动生成 |
| 搜索插件 | 内置搜索 | 无需额外配置 |
| Mermaid 图表 | Mermaid 插件 | 需要安装插件 |
| 代码高亮 | Shiki | 支持 100+ 语言 |
| 多语言支持 | - | 暂不支持 |
| 博客功能 | - | 暂不支持 |

### 迁移示例

#### 完整的配置转换

**MkDocs 配置 (mkdocs.yml)**

```yaml
site_name: API Reference
site_url: https://api.example.com
site_author: Dev Team
site_description: Complete API documentation

theme:
  name: material
  features:
    - navigation.instant
    - navigation.tracking
    - search.suggest
  palette:
    - scheme: default
      primary: indigo
      accent: indigo
      toggle:
        icon: material/toggle-switch

plugins:
  - search
  - mermaid2
  - git-revision-date-localized

markdown_extensions:
  - pymdownx.highlight
  - pymdownx.superfences
  - pymdownx.tabbed
  - admonition
  - footnotes

nav:
  - Home: index.md
  - Guides:
      - Installation: guides/installation.md
      - Configuration: guides/configuration.md
  - API:
      - Overview: api/overview.md
      - Endpoints: api/endpoints.md
```

**Folder-Site CLI 配置 (.folder-siterc.json)**

```json
{
  "version": "1.0.0",
  "site": {
    "title": "API Reference",
    "url": "https://api.example.com",
    "author": "Dev Team",
    "description": "Complete API documentation",
    "language": "en"
  },
  "theme": {
    "mode": "light",
    "primaryColor": "#6366f1"
  },
  "navigation": {
    "showSidebar": true,
    "expandedGroups": ["guides", "api"]
  },
  "search": {
    "enabled": true,
    "hotkey": "Cmd+P",
    "options": {
      "minMatchCharLength": 2,
      "limit": 10
    }
  },
  "export": {
    "pdf": {
      "enabled": true,
      "format": "a4",
      "includeToc": true
    }
  }
}
```

**目录结构调整**

```bash
# 保持原结构，使用白名单模式
folder-site --whitelist "docs/**/*,README.md"

# 或迁移到新结构
mv docs/index.md README.md
mv docs/guides/* guides/
mv docs/api/* api/
rm -rf docs
```

---

## 从 Docusaurus 迁移

Docusaurus 是 Facebook 开发的基于 React 的静态站点生成器，使用 `docusaurus.config.js` 配置文件。

### 配置对比

#### Docusaurus 配置示例

```javascript
module.exports = {
  title: 'My Site',
  tagline: 'The tagline of the site',
  url: 'https://your-docusaurus-site.example.com',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'your-org',
  projectName: 'your-project',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/your-org/your-project/tree/main/',
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'My Site',
      items: [
        { to: 'docs/intro', label: 'Docs', position: 'left' },
        { to: 'blog', label: 'Blog', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Your Name.`,
    },
  },
};
```

#### Folder-Site CLI 配置示例

```json
{
  "version": "1.0.0",
  "site": {
    "title": "My Site",
    "description": "The tagline of the site",
    "url": "https://your-docusaurus-site.example.com",
    "favicon": "img/favicon.ico"
  },
  "theme": {
    "mode": "dark"
  },
  "navigation": {
    "showSidebar": true
  }
}
```

### 配置项映射表

| Docusaurus 配置 | Folder-Site CLI 配置 | 说明 |
|-----------------|---------------------|------|
| `title` | `site.title` | 站点标题 |
| `tagline` | `site.description` | 站点描述 |
| `url` | `site.url` | 站点 URL |
| `baseUrl` | - | 由服务器自动处理 |
| `favicon` | `site.favicon` | 站点图标 |
| `presets.docs` | 目录结构 | 文档目录 |
| `presets.blog` | - | 暂不支持博客 |
| `themeConfig.navbar` | - | 使用侧边栏导航 |
| `themeConfig.footer` | - | 使用默认页脚 |

### 目录结构转换

#### Docusaurus 目录结构

```
my-site/
├── docusaurus.config.js
├── sidebars.js
├── docs/
│   ├── intro.md
│   ├── tutorial-basics/
│   │   ├── create-a-document.md
│   │   └── create-a-page.md
│   └── tutorial-extras/
│       └── translate-your-site.md
├── blog/
│   ├── 2019-05-28-hello-world.md
│   └── 2019-05-30-welcome.md
├── src/
│   ├── css/
│   │   └── custom.css
│   └── pages/
│       └── styles.module.css
└── static/
    └── img/
```

#### Folder-Site CLI 目录结构

```
my-site/
├── .folder-siterc.json
├── README.md
├── docs/
│   ├── intro.md
│   ├── tutorial-basics/
│   │   ├── create-a-document.md
│   │   └── create-a-page.md
│   └── tutorial-extras/
│       └── translate-your-site.md
└── static/
    └── img/
```

### 迁移步骤

1. **安装 Folder-Site CLI**
   ```bash
   npm install -g folder-site
   ```

2. **创建配置文件**
   ```bash
   cd my-site
   touch .folder-siterc.json
   ```

3. **转换配置**
   ```json
   {
     "site": {
       "title": "My Site",
       "description": "The tagline of the site",
       "url": "https://your-docusaurus-site.example.com"
     },
     "build": {
       "whitelist": ["docs/**/*", "README.md", "static/**/*"]
     }
   }
   ```

4. **处理特殊文件**
   ```bash
   # 将 docs/intro.md 复制为 README.md
   cp docs/intro.md README.md

   # 博客内容可以迁移到 docs/blog/ 目录
   mkdir -p docs/blog
   mv blog/*.md docs/blog/
   ```

5. **启动服务**
   ```bash
   folder-site
   ```

### 功能映射

| Docusaurus 功能 | Folder-Site CLI 功能 | 迁移说明 |
|-----------------|---------------------|----------|
| React 组件 | - | 不支持自定义 React 组件 |
| MDX 支持 | - | 不支持 MDX |
| 博客系统 | - | 暂不支持 |
| 版本控制 | - | 暂不支持 |
| i18n | - | 暂不支持 |
| Algolia 搜索 | 内置搜索 | 无需外部服务 |
| 自定义 CSS | `theme.customCss` | 支持自定义样式 |

### 迁移示例

#### 完整的配置转换

**Docusaurus 配置 (docusaurus.config.js)**

```javascript
module.exports = {
  title: 'React Documentation',
  tagline: 'A JavaScript library for building user interfaces',
  url: 'https://react.dev',
  baseUrl: '/',
  favicon: 'img/favicon.ico',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/facebook/react/tree/main/docs/',
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'React',
      items: [
        { to: 'docs/learn', label: 'Learn', position: 'left' },
        { to: 'docs/reference', label: 'API', position: 'left' },
      ],
    },
    prism: {
      theme: require('prism-react-renderer/themes/dark'),
    },
  },
};
```

**Folder-Site CLI 配置 (.folder-siterc.json)**

```json
{
  "version": "1.0.0",
  "site": {
    "title": "React Documentation",
    "description": "A JavaScript library for building user interfaces",
    "url": "https://react.dev",
    "favicon": "img/favicon.ico"
  },
  "theme": {
    "mode": "dark",
    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  "navigation": {
    "showSidebar": true,
    "expandedGroups": ["learn", "reference"]
  },
  "search": {
    "enabled": true,
    "hotkey": "Cmd+P"
  }
}
```

---

## 从 Jekyll 迁移

Jekyll 是基于 Ruby 的静态站点生成器，使用 `_config.yml` 配置文件。

### 配置对比

#### Jekyll 配置示例

```yaml
title: My Blog
email: your-email@example.com
description: >-
  Write an awesome description for your new site here.
baseurl: ""
url: "https://example.com"
twitter_username: jekyllrb
github_username: jekyll

theme: minima
plugins:
  - jekyll-feed
  - jekyll-seo-tag

exclude:
  - .sass-cache/
  - .jekyll-cache/
  - gemfiles/
  - Gemfile
  - Gemfile.lock

collections:
  docs:
    output: true
    permalink: /docs/:path/
```

#### Folder-Site CLI 配置示例

```json
{
  "version": "1.0.0",
  "site": {
    "title": "My Blog",
    "description": "Write an awesome description for your new site here",
    "url": "https://example.com"
  },
  "theme": {
    "mode": "auto"
  }
}
```

### 配置项映射表

| Jekyll 配置 | Folder-Site CLI 配置 | 说明 |
|-------------|---------------------|------|
| `title` | `site.title` | 站点标题 |
| `email` | - | 不使用 |
| `description` | `site.description` | 站点描述 |
| `baseurl` | - | 由服务器自动处理 |
| `url` | `site.url` | 站点 URL |
| `theme` | - | Folder-Site 使用内置主题 |
| `plugins` | 插件系统 | 需要重新实现 |
| `exclude` | `build.whitelist` | 使用白名单模式 |
| `collections` | 目录结构 | 使用目录结构代替 |

### 目录结构转换

#### Jekyll 目录结构

```
my-jekyll-site/
├── _config.yml
├── _posts/
│   ├── 2023-01-01-welcome-to-jekyll.markdown
│   └── 2023-01-02-second-post.markdown
├── _pages/
│   ├── about.md
│   └── contact.md
├── _docs/
│   ├── getting-started.md
│   └── advanced.md
├── _layouts/
│   └── default.html
├── _includes/
│   └── header.html
├── assets/
│   ├── css/
│   └── images/
└── index.md
```

#### Folder-Site CLI 目录结构

```
my-jekyll-site/
├── .folder-siterc.json
├── README.md
├── posts/
│   ├── welcome-to-jekyll.md
│   └── second-post.md
├── pages/
│   ├── about.md
│   └── contact.md
├── docs/
│   ├── getting-started.md
│   └── advanced.md
└── assets/
    ├── css/
    └── images/
```

### 迁移步骤

1. **安装 Folder-Site CLI**
   ```bash
   npm install -g folder-site
   ```

2. **创建配置文件**
   ```bash
   cd my-jekyll-site
   touch .folder-siterc.json
   ```

3. **转换配置**
   ```json
   {
     "site": {
       "title": "My Blog",
       "description": "Write an awesome description for your new site here",
       "url": "https://example.com"
     },
     "build": {
       "whitelist": [
         "docs/**/*",
         "posts/**/*",
         "pages/**/*",
         "assets/**/*",
         "README.md"
       ]
     }
   }
   ```

4. **迁移内容**
   ```bash
   # 重命名目录（去掉下划线前缀）
   mv _posts posts
   mv _pages pages
   mv _docs docs

   # 处理 Liquid 模板
   # 需要手动将 Liquid 语法转换为标准 Markdown
   ```

5. **启动服务**
   ```bash
   folder-site
   ```

### 功能映射

| Jekyll 功能 | Folder-Site CLI 功能 | 迁移说明 |
|-------------|---------------------|----------|
| Liquid 模板 | - | 需要转换为纯 Markdown |
| Front Matter | 内置支持 | 支持 YAML front matter |
| 集合 | 目录结构 | 使用目录代替 |
| 布局 | - | 不支持自定义布局 |
| 包含 | - | 不支持模板包含 |
| 插件系统 | 插件系统 | 部分功能可迁移 |
| 博客功能 | - | 暂不支持 |

### 迁移示例

#### 完整的配置转换

**Jekyll 配置 (_config.yml)**

```yaml
title: Developer Guide
email: dev@example.com
description: >-
  Comprehensive developer guide for our platform.
baseurl: "/dev-guide"
url: "https://example.com"
github_username: myorg

theme: minima
plugins:
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag

collections:
  docs:
    output: true
    permalink: /docs/:path/
  tutorials:
    output: true
    permalink: /tutorials/:path/

defaults:
  - scope:
      path: ""
      type: "docs"
    values:
      layout: "docs"

exclude:
  - .sass-cache/
  - .jekyll-cache/
  - Gemfile
  - Gemfile.lock
```

**Folder-Site CLI 配置 (.folder-siterc.json)**

```json
{
  "version": "1.0.0",
  "site": {
    "title": "Developer Guide",
    "description": "Comprehensive developer guide for our platform",
    "url": "https://example.com"
  },
  "theme": {
    "mode": "auto"
  },
  "navigation": {
    "showSidebar": true,
    "expandedGroups": ["docs", "tutorials"]
  },
  "build": {
    "whitelist": [
      "docs/**/*",
      "tutorials/**/*",
      "README.md"
    ]
  }
}
```

---

## 从 Hugo 迁移

Hugo 是基于 Go 的静态站点生成器，使用 `config.toml` 或 `config.yaml` 配置文件。

### 配置对比

#### Hugo 配置示例

```toml
baseURL = "https://example.com/"
languageCode = "en-us"
title = "My New Hugo Site"

theme = "ananke"

[params]
  author = "Your Name"
  description = "My awesome site"

[menu]
  [[menu.main]]
    identifier = "home"
    name = "Home"
    url = "/"
    weight = 1
  [[menu.main]]
    identifier = "about"
    name = "About"
    url = "/about/"
    weight = 2
```

#### Folder-Site CLI 配置示例

```json
{
  "version": "1.0.0",
  "site": {
    "title": "My New Hugo Site",
    "url": "https://example.com",
    "description": "My awesome site",
    "language": "en",
    "author": "Your Name"
  },
  "theme": {
    "mode": "auto"
  }
}
```

### 配置项映射表

| Hugo 配置 | Folder-Site CLI 配置 | 说明 |
|-----------|---------------------|------|
| `baseURL` | `site.url` | 站点 URL |
| `languageCode` | `site.language` | 语言代码 |
| `title` | `site.title` | 站点标题 |
| `theme` | - | Folder-Site 使用内置主题 |
| `params` | `site.*` | 参数映射到 site 配置 |
| `menu` | 目录结构 | 使用目录结构代替 |

### 目录结构转换

#### Hugo 目录结构

```
my-hugo-site/
├── config.toml
├── content/
│   ├── _index.md
│   ├── posts/
│   │   ├── first-post.md
│   │   └── second-post.md
│   └── docs/
│       ├── getting-started.md
│       └── configuration.md
├── layouts/
│   ├── _default/
│   │   └── single.html
│   └── partials/
│       └── header.html
├── static/
│   ├── css/
│   └── images/
└── themes/
    └── ananke/
```

#### Folder-Site CLI 目录结构

```
my-hugo-site/
├── .folder-siterc.json
├── README.md
├── posts/
│   ├── first-post.md
│   └── second-post.md
└── docs/
    ├── getting-started.md
    └── configuration.md
```

### 迁移步骤

1. **安装 Folder-Site CLI**
   ```bash
   npm install -g folder-site
   ```

2. **创建配置文件**
   ```bash
   cd my-hugo-site
   touch .folder-siterc.json
   ```

3. **转换配置**
   ```json
   {
     "site": {
       "title": "My New Hugo Site",
       "url": "https://example.com",
       "description": "My awesome site",
       "language": "en"
     },
     "build": {
       "whitelist": [
         "content/**/*",
         "static/**/*"
       ]
     }
   }
   ```

4. **迁移内容**
   ```bash
   # 将 content/_index.md 复制为 README.md
   cp content/_index.md README.md

   # 移动其他内容
   mv content/posts/* posts/
   mv content/docs/* docs/

   # 处理 Hugo 特定语法
   # 需要手动转换 Shortcodes 为标准 Markdown
   ```

5. **启动服务**
   ```bash
   folder-site
   ```

### 功能映射

| Hugo 功能 | Folder-Site CLI 功能 | 迁移说明 |
|-----------|---------------------|----------|
| Shortcodes | - | 需要转换为 HTML/Markdown |
| Front Matter | 内置支持 | 支持 YAML/TOML front matter |
| 模板系统 | - | 不支持自定义模板 |
| 分类和标签 | - | 暂不支持 |
| 多语言 | - | 暂不支持 |
| 主题系统 | - | 使用内置主题 |
| 资源管道 | - | 不支持资源处理 |

### 迁移示例

#### 完整的配置转换

**Hugo 配置 (config.toml)**

```toml
baseURL = "https://docs.example.com/"
languageCode = "en-us"
title = "Project Documentation"

theme = "docsy"

[params]
  author = "Documentation Team"
  description = "Official project documentation"
  github_repo = "https://github.com/org/project"

[markup]
  [markup.highlight]
    style = "monokai"
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true

[[menu.main]]
  name = "Home"
  url = "/"
  weight = 1

[[menu.main]]
  name = "Getting Started"
  url = "/docs/getting-started/"
  weight = 2

[[menu.main]]
  name = "API Reference"
  url = "/docs/api/"
  weight = 3
```

**Folder-Site CLI 配置 (.folder-siterc.json)**

```json
{
  "version": "1.0.0",
  "site": {
    "title": "Project Documentation",
    "url": "https://docs.example.com",
    "description": "Official project documentation",
    "language": "en",
    "author": "Documentation Team"
  },
  "theme": {
    "mode": "dark"
  },
  "navigation": {
    "showSidebar": true,
    "expandedGroups": ["getting-started", "api"]
  },
  "search": {
    "enabled": true,
    "hotkey": "Cmd+P"
  }
}
```

---

## 迁移检查清单

### 通用检查项

- [ ] **备份现有项目**
  - 创建项目备份
  - 使用 Git 提交当前状态

- [ ] **安装 Folder-Site CLI**
  - 运行 `npm install -g folder-site`
  - 验证安装 `folder-site --version`

- [ ] **创建新项目结构**
  - 分析现有目录结构
  - 规划新的目录布局
  - 创建必要的目录

- [ ] **转换配置文件**
  - 将原配置转换为 `.folder-siterc.json`
  - 验证 JSON 格式正确性
  - 配置白名单（如需要）

- [ ] **迁移内容文件**
  - 复制/移动 Markdown 文件
  - 处理特殊文件（模板、布局等）
  - 清理不支持的语法

- [ ] **测试构建**
  - 运行 `folder-site` 启动服务
  - 检查文件树是否正确显示
  - 验证所有页面可访问

- [ ] **验证功能**
  - 测试搜索功能
  - 验证主题切换
  - 测试文件修改后的自动刷新
  - 检查代码高亮和图表渲染

### MkDocs 特定检查项

- [ ] 处理 `nav` 配置（转换为目录结构）
- [ ] 检查 `markdown_extensions` 配置的兼容性
- [ ] 迁移 `plugins` 配置（查看 Folder-Site 插件支持）
- [ ] 处理 `docs/` 目录结构
- [ ] 迁移 `overrides/` 自定义内容

### Docusaurus 特定检查项

- [ ] 处理 `sidebars.js` 配置
- [ ] 转换 MDX 内容为标准 Markdown
- [ ] 迁移 React 组件（如需要）
- [ ] 处理 `docs/` 和 `blog/` 目录
- [ ] 转换自定义 CSS

### Jekyll 特定检查项

- [ ] 重命名 `_` 开头的目录
- [ ] 转换 Liquid 模板语法
- [ ] 处理 Front Matter 格式
- [ ] 迁移 `_layouts/` 和 `_includes/`（如需要）
- [ ] 处理插件依赖

### Hugo 特定检查项

- [ ] 转换 Shortcodes 为 HTML/Markdown
- [ ] 处理 Front Matter 格式
- [ ] 迁移 `content/` 目录
- [ ] 处理静态资源
- [ ] 清理主题相关配置

---

## 常见问题和解决方案

### 配置问题

#### Q1: 配置文件不生效？

**A1:** 检查以下内容：
- 确认配置文件名为 `.folder-siterc.json` 或 `folder-site.config.json`
- 文件必须在项目根目录
- 验证 JSON 格式是否正确（使用 JSON 验证器）
- 检查文件编码是否为 UTF-8

#### Q2: 白名单模式看不到任何文件？

**A2:** 解决步骤：
1. 检查 glob 模式是否正确
2. 确认路径是相对于项目根目录的
3. 使用 `**/*` 匹配所有子目录
4. 查看服务器启动日志中的白名单提示

```bash
# 错误示例
folder-site --whitelist "docs/*.md"  # 只匹配 docs/ 根目录

# 正确示例
folder-site --whitelist "docs/**/*.md"  # 递归匹配所有子目录
```

#### Q3: 如何配置主题颜色？

**A3:** 在 `.folder-siterc.json` 中配置：

```json
{
  "theme": {
    "mode": "dark",
    "primaryColor": "#3b82f6",
    "customCss": ["custom.css"]
  }
}
```

### 内容迁移问题

#### Q4: Front Matter 格式不兼容？

**A4:** Folder-Site 支持多种 Front Matter 格式：

```yaml
---
title: Page Title
date: 2024-01-01
---
```

```toml
+++
title = "Page Title"
date = 2024-01-01
+++
```

```json
---
{
  "title": "Page Title",
  "date": "2024-01-01"
}
---
```

#### Q5: 如何处理 Liquid/Jinja2 模板语法？

**A5:** 需要手动转换为标准 Markdown 或 HTML：

```liquid
<!-- 原始 Liquid 语法 -->
{% include header.html %}
{{ site.title }}

<!-- 转换后 -->
<!-- 使用标准 Markdown -->
# Header
```

#### Q6: Shortcodes 如何转换？

**A6:** 将 Hugo Shortcodes 转换为 HTML：

```markdown
<!-- 原始 Hugo Shortcode -->
{{< youtube dQw4w9WgXcQ >}}

<!-- 转换后 -->
<iframe width="560" height="315"
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  frameborder="0" allowfullscreen>
</iframe>
```

### 构建和部署问题

#### Q7: 如何部署到生产环境？

**A7:** Folder-Site 支持多种部署方式：

```bash
# 开发模式（带热重载）
folder-site

# 生产模式（使用环境变量）
PORT=8080 folder-site --whitelist "docs/**/*"

# 使用 process manager (如 PM2)
pm2 start "folder-site" --name "docs-site" -- --port 8080
```

#### Q8: 如何配置域名？

**A8:** 使用反向代理（如 Nginx）：

```nginx
server {
    listen 80;
    server_name docs.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Q9: 如何集成到 CI/CD？

**A9:** 示例 GitHub Actions 配置：

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g folder-site
      - run: folder-site --port 3000 &
      - run: # 部署步骤
```

### 功能兼容性问题

#### Q10: 如何实现多语言支持？

**A10:** 目前 Folder-Site 暂不支持内置的多语言功能，但可以通过目录结构实现：

```
docs/
├── en/
│   ├── index.md
│   └── guide.md
└── zh/
    ├── index.md
    └── guide.md
```

#### Q11: 如何添加自定义脚本？

**A11:** 使用插件系统：

```typescript
// plugins/custom-script/index.ts
export const plugin = {
  name: 'custom-script',
  render: (content: string) => {
    // 自定义渲染逻辑
    return content;
  }
};
```

#### Q12: 如何实现搜索优化？

**A12:** 配置搜索选项：

```json
{
  "search": {
    "enabled": true,
    "hotkey": "Cmd+P",
    "options": {
      "minMatchCharLength": 2,
      "caseSensitive": false,
      "includeTitle": true,
      "includeContent": true,
      "limit": 10
    }
  }
}
```

---

## 最佳实践

### 1. 渐进式迁移

不要一次性迁移所有内容：

1. **第一阶段**：迁移核心文档
2. **第二阶段**：迁移辅助文档
3. **第三阶段**：优化和调整

### 2. 使用白名单模式

对于大型项目，使用白名单模式逐步迁移：

```bash
# 先迁移 docs/ 目录
folder-site --whitelist "docs/**/*,README.md"

# 确认无误后，添加更多目录
folder-site --whitelist "docs/**/*,examples/**/*,README.md"
```

### 3. 保持 Git 历史

使用 Git 追踪迁移过程：

```bash
# 创建迁移分支
git checkout -b migration/folder-site

# 提交迁移后的配置
git add .folder-siterc.json
git commit -m "Add Folder-Site configuration"

# 分阶段提交内容迁移
git add docs/
git commit -m "Migrate docs directory"
```

### 4. 验证链接和引用

迁移后检查所有内部链接：

```bash
# 使用工具检查死链
npx markdown-link-check docs/**/*.md
```

### 5. 性能优化

对于大型文档集：

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000
  },
  "search": {
    "options": {
      "limit": 20
    }
  }
}
```

### 6. 备份和回滚

始终保留原始配置：

```bash
# 备份原配置
cp mkdocs.yml mkdocs.yml.backup
cp docusaurus.config.js docusaurus.config.js.backup

# 创建回滚脚本
cat > rollback.sh << 'EOF'
#!/bin/bash
rm .folder-siterc.json
git checkout main
EOF
chmod +x rollback.sh
```

---

## 进阶主题

### 插件开发

如果需要自定义功能，可以开发插件：

```typescript
// plugins/my-plugin/index.ts
import { Plugin } from '../../types/plugin.js';

export const plugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  supportedFormats: ['.md', '.mmd'],
  
  async render(content: string, filePath: string) {
    // 自定义渲染逻辑
    return processedContent;
  }
};
```

### 集成 Workhub

Folder-Site 支持 Workhub 结构：

```
docs/
├── issues/          # 任务规划
├── pr/              # 变更记录
├── design-catalog/  # 设计文档
└── reports/         # 报告文档
```

```json
{
  "build": {
    "whitelist": [
      "docs/issues/**/*",
      "docs/pr/**/*",
      "docs/design-catalog/**/*",
      "docs/reports/**/*"
    ]
  }
}
```

### 自定义主题

通过 CSS 自定义主题：

```css
/* custom.css */
:root {
  --primary-color: #3b82f6;
  --font-family: 'Inter', sans-serif;
}

body {
  font-family: var(--font-family);
}
```

```json
{
  "theme": {
    "customCss": ["custom.css"]
  }
}
```

### API 集成

使用 Folder-Site API 进行集成：

```bash
# 健康检查
curl http://localhost:3000/api/health

# 获取文件列表
curl http://localhost:3000/api/files

# 搜索文件
curl http://localhost:3000/api/search?q=api
```

---

## 获取帮助

### 文档资源

- [安装指南](./INSTALLATION.md)
- [使用指南](./USAGE.md)
- [API 文档](./API.md)
- [故障排查](./TROUBLESHOOTING.md)
- [白名单模式](./WHITELIST_MODE.md)

### 社区支持

- **GitHub Issues**: [提交问题](https://github.com/yourusername/folder-site/issues)
- **GitHub Discussions**: [参与讨论](https://github.com/yourusername/folder-site/discussions)
- **Email**: your.email@example.com

### 贡献指南

欢迎贡献迁移指南：

1. Fork 项目
2. 创建迁移指南的改进分支
3. 提交 Pull Request

### 迁移服务

如果需要专业迁移支持，可以：

1. 提供项目详情（工具、规模、特殊需求）
2. 获取迁移方案建议
3. 获取一对一技术支持

---

## 附录

### A. 配置文件模板

#### 基础模板

```json
{
  "version": "1.0.0",
  "site": {
    "title": "My Documentation",
    "description": "Project documentation",
    "url": "https://example.com"
  },
  "theme": {
    "mode": "auto"
  }
}
```

#### 完整模板

```json
{
  "version": "1.0.0",
  "site": {
    "title": "My Documentation",
    "description": "Project documentation",
    "url": "https://example.com",
    "favicon": "favicon.ico",
    "logo": "logo.png",
    "language": "en",
    "author": "Your Name"
  },
  "theme": {
    "mode": "auto",
    "primaryColor": "#3b82f6",
    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "customCss": ["custom.css"]
  },
  "navigation": {
    "showSidebar": true,
    "expandedGroups": ["getting-started", "api"]
  },
  "search": {
    "enabled": true,
    "hotkey": "Cmd+P",
    "options": {
      "minMatchCharLength": 2,
      "caseSensitive": false,
      "includeTitle": true,
      "includeContent": true,
      "limit": 10
    }
  },
  "export": {
    "pdf": {
      "enabled": true,
      "format": "a4",
      "margin": 20,
      "includeToc": true,
      "filename": "documentation.pdf"
    },
    "html": {
      "enabled": true,
      "inlineCss": true,
      "inlineImages": true,
      "filename": "documentation.html"
    }
  },
  "build": {
    "whitelist": [
      "docs/**/*",
      "examples/**/*",
      "README.md"
    ]
  }
}
```

### B. 常用 Glob 模式

| 模式 | 说明 |
|------|------|
| `**/*` | 匹配所有文件和目录 |
| `**/*.md` | 递归匹配所有 Markdown 文件 |
| `docs/**/*` | 匹配 docs 目录下的所有内容 |
| `docs/**/*.md` | 匹配 docs 目录下的所有 Markdown 文件 |
| `*.md` | 匹配当前目录下的 Markdown 文件 |
| `README.md` | 精确匹配 README.md |
| `docs/*.md` | 匹配 docs 根目录的 Markdown 文件 |
| `**/test*.md` | 匹配所有以 test 开头的 Markdown 文件 |
| `!node_modules/**` | 排除 node_modules 目录 |

### C. 快速参考卡片

#### 命令行参数

```bash
folder-site                    # 默认启动
folder-site --port 8080        # 指定端口
folder-site --dir /path/docs   # 指定目录
folder-site --whitelist "docs/**/*"  # 白名单模式
folder-site --version          # 查看版本
folder-site --help             # 查看帮助
```

#### 环境变量

```bash
PORT=3000                      # 端口号
WHITELIST="docs/**/*"          # 白名单模式
```

#### 配置文件位置

```
.folder-siterc.json           # 首选配置文件
folder-site.config.json       # 备选配置文件
```

### D. 迁移时间估算

| 工具 | 小型项目 | 中型项目 | 大型项目 |
|------|---------|---------|---------|
| MkDocs | 1-2 小时 | 4-8 小时 | 1-2 天 |
| Docusaurus | 2-4 小时 | 1-2 天 | 3-5 天 |
| Jekyll | 2-3 小时 | 1-2 天 | 2-3 天 |
| Hugo | 1-2 小时 | 4-8 小时 | 1-2 天 |

**估算依据：**
- 小型项目：< 50 个文档文件
- 中型项目：50-200 个文档文件
- 大型项目：> 200 个文档文件

---

**祝你迁移顺利！** 🚀

如有任何问题，请查阅相关文档或联系社区支持。