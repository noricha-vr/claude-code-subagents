# Video to MP3 Converter

ブラウザで動作する動画からMP3への変換アプリケーション。FFmpeg.wasmを使用してクライアントサイドで安全に変換処理を行います。

## 特徴

- 🔒 **完全プライベート**: ファイルはサーバーに送信されません
- ⚡ **高速変換**: WebAssembly版FFmpegによる効率的な変換
- 📱 **PWA対応**: デバイスにインストール可能
- 🎯 **ドラッグ&ドロップ対応**: 直感的なファイルアップロード
- 🌐 **オフライン動作**: Service Workerによるオフライン対応
- 📊 **リアルタイム進捗**: 変換プロセスの詳細な進捗表示

## サポートされているファイル形式

### 入力形式
- MP4, AVI, MOV, MKV
- WebM, WMV, 3GP, FLV
- M4V, TS, MTS

### 出力形式
- MP3 (128kbps, 44.1kHz, Stereo)

## 技術スタック

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Video Processing**: FFmpeg.wasm
- **PWA**: vite-plugin-pwa
- **Package Manager**: bun (推奨)

## システム要件

### ブラウザ要件
- Chrome 88+ (推奨)
- Firefox 79+
- Safari 15+
- Edge 88+

### 技術要件
- WebAssembly対応
- SharedArrayBuffer対応
- Web Workers対応
- Cross-Origin Isolation対応

## インストールと起動

### 依存関係のインストール

```bash
# bunを使用（推奨）
bun install

# または npm
npm install
```

### FFmpegファイルのセットアップ

```bash
# 自動的にpostinstallで実行されますが、手動でも実行可能
bun run setup-ffmpeg
```

### 開発サーバーの起動

```bash
bun run dev
```

アプリケーションは http://localhost:5173 で利用可能になります。

### 本番ビルド

```bash
bun run build
```

### プレビュー

```bash
bun run preview
```

## Cross-Origin Isolation設定

FFmpeg.wasmがSharedArrayBufferを使用するため、以下のHTTPヘッダーが必要です：

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

Viteの開発サーバーでは自動的に設定されます。本番環境では適切にヘッダーを設定してください。

## ディレクトリ構造

```
src/
├── components/          # Reactコンポーネント
│   ├── ConversionProgress.tsx
│   ├── ErrorMessage.tsx
│   ├── FileUpload.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   └── PWAInstallButton.tsx
├── hooks/              # カスタムフック
│   ├── useErrorHandler.ts
│   └── useFFmpeg.ts
├── services/           # ビジネスロジック
│   ├── ffmpegService.ts
│   └── workerManager.ts
├── types/              # TypeScript型定義
│   └── index.ts
├── utils/              # ユーティリティ関数
│   ├── pwaUtils.ts
│   └── systemCheck.ts
├── workers/            # Web Worker
│   └── ffmpegWorker.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 使用方法

1. **ファイル選択**: 動画ファイルをドラッグ&ドロップまたはファイル選択
2. **変換開始**: 「MP3に変換開始」ボタンをクリック
3. **進捗確認**: リアルタイムで変換進捗を確認
4. **ダウンロード**: 変換完了後、「MP3ファイルをダウンロード」をクリック

## トラブルシューティング

### SharedArrayBufferエラー
- ブラウザでCross-Origin Isolationが有効になっていない
- 別のブラウザを試してください

### メモリ不足エラー
- より小さなファイルサイズの動画を使用してください
- ブラウザのタブを閉じてメモリを解放してください

### FFmpeg読み込みエラー
- インターネット接続を確認してください
- ブラウザのキャッシュをクリアしてください

## ライセンス

MIT License

## 技術的な詳細

### FFmpeg.wasm
- バージョン: 0.12.10
- WebAssembly版FFmpegライブラリを使用
- Web Workerで非ブロッキング処理

### PWA機能
- アプリインストール対応
- オフライン動作
- プッシュ通知準備済み

### セキュリティ
- クライアントサイド処理
- ファイルアップロードなし
- プライバシー保護

## 開発

### 型チェック
```bash
bun run type-check
```

### Lint
```bash
bun run lint
```

### FFmpegセットアップ（手動）
```bash
bun run setup-ffmpeg
```

## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## サポート

問題や質問がある場合は、GitHubのIssuesページでお知らせください。