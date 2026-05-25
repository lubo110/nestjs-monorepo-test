# =============================
# 1. Builder 阶段
# =============================
FROM node:20-alpine AS builder

WORKDIR /app

# 启用 pnpm
RUN corepack enable

# 复制依赖文件（利用缓存层）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY nest-cli.json tsconfig*.json ./

# 安装依赖（monorepo 必须）
RUN pnpm install --frozen-lockfile

# 复制整个 monorepo
COPY . .

# 构建所有 apps（你的需求）
RUN pnpm run build


# =============================
# 2. Runtime 阶段
# =============================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 启用 pnpm（如果 runtime 需要 pnpm 依赖）
RUN corepack enable

# 只安装生产依赖（workspace safe）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 拷贝构建产物
COPY --from=builder /app/dist ./dist

# 可选：如果你有静态资源
# COPY --from=builder /app/public ./public

# 不写死启动服务（交给 docker-compose command）
CMD ["node", "dist/apps/incare/main.js"]