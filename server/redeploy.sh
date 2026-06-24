echo "=== 停止并删除旧容器 ==="
docker compose down

echo "=== 重新构建镜像并启动 ==="
docker compose up -d --build

echo "=== 检查容器状态 ==="
docker compose ps

echo "=== 检查网络连接 ==="
docker network inspect mongo | grep -A 5 "Containers"

echo "=== 最近日志 ==="
docker compose logs --tail=10