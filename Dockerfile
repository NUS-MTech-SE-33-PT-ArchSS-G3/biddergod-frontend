ARG NODE_VERSION=23.4.0
FROM node:${NODE_VERSION}-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]