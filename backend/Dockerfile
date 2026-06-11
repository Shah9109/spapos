FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client and Build
RUN npx prisma generate
RUN npm run build

EXPOSE 8000

CMD ["npm", "start"]
