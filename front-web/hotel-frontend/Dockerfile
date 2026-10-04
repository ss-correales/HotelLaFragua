FROM node:20-alpine

WORKDIR /app

COPY front-web/hotel-frontend/package.json ./package.json
COPY front-web/hotel-frontend/package-lock.json ./package-lock.json
RUN npm install

COPY front-web/hotel-frontend ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
