# Tsugi no Tokimeki - 開発ロードマップ

> 次のトキメキを逃さないための行動判断エージェント

## 📊 実装状況

### Phase 1: MVP / プロトタイプ（現在）

| コンポーネント | 状態 | 備考 |
|--------------|------|------|
| Next.js (App Router) | ✅ 完了 | フロントエンド基盤 |
| Firebase Auth (匿名) | ✅ 完了 | 匿名ログイン |
| Firestore (posts/users) | ✅ 完了 | 基本データ構造 |
| オンボーディング UI | ✅ 完了 | 推しキャラ・エリア・空き時間設定 |
| 投稿機能 | ✅ 完了 | 目撃情報の投稿・閲覧 |
| カレンダー表示 | ✅ 完了 | 行ける候補日の表示 |
| 行動判断ロジック | ⚠️ モック | クライアント側でシミュレーション |

### Phase 2: バックエンド強化（TODO）

| コンポーネント | 状態 | 備考 |
|--------------|------|------|
| Next.js Route Handlers | ❌ 未実装 | API エンドポイント |
| Vertex AI (Gemini) 連携 | ❌ 未実装 | 本格的な行動判断AI |
| 転売対策 (posts_private) | ❌ 未実装 | 住所情報の分離管理 |
| suggestions コレクション | ❌ 未実装 | AI生成の行動提案保存 |

### Phase 3: v3 完全版（TODO）

| コンポーネント | 状態 | 備考 |
|--------------|------|------|
| Cloud Run デプロイ | ❌ 未実装 | 本番環境 |
| Cloud Scheduler | ❌ 未実装 | 定期実行（毎朝/毎時） |
| Event Matcher | ❌ 未実装 | 空き時間 × イベント突合 |
| user_event_matches | ❌ 未実装 | マッチング結果保存 |
| プッシュ通知 | ❌ 未実装 | FCM or LINE連携 |

---

## 🏗️ システムアーキテクチャ（v3 目標）

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser/PWA)                      │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │  Next.js UI     │  │  Firebase Auth SDK              │   │
│  └────────┬────────┘  └────────────────┬────────────────┘   │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            ▼                            ▼
┌───────────────────────────────────────────────────────────────┐
│                  Google Cloud / Firebase                       │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Server (Cloud Run)                           │ │
│  │  ┌─────────────────────┐  ┌────────────────────────────┐ │ │
│  │  │ Next.js Route       │  │ v3 Core Logic              │ │ │
│  │  │ Handlers (API)      │  │ - 行動判断ロジック         │ │ │
│  │  └─────────────────────┘  │ - Event Matcher            │ │ │
│  │                           └────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │  Firestore      │  │  Vertex AI      │  │ Cloud         │ │
│  │  - users        │  │  (Gemini)       │  │ Scheduler     │ │
│  │  - posts        │  │                 │  │               │ │
│  │  - store_events │  │                 │  │               │ │
│  │  - suggestions  │  │                 │  │               │ │
│  └─────────────────┘  └─────────────────┘  └───────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## 📁 Firestore コレクション設計

### 現在実装済み

```
artifacts/{appId}/
  ├── users/{uid}/
  │   └── profile/main     # ユーザー設定（favorites, area, availability）
  └── public/data/
      ├── posts/           # 投稿（目撃情報）
      └── store_events/    # 店舗イベント
```

### v3 で追加予定

```
artifacts/{appId}/
  ├── users/{uid}/
  │   ├── profile/main
  │   └── event_matches/   # 行ける候補日（NEW）
  └── public/data/
      ├── posts/
      ├── posts_private/   # 詳細住所（転売対策）（NEW）
      ├── store_events/
      └── suggestions/     # AI生成の行動提案（NEW）
```

---

## 🔧 開発環境

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番起動
npm start
```

### 環境変数（.env.local）

```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

---

## 📅 今後の TODO

### 短期（MVP完成）
- [ ] ローカルで動作確認
- [ ] UI/UX の微調整
- [ ] エラーハンドリング強化

### 中期（バックエンド）
- [ ] Route Handlers でAPI作成
- [ ] Vertex AI 連携
- [ ] 転売対策の実装

### 長期（v3完全版）
- [ ] Cloud Run デプロイ
- [ ] Cloud Scheduler 設定
- [ ] Event Matcher 実装
- [ ] プッシュ通知（LINE or FCM）

---

*Last Updated: 2026-01-25*


