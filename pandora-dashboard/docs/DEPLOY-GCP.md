# Deploying Pandora Dashboard on Google Cloud Platform

This guide uses **Google Compute Engine** (a virtual machine) because it lets SQLite work
with persistent storage — no external database needed.

---

## Prerequisites

- A Google account
- A credit card for GCP (free tier covers this for 90 days / $300 credit)

---

## Step 1: Create a GCP Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it `pandora-dashboard` → **Create**
4. Make sure your new project is selected in the dropdown

---

## Step 2: Create a Virtual Machine

1. In the left sidebar: **Compute Engine** → **VM instances**
   - If prompted, click **Enable** to turn on the Compute Engine API (takes ~1 min)
2. Click **Create Instance**
3. Configure it:

| Setting | Value |
|---------|-------|
| Name | `pandora-vm` |
| Region | Pick one close to you (e.g., `us-central1`) |
| Zone | Any (e.g., `us-central1-a`) |
| Machine type | `e2-small` (2 vCPU, 2 GB RAM — enough for this) |
| Boot disk | Click **Change** → **Ubuntu 22.04 LTS** → Size: **20 GB** → **Select** |
| Firewall | Check **Allow HTTP traffic** AND **Allow HTTPS traffic** |

4. Click **Create** and wait ~30 seconds

---

## Step 3: Open Port 3000

1. In the left sidebar: **VPC Network** → **Firewall**
2. Click **Create Firewall Rule**
3. Fill in:

| Setting | Value |
|---------|-------|
| Name | `allow-3000` |
| Targets | All instances in the network |
| Source IP ranges | `0.0.0.0/0` |
| Protocols and ports | Check **TCP** → enter `3000` |

4. Click **Create**

---

## Step 4: Connect to Your VM

1. Go back to **Compute Engine** → **VM instances**
2. Click the **SSH** button next to your VM (opens a terminal in the browser)

---

## Step 5: Install Node.js on the VM

Run these commands one by one in the SSH terminal:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

You should see Node v20.x and npm 10.x.

---

## Step 6: Install Git and Clone Your Repo

```bash
# Install git
sudo apt install -y git

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/YOUR_USERNAME/Pandora-Dashboard.git

# Go into the project
cd Pandora-Dashboard/pandora-dashboard
```

> **If your repo is private**, you'll need a personal access token.
> Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Generate.
> Then clone with: `git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/Pandora-Dashboard.git`

---

## Step 7: Set Up the App

```bash
# Install dependencies
npm install

# Create the environment file
cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"
JWT_SECRET="sciglob1sciglob2sciglob3sciglob4"
EOF

# Generate Prisma client
npx prisma generate

# Create the database and tables
npx prisma db push

# Seed the database with your data
npx tsx prisma/seed/seed.ts
```

You should see "Seed complete!" at the end.

---

## Step 8: Build and Test

```bash
# Build the production app
npm run build

# Test it (press Ctrl+C to stop after confirming it works)
npm start
```

Open a new browser tab and go to: `http://YOUR_VM_EXTERNAL_IP:3000`

> Find your VM's external IP on the **VM instances** page in GCP console.

You should see the login page.

---

## Step 9: Keep It Running with PM2

Right now, the app stops when you close the SSH window. PM2 keeps it running forever:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the app with PM2
pm2 start npm --name "pandora" -- start

# Make PM2 restart the app if the VM reboots
pm2 startup
# (copy and run the command it prints)

pm2 save
```

### Useful PM2 Commands

```bash
pm2 status          # Check if the app is running
pm2 logs pandora    # View app logs
pm2 restart pandora # Restart the app
pm2 stop pandora    # Stop the app
```

---

## Step 10: Set Up a Domain Name (Optional)

If you have a domain (e.g., `pandora.yourcompany.com`):

1. Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
2. Add an **A record**:
   - Host: `pandora` (or `@` for root domain)
   - Value: Your VM's external IP
   - TTL: 300

---

## Step 11: Add HTTPS with Nginx (Optional but Recommended)

```bash
# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/pandora << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

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
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

If you have a domain, add HTTPS:

```bash
sudo certbot --nginx -d YOUR_DOMAIN
```

After this, your app is accessible on port 80 (HTTP) and 443 (HTTPS) instead of 3000.

---

## Updating the App Later

When you push new code to GitHub:

```bash
# SSH into your VM, then:
cd Pandora-Dashboard/pandora-dashboard
git pull
npm install
npm run build
pm2 restart pandora
```

---

## Cost Estimate

| Resource | Monthly Cost |
|----------|-------------|
| e2-small VM | ~$14/month (or free with $300 trial credit) |
| 20 GB disk | ~$1/month |
| **Total** | **~$15/month** |

> GCP gives $300 free credit for 90 days to new accounts.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't reach the app | Check firewall rule for port 3000 exists |
| App crashes | Run `pm2 logs pandora` to see the error |
| Database is empty | Run `npx prisma db push && npx tsx prisma/seed/seed.ts` |
| Permission denied | Add `sudo` before the command |
| npm install fails | Run `sudo apt install -y build-essential` then retry |
