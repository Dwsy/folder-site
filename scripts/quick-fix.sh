#!/usr/bin/env bash

# 快速修复脚本

echo "🔧 Folder-Site 快速修复"
echo "======================="
echo ""

# 1. 清理旧会话
echo "1️⃣  清理旧的 tmux 会话..."
bun ~/.pi/agent/skills/tmux/lib.ts cleanup 1
echo ""

# 2. 检查端口
echo "2️⃣  检查端口占用..."
if lsof -i :3008 | grep -q LISTEN; then
  echo "⚠️  端口 3008 已被占用"
  echo "   正在使用的进程："
  lsof -i :3008 | grep LISTEN
  echo ""
  read -p "   是否杀死该进程？(y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    PID=$(lsof -ti :3008)
    kill -9 $PID
    echo "   ✅ 已杀死进程 $PID"
  fi
else
  echo "✅ 端口 3008 可用"
fi
echo ""

# 3. 启动服务器
echo "3️⃣  启动服务器..."
bun ~/.pi/agent/skills/tmux/lib.ts create folder-site "bun run dev" service
echo ""

# 4. 等待服务器启动
echo "4️⃣  等待服务器启动..."
sleep 5
echo ""

# 5. 测试 API
echo "5️⃣  测试 API..."
if curl -s -f "http://localhost:3008/api/health" > /dev/null 2>&1; then
  echo "✅ API 正常工作"
  echo ""
  echo "🎉 修复完成！"
  echo ""
  echo "📝 下一步："
  echo "   1. 在浏览器中访问: http://localhost:3008"
  echo "   2. 如果仍然有问题，清除浏览器缓存或使用无痕模式"
  echo "   3. 确保访问的是 3008 端口，不是 3010 端口"
  echo ""
  echo "📚 更多帮助："
  echo "   查看故障排除指南: docs/TROUBLESHOOTING_500_ERROR.md"
else
  echo "❌ API 无响应"
  echo ""
  echo "请检查服务器日志："
  echo "   bun ~/.pi/agent/skills/tmux/lib.ts list"
  echo "   bun ~/.pi/agent/skills/tmux/lib.ts capture <session-id>"
fi
echo ""
