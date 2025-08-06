"""Web検索を使ったニュースコレクター"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import re

from .base_collector import BaseCollector
from ..models.news_item import NewsItem, NewsSource
from ..utils.text_utils import calculate_ai_relevance_score, calculate_importance_score, clean_text
from config.settings import logger


class WebSearchCollector(BaseCollector):
    """Web検索を使用してAI関連ニュースを収集"""
    
    def __init__(self, search_engine: str = "perplexity", rate_limit: float = 5.0):
        super().__init__("Web Search", rate_limit)
        self.search_engine = search_engine
        self.search_queries = [
            "AI artificial intelligence news today",
            "machine learning breakthrough 2025",
            "OpenAI ChatGPT latest news",
            "Google DeepMind new research",
            "LLM large language model news",
            "artificial general intelligence AGI progress",
            "AI robotics automation recent developments"
        ]
        
    def get_source_type(self) -> NewsSource:
        return NewsSource.WEB_SEARCH
    
    def _search_news(self, query: str, days_back: int = 7) -> List[Dict[str, Any]]:
        """指定したクエリでニュースを検索"""
        try:
            # 日付範囲を追加したクエリ
            time_query = f"Latest {query} news from the past {days_back} days with URLs and sources"
            
            logger.debug(f"Searching for: {time_query}")
            
            # このメソッドでは、外部のPerplexity検索を想定した結果解析を行う
            # 実際の検索は外部で実行されることを前提として、
            # 検索結果のパースロジックを提供する
            
            # 実装例として、検索結果の構造化データを返す
            # 実際の使用時は、外部APIやmcpツールから結果を取得する
            search_results = self._parse_search_results(time_query)
            
            return search_results
            
        except Exception as e:
            logger.error(f"Failed to search for '{query}': {e}")
            return []
    
    def _parse_search_results(self, query: str) -> List[Dict[str, Any]]:
        """検索結果をパース（実際の検索APIレスポンスを処理）"""
        try:
            # ここで実際にPerplexityまたは他の検索APIを呼び出す
            # 現在はサンプルデータを返すが、実装時は外部ツールと連携
            
            sample_results = [
                {
                    "title": "OpenAI Announces Major AI Research Breakthrough",
                    "url": "https://example-ai-news.com/openai-breakthrough",
                    "summary": "OpenAI has announced significant advancements in AI research with new language models showing improved reasoning capabilities.",
                    "published": datetime.now() - timedelta(hours=6),
                    "source": "AI Research News"
                },
                {
                    "title": "Google DeepMind Releases New AI Model for Scientific Research",
                    "url": "https://example-tech.com/deepmind-science-ai",
                    "summary": "DeepMind's latest AI model demonstrates unprecedented accuracy in scientific problem solving and research applications.",
                    "published": datetime.now() - timedelta(hours=12),
                    "source": "TechCrunch"
                }
            ]
            
            # 実際の検索を行うためのプレースホルダー
            # TODO: 外部ツール（Perplexity MCP）との連携を実装
            logger.info(f"Mock search executed for: {query}")
            
            return sample_results
            
        except Exception as e:
            logger.error(f"Failed to parse search results: {e}")
            return []
    
    def _create_news_item_from_search(self, result: Dict[str, Any]) -> Optional[NewsItem]:
        """検索結果からNewsItemを作成"""
        try:
            # 必須フィールドのチェック
            title = result.get('title', '').strip()
            url = result.get('url', '').strip()
            
            if not title or not url:
                logger.debug(f"Search result missing title or url: {result}")
                return None
            
            # 公開日時の処理
            published_at = result.get('published')
            if not published_at:
                published_at = datetime.now()
            elif isinstance(published_at, str):
                try:
                    from dateutil.parser import parse as parse_date
                    published_at = parse_date(published_at)
                except:
                    published_at = datetime.now()
            
            # 概要・本文の取得
            summary = clean_text(result.get('summary', ''))
            content = clean_text(result.get('content', ''))
            
            # AI関連度とスコア計算
            text_for_analysis = f"{title} {summary} {content}"
            ai_relevance = calculate_ai_relevance_score(title, text_for_analysis)
            is_ai_related = ai_relevance >= 0.3
            
            # 重要度スコア（Web検索結果は検索ランキングベースで計算）
            importance = calculate_importance_score(
                ai_relevance=ai_relevance,
                upvotes=0,
                comments_count=0,
                title_length=len(title)
            ) + 0.1  # Web検索結果には少しボーナスを付与
            
            news_item = NewsItem(
                title=title,
                url=url,
                source=self.get_source_type(),
                published_at=published_at,
                summary=summary if summary else None,
                content=content if content else None,
                author=result.get('source', 'Web Search'),
                ai_relevance_score=ai_relevance,
                importance_score=importance,
                is_ai_related=is_ai_related,
                source_id=url
            )
            
            return news_item
            
        except Exception as e:
            logger.error(f"Failed to create NewsItem from search result: {e}")
            return None
    
    def collect(self, limit: int = 10) -> List[NewsItem]:
        """Web検索を使用してニュースを収集"""
        logger.info(f"Collecting from Web Search (limit: {limit})")
        
        news_items = []
        items_per_query = max(1, limit // len(self.search_queries))
        
        for query in self.search_queries:
            if len(news_items) >= limit:
                break
                
            try:
                # 検索実行
                search_results = self._search_news(query)
                
                # 結果を処理
                for result in search_results[:items_per_query]:
                    if len(news_items) >= limit:
                        break
                        
                    news_item = self._create_news_item_from_search(result)
                    if news_item:
                        news_items.append(news_item)
                        logger.debug(f"Added search result: {news_item.title[:50]}... (AI: {news_item.ai_relevance_score:.2f})")
                        
                # レート制限の待機
                self._rate_limit_wait()
                
            except Exception as e:
                logger.error(f"Error processing search query '{query}': {e}")
                continue
        
        logger.info(f"Collected {len(news_items)} items from Web Search")
        return news_items