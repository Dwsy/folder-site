/**
 * Code Language Icons
 * 
 * 为代码块添加语言图标，使用 @react-symbols/icons 的 FileIcon
 */

import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { FileIcon } from '@react-symbols/icons/utils';

/**
 * 语言到文件扩展名的映射
 */
const LANGUAGE_TO_EXTENSION: Record<string, string> = {
  // JavaScript/TypeScript
  'javascript': 'js',
  'js': 'js',
  'jsx': 'jsx',
  'typescript': 'ts',
  'ts': 'ts',
  'tsx': 'tsx',
  
  // Web
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  'vue': 'vue',
  'svelte': 'svelte',
  
  // Python
  'python': 'py',
  'py': 'py',
  
  // Java/Kotlin
  'java': 'java',
  'kotlin': 'kt',
  'kt': 'kt',
  
  // C/C++
  'c': 'c',
  'cpp': 'cpp',
  'c++': 'cpp',
  'h': 'h',
  'hpp': 'hpp',
  
  // C#
  'csharp': 'cs',
  'cs': 'cs',
  
  // Go
  'go': 'go',
  
  // Rust
  'rust': 'rs',
  'rs': 'rs',
  
  // PHP
  'php': 'php',
  
  // Ruby
  'ruby': 'rb',
  'rb': 'rb',
  
  // Shell
  'bash': 'sh',
  'sh': 'sh',
  'shell': 'sh',
  'zsh': 'sh',
  
  // Config
  'json': 'json',
  'yaml': 'yaml',
  'yml': 'yml',
  'toml': 'toml',
  'xml': 'xml',
  
  // Markdown
  'markdown': 'md',
  'md': 'md',
  
  // SQL
  'sql': 'sql',
  
  // Docker
  'dockerfile': 'dockerfile',
  'docker': 'dockerfile',
  
  // Git
  'gitignore': '.gitignore',
  
  // Swift
  'swift': 'swift',
  
  // Dart
  'dart': 'dart',
  
  // Lua
  'lua': 'lua',
  
  // R
  'r': 'r',
  
  // Scala
  'scala': 'scala',
  
  // Elixir
  'elixir': 'ex',
  'ex': 'ex',
  
  // Haskell
  'haskell': 'hs',
  'hs': 'hs',
  
  // Clojure
  'clojure': 'clj',
  'clj': 'clj',
  
  // Erlang
  'erlang': 'erl',
  'erl': 'erl',
  
  // Perl
  'perl': 'pl',
  'pl': 'pl',
  
  // Makefile
  'makefile': 'makefile',
  'make': 'makefile',
  
  // GraphQL
  'graphql': 'graphql',
  'gql': 'graphql',
  
  // Prisma
  'prisma': 'prisma',
  
  // Solidity
  'solidity': 'sol',
  'sol': 'sol',
};

/**
 * 获取语言对应的文件名（用于图标）
 */
function getFileNameForLanguage(lang: string): string {
  const normalizedLang = lang.toLowerCase();
  const extension = LANGUAGE_TO_EXTENSION[normalizedLang] || normalizedLang;
  return `file.${extension}`;
}

/**
 * 渲染单个语言图标
 */
function renderLanguageIcon(container: Element, lang: string, size: number = 16): void {
  try {
    const fileName = getFileNameForLanguage(lang);
    console.log(`[CodeLanguageIcons] Rendering icon for ${lang} -> ${fileName}`);
    
    const iconElement = createElement(FileIcon, {
      fileName,
      width: size,
      height: size,
    });
    
    const root = createRoot(container);
    root.render(iconElement);
    console.log(`[CodeLanguageIcons] Icon rendered successfully for ${lang}`);
  } catch (error) {
    console.error(`[CodeLanguageIcons] Failed to render icon for ${lang}:`, error);
  }
}

/**
 * 初始化代码块语言图标
 * 在 DOM 加载后调用，为所有代码块添加图标
 */
export function initCodeLanguageIcons(): void {
  console.log('[CodeLanguageIcons] Initializing code language icons...');
  
  // 查找所有需要添加图标的元素
  const iconPlaceholders = document.querySelectorAll('.code-language-icon[data-lang]');
  console.log(`[CodeLanguageIcons] Found ${iconPlaceholders.length} icon placeholders`);
  
  iconPlaceholders.forEach((placeholder, index) => {
    const lang = placeholder.getAttribute('data-lang');
    if (!lang || placeholder.hasAttribute('data-icon-rendered')) {
      console.log(`[CodeLanguageIcons] Skipping placeholder ${index}: lang=${lang}, already rendered=${placeholder.hasAttribute('data-icon-rendered')}`);
      return;
    }
    
    console.log(`[CodeLanguageIcons] Rendering icon ${index} for language: ${lang}`);
    renderLanguageIcon(placeholder, lang, 16);
    placeholder.setAttribute('data-icon-rendered', 'true');
  });
  
  console.log('[CodeLanguageIcons] Initialization complete');
}

/**
 * 监听 DOM 变化，自动为新添加的代码块添加图标
 */
export function observeCodeBlocks(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // 检查是否是代码块或包含代码块
            const iconPlaceholders = element.classList.contains('code-language-icon')
              ? [element]
              : Array.from(element.querySelectorAll('.code-language-icon[data-lang]'));
            
            iconPlaceholders.forEach((placeholder) => {
              const lang = placeholder.getAttribute('data-lang');
              if (!lang || placeholder.hasAttribute('data-icon-rendered')) return;
              
              try {
                renderLanguageIcon(placeholder, lang, 16);
                placeholder.setAttribute('data-icon-rendered', 'true');
              } catch (error) {
                console.error(`Failed to render icon for language: ${lang}`, error);
              }
            });
          }
        });
      }
    }
  });
  
  // 观察整个文档的变化
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
