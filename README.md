# 社長の奢り自販機ペア管理システム

## 概要
社内制度「社長の奢り自販機」のペア記録を管理するWebアプリケーションです。毎日異なる社員とペアで社員証をかざすことで1本無料でドリンクが入手できる制度の利便性を向上させます。

## 機能
- ユーザー認証（JWT）
- 日次ペア登録（1日1回制限）
- 週次履歴表示（月曜〜日曜）
- 未ペア社員一覧表示
- 週次自動リセット（月曜0時）
- レスポンシブデザイン（スマホ・PC対応）

## 技術スタック
- **バックエンド**: FastAPI (Python 3.12)
- **フロントエンド**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **認証**: JWT トークン
- **データベース**: インメモリ（概念実証用）

## 環境構築

### 前提条件
- Python 3.12以上
- Node.js 18以上
- Poetry (Python依存関係管理)
- npm または yarn

### 1. リポジトリのクローン
```bash
git clone https://github.com/ogorizihanki/main.git
cd main
```

### 2. バックエンドのセットアップ
```bash
cd vending-pair-system/backend

# Poetry依存関係のインストール
poetry install

# 環境変数の設定（必要に応じて.envファイルを編集）
# SECRET_KEY=your-secret-key-change-in-production
# ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. フロントエンドのセットアップ
```bash
cd ../frontend

# npm依存関係のインストール
npm install

# 環境変数の設定（必要に応じて.envファイルを編集）
# VITE_API_URL=http://localhost:8000
```

## アプリケーションの起動

### バックエンドの起動
```bash
cd vending-pair-system/backend
poetry run fastapi dev app/main.py
```
- サーバーは http://localhost:8000 で起動します
- API仕様書は http://localhost:8000/docs で確認できます

### フロントエンドの起動
```bash
cd vending-pair-system/frontend
npm run dev
```
- アプリケーションは http://localhost:5173 で起動します

## 使用方法

1. **初回ユーザー登録**
   - ブラウザで http://localhost:5173 にアクセス
   - 「新規登録」から社員情報を登録

2. **ログイン**
   - 登録したメールアドレスとパスワードでログイン

3. **ペア登録**
   - 「今日のペア」タブで相手を選択して登録
   - 1日1回のみ登録可能

4. **履歴確認**
   - 「履歴」タブで今週のペア履歴を確認

5. **未ペア確認**
   - 「未ペア」タブで今日まだペアを組んでいない社員を確認

## 開発用コマンド

### バックエンド
```bash
# 開発サーバー起動
poetry run fastapi dev app/main.py

# 依存関係追加
poetry add package-name

# 仮想環境アクティベート
poetry shell
```

### フロントエンド
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# リント
npm run lint
```

## トラブルシューティング

### よくある問題

1. **ポートが使用中の場合**
   - バックエンド: `poetry run fastapi dev app/main.py --port 8001`
   - フロントエンド: `npm run dev -- --port 5174`

2. **依存関係のエラー**
   - バックエンド: `poetry install --no-cache`
   - フロントエンド: `rm -rf node_modules && npm install`

3. **CORS エラー**
   - フロントエンドの.envファイルでVITE_API_URLが正しく設定されているか確認

## ライセンス
このプロジェクトは社内利用を目的としています。

---
**開発者**: Devin AI  
**要求者**: @hitugihane
