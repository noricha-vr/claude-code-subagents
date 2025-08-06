#!/usr/bin/env python3
"""AI ニュース収集メインスクリプト"""

import sys
import argparse
from pathlib import Path
from datetime import datetime
from typing import List

# プロジェクトルートをPATHに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ai_news_reporter.collectors import HackerNewsCollector, RSSCollector, WebSearchCollector
from src.ai_news_reporter.processors import NewsProcessor
from src.ai_news_reporter.generators import ReportGenerator
from src.ai_news_reporter.models import NewsItem, NewsReport, ReportConfig
from config.settings import settings, logger


def create_collectors(include_web_search: bool = True) -> List:
    """設定に基づいてコレクターを作成"""
    collectors = []
    
    for source_config in settings.news_sources:
        if not source_config.enabled:
            continue
            
        try:
            if "hacker-news" in source_config.url or "firebaseio.com" in source_config.url:
                collector = HackerNewsCollector(rate_limit=source_config.rate_limit)
            else:
                # RSS フィード
                collector = RSSCollector(
                    feed_url=source_config.url,
                    rate_limit=source_config.rate_limit
                )
            
            collectors.append(collector)
            logger.info(f"Created collector: {collector.source_name}")
            
        except Exception as e:
            logger.error(f"Failed to create collector for {source_config.name}: {e}")
    
    # Web検索コレクターを追加
    if include_web_search:
        try:
            web_collector = WebSearchCollector(rate_limit=5.0)
            collectors.append(web_collector)
            logger.info(f"Created collector: {web_collector.source_name}")
        except Exception as e:
            logger.error(f"Failed to create web search collector: {e}")
    
    return collectors


def collect_news(collectors: List, limit_per_source: int = 10) -> List[NewsItem]:
    """すべてのコレクターからニュースを収集"""
    all_news = []
    total_collectors = len(collectors)
    
    logger.info(f"Starting collection from {total_collectors} sources...")
    
    for i, collector in enumerate(collectors, 1):
        try:
            progress = f"[{i}/{total_collectors}]"
            logger.info(f"{progress} Collecting from {collector.source_name}...")
            
            news_items = collector.collect(limit=limit_per_source)
            all_news.extend(news_items)
            
            success_msg = f"{progress} ✓ Collected {len(news_items)} items from {collector.source_name}"
            logger.info(success_msg)
            
        except Exception as e:
            error_msg = f"{progress} ✗ Failed to collect from {collector.source_name}: {e}"
            logger.error(error_msg)
            continue
    
    logger.info(f"📊 Collection complete: {len(all_news)} total items from {total_collectors} sources")
    return all_news


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(description="AI News Reporter - ニュース収集・レポート生成")
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="各ソースからの収集記事数の上限"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="output",
        help="出力ディレクトリ"
    )
    parser.add_argument(
        "--format",
        choices=["markdown", "html", "both"],
        default="both",
        help="出力フォーマット"
    )
    parser.add_argument(
        "--min-relevance",
        type=float,
        default=0.3,
        help="AI関連度の最小値"
    )
    parser.add_argument(
        "--max-articles",
        type=int,
        default=15,
        help="レポートの最大記事数"
    )
    
    args = parser.parse_args()
    
    logger.info("AI News Reporter を開始します")
    logger.info(f"設定: limit={args.limit}, format={args.format}, min_relevance={args.min_relevance}")
    
    try:
        # 1. コレクターを作成
        collectors = create_collectors()
        if not collectors:
            logger.error("利用可能なコレクターがありません")
            return 1
        
        # 2. ニュースを収集
        news_items = collect_news(collectors, limit_per_source=args.limit)
        if not news_items:
            logger.warning("収集されたニュース記事がありません")
            return 1
        
        # 3. レポート設定を作成
        report_config = ReportConfig(
            max_items=args.max_articles,
            min_ai_relevance=args.min_relevance,
            output_format=args.format
        )
        
        # 4. ニュースを処理
        processor = NewsProcessor(config=report_config)
        report = processor.create_report(news_items)
        
        if not report.top_stories:
            logger.warning("AI関連記事が見つかりませんでした")
            return 1
        
        # 5. レポートを生成
        generator = ReportGenerator()
        output_dir = Path(args.output)
        output_dir.mkdir(exist_ok=True)
        
        # ファイル名を作成（日時付き）
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if args.format in ["markdown", "both"]:
            markdown_path = output_dir / f"ai_news_report_{timestamp}.md"
            generator.save_report(report, str(markdown_path), "markdown")
        
        if args.format in ["html", "both"]:
            html_path = output_dir / f"ai_news_report_{timestamp}.html"
            generator.save_report(report, str(html_path), "html")
        
        # 結果サマリーを表示
        logger.info("=" * 50)
        logger.info("レポート生成完了!")
        logger.info(f"トップ記事数: {len(report.top_stories)}")
        logger.info(f"総記事数: {report.total_collected}")
        logger.info(f"AI関連記事数: {report.ai_related_count}")
        logger.info(f"利用ソース数: {report.sources_count}")
        
        if report.top_stories:
            logger.info("\n最高スコア記事:")
            top_article = report.top_stories[0]
            logger.info(f"  タイトル: {top_article.title}")
            logger.info(f"  重要度: {top_article.importance_score:.2f}")
            logger.info(f"  AI関連度: {top_article.ai_relevance_score:.2f}")
            logger.info(f"  ソース: {top_article.source.value}")
        
        logger.info("=" * 50)
        return 0
        
    except KeyboardInterrupt:
        logger.info("処理を中断しました")
        return 1
        
    except Exception as e:
        logger.error(f"予期しないエラーが発生しました: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())