# 💖 Tsugi no Tokimeki - 次のトキメキ

> **「次のトキメキを逃さないための、行動判断エージェント」**
>
> AI駆動型・リアルタイム目撃情報共有 & 行動提案アプリケーション

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)
![Cloud Run](https://img.shields.io/badge/Cloud%20Run-Deployed-4285F4?logo=googlecloud)
![LINE](https://img.shields.io/badge/LINE-Messaging%20API-00C300?logo=line)
![Vertex AI](https://img.shields.io/badge/Vertex%20AI-Gemini%202.5-4285F4?logo=googlecloud)

🔗 **デモ**: [https://tsugi-no-tokimeki-265901745615.asia-northeast1.run.app](https://tsugi-no-tokimeki-265901745615.asia-northeast1.run.app)

> ⚠️ **LINE内ブラウザで戻れない場合**: 外部ブラウザ（Chrome/Safari）で [こちら](https://tsugi-no-tokimeki-265901745615.asia-northeast1.run.app/onboarding?step=5) を開いて続行できます。

## 📖 プロジェクト概要

**Tsugi no Tokimeki** は、お気に入りのキャラグッズ（シール）の目撃情報をリアルタイムで共有し、AIがシールを見に行くスケジュールを立ててユーザーにLINEで提案するWebアプリケーションです。

- 📍 コミュニティからの目撃情報をリアルタイム収集
- 🤖 **Vertex AI (Gemini 2.5)** による行動判断・ルート提案 ✅
- ⏰ **Cloud Scheduler** で朝8時に「今日のおすすめルート＋目撃情報」、夕方18時に「今日の目撃まとめ」を自動通知 ✅
- 📅 ユーザーの空き時間 × エリア × 目撃情報のスマートマッチング
- 🔔 **LINE通知** でパーソナライズされたプッシュ通知 ✅

---

## 🎯 解決する課題

### 背景：平成女児ブームとシール入手困難

2025年、**平成女児ブーム**の影響でシール帳文化が再来。しかし需要の急増により：

- 🏃 入荷情報が流れると店舗に人が殺到
- 📱 SNSに張り付いて情報収集する日々
- 😰 店舗側も問い合わせ対応に追われる
- 💸 転売による価格高騰

### 私たちの解決策

**「シールを探しに行く1日を楽しむ」** ためのエージェントを開発。

- ✅ AIが最適な行動スケジュールを提案
- ✅ 自分の興味（キャラ・エリア）に絞った情報だけを表示
- ✅ LINE通知で必要な情報だけをプッシュ

---

## 👥 対象ユーザー

- シール帳作りを楽しみたい人
- 情報収集や行動判断が苦手な人
- 平成女児文化・キャラクターグッズ界隈のファン

---

## ✨ 主な機能

| 機能 | 説明 | 状態 |
|------|------|------|
| **オンボーディング** | キャラ・エリア・ショップ・シール種類・時間指定・LINE通知の設定（7ステップ） | ✅ 実装済み |
| **投稿機能** | 目撃情報（見た/買えた/売り切れ）の投稿 | ✅ 実装済み |
| **フィード表示** | コミュニティ投稿のリアルタイム表示・フィルター機能・いいね機能 | ✅ 実装済み |
| **行動判断 AI** | 今動くべきかの判断と根拠表示（For You画面） | ✅ 実装済み |
| **Vertex AI 統合** | Gemini 2.5 Flash による本格的なAI推論 | ✅ 実装済み |
| **朝の統合通知** | 毎朝8時に「今日のおすすめルート＋直近の目撃情報」をLINEで自動通知 | ✅ 実装済み |
| **夕方のまとめ通知** | 夕方18時に「今日の目撃情報まとめ」をLINEで自動通知 | ✅ 実装済み |
| **ルート提案 AI** | AIがショップ巡回スケジュールを作成 | ✅ 実装済み |
| **ルート再生成** | AIとチャット形式でルートを修正・再提案 | ✅ 実装済み |
| **カレンダー** | ルート提案の一覧表示・詳細確認・確定 | ✅ 実装済み |
| **シールアルバム** | シール帳の写真を投稿・共有 | ✅ 実装済み |
| **プロフィール編集** | ユーザー設定の編集機能（表示名・ハンドル名・LINE連携） | ✅ 実装済み |
| **通知設定** | 朝の通知・夕方の通知を個別にオン/オフ設定 | ✅ 実装済み |
| **LINE連携** | LIFF ログイン + Messaging API + Flex Message でリッチ通知 | ✅ 実装済み |
| **発見確率算出** | 目撃情報をリアルタイム分析し、パーソナライズされた発見確率を算出 | ✅ 実装済み |

---

## 🎲 発見確率アルゴリズム

### 概要

ユーザーがルートを巡回した際に、お気に入りのシールを発見できる確率を算出します。
過去の目撃情報（投稿データ）をリアルタイム分析し、ユーザーごとにパーソナライズされた確率を表示します。

### 設計思想

| 設計ポイント | 説明 |
|-------------|------|
| **時間減衰モデル** | 目撃情報は鮮度が命。当日の情報は価値が高く、時間経過とともに減衰 |
| **パーソナライズ** | ユーザーのお気に入りキャラクターを考慮した確率補正 |
| **期待値コントロール** | 30〜85%の範囲に制限し、ユーザー体験を最適化 |
| **ポジティブ設計** | 下限30%で「運が良ければ見つかるかも」という期待を維持 |

### アルゴリズム詳細

#### 1. 基準確率
```
基準確率 = 30%
```
何も情報がない場合でも、一定の期待を持たせる設計。

#### 2. 目撃情報（seen）による加算

| 鮮度 | 加算値 | 理由 |
|-----|--------|------|
| **当日（0日）** | +30〜40% | 今日目撃された → まだある可能性大！ |
| **1日前** | +20〜28% | 昨日目撃 → 残っている可能性あり |
| **2日前** | +8〜12% | 少し古いが参考になる |
| **3〜7日前** | +5% | 参考程度 |

#### 3. 売り切れ情報（soldout）による減算

| 鮮度 | 減算値 | 理由 |
|-----|--------|------|
| **当日（0日）** | -20〜25% | 今日売り切れ → 厳しい |
| **1日前** | -10〜15% | 昨日売り切れ → 補充されているかも |
| **2〜3日前** | -5% | 補充済みの可能性が高い |

#### 4. パーソナライズ補正

| 条件 | 補正値 |
|-----|--------|
| お気に入りキャラの目撃情報あり | +10〜20% |
| 訪問予定店舗での直近目撃 | +10% |
| 店舗数ボーナス（多く回る） | +3%/店舗（最大+15%） |
| 曜日ボーナス（月〜水：入荷日） | +5% |

#### 5. 確率レベル表示

| 確率範囲 | レベル | 表示 | 意味 |
|---------|-------|------|------|
| 70〜85% | Hot | 🔥 激アツ！ | 高確率で見つかる |
| 55〜69% | High | ✨ 期待大 | かなり期待できる |
| 42〜54% | Medium | 👀 まあまあ | 運次第 |
| 30〜41% | Low | 🍀 運試し | 見つかればラッキー |

### 計算式（疑似コード）

```
確率 = 30（基準）
     + 目撃ボーナス（鮮度に応じて0〜40%）
     - 売り切れペナルティ（鮮度に応じて0〜25%）
     + お気に入りボーナス（0〜20%）
     + 店舗数ボーナス（0〜15%）
     + 曜日ボーナス（0〜5%）

最終確率 = clamp(確率, 30%, 85%)
```

### 今後のロードマップ

| フェーズ | 内容 |
|---------|------|
| **Phase 1（現在）** | ルールベース + リアルタイム統計分析 |
| **Phase 2（データ蓄積期）** | 「購入できた！」フィードバック機能追加、成功データ収集 |
| **Phase 3（機械学習導入）** | 成功パターンから重みを自動学習、店舗×曜日×キャラの入荷予測 |

---

## 🛠 システムアーキテクチャ

本アプリケーションは、Next.js (App Router) をベースに構築され、Cloud Run 上での動作を想定しています。

```mermaid
graph TD
    User((ユーザー))
    
    subgraph "Client (Browser/PWA)"
        UI[Next.js Frontend<br/>React UI]
        AuthSDK[Firebase Auth SDK]
        LIFF[LINE LIFF SDK]
    end
    
    subgraph "Google Cloud Platform"
        subgraph "Cloud Run"
            API[Next.js App<br/>Frontend + API Routes]
        end
        
        subgraph "Firebase"
            Auth[Firebase Auth<br/>匿名認証]
            Firestore[(Firestore<br/>posts / users / events)]
        end
        
        subgraph "AI Layer ✅"
            VertexAI[Vertex AI<br/>Gemini 2.5]
            Scheduler[Cloud Scheduler<br/>朝8時: ルート+目撃<br/>夕18時: まとめ]
        end
    end
    
    subgraph "External Services ✅"
        LINE[LINE Platform<br/>LIFF認証 + Messaging API]
    end
    
    User <--> UI
    UI --> AuthSDK
    AuthSDK <--> Auth
    UI --> LIFF
    LIFF <-.->|"認証（任意）"| LINE
    UI <--> API
    API <--> Firestore
    Scheduler -.->|"定期トリガー"| API
    API -.->|"推論リクエスト"| VertexAI
    API -.->|"通知送信"| LINE
    LINE -.->|"📱 プッシュ通知"| User
```

### アーキテクチャの特徴

- **Serverless**: Cloud Run によるフルマネージドなコンテナ実行
- **Realtime**: Firestore の `onSnapshot` によるリアルタイムデータ同期
- **CI/CD**: GitHub + Cloud Build による自動デプロイ
- **型安全**: TypeScript による厳格な型定義

---

## 🔄 ユーザーフロー

### 投稿 → 判断 → 通知 のシーケンス

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UI as Browser (React)
    participant Run as Cloud Run
    participant FS as Firestore
    participant AI as Vertex AI
    participant LINE as LINE API

    Note over User, UI: 目撃情報を投稿
    User->>UI: 投稿ボタン押下
    UI->>Run: POST /api (via Firestore SDK)
    Run->>FS: addDoc(posts)
    FS-->>UI: onSnapshot (リアルタイム更新)

    Note over AI: 定期的に分析
    AI->>FS: 直近の投稿を取得
    AI->>AI: 期待値・根拠を計算
    AI->>FS: suggestions に保存
    
    alt 確度が高い場合
        Run->>LINE: pushMessage()
        LINE-->>User: 📱「いま動こう！」通知
    end
    
    FS-->>UI: onSnapshot (判断結果)
    UI-->>User: 「いま動こう！」表示
```

### 認証フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as Next.js App
    participant Auth as Firebase Auth
    participant FS as Firestore

    User->>App: アプリにアクセス
    App->>Auth: signInAnonymously()
    Auth-->>App: 匿名ユーザー (uid)
    App->>FS: ユーザー設定を取得/作成
    FS-->>App: オンボーディング状態
    
    alt 未設定の場合
        App-->>User: オンボーディング画面
        User->>App: Step1: LINE友達登録（任意）
        User->>App: Step2-5: キャラ・エリア・ショップ・シール種類を設定
        User->>App: Step6: 確認・保存
        App->>FS: ユーザー設定 + lineUserId を保存
    else 設定済みの場合
        App-->>User: メイン画面
    end
```

---

## 📁 ディレクトリ構造

```
tsugi-no-tokimeki/
├── app/
│   ├── layout.tsx            # ルートレイアウト (AppProvider)
│   ├── page.tsx              # ルートページ (リダイレクト処理)
│   ├── globals.css           # グローバルスタイル (Tailwind)
│   ├── (main)/               # ルートグループ (メインアプリ)
│   │   ├── layout.tsx        # メインレイアウト (Header + Nav)
│   │   ├── home/
│   │   │   └── page.tsx      # For You画面 (/home)
│   │   ├── feed/
│   │   │   └── page.tsx      # Feed画面 (/feed)
│   │   ├── sticker-book/
│   │   │   └── page.tsx      # シール帳画面 (/sticker-book)
│   │   ├── profile/
│   │   │   └── page.tsx      # Profile画面 (/profile)
│   │   ├── notification-settings/
│   │   │   └── page.tsx      # 通知設定画面 (/notification-settings)
│   │   └── route-result/
│   │       └── [id]/
│   │           └── page.tsx  # ルート結果詳細 (/route-result/[id])
│   ├── onboarding/
│   │   └── page.tsx          # オンボーディング (/onboarding)
│   └── api/
│       ├── analyze/          # 個別ユーザー分析 API
│       │   └── route.ts
│       ├── analyze-all/      # Cloud Scheduler用 全ユーザー分析 API
│       │   └── route.ts
│       ├── morning-notification/  # 朝8時の統合通知 API（ルート+目撃情報）
│       │   └── route.ts
│       ├── evening-notification/  # 夕方18時のまとめ通知 API
│       │   └── route.ts
│       ├── notify-post/      # 投稿通知 API
│       │   └── route.ts
│       └── route-proposal/   # ルート提案 AI API
│           └── route.ts
├── components/               # 再利用可能なコンポーネント
│   ├── NavButton.tsx         # ナビゲーションボタン (Link使用)
│   ├── PostModal.tsx         # 投稿モーダル
│   ├── ProfileEditModal.tsx  # プロフィール編集モーダル
│   ├── LineLoginButton.tsx   # LINE ログインボタン
│   ├── RouteDetailView.tsx   # ルート提案詳細表示
│   ├── RouteRegenerateModal.tsx  # ルート再生成モーダル（AIチャット）
│   ├── ImageViewer.tsx       # 画像フルスクリーン表示
│   ├── TimeEditModal.tsx     # 時間編集モーダル
│   ├── StickerAlbumPostModal.tsx  # シールアルバム投稿モーダル
│   └── shared/               # 共通UIコンポーネント
│       ├── ButtonSelect.tsx
│       ├── CustomDatePicker.tsx
│       ├── SelectWithCustom.tsx
│       └── StepButton.tsx
├── contexts/                 # React Context
│   └── AppContext.tsx        # グローバル状態管理
├── hooks/                    # カスタムフック
├── lib/                      # ユーティリティ・設定
│   ├── firebase.ts           # Firebase初期化（Auth, Firestore, Storage）
│   ├── liff.ts               # LINE LIFF SDK 初期化・操作
│   ├── line.ts               # LINE Messaging API メッセージ構築
│   ├── types.ts              # TypeScript型定義
│   ├── routeProposalService.ts # Firestore CRUD (ルート提案)
│   ├── postService.ts        # 投稿のいいね機能
│   ├── stickerAlbumService.ts # シールアルバム投稿サービス
│   └── utils.ts              # ヘルパー関数・定数
├── docs/
│   ├── DEVELOPMENT_ROADMAP.md  # 開発ロードマップ
│   └── CLOUD_SCHEDULER_SETUP.md  # Cloud Scheduler設定ガイド
├── public/                   # 静的アセット
├── Dockerfile                # Cloud Run 用マルチステージビルド
├── .dockerignore             # Docker ビルド除外設定
├── cloudbuild.yaml           # Cloud Build パイプライン設定
├── firebase.json             # Firebase Emulator 設定
├── firestore.rules           # Firestore セキュリティルール
├── storage.rules             # Firebase Storage セキュリティルール
├── next.config.ts            # Next.js 設定 (standalone出力)
├── tsconfig.json             # TypeScript 設定
├── package.json              # 依存関係
├── .env.example              # 環境変数テンプレート
└── .env.local                # 環境変数 (Git管理外)
```

---

## 💻 技術スタック

| Category | Technology | Version | Usage |
|:---------|:-----------|:--------|:------|
| **Framework** | Next.js | 16.x | App Router, React Server Components |
| **Language** | TypeScript | 5.x | 型安全な開発 |
| **UI Library** | React | 19.x | コンポーネントアーキテクチャ |
| **Styling** | Tailwind CSS | 4.x | ユーティリティファースト CSS |
| **Database** | Firestore | - | NoSQL リアルタイムDB |
| **Storage** | Firebase Storage | - | シールアルバム画像保存 |
| **Auth** | Firebase Auth + LINE LIFF | - | 匿名認証 + LINE連携（任意） |
| **Icons** | Lucide React | - | SVG アイコン |
| **Hosting** | Cloud Run | - | コンテナホスティング |
| **CI/CD** | Cloud Build | - | GitHub連携自動デプロイ |
| **Container** | Docker | - | マルチステージビルド |
| **Notification** | LINE Messaging API | - | プッシュ通知 ✅ |
| **AI** | Vertex AI (Gemini) | 2.5 Flash | 行動判断AI・ルート提案 ✅ |
| **Form** | react-hook-form + zod | - | フォームバリデーション |
| **Markdown** | react-markdown + remark-gfm | - | AIレスポンス表示 |

---

## 📊 開発進捗

### Phase 1: MVP ✅ 完了

- [x] Next.js プロジェクト作成
- [x] Firebase Auth (匿名認証) 設定
- [x] Firestore 連携 & セキュリティルール設定
- [x] オンボーディング UI
- [x] 投稿・フィード機能
- [x] モック AI 判断ロジック
- [x] Docker 設定 (Dockerfile, .dockerignore)
- [x] Cloud Run デプロイ設定
- [x] Cloud Build トリガー設定 (GitHub連携)
- [x] 環境変数設定 (Cloud Build Substitutions)
- [x] API キー制限 (HTTP Referrer)

### Phase 2: バックエンド強化 ✅ 完了

- [x] Vertex AI (Gemini 2.5) 連携
- [x] Route Handlers (`/api/analyze`, `/api/analyze-all`)
- [x] Cloud Scheduler 定期実行

### Phase 3: LINE連携 ✅ 完了

- [x] LINE LIFF SDK 導入
- [x] LINE 友達登録機能（オンボーディング Step 1）
- [x] lineUserId を Firestore に保存
- [x] Secret Manager に LINE シークレット登録
- [x] プッシュ通知 API 実装
- [x] ルート提案 UI（AIでスケジュール作成）
- [x] プロフィール編集機能
- [x] 投稿への入力内容反映

### Phase 4: 統合通知システム ✅ 完了

- [x] 朝の統合通知（`/api/morning-notification`）- ルート提案 + 目撃情報
- [x] 夕方のまとめ通知（`/api/evening-notification`）- 今日の目撃情報まとめ
- [x] LINE Flex Message によるリッチ通知
- [x] 通知設定画面のUI刷新（朝/夕方トグル）
- [x] プロフィール画面からのLINE連携ボタン
- [x] LINE連携状態の自動検出・引き継ぎ

### Phase 5: 今後の予定

- [ ] Event Matcher（イベント情報との連携）
- [ ] PWA 対応
- [ ] LINE Webhook 受信（双方向コミュニケーション）
- [ ] 転売対策（posts_private コレクション）
- [ ] 地図表示・ジオロケーション連携
- [ ] ショップ営業時間データベース

---

## 🚀 ローカルでの実行方法

### 1. 前提条件

- Node.js v20 or later
- npm
- Firebase プロジェクト (Firestore, Auth 有効化済み)

### 2. インストール

```bash
git clone https://github.com/nekoai-lab/tsugi-no-tokimeki.git
cd tsugi-no-tokimeki
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成：

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. 実行

```bash
npm run dev
```

http://localhost:3000 にアクセス

---

## ☁️ デプロイ

### Cloud Run へのデプロイ

GitHub への push で自動デプロイされます（Cloud Build トリガー設定済み）

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

### デプロイパイプライン

```mermaid
graph LR
    A[git push] --> B[Cloud Build Trigger]
    B --> C[Docker Build]
    C --> D[Push to GCR]
    D --> E[Deploy to Cloud Run]
    E --> F[Live 🚀]
```

### 環境変数 (Cloud Build)

Cloud Build トリガーの「代入変数」で設定：

| 変数名 | 説明 |
|--------|------|
| `_NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API キー |
| `_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth ドメイン |
| `_NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase プロジェクト ID |
| `_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage バケット |
| `_NEXT_PUBLIC_LIFF_ID` | LINE LIFF ID（LINEログイン用） |

### シークレット (Secret Manager)

| シークレット名 | 説明 |
|---------------|------|
| `FIREBASE_API_KEY` | Firebase API キー |
| `FIREBASE_AUTH_DOMAIN` | Firebase Auth ドメイン |
| `FIREBASE_PROJECT_ID` | Firebase プロジェクト ID |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage バケット |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID |
| `FIREBASE_APP_ID` | Firebase App ID |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API アクセストークン |
| `LINE_CHANNEL_SECRET` | LINE チャネルシークレット |
| `CRON_SECRET` | Cloud Scheduler認証用シークレット |
| `_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID |
| `_NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |

---

## 🔒 セキュリティ

### API キー制限

Firebase API キーには HTTP Referrer 制限を設定済み：

- `localhost:*` (ローカル開発)
- `127.0.0.1:*` (ローカル開発)
- `https://*.run.app/*` (Cloud Run)

### Firestore セキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📱 LINE連携（Phase 3）

**LINE LIFF + Messaging API** を使用したログイン・プッシュ通知を実装。

### システム設計図

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LINE連携 全体像                               │
└─────────────────────────────────────────────────────────────────────┘

【Phase 1: LINEログイン】 ✅ 実装済み

ユーザー                    アプリ                      LINE
   │                         │                          │
   │  「LINEでログイン」     │                          │
   │ ────────────────────>   │                          │
   │                         │   LIFF.init(LIFF_ID)     │
   │                         │ ────────────────────────>│
   │                         │                          │
   │   <──────────────────── │ <──────── 認証画面 ──────│
   │                         │                          │
   │      認証を許可         │                          │
   │ ────────────────────>   │ ────────────────────────>│
   │                         │                          │
   │                         │ <──── userId, profile ───│
   │                         │                          │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Firestore                                    │
│   users/{uid}/profile/main                                           │
│     └── lineUserId: "U1234567890abcdef"  ← 保存！                   │
└─────────────────────────────────────────────────────────────────────┘


【Phase 2: 定期分析】 ✅ 実装済み

Cloud Scheduler ──────> Cloud Run ──────> Vertex AI
(毎日 8:00 / 18:00)         │                  │
                            │  分析リクエスト  │
                            │ ────────────────>│
                            │ <── 判定結果 ────│
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Firestore                                    │
│   users/{uid}/suggestions/latest                                     │
│     ├── decision: "go" / "gather" / "wait"                          │
│     ├── score: 0.85                                                  │
│     └── reasons: ["新宿で目撃情報あり！", ...]                      │
└─────────────────────────────────────────────────────────────────────┘


【Phase 3: プッシュ通知】 ✅ 実装済み

Cloud Run                              LINE Messaging API
   │                                          │
   │  decision === "go" のユーザー抽出        │
   │                                          │
   │  POST /v2/bot/message/push               │
   │  { "to": "U1234...", "messages": [...] } │
   │ ────────────────────────────────────────>│
   │                                          │
   │                                          ▼
   │                                    ┌──────────┐
   │                                    │ 📱 LINE  │
   │                                    │  通知！  │
   │                                    └──────────┘
```

### 必要な設定

| 項目 | 設定場所 | 用途 |
|------|---------|------|
| `NEXT_PUBLIC_LIFF_ID` | Cloud Build 代入変数 | LINEログイン |
| `LINE_CHANNEL_ACCESS_TOKEN` | Secret Manager | プッシュ通知 |
| `LINE_CHANNEL_SECRET` | Secret Manager | Webhook検証 |

### API エンドポイント

| エンドポイント | 用途 | 状態 |
|---------------|------|------|
| `/api/analyze` | 個別ユーザー分析 | ✅ 実装済み |
| `/api/analyze-all` | 全ユーザー一括分析 | ✅ 実装済み |
| `/api/morning-notification` | 朝8時の統合通知（ルート＋目撃情報） | ✅ 実装済み |
| `/api/evening-notification` | 夕方18時の目撃まとめ通知 | ✅ 実装済み |
| `/api/route-proposal` | ルート提案（AI スケジュール作成・再生成） | ✅ 実装済み |
| `/api/notify-post` | 投稿通知 | ✅ 実装済み |
| `/api/line-webhook` | LINE Webhook受信 | 🔄 予定 |

### 通知シナリオ

```mermaid
sequenceDiagram
    participant Scheduler as Cloud Scheduler
    participant API as Cloud Run
    participant AI as Vertex AI
    participant LINE as LINE Messaging API
    participant User as ユーザー

    Note over Scheduler: 毎朝 8:00
    Scheduler->>API: POST /api/morning-notification
    API->>AI: ルート提案を生成
    API->>API: 直近の目撃情報を取得
    API->>LINE: Flex Message 送信
    LINE-->>User: 「🌅 今日のおすすめルート＋目撃情報」

    Note over Scheduler: 毎夕 18:00
    Scheduler->>API: POST /api/evening-notification
    API->>API: 今日の目撃情報を集計
    API->>LINE: Flex Message 送信
    LINE-->>User: 「🌇 今日の目撃情報まとめ」
```

### 実装済みの機能

| 機能 | 説明 | 状態 |
|------|------|------|
| **LINEログイン** | LIFF SDK でユーザー認証 | ✅ |
| **朝の統合通知** | ルート提案 + 目撃情報を1つのメッセージで | ✅ |
| **夕方のまとめ通知** | 今日の目撃情報をサマリー | ✅ |
| **Flex Message** | LINE のリッチなカード形式メッセージ | ✅ |
| **通知オン/オフ設定** | 朝・夕方を個別に設定可能 | ✅ |
| **クイックリプライ** | 「行く」「スキップ」をワンタップで回答 | 🔄 予定 |

### ユーザー体験フロー

```
1. アプリにアクセス
       ↓
2. オンボーディング Step 1-5（推しキャラ、エリア、ショップ、シール種類、時間指定）
       ↓
3. Step 6「LINE通知を設定しよう」（任意）
   → 友達追加後、挨拶メッセージの LIFF URL をタップ
   → lineUserId 取得
       ↓
4. Step 7 確認・保存
       ↓
5. ホーム画面へ
       ↓
6. 毎朝8時「今日のおすすめルート＋目撃情報」がLINEに届く
       ↓
7. 夕方18時「今日の目撃まとめ」がLINEに届く
```

### 通知設定フロー

```
プロフィール画面
    │
    ├── 「LINE連携」ボタン → LINE認証 → lineUserId保存
    │
    └── 「通知設定」へ移動
            │
            ├── 🌅 朝の通知（8:00）: ON/OFF
            │       └── 今日のおすすめルート＋目撃情報
            │
            └── 🌇 夕方の通知（18:00）: ON/OFF
                    └── 今日の目撃情報まとめ
```

### LINE連携の環境変数

```env
# LINE LIFF (フロントエンド)
NEXT_PUBLIC_LIFF_ID=your_liff_id

# LINE Messaging API (バックエンド - Secret Manager)
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret

# Cloud Scheduler認証用
CRON_SECRET=your_cron_secret
```

---

## ⏰ Cloud Scheduler 設定

朝8時と夕方18時の自動通知には Cloud Scheduler を使用しています。

### ジョブ一覧

| ジョブ名 | スケジュール | エンドポイント | 説明 |
|---------|-------------|---------------|------|
| `morning-notification` | `0 8 * * *` (毎朝8時) | `/api/morning-notification` | ルート提案＋目撃情報 |
| `evening-notification` | `0 18 * * *` (毎夕18時) | `/api/evening-notification` | 今日の目撃まとめ |

### 必要なHTTPヘッダー

```
Content-Type: application/json
Authorization: Bearer {CRON_SECRET}
```

詳細な設定手順は [docs/CLOUD_SCHEDULER_SETUP.md](docs/CLOUD_SCHEDULER_SETUP.md) を参照してください。

---

## 🔒 セキュリティ

### 現状（ハッカソン版）

| 項目 | 状態 | 備考 |
|-----|------|------|
| API キー | ✅ 環境変数で管理 | Secret Manager 使用 |
| Firestore ルール | ⚠️ 簡易版 | 認証済みユーザーのみアクセス可 |
| Storage ルール | ✅ 適切 | 自分のファイルのみ書き込み可 |
| API エンドポイント | ⚠️ 一部認証なし | Cloud Scheduler は CRON_SECRET で保護 |

### 本番運用前に強化予定

1. **Firestore ルールの細分化**
   - 自分のプロフィールのみ編集可能
   - 投稿は作成者のみ編集・削除可能
   
   ```javascript
   // 改善版ルール例
   match /artifacts/{appId}/users/{userId}/profile/{docId} {
     allow read, write: if request.auth.uid == userId;
   }
   
   match /artifacts/{appId}/public/data/posts/{postId} {
     allow read: if request.auth != null;
     allow create: if request.auth != null;
     allow update, delete: if resource.data.uid == request.auth.uid;
   }
   ```

2. **API レート制限**
   - Vertex AI 呼び出しにレート制限を追加
   - Cloud Armor の導入検討

3. **監査ログ**
   - 重要な操作のログ記録

---

## 🛡️ License & Credit

- **Development**: [yumemiru-masomi](https://github.com/yumemiru-masomi) × [nekoai-lab](https://github.com/nekoai-lab)
- **Event**: [第4回 Agentic AI Hackathon with Google Cloud](https://zenn.dev/hackathons/google-cloud-japan-ai-hackathon-vol4)
- **Powered by**: Google Cloud (Vertex AI Gemini 2.5, Cloud Run, Firestore, Cloud Scheduler)
- **Integrated with**: LINE Platform (LIFF, Messaging API, Flex Message)
- **License**: MIT

---

## 👥 開発チーム

本プロジェクトは **2人チーム** で開発しました。

| メンバー | 役割 |
|---------|------|
| [yumemiru-masomi](https://github.com/yumemiru-masomi) | UI/UX デザイン・フロントエンド |
| [nekoai-lab](https://github.com/nekoai-lab) | バックエンド・インフラ・AI連携 |

### 開発スタイル

- GitHub Flow（PR ベースの開発）
- Firebase Emulator でローカル開発
- Cloud Build による自動デプロイ

---

---

## 📸 スクリーンショット

### 通知例（LINE Flex Message）

**朝の通知（8:00）**
```
🌅 おはようございます！
今日のおすすめルートと、直近の目撃情報をお届けします。

📍 設定エリア: 渋谷、新宿
🗓 おすすめルート: 渋谷ロフト → 新宿マルイ → ...

👀 直近の目撃情報:
・渋谷ロフト: ちいかわシール入荷中！
・新宿マルイ: ハチワレ残り3枚
```

**夕方の通知（18:00）**
```
🌇 今日の目撃情報まとめ
本日 5件 の目撃情報がありました！

📍 渋谷エリア: 3件
📍 新宿エリア: 2件
```

---

*Created with 💖 by yumemiru-masomi & nekoai-lab*
