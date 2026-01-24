#!/bin/bash

# Tabs 功能测试脚本

echo "🧪 Tabs 功能测试"
echo "================"
echo ""

echo "1️⃣ TypeScript 类型检查..."
bun run typecheck
if [ $? -eq 0 ]; then
  echo "✅ 类型检查通过"
else
  echo "❌ 类型检查失败"
  exit 1
fi

echo ""
echo "2️⃣ 构建客户端..."
bun run build:client
if [ $? -eq 0 ]; then
  echo "✅ 构建成功"
else
  echo "❌ 构建失败"
  exit 1
fi

echo ""
echo "✅ 所有自动化测试通过！"
echo ""
echo "📝 手动测试清单："
echo "  1. 启动开发服务器：bun run dev"
echo "  2. 打开浏览器：http://localhost:3000"
echo "  3. 测试场景："
echo "     - 点击 Sidebar 中的文件，检查是否打开标签页"
echo "     - 点击标签页，检查是否切换文件"
echo "     - 点击关闭按钮，检查是否关闭标签页"
echo "     - 右键标签页，检查右键菜单"
echo "     - 拖拽标签页，检查排序功能"
echo "     - 固定标签页，检查固定功能"
echo "     - 打开超过 10 个标签页，检查 LRU"
echo "     - 刷新页面，检查持久化"
echo "     - 使用 Cmd+W 关闭标签页"
echo "     - 使用 Cmd+Shift+T 重新打开"
echo ""
echo "🎉 准备就绪！"
