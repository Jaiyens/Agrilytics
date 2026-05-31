FROM node:22-slim

WORKDIR /app

# Install deps (incl. dev deps needed to build the client)
COPY package*.json ./
RUN npm install

# Build the React client into dist/
COPY . .
RUN npm run build

# Cloud Run provides PORT; the server reads it.
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server/index.js"]
