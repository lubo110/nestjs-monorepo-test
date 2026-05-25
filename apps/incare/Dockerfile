# =============================
# 1. Builder
# =============================
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

# 先复制依赖描述（利用缓存）
COPY package.json pnpm-lock.yaml ./
COPY nest-cli.json tsconfig*.json ./

RUN pnpm install --frozen-lockfile

# 再复制整个 monorepo
COPY . .

# 只 build 当前 app
RUN pnpm nest build incare


# =============================
# 2. Runner
# =============================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

# 生产依赖
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

# 只复制当前 app dist
COPY --from=builder /app/dist/apps/api-server ./dist

CMD ["node", "dist/main.js"]