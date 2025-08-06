"""RSSフィードコレクター"""

from datetime import datetime
from typing import List, Optional, Dict, Any
import feedparser
from dateutil.parser import parse as parse_date

from .base_collector import BaseCollector
from ..models.news_item import NewsItem, NewsSource
from ..utils.text_utils import calculate_ai_relevance_score, calculate_importance_score, clean_text
from config.settings import logger


class RSSCollector(BaseCollector):
    """RSSフィードからニュースを収集"""
    
    def __init__(self, feed_url: str, rate_limit: float = 2.0):
        # フィード名を URL から推定
        source_name = self._extract_source_name(feed_url)
        super().__init__(source_name, rate_limit)
        self.feed_url = feed_url
        
    def _extract_source_name(self, url: str) -> str:
        """URL からソース名を抽出"""
        if "venturebeat.com" in url:
            return "VentureBeat AI"
        elif "technologyreview.com" in url:
            return "MIT Technology Review"
        elif "towardsdatascience.com" in url:
            return "Towards Data Science"
        elif "ai.googleblog.com" in url:
            return "Google AI Blog"
        else:
            # ドメイン名から推定
            try:
                from urllib.parse import urlparse
                domain = urlparse(url).netloc
                return domain.replace("www.", "").replace(".com", "").title()
            except:
                return "RSS Feed"
    
    def get_source_type(self) -> NewsSource:
        return NewsSource.RSS_FEED
    
    def _parse_feed(self) -> Optional[feedparser.FeedParserDict]:
        """RSSフィードを解析"""
        try:
            logger.debug(f"Parsing RSS feed: {self.feed_url}")
            
            # requests を使用してレスポンスを取得し、feedparserに渡す
            response = self._make_request(self.feed_url)
            if not response:
                logger.error(f"Failed to fetch RSS feed: {self.feed_url}")
                return None
            
            # Content-Typeのチェック
            content_type = response.headers.get('content-type', '').lower()
            if 'xml' not in content_type and 'rss' not in content_type and 'atom' not in content_type:
                logger.warning(f"Unexpected content type for RSS feed {self.feed_url}: {content_type}")
                # HTMLレスポンスの場合はスキップ
                if 'html' in content_type:
                    logger.warning(f"RSS feed returned HTML instead of XML: {self.feed_url}")
                    return None
            
            # feedparserで解析
            try:
                feed = feedparser.parse(response.content)
            except Exception as parse_error:
                logger.error(f"feedparser failed to parse {self.feed_url}: {parse_error}")
                return None
            
            # フィード解析の成功/失敗をチェック
            if hasattr(feed, 'bozo') and feed.bozo:
                bozo_msg = str(feed.bozo_exception) if hasattr(feed, 'bozo_exception') else "unknown error"
                logger.warning(f"RSS feed parsing warning for {self.feed_url}: {bozo_msg}")
                
                # 軽微なエラーは無視、深刻なエラーはスキップ
                serious_errors = ['not well-formed', 'syntax error', 'no element found']
                if any(error in bozo_msg.lower() for error in serious_errors) and not feed.entries:
                    logger.error(f"Serious parse error for {self.feed_url}, skipping")
                    return None
            
            if not feed.entries:
                logger.warning(f"No entries found in RSS feed: {self.feed_url}")
                return None
            
            logger.debug(f"Successfully parsed RSS feed with {len(feed.entries)} entries")
            return feed
            
        except Exception as e:
            logger.error(f"Failed to parse RSS feed {self.feed_url}: {e}", exc_info=True)
            return None
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """日付文字列をパース"""
        if not date_str:
            return None
            
        try:
            # feedparserが返すtime.struct_timeの場合
            if hasattr(date_str, 'tm_year'):
                import time
                timestamp = time.mktime(date_str)
                return datetime.fromtimestamp(timestamp)
            
            # 文字列の場合
            if isinstance(date_str, str):
                return parse_date(date_str)
                
            return None
        except Exception as e:
            logger.debug(f"Failed to parse date '{date_str}': {e}")
            return None
    
    def _create_news_item(self, entry: Dict[str, Any]) -> Optional[NewsItem]:
        """RSS entry から NewsItem を作成"""
        try:
            # 必須フィールドのチェック
            title = entry.get('title', '').strip()
            link = entry.get('link', '').strip()
            
            if not title or not link:
                logger.debug(f"RSS entry missing title or link: {entry}")
                return None
            
            # 公開日時の取得（複数のフィールドを試行）
            published_at = None
            for date_field in ['published_parsed', 'updated_parsed', 'published', 'updated']:
                if date_field in entry:
                    published_at = self._parse_date(entry[date_field])
                    if published_at:
                        break
            
            # 公開日時が取得できない場合は現在時刻を使用
            if not published_at:
                published_at = datetime.now()
                logger.debug(f"Using current time for entry: {title[:50]}...")
            
            # 概要・本文の取得
            summary = clean_text(entry.get('summary', ''))
            content = clean_text(entry.get('content', [{}])[0].get('value', '') if entry.get('content') else '')
            
            # 著者の取得
            author = entry.get('author', '')
            if not author and 'authors' in entry and entry['authors']:
                author = entry['authors'][0].get('name', '')
            
            # タグの取得
            tags = []
            if 'tags' in entry:
                tags = [tag.get('term', '') for tag in entry['tags'] if tag.get('term')]
            
            # AI関連度とスコア計算
            text_for_analysis = f"{title} {summary} {content}"
            ai_relevance = calculate_ai_relevance_score(title, text_for_analysis)
            is_ai_related = ai_relevance >= 0.3
            
            # 重要度スコア（RSS記事は upvotes/comments がないので title ベースで計算）
            importance = calculate_importance_score(
                ai_relevance=ai_relevance,
                upvotes=0,
                comments_count=0,
                title_length=len(title)
            )
            
            news_item = NewsItem(
                title=title,
                url=link,
                source=self.get_source_type(),
                published_at=published_at,
                summary=summary if summary else None,
                content=content if content else None,
                author=author if author else None,
                tags=tags,
                ai_relevance_score=ai_relevance,
                importance_score=importance,
                is_ai_related=is_ai_related,
                source_id=entry.get('id', link)  # IDがない場合はURLを使用
            )
            
            return news_item
            
        except Exception as e:
            logger.error(f"Failed to create NewsItem from RSS entry: {e}")
            return None
    
    def collect(self, limit: int = 10) -> List[NewsItem]:
        """ニュースを収集"""
        logger.info(f"Collecting from RSS feed: {self.source_name} (limit: {limit})")
        
        # RSS フィードを解析
        feed = self._parse_feed()
        if not feed:
            logger.warning(f"Failed to parse RSS feed: {self.feed_url}")
            return []
        
        news_items = []
        
        # エントリーを処理
        for i, entry in enumerate(feed.entries[:limit * 2]):  # 余裕を持って多めに処理
            if len(news_items) >= limit:
                break
                
            news_item = self._create_news_item(entry)
            if news_item:
                news_items.append(news_item)
                logger.debug(f"Added RSS item: {news_item.title[:50]}... (AI: {news_item.ai_relevance_score:.2f})")
        
        logger.info(f"Collected {len(news_items)} items from RSS feed: {self.source_name}")
        return news_items