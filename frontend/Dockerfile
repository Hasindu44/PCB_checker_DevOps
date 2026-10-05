FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html postcss.config.js tailwind.config.js vite.config.js ./
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine AS runtime

ENV BACKEND_URL=http://backend:3000
ENV NGINX_ENVSUBST_FILTER=^BACKEND_URL$

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider --quiet http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
