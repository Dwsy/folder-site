#!/usr/bin/env bash

# Folder-Site 诊断脚本

echo "🔍 Folder-Site 诊断工具"
echo "======================="
echo ""

# 检查端口占用
echo "📡 检查端口占用情况..."
echo ""

for port in 3008 3010 3011; do
  if lsof -i :$port | grep -q LISTEN; then
    echo "✅ 端口 $port 正在使用"
    lsof -i :$port | grep LISTEN
  else
    echo "❌ 端口 $port 未使用"
  fi
  echo ""
done

# 检查 tmux 会话
echo "🖥️  检查 tmux 会话..."
echo ""
bun ~/.pi/agent/skills/tmux/lib.ts list | grep folder-site || echo "❌ 没有 folder-site 相关的 tmux 会话"
echo ""

# 检查配置
echo "⚙️  检查配置..."
echo ""

if [ -f ".env" ]; then
  echo "✅ 找到 .env 文件"
  cat .env
else
  echo "❌ 未找到 .env 文件"
fi
echo ""

# 检查 API 健康状态
echo "🏥 检查 API 健康状态..."
echo ""

for port in 3008 3010 3011; do
  echo "测试端口 $port..."
  if curl -s -f "http://localhost:$port/api/health" > /dev/null 2>&1; then
    echo "✅ http://localhost:$port/api/health 正常"
    curl -s "http://localhost:$port/api/health" | jq -r '.data.status // "OK"'
  else
    echo "❌ http://localhost:$port/api/health 无响应"
  fi
  echo ""
done

# 测试文件树 API
echo "📁 测试文件树 API..."
echo ""

for port in 3008 3010 3011; do
  echo "测试端口 $port..."
  if curl -s -f "http://localhost:$port/api/files/tree/list" > /dev/null 2>&1; then
    echo "✅ http://localhost:$port/api/files/tree/list 正常"
    curl -s "http://localhost:$port/api/files/tree/list" | jq -r 'if .success then "返回 \(.data.tree | length) 个文件/文件夹" else "错误: \(.error.message)" end'
  else
    echo "❌ http://localhost:$port/api/files/tree/list 无响应"
  fi
  echo ""
done

# 建议
echo "💡 建议..."
echo ""
echo "1. 确保后端服务器正在运行："
echo "   bun run dev"
echo ""
echo "2. 如果需要开发前端，同时运行："
echo "   bun run dev:client"
echo ""
echo "3. 清理旧的 tmux 会话："
echo "   bun ~/.pi/agent/skills/tmux/lib.ts cleanup 1"
echo ""
echo "4. 如果浏览器显示错误端口，清除浏览器缓存或使用无痕模式"
echo ""
