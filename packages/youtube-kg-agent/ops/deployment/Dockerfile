FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig*.json ./
RUN npm run build
ENV NODE_ENV=production
CMD ["node", "dist/cli.js", "chat"]
