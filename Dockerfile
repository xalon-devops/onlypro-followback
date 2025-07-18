
FROM ghcr.io/browserless/chrome:latest
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "index.js"]
