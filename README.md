# JRX License Server

A Node.js-based license validation API for JRXViewer.

## Features

- License key registration and verification
- MongoDB Atlas integration
- REST API endpoints

## API Endpoints

- `GET /api/check?key=XXXX&mac=XX:XX`
- `POST /api/register?key=JRX-JRXVIEWER-D15528UR&mac=AA:BB:CC:DD:EE:FF`

## Setup

```bash
npm install
node server.js
```

## Deploy to Render -> Railway

https://jrx-license-server.onrender.com/api/check?key=JRX-GOWIX-UT7HO3CY&mac=00:11:22:33:44:55
