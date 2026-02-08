# Cloud Scheduler Setup for Daily Route Generation

## Overview
This document explains how to set up Google Cloud Scheduler to automatically generate routes for all users daily at 9 AM JST.

## Prerequisites
- Google Cloud Project with Cloud Scheduler API enabled
- Deployed application URL
- Service account with appropriate permissions

## Setup Steps

### 1. Enable Cloud Scheduler API
```bash
gcloud services enable cloudscheduler.googleapis.com
```

### 2. Create a Secret for Authentication (Optional but Recommended)
```bash
# Generate a random secret
export CRON_SECRET=$(openssl rand -base64 32)

# Add to Secret Manager
gcloud secrets create cron-secret --data-file=- <<< "$CRON_SECRET"

# Add to your .env.local and deployment environment
echo "CRON_SECRET=$CRON_SECRET" >> .env.local
```

### 3. Create Cloud Scheduler Job
```bash
# Set your app URL
export APP_URL="https://your-app-url.run.app"

# Create the scheduler job
gcloud scheduler jobs create http daily-route-generation \
  --schedule="0 9 * * *" \
  --time-zone="Asia/Tokyo" \
  --uri="${APP_URL}/api/generate-daily-routes" \
  --http-method=POST \
  --headers="Content-Type=application/json,Authorization=Bearer ${CRON_SECRET}" \
  --location="asia-northeast1"
```

### 4. Test the Job Manually
```bash
# Trigger the job manually to test
gcloud scheduler jobs run daily-route-generation --location="asia-northeast1"

# Check the logs
gcloud scheduler jobs describe daily-route-generation --location="asia-northeast1"
```

## Schedule Format
The cron schedule `0 9 * * *` means:
- Minute: 0
- Hour: 9
- Day of month: * (every day)
- Month: * (every month)
- Day of week: * (every day of week)

This runs at 9:00 AM JST every day.

## Monitoring
You can monitor the job execution in:
1. Google Cloud Console → Cloud Scheduler
2. Cloud Logging for detailed logs
3. The API response includes a summary of successful and failed route generations

## Environment Variables
Make sure to set these in your deployment environment:
- `CRON_SECRET`: Secret token for authenticating scheduler requests
- `NEXT_PUBLIC_APP_URL`: Your application URL (for internal API calls)

## Troubleshooting

### Job fails with 401 Unauthorized
- Check that `CRON_SECRET` is set correctly in both Cloud Scheduler and your app environment
- Verify the Authorization header is being sent correctly

### Routes not being generated
- Check Cloud Logging for detailed error messages
- Verify users have complete profile settings (areas, startTime, endTime)
- Test the endpoint manually using curl:
  ```bash
  curl -X POST "${APP_URL}/api/generate-daily-routes" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${CRON_SECRET}"
  ```

### Some users fail
- The API returns a detailed breakdown of successes and failures
- Check the response JSON for specific error messages per user
- Common issues: incomplete profiles, API quota limits

## Alternative: Vercel Cron (if deploying to Vercel)
If you're deploying to Vercel instead of Cloud Run, you can use Vercel Cron:

1. Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/generate-daily-routes",
    "schedule": "0 9 * * *"
  }]
}
```

2. The CRON_SECRET will be automatically set by Vercel
