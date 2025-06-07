# Use Node.js for building and serving React app
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the React app
RUN yarn build

# Install a simple static server
RUN yarn global add serve

# Expose port
EXPOSE 3000

# Serve the built app
CMD ["serve", "-s", "build", "-l", "3000"]