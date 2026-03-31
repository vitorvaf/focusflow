# Stage 1: build renderer with Vite
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build:renderer

# Stage 2: serve with Nginx
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist-renderer /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
