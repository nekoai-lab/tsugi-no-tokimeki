# Cloud Scheduler Setup for LINE Notifications

## Overview
このドキュメントでは、Google Cloud Schedulerを使用して、毎日定時にLINE通知を送信するための設定方法を説明します。

## 通知スケジュール

| 時刻 | API | 内容 |
|------|-----|------|
| 朝8:00 JST | `/api/morning-notification` | 今日のルート＋直近の目撃情報 |
| 夕方18:00 JST | `/api/evening-notification` | 今日の目撃情報まとめ |

## Prerequisites
- Google Cloud Project with Cloud Scheduler API enabled
- Deployed application URL (Cloud Run)
- `CRON_SECRET` environment variable set

## Setup Steps

### 1. Enable Cloud Scheduler API
```bash
gcloud services enable cloudscheduler.googleapis.com
```

### 2. Create a Secret for Authentication
```bash
# Generate a random secret
export CRON_SECRET=$(openssl rand -base64 32)

# Add to Secret Manager (recommended)
echo -n "$CRON_SECRET" | gcloud secrets create cron-secret --data-file=-

# Set in Cloud Run environment
gcloud run services update tsugi-no-tokimeki \
  --update-env-vars="CRON_SECRET=$CRON_SECRET" \
  --region=asia-northeast1
```

### 3. Create Cloud Scheduler Jobs

#### 朝8時の通知（ルート＋目撃情報）
```bash
export APP_URL="https://tsugi-no-tokimeki-265901745615.asia-northeast1.run.app"

gcloud scheduler jobs create http morning-notification \
  --schedule="0 8 * * *" \
  --time-zone="Asia/Tokyo" \
  --uri="${APP_URL}/api/morning-notification" \
  --http-method=POST \
  --headers="Content-Type=application/json,Authorization=Bearer ${CRON_SECRET}" \
  --location="asia-northeast1" \
  --description="朝8時の統合通知（ルート生成＋目撃情報）"
```

#### 夕方18時の通知（まとめ）
```bash
gcloud scheduler jobs create http evening-notification \
  --schedule="0 18 * * *" \
  --time-zone="Asia/Tokyo" \
  --uri="${APP_URL}/api/evening-notification" \
  --http-method=POST \
  --headers="Content-Type=application/json,Authorization=Bearer ${CRON_SECRET}" \
  --location="asia-northeast1" \
  --description="夕方18時のまとめ通知"
```

### 4. (Optional) Delete Old Jobs
旧形式のジョブがある場合は削除：
```bash
# 旧: 朝9時のルート生成ジョブ
gcloud scheduler jobs delete daily-route-generation --location="asia-northeast1" --quiet

# 旧: その他不要なジョブ
gcloud scheduler jobs list --location="asia-northeast1"
```

### 5. Test Jobs Manually
```bash
# 朝の通知をテスト
gcloud scheduler jobs run morning-notification --location="asia-northeast1"

# 夕方の通知をテスト
gcloud scheduler jobs run evening-notification --location="asia-northeast1"
```

## Schedule Format (Cron)
```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6) (Sunday=0)
│ │ │ │ │
* * * * *
```

- `0 8 * * *` = 毎日8:00 JST
- `0 18 * * *` = 毎日18:00 JST

## Monitoring

### View Job Status
```bash
gcloud scheduler jobs list --location="asia-northeast1"
```

### View Execution History
```bash
gcloud scheduler jobs describe morning-notification --location="asia-northeast1"
gcloud scheduler jobs describe evening-notification --location="asia-northeast1"
```

### View Logs
```bash
# Cloud Loggingで確認
gcloud logging read "resource.type=cloud_scheduler_job" --limit=20
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CRON_SECRET` | Scheduler認証トークン | Yes |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API | Yes |
| `GOOGLE_CLOUD_PROJECT` | GCPプロジェクトID | Yes |
| `NEXT_PUBLIC_APP_URL` | アプリURL | Yes |

## User Settings

ユーザーは設定画面から以下を選択可能：
- **朝の通知（8:00）**: ON/OFF
- **夕方の通知（18:00）**: ON/OFF
- **通知エリア**: 設定中のエリア / 東京全域

設定はFirestoreの`notificationPreferences`に保存：
```json
{
  "enabled": true,
  "areas": ["渋谷", "原宿"],
  "morningNotification": true,
  "eveningNotification": false
}
```

## Troubleshooting

### 401 Unauthorized
- `CRON_SECRET`がCloud RunとSchedulerで一致しているか確認
- Authorization headerが正しく設定されているか確認

### 通知が届かない
1. ユーザーの`lineUserId`が設定されているか
2. `notificationPreferences.enabled`がtrueか
3. `morningNotification`/`eveningNotification`がtrueか
4. LINE Channel Access Tokenが有効か

### ルートが生成されない
1. ユーザーの`areas`, `startTime`, `endTime`が設定されているか
2. Vertex AI APIの権限があるか
3. APIの呼び出しログを確認

## Migration from Old System

旧形式（4時間帯選択）から新形式（2トグル）への移行：
- 旧`timeSlots`に`morning`/`afternoon`が含まれていれば → `morningNotification: true`
- 旧`timeSlots`に`evening`/`night`が含まれていれば → `eveningNotification: true`

この移行は設定画面を開いた際に自動的に行われます。
