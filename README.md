# AI News Reporter 📰🤖

AIニュースを自動収集・分析し、日本語レポートを生成するシステムです。

## ✨ 特徴

- **🌐 多ソース対応**: Hacker News API、技術系RSSフィードから自動収集
- **🧠 AI判定**: キーワードベースでAI関連記事を自動識別・スコアリング
- **📊 重要度ランキング**: エンゲージメント・関連度・品質を考慮した総合評価
- **📝 日本語レポート**: Markdown・HTML形式の見やすいレポート生成
- **⏰ 自動実行**: スケジューラーによる定期実行対応
- **🛡️ エラー耐性**: 堅牢なエラーハンドリングと継続実行

## 🚀 クイックスタート

### 1. セットアップ
```bash
# 依存関係をインストール
uv sync

# ログディレクトリの確認（自動作成されます）
ls logs/
```

### 2. 基本実行
```bash
# 基本的なニュース収集とレポート生成
uv run python scripts/collect_ai_news.py

# 生成されたレポートを確認
ls output/
```

### 3. オプション付き実行
```bash
# 詳細オプション指定
uv run python scripts/collect_ai_news.py \
  --limit 10 \
  --max-articles 15 \
  --format both \
  --min-relevance 0.2
```

### 4. 自動化
```bash
# スケジューラー開始（毎日8:00と20:00に実行）
uv run python scripts/schedule_ai_news.py
```

## 📋 コマンドオプション

| オプション | デフォルト | 説明 |
|-----------|------------|------|
| `--limit` | 20 | 各ソースからの最大収集数 |
| `--max-articles` | 15 | レポートの最大記事数 |
| `--format` | both | 出力形式 (markdown/html/both) |
| `--min-relevance` | 0.3 | AI関連度の最小閾値 (0.0-1.0) |
| `--output` | output | 出力ディレクトリ |

## 📊 出力例

### 統計情報
```
総収集記事数: 15
AI関連記事数: 8  
利用ソース数: 3
最高スコア記事: "How LLM Agents Are Transforming Research" (重要度: 0.85)
```

### 生成ファイル
- `ai_news_report_YYYYMMDD_HHMMSS.md` - Markdownレポート
- `ai_news_report_YYYYMMDD_HHMMSS.html` - HTMLレポート（スタイル付き）
- `logs/ai_news_reporter.log` - 実行ログ

## 🏗️ アーキテクチャ

```
src/ai_news_reporter/
├── collectors/          # データ収集層
│   ├── hacker_news_collector.py
│   └── rss_collector.py
├── processors/          # データ処理層
│   └── news_processor.py
├── generators/          # レポート生成層
│   └── report_generator.py
├── models/              # データモデル
│   ├── news_item.py     # ニュース記事モデル
│   └── report.py        # レポートモデル
└── utils/               # ユーティリティ
    └── text_utils.py    # テキスト処理・スコア計算
```

## ⚙️ 設定

### ニュースソース設定
`config/settings.py` でソースを追加・変更できます：

```python
news_sources: List[NewsSourceConfig] = [
    NewsSourceConfig(
        name="新しいソース",
        url="https://example.com/feed.rss",
        rate_limit=2.0,
        enabled=True
    ),
]
```

### AI判定キーワード
AI関連度判定に使用するキーワードをカスタマイズ可能：

```python
ai_keywords = AIKeywords(
    primary=["AI", "machine learning", "GPT", ...],
    secondary=["algorithm", "data science", ...],
    exclusions=["air", "aid", ...]
)
```

## 🔧 技術スタック

- **Python 3.11+**
- **主要ライブラリ**:
  - `requests` - HTTP通信
  - `feedparser` - RSS解析  
  - `pydantic` - データ検証
  - `jinja2` - テンプレート生成
  - `schedule` - タスクスケジューラー

## 📈 パフォーマンス

- **実行時間**: 2-5秒（標準設定）
- **メモリ使用量**: < 100MB
- **レート制限**: ソース毎1-2秒間隔
- **エラー回復**: 1つのソース失敗時も継続動作

## 🛠️ トラブルシューティング

### よくある問題

1. **Hacker News API 401エラー**
   ```
   解決策: RSSソースが正常動作するため、システム全体に影響なし
   ```

2. **RSS解析エラー**
   ```
   解決策: エラーハンドリング実装済み。他ソースで補完
   ```

3. **AI関連記事が少ない**
   ```bash
   # 関連度閾値を下げる
   uv run python scripts/collect_ai_news.py --min-relevance 0.2
   ```

### ログ確認
```bash
# 詳細ログの確認
tail -f logs/ai_news_reporter.log

# エラーログのみ
grep ERROR logs/ai_news_reporter.log
```

## 🤝 開発・カスタマイズ

### 新しいコレクター追加
1. `src/ai_news_reporter/collectors/` に新しいコレクタークラスを作成
2. `BaseCollector` を継承
3. `collect()` メソッドを実装

### スコアリングアルゴリズム改善
`src/ai_news_reporter/utils/text_utils.py` の関数をカスタマイズ：
- `calculate_ai_relevance_score()` - AI関連度計算
- `calculate_importance_score()` - 重要度計算

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート

問題が発生した場合：
1. ログファイルを確認
2. 設定を見直し
3. 最新版への更新を確認

---

**🎯 本番環境での定期実行推奨**: 毎日朝夕2回の自動実行で、最新AI動向を継続的にキャッチアップできます。