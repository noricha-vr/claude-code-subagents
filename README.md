# Video to MP3 Converter

🎥➡️🎵 ブラウザ内で動画ファイルをMP3音声ファイルに変換するPWA対応ウェブアプリケーション

![alt text](images/thumbnail.png)

## ✨ 主な機能

- **🚀 ブラウザ内変換**: FFmpeg.wasmを使用してサーバーレス変換
- **📱 PWA対応**: インストール可能でオフライン動作
- **🎯 ドラッグ&ドロップ**: 直感的なファイルアップロード
- **📊 リアルタイム進捗**: 変換進捗の詳細表示
- **🔒 プライバシー重視**: ファイルはブラウザ内で処理、外部送信なし
- **🎨 レスポンシブデザイン**: モバイル・デスクトップ両対応

## 🎬 対応動画形式

- MP4
- MOV  
- AVI
- WebM
- MKV
- その他FFmpeg対応形式

## 🚀 クイックスタート

### 前提条件

- Node.js 18+ または Bun
- モダンブラウザ（Chrome, Firefox, Safari, Edge）

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd claude-code-agents

# 依存関係をインストール
bun install
# または
npm install

# 開発サーバー起動
bun run dev
# または
npm run dev
```

ブラウザで `http://localhost:5173` を開いてアプリケーションにアクセス

## 📱 PWAインストール

### デスクトップ
1. アプリをブラウザで開く
2. アドレスバーの「インストール」ボタンをクリック
3. または Chrome メニューから「アプリをインストール」を選択

### モバイル
1. Safari/Chrome でアプリを開く
2. 共有ボタン（iOS）またはメニュー（Android）をタップ  
3. 「ホーム画面に追加」を選択

## 🎯 使い方

### 基本的な変換フロー

1. **ファイル選択**
   - クリックしてファイル選択またはドラッグ&ドロップ
   - 対応する動画ファイルを選択

2. **変換開始**
   - 「変換開始」ボタンをクリック
   - 進捗バーで変換状況を確認

3. **ダウンロード**
   - 変換完了後、「Download MP3」ボタンでダウンロード

### 高度な使い方

- **大容量ファイル**: 数GB のファイルも処理可能（メモリ使用量に注意）
- **バッチ処理**: 一度に一つずつファイルを変換
- **品質設定**: デフォルト設定で高品質MP3を出力

## 🛠️ 技術スタック

### フロントエンド
- **React 18** - モダンなUI フレームワーク
- **TypeScript** - 型安全な開発
- **Vite** - 高速ビルドツール
- **Tailwind CSS** - ユーティリティファーストCSS

### 変換エンジン  
- **FFmpeg.wasm** - ブラウザ内動画変換
- **Web Workers** - 非同期処理とパフォーマンス向上

### PWA機能
- **Service Worker** - オフライン対応とキャッシング
- **Web App Manifest** - インストール可能アプリ

### テスト・品質
- **Playwright** - E2Eテスト
- **TypeScript Strict** - 厳格な型チェック

## 🧪 テスト

### 単体テスト実行
```bash
bun run test
```

### E2Eテスト実行
```bash
# 開発サーバー起動（別ターミナル）
bun run dev

# テスト実行
bun run test:e2e
```

### テストファイル構成
- `tests/e2e/basic.spec.ts` - 基本機能テスト
- `tests/e2e/conversion.spec.ts` - 変換機能テスト
- `tests/e2e/integration.spec.ts` - 統合テスト

## 🏗️ ビルド

### 開発ビルド
```bash
bun run build
```

### 本番ビルド
```bash
bun run build:prod
```

### ビルド結果確認
```bash
bun run preview
```

## 🔧 設定

### 環境変数

プロジェクトルートに `.env.local` を作成：

```bash
# 開発環境設定
VITE_APP_TITLE=Video to MP3 Converter
VITE_APP_VERSION=1.0.0

# FFmpeg設定
VITE_FFMPEG_CORE_PATH=/ffmpeg-core

# PWA設定  
VITE_PWA_NAME="Video to MP3 Converter"
VITE_PWA_SHORT_NAME="Video2MP3"
```

### Vite設定カスタマイズ

`vite.config.ts` でビルド設定を調整可能：

```typescript
export default defineConfig({
  // Cross-Origin Isolation（FFmpeg.wasm必須）
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
})
```

## 📊 パフォーマンス

### システム要件
- **RAM**: 最低2GB推奨（大容量ファイル処理時は8GB+）
- **CPU**: マルチコア推奨
- **ストレージ**: 変換ファイルサイズの2倍の空き容量

### 最適化のヒント
- 複数ファイル変換時は一つずつ順次実行
- ブラウザタブは変換中は他の重いページを開かない
- メモリ不足の場合はブラウザを再起動

## 🚨 トラブルシューティング

### よくある問題

**Q: 変換が開始されない**
A: ブラウザがCross-Origin Isolationに対応していることを確認。Chrome推奨。

**Q: メモリエラーが発生する**  
A: ブラウザのタブを閉じてメモリを解放するか、より小さいファイルで試す。

**Q: PWAがインストールできない**
A: HTTPS環境または localhost で実行していることを確認。

**Q: 変換に時間がかかる**
A: ファイルサイズと品質に比例。大容量ファイルは数分から十数分かかる場合があります。

### デバッグモード

開発者ツールのコンソールでログを確認：

```javascript
// ローカルストレージでデバッグモード有効化
localStorage.setItem('debug', 'true')
```

## 🤝 コントリビューション

### 開発環境セットアップ

1. フォークしてクローン
2. 依存関係インストール: `bun install`
3. 開発サーバー起動: `bun run dev`  
4. テスト実行: `bun run test:e2e`

### コーディング規則

- TypeScript strict mode使用
- ESLint + Prettier設定に従う
- テストカバレッジ維持
- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) 形式

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🙏 謝辞

- [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) - ブラウザ内動画変換を可能にする素晴らしいライブラリ
- [React](https://reactjs.org/) - モダンなUI構築フレームワーク
- [Vite](https://vitejs.dev/) - 高速開発体験を提供

## 📞 サポート

問題や質問がある場合：

1. [GitHub Issues](../../issues) で報告
2. [Discussion](../../discussions) で質問
3. 開発者ブログ: [コミュニティページ]()

---

**🎵 動画をMP3に変換して、お気に入りの音楽をいつでもどこでも楽しもう！**
