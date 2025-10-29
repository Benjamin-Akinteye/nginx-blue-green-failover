# Dockerfile
# Use a slim Node.js base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Install dependencies (Express)
RUN npm install express body-parser

# Copy the application source code
COPY server.js .

# Expose the application port (set by $PORT environment variable)
EXPOSE 3000

# Command to run the application
CMD [ "node", "server.js" ]