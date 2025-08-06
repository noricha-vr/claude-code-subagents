"""Hacker News APIコレクター"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from urllib.parse import urljoin

from .base_collector import BaseCollector
from ..models.news_item import NewsItem, NewsSource
from ..utils.text_utils import calculate_ai_relevance_score, calculate_importance_score
from config.settings import logger


class HackerNewsCollector(BaseCollector):
    """Hacker News APIからニュースを収集"""
    
    def __init__(self, rate_limit: float = 1.0):
        super().__init__("Hacker News", rate_limit)
        self.base_url = "https://hacker-news.firebaseio.com/v0"
        # Hacker News API用のヘッダー設定を上書き
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        })
        
    def get_source_type(self) -> NewsSource:
        return NewsSource.HACKER_NEWS
    
    def _get_top_story_ids(self, limit: int = 50) -> List[int]:
        """トップストーリーのIDリストを取得"""
        url = urljoin(self.base_url, "topstories.json")
        response = self._make_request(url)
        
        if not response:
            logger.error("Failed to get top stories from Hacker News")
            return []
            
        try:
            story_ids = response.json()
            return story_ids[:limit] if isinstance(story_ids, list) else []
        except Exception as e:
            logger.error(f"Failed to parse top stories response: {e}")
            return []
    
    def _get_story_details(self, story_id: int) -> Optional[Dict[str, Any]]:
        """ストーリーの詳細を取得"""
        url = urljoin(self.base_url, f"item/{story_id}.json")
        response = self._make_request(url)
        
        if not response:
            return None
            
        try:
            return response.json()
        except Exception as e:
            logger.error(f"Failed to parse story {story_id}: {e}")
            return None
    
    def _create_news_item(self, story_data: Dict[str, Any]) -> Optional[NewsItem]:
        """ストーリーデータからNewsItemを作成"""
        try:
            # 必須フィールドのチェック
            if not all(key in story_data for key in ['title', 'url', 'time']):
                # URLがない場合はHacker Newsの記事ページを使用
                if 'url' not in story_data and 'id' in story_data:
                    story_data['url'] = f"https://news.ycombinator.com/item?id={story_data['id']}"
                else:
                    logger.debug(f"Story missing required fields: {story_data}")
                    return None
            
            # 公開日時の変換
            published_at = datetime.fromtimestamp(story_data['time'])
            
            # AI関連度とスコアの計算
            title = story_data.get('title', '')
            content = story_data.get('text', '')  # 本文がある場合
            
            ai_relevance = calculate_ai_relevance_score(title, content)
            is_ai_related = ai_relevance >= 0.3
            
            # 重要度スコアの計算
            importance = calculate_importance_score(
                ai_relevance=ai_relevance,
                upvotes=story_data.get('score', 0),
                comments_count=story_data.get('descendants', 0),
                title_length=len(title)
            )
            
            # NewsItem作成
            news_item = NewsItem(
                title=title,
                url=story_data['url'],
                source=self.get_source_type(),
                published_at=published_at,
                author=story_data.get('by'),
                ai_relevance_score=ai_relevance,
                importance_score=importance,
                is_ai_related=is_ai_related,
                source_id=str(story_data.get('id', '')),
                comments_count=story_data.get('descendants', 0),
                upvotes=story_data.get('score', 0)
            )
            
            return news_item
            
        except Exception as e:
            logger.error(f"Failed to create NewsItem from story data: {e}")
            return None
    
    def collect(self, limit: int = 10) -> List[NewsItem]:
        """ニュースを収集"""
        logger.info(f"Collecting from Hacker News (limit: {limit})")
        
        # トップストーリーIDを取得
        story_ids = self._get_top_story_ids(limit * 3)  # 余裕を持って多めに取得
        if not story_ids:
            logger.warning("No story IDs retrieved from Hacker News")
            return []
        
        news_items = []
        processed_count = 0
        
        for story_id in story_ids:
            if len(news_items) >= limit:
                break
                
            # ストーリー詳細を取得
            story_data = self._get_story_details(story_id)
            if not story_data:
                continue
                
            processed_count += 1
            
            # ストーリータイプのフィルタリング（story または job のみ）
            story_type = story_data.get('type')
            if story_type not in ['story', 'job']:
                continue
            
            # NewsItemを作成
            news_item = self._create_news_item(story_data)
            if news_item:
                news_items.append(news_item)
                logger.debug(f"Added story: {news_item.title[:50]}... (AI: {news_item.ai_relevance_score:.2f})")
        
        logger.info(f"Collected {len(news_items)} items from Hacker News (processed {processed_count})")
        return news_items