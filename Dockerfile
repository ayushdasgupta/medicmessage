FROM node:22-alpine

WORKDIR /app

# Install necessary packages (for nodemailer & TLS support)

COPY package.json ./
RUN npm install

COPY . .

# Run the worker
CMD ["npm", "run","start"]
