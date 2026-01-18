# Docker Setup Guide

This document provides instructions for running the Attendance Management System using Docker.

## Prerequisites

- Docker Desktop installed and running (https://www.docker.com/products/docker-desktop)
- Docker Compose installed (comes with Docker Desktop)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Create Environment File

Copy the example environment file and update values as needed:

```bash
cp .env.example .env
```

Edit `.env` file with your desired configuration:

```env
MONGO_USER=admin
MONGO_PASSWORD=password123
MONGO_DB=attendance_db
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

### 3. Build and Start Services

Run all services with Docker Compose:

```bash
docker-compose up -d
```

This will:
- Build the server Docker image
- Build the client Docker image
- Download and start MongoDB
- Start all three services (MongoDB, Server, Client)

### 4. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

## Common Commands

### View Running Services

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongodb
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove All Data

```bash
docker-compose down -v
```

### Rebuild Images

```bash
docker-compose up -d --build
```

### Restart a Service

```bash
docker-compose restart server
# or
docker-compose restart client
# or
docker-compose restart mongodb
```

## Individual Docker Images

### Build Server Image Only

```bash
docker build -t attendance-server:latest ./server
```

### Build Client Image Only

```bash
docker build -t attendance-client:latest ./client
```

### Run Server Image

```bash
docker run -p 5000:5000 \
  -e MONGO_URI="mongodb://admin:password123@localhost:27017/attendance_db?authSource=admin" \
  attendance-server:latest
```

### Run Client Image

```bash
docker run -p 80:80 attendance-client:latest
```

## Production Deployment

### Using Docker Hub

1. **Build and Tag Images**

```bash
docker build -t yourusername/attendance-server:1.0.0 ./server
docker build -t yourusername/attendance-client:1.0.0 ./client
```

2. **Push to Docker Hub**

```bash
docker push yourusername/attendance-server:1.0.0
docker push yourusername/attendance-client:1.0.0
```

3. **Pull and Run on Production Server**

```bash
docker pull yourusername/attendance-server:1.0.0
docker pull yourusername/attendance-client:1.0.0
docker-compose up -d
```

### Using Private Registry

For AWS ECR, Azure ACR, or other registries, follow your provider's specific guidelines.

## Troubleshooting

### Port Already in Use

If port 80, 5000, or 27017 is already in use, modify the ports in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"      # Changed from 80:80
  - "5001:5000"    # Changed from 5000:5000
```

### MongoDB Connection Error

Ensure MongoDB is running and healthy:

```bash
docker-compose logs mongodb
```

Check the connection string in `.env` matches the service name in `docker-compose.yml`.

### Container Exit Immediately

Check logs for errors:

```bash
docker-compose logs -f
```

### Build Issues

Clear Docker cache and rebuild:

```bash
docker system prune -a
docker-compose up -d --build
```

## Security Notes

1. **Change Default Credentials**: Update `MONGO_PASSWORD` and `JWT_SECRET` in `.env`
2. **Use HTTPS in Production**: Configure a reverse proxy (Nginx, Traefik) with SSL certificates
3. **Environment Variables**: Never commit `.env` file to version control
4. **Update Base Images**: Regularly update Node and MongoDB base images for security patches

## Architecture

```
┌─────────────────────────────────────────┐
│         Attendance Management            │
├─────────────────────────────────────────┤
│ nginx (Client - Port 80)                │
│ - Serves React SPA                      │
│ - Proxies /api to backend               │
├─────────────────────────────────────────┤
│ Node.js Server (Port 5000)              │
│ - Express API                           │
│ - JWT Authentication                    │
│ - File uploads                          │
├─────────────────────────────────────────┤
│ MongoDB (Port 27017)                    │
│ - User data                             │
│ - Attendance records                    │
│ - Audit logs                            │
└─────────────────────────────────────────┘
```

## Performance Optimization

### Reduce Image Size

The current setup uses:
- `node:18-alpine` - Small Node.js image
- `nginx:alpine` - Lightweight web server
- Multi-stage builds - Optimizes final image size

### Caching

- Static assets are cached for 1 year
- Docker layer caching for faster rebuilds
- MongoDB data persists in volumes

## Support

For issues or questions, refer to:
- Docker Documentation: https://docs.docker.com/
- Node.js in Docker: https://hub.docker.com/_/node
- MongoDB in Docker: https://hub.docker.com/_/mongo
- Nginx Documentation: https://nginx.org/en/docs/

---

**Last Updated**: January 2026
