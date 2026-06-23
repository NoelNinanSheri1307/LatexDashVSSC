# VSSC LaTeX Analytics — Setup & Run Instructions

## Prerequisites

- **Python 3.8+** installed (needed only for the static file server)
- A modern web browser (Chrome, Firefox, Edge)

> No Flask, no pip packages, no backend dependencies are required for the dashboard.

---

## Running on Windows

### 1. Open a terminal (PowerShell or Command Prompt)

```powershell
cd C:\Users\VICTUS\LatexDash\frontend
```

### 2. Start a static file server

```powershell
python -m http.server 5001
```

### 3. Open the dashboard

```
http://localhost:5001
```

### 4. Stop the server

Press `Ctrl + C` in the terminal.

---

## Running on RHEL (Red Hat Enterprise Linux)

### 1. Verify Python is installed

```bash
python3 --version
```

If not installed:

```bash
sudo dnf install python3
```

### 2. Navigate to the frontend directory

```bash
cd /opt/latexdash/frontend    # or wherever you placed the project
```

### 3. Start a static file server

```bash
python3 -m http.server 5001
```

### 4. Open the dashboard

```
http://<server-ip>:5001
```

### 5. (Optional) Run as a background service

Using `nohup`:

```bash
cd /opt/latexdash/frontend
nohup python3 -m http.server 5001 > /tmp/latexdash.log 2>&1 &
```

Using `systemd` (create `/etc/systemd/system/latexdash.service`):

```ini
[Unit]
Description=VSSC LaTeX Analytics Dashboard
After=network.target

[Service]
User=your_user
WorkingDirectory=/opt/latexdash/frontend
ExecStart=/usr/bin/python3 -m http.server 5001
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable latexdash
sudo systemctl start latexdash
```

---

## Connecting to the Real Backend (Production)

When the real backend (with MongoDB, Redis, MySQL connections) is running:

1. Start the backend on port 5001 (as per `backend/app.py`)
2. Serve the frontend files through the backend or on a separate port
3. Update `API_BASE` in `frontend/static/app.js` if the backend runs on a different host/port

The frontend will automatically prefer live API data over the static JSON fallback.

---

## Firewall Notes (RHEL)

If the dashboard is not accessible from other machines:

```bash
sudo firewall-cmd --add-port=5001/tcp --permanent
sudo firewall-cmd --reload
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5001 already in use | Change the port number in the command |
| Charts not loading | Ensure internet access for Chart.js CDN, or download `chart.umd.min.js` into `frontend/static/` |
| Blank page | Check browser console (F12) for errors |
| Data not showing | Verify `frontend/static/data/*.json` files exist |
