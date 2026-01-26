# Google App Engine Deployment Guide

## Setup Steps

### 1. Install Google Cloud SDK
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2. Initialize and authenticate
```bash
gcloud init
gcloud auth application-default login
```

### 3. Build your Angular app
```bash
npm run build:prod
```

### 4. Deploy to App Engine
```bash
gcloud app deploy
```

## Configuration Details

### app.yaml
- **Runtime**: Node.js 22
- **Environment**: Standard
- **Static files**: Handled directly for assets (.js, .css, images, fonts)
- **Dynamic routes**: Handled by Express server for SPA routing

### server.js
- Serves the built Angular application from `dist/triskeltrails/browser`
- Implements SPA routing - all non-file routes return `index.html`
- Listens on the `PORT` environment variable (default: 8080)

### Build Configuration
- `npm run build:prod` - Production build with optimization
- Output directory: `dist/triskeltrails/browser`

## Important Notes

1. **Build first**: Always run `npm run build:prod` before deploying
2. **Project ID**: Set your Google Cloud project ID in gcloud config
3. **First deployment**: First deployment may take 5-10 minutes
4. **Check logs**: View deployment logs with `gcloud app logs read`
5. **View app**: Access your app at `https://PROJECT_ID.appspot.com`

## Troubleshooting

- **Port issues**: App Engine automatically assigns the PORT environment variable
- **Static files**: Ensure dist/ is built before deploying
- **SPA routing**: All routes that don't match files will serve index.html
- **Environment variables**: Add more in app.yaml under `env_variables`

## Deploy Commands Reference
```bash
# Build production
npm run build:prod

# Deploy
gcloud app deploy

# View logs in real-time
gcloud app logs read --limit 50

# Open app in browser
gcloud app browse

# View app status
gcloud app describe
```
