# Deploying Pandora Dashboard with Docker

This guide deploys the app using **Docker Compose** with PostgreSQL — production-ready, portable, and reproducible.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed (includes Docker Compose)
- Git

---

## Quick Start (3 commands)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/Pandora-Dashboard.git
cd Pandora-Dashboard/pandora-dashboard

# 2. Set your JWT secret
export JWT_SECRET="$(openssl rand -base64 32)"

# 3. Build and start
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000) and log in.

**Default credentials:**

| Username | Password | Role |
|----------|----------|------|
| ashutosh.joshi | Ashu@123 | admin |
| omar.abuhassan | Omar@123 | admin |
| william.lo | William@123 | editor |

---

## What Gets Deployed

| Service | Image | Port |
|---------|-------|------|
| **app** | Custom Next.js build | 3000 |
| **db** | PostgreSQL 16 Alpine | 5432 |

On first start, the app container automatically:
1. Runs `prisma db push` to create all database tables
2. Runs the seed script to populate users, workspaces, boards, and cards

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-to-a-strong-random-secret` | **Change this.** Signs session cookies. |
| `DATABASE_URL` | Set automatically by Compose | PostgreSQL connection string |
| `POSTGRES_USER` | `pandora` | Database username |
| `POSTGRES_PASSWORD` | `pandora` | Database password |
| `POSTGRES_DB` | `pandora` | Database name |

### Using a `.env` File

Instead of exporting variables, create a `.env` file next to `docker-compose.yml`:

```bash
JWT_SECRET="your-strong-random-secret-here"
```

Docker Compose reads this automatically.

### Custom Database Credentials

Edit `docker-compose.yml` to change the PostgreSQL credentials:

```yaml
services:
  db:
    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
      POSTGRES_DB: mydatabase

  app:
    environment:
      DATABASE_URL: "postgresql://myuser:mypassword@db:5432/mydatabase?schema=public"
```

---

## Deploying on a Server

### Option A: Any Linux VPS (DigitalOcean, Linode, AWS EC2, etc.)

```bash
# SSH into your server
ssh user@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group to take effect

# Clone and deploy
git clone https://github.com/YOUR_USERNAME/Pandora-Dashboard.git
cd Pandora-Dashboard/pandora-dashboard

export JWT_SECRET="$(openssl rand -base64 32)"
docker compose up -d --build
```

### Option B: Google Cloud Platform (GCP)

1. Create a Compute Engine VM (e2-small, Ubuntu 22.04, 20 GB disk)
2. Open port 3000 in firewall (VPC Network > Firewall > Create rule, TCP:3000, source 0.0.0.0/0)
3. SSH in and follow Option A above

### Option C: AWS EC2

1. Launch an EC2 instance (t3.small, Ubuntu 22.04)
2. Configure Security Group: allow inbound TCP 3000
3. SSH in and follow Option A above

---

## Adding HTTPS with Nginx

For production, put Nginx in front as a reverse proxy with SSL:

```bash
# Install Nginx and Certbot on the host (not in Docker)
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/pandora << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/pandora /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Add SSL (requires a domain pointed at this server)
sudo certbot --nginx -d YOUR_DOMAIN
```

---

## Common Operations

### View Logs

```bash
# All services
docker compose logs -f

# Just the app
docker compose logs -f app

# Just the database
docker compose logs -f db
```

### Restart After Code Changes

```bash
git pull
docker compose up -d --build
```

### Stop Everything

```bash
docker compose down
```

### Stop and Delete All Data (database included)

```bash
docker compose down -v
```

### Access the Database Directly

```bash
docker compose exec db psql -U pandora -d pandora
```

### Re-seed the Database

```bash
docker compose exec app npx tsx prisma/seed/seed.ts
```

---

## Data Persistence

PostgreSQL data is stored in a Docker volume (`pgdata`). This survives container restarts and rebuilds. Data is only lost if you explicitly run `docker compose down -v`.

### Backup the Database

```bash
docker compose exec db pg_dump -U pandora pandora > backup_$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
cat backup_20260414.sql | docker compose exec -T db psql -U pandora pandora
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't reach the app | Check `docker compose ps` — both services should be `Up` |
| App exits on startup | Check `docker compose logs app` — likely a database connection issue |
| Database connection refused | The `db` service may not be healthy yet. Check `docker compose logs db` |
| Port 3000 already in use | Change the port mapping in `docker-compose.yml`: `"8080:3000"` |
| Seed fails | Check the app logs: `docker compose logs app` |
| Want to start fresh | Run `docker compose down -v` then `docker compose up -d --build` |

---

## Architecture

```
┌─────────────────────────────────┐
│           Browser               │
│     http://server:3000          │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│      Docker Compose             │
│                                 │
│  ┌──────────────────────────┐   │
│  │  app (Next.js)           │   │
│  │  Port 3000               │   │
│  │  - Server-side rendering │   │
│  │  - API routes            │   │
│  │  - JWT auth              │   │
│  └────────────┬─────────────┘   │
│               │                 │
│  ┌────────────▼─────────────┐   │
│  │  db (PostgreSQL 16)      │   │
│  │  Port 5432               │   │
│  │  Volume: pgdata          │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```
