# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM docker.io/node:20 AS build-stage

WORKDIR /app

# Copy everything at once to minimize separate RUN steps
COPY . /app/

# Offline build - only one RUN command to minimize network operations
RUN npm ci --offline || npm install --no-network && npm run build

ARG VITE_API_URL=${VITE_API_URL}


# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM docker.io/nginx:1

COPY --from=build-stage /app/dist/ /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf
