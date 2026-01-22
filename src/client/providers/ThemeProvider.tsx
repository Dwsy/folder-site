/**
 * ThemeProvider 导出模块
 * 
 * 主题提供者组件的统一导出点
 * 实际实现位于 src/client/hooks/useTheme.tsx
 */

export {
  ThemeProvider,
  useTheme,
  useEffectiveTheme,
  useIsDark,
  useIsLight,
} from '../hooks/useTheme.js';