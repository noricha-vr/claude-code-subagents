# デプロイメントガイド 🚀

Video to MP3 Converter をプロダクション環境にデプロイするためのガイドです。

## 📋 デプロイ前チェックリスト

### 必須要件確認
- [ ] **Cross-Origin Isolation対応**: サーバーヘッダー設定済み
- [ ] **HTTPS環境**: PWA機能に必須  
- [ ] **FFmpeg.wasmファイル**: 配布ディレクトリに含まれている
- [ ] **Service Worker**: 正常に登録・動作確認済み
- [ ] **マニフェストファイル**: PWAインストール可能

### パフォーマンス確認
- [ ] **ビルドサイズ**: 総サイズ ~32MB（FFmpeg.wasm含む）
- [ ] **初回読み込み**: 3秒以内の表示
- [ ] **メモリ使用量**: 大容量ファイル処理時の動作確認
- [ ] **モバイル対応**: レスポンシブデザインの確認

### セキュリティ確認  
- [ ] **CSP設定**: Content Security Policy の適切な設定
- [ ] **CORS設定**: クロスオリジンリクエストの制御
- [ ] **ファイルアップロード制限**: 悪意のあるファイルの防御
- [ ] **エラーハンドリング**: 機密情報の漏洩防止

## 🔧 サーバー設定

### Nginx設定例

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL証明書設定
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Cross-Origin Isolation（FFmpeg.wasm必須）
    add_header Cross-Origin-Opener-Policy same-origin;
    add_header Cross-Origin-Embedder-Policy require-corp;
    
    # PWA必須ヘッダー
    add_header Service-Worker-Allowed /;
    
    # セキュリティヘッダー
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
    
    # CSP設定
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'self' 'wasm-unsafe-eval';
        worker-src 'self' blob:;
        connect-src 'self' blob:;
        img-src 'self' data: blob:;
        style-src 'self' 'unsafe-inline';
        font-src 'self';
    ";
    
    location / {
        root /var/www/video-converter;
        try_files $uri $uri/ /index.html;
        
        # キャッシュ設定
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # FFmpegファイルの特別設定
        location /ffmpeg-core/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Cross-Origin-Resource-Policy cross-origin;
        }
        
        # Service Worker
        location /service-worker.js {
            expires 0;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
}
```

### Apache設定例

```apache
<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/video-converter
    
    # SSL設定
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    # Cross-Origin Isolation
    Header always set Cross-Origin-Opener-Policy same-origin
    Header always set Cross-Origin-Embedder-Policy require-corp
    
    # セキュリティヘッダー
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    
    # PWA対応
    Header always set Service-Worker-Allowed "/"
    
    # FFmpegファイルの設定
    <LocationMatch "/ffmpeg-core/">
        Header set Cross-Origin-Resource-Policy cross-origin
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </LocationMatch>
    
    # Service Worker
    <Files "service-worker.js">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </Files>
    
    # フォールバック設定
    FallbackResource /index.html
</VirtualHost>
```

## ☁️ クラウドサービス別設定

### Vercel

`vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy", 
          "value": "require-corp"
        }
      ]
    },
    {
      "source": "/ffmpeg-core/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Resource-Policy",
          "value": "cross-origin"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Netlify

`_headers`:
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff

/ffmpeg-core/*
  Cross-Origin-Resource-Policy: cross-origin
  Cache-Control: public, max-age=31536000, immutable

/service-worker.js
  Cache-Control: no-cache, no-store, must-revalidate
```

### GitHub Pages

`public/_headers` に上記Netlifyと同様の設定を配置

## 🚀 デプロイ手順

### 1. ビルド実行

```bash
# 依存関係インストール
bun install

# 環境変数設定
cp .env.example .env.local
# 必要に応じて .env.local を編集

# 本番ビルド
bun run build

# ビルド結果確認
ls -la dist/
```

### 2. テスト実行

```bash
# E2Eテスト（本番ビルド版）
bun run preview &
sleep 5
bunx playwright test --config=playwright.config.ts
```

### 3. デプロイ実行

```bash
# 例：rsyncでサーバーへデプロイ
rsync -avz --delete dist/ user@server:/var/www/video-converter/

# 例：AWS S3へデプロイ
aws s3 sync dist/ s3://your-bucket --delete

# 例：Vercelへデプロイ
vercel --prod
```

## 🔍 デプロイ後確認

### 機能テスト
1. **PWAインストール**: ブラウザでインストール可能か確認
2. **オフライン動作**: ネットワーク切断時の動作確認
3. **ファイル変換**: 各種動画形式での変換テスト
4. **モバイル対応**: スマートフォン・タブレットでの動作確認

### パフォーマンステスト
```bash
# Lighthouse監査
bunx lighthouse https://your-domain.com --output=html --output-path=./lighthouse-report.html

# Core Web Vitals確認
bunx web-vitals-measure https://your-domain.com
```

### セキュリティ監査
```bash
# セキュリティヘッダー確認
curl -I https://your-domain.com

# SSL設定確認
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## 📊 監視・メンテナンス

### アプリケーション監視
- **Service Worker更新**: 定期的なキャッシュクリア
- **FFmpeg.wasmバージョン**: セキュリティアップデート対応
- **エラー監視**: ブラウザコンソールエラーの収集

### パフォーマンス監視
- **読み込み速度**: 初回表示時間の追跡
- **変換速度**: ファイルサイズ別の処理時間測定
- **メモリ使用量**: ブラウザクラッシュの予防

### セキュリティ更新
- **依存関係更新**: 定期的なnpm audit実行
- **証明書更新**: SSL証明書の自動更新設定
- **ヘッダー設定**: セキュリティヘッダーの継続監視

## 🆘 トラブルシューティング

### デプロイ時の問題

**問題**: Cross-Origin Isolationエラー
```
解決策: サーバーヘッダー設定確認
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Embedder-Policy: require-corp
```

**問題**: PWAインストールできない
```
解決策: HTTPS環境確認とmanifest.json設定確認
```

**問題**: FFmpeg.wasmが読み込めない
```
解決策: ffmpeg-coreディレクトリのCORP設定確認
```

### 本番環境での問題

**問題**: メモリ不足エラー
```
解決策: ファイルサイズ制限やタイムアウト設定の調整
```

**問題**: 変換が途中で止まる
```
解決策: Worker TimeoutとCross-Origin設定の確認
```

## 📞 サポート

デプロイに関する質問や問題：

1. **ドキュメント**: README.md の詳細手順確認
2. **Issues**: GitHub Issues での報告
3. **ログ確認**: ブラウザ開発者ツールでの詳細ログ確認

---

**✅ 正しく設定されたプロダクション環境で、快適な動画変換体験を提供しましょう！**