"""ニュース処理・フィルタリング機能"""

from typing import List
from datetime import datetime, timedelta

from ..models.news_item import NewsItem
from ..models.report import NewsReport, ReportConfig
from ..utils.text_utils import calculate_ai_relevance_score, calculate_importance_score
from config.settings import settings, logger


class NewsProcessor:
    """ニュース記事の処理とフィルタリング"""
    
    def __init__(self, config: ReportConfig = None):
        self.config = config or ReportConfig()
        
    def filter_ai_related(self, news_items: List[NewsItem]) -> List[NewsItem]:
        """AI関連記事をフィルタリング"""
        ai_items = []
        
        for item in news_items:
            # AI関連度が設定値以上の記事のみを通す
            if item.ai_relevance_score >= self.config.min_ai_relevance:
                item.is_ai_related = True
                ai_items.append(item)
                logger.debug(f"AI item: {item.title[:50]}... (score: {item.ai_relevance_score:.2f})")
            
        logger.info(f"Filtered {len(ai_items)} AI-related articles from {len(news_items)} total")
        return ai_items
        
    def remove_duplicates(self, news_items: List[NewsItem]) -> List[NewsItem]:
        """重複記事を除去"""
        seen_titles = set()
        unique_items = []
        
        for item in news_items:
            # タイトルの正規化（小文字化、前後空白除去）
            normalized_title = item.title.lower().strip()
            
            if normalized_title not in seen_titles:
                seen_titles.add(normalized_title)
                unique_items.append(item)
            else:
                logger.debug(f"Duplicate removed: {item.title[:50]}...")
        
        logger.info(f"Removed {len(news_items) - len(unique_items)} duplicate articles")
        return unique_items
    
    def sort_by_importance(self, news_items: List[NewsItem]) -> List[NewsItem]:
        """重要度でソート"""
        sorted_items = sorted(
            news_items, 
            key=lambda x: (x.importance_score, x.ai_relevance_score, x.published_at), 
            reverse=True
        )
        
        logger.info(f"Sorted {len(sorted_items)} articles by importance")
        return sorted_items
    
    def filter_by_date(self, news_items: List[NewsItem], days_back: int = 7) -> List[NewsItem]:
        """指定期間内の記事をフィルタリング"""
        cutoff_date = datetime.now() - timedelta(days=days_back)
        recent_items = [item for item in news_items if item.published_at >= cutoff_date]
        
        logger.info(f"Filtered {len(recent_items)} recent articles (last {days_back} days)")
        return recent_items
    
    def process_items(self, news_items: List[NewsItem]) -> List[NewsItem]:
        """記事の総合処理"""
        logger.info(f"Processing {len(news_items)} news items")
        
        # 1. 重複除去
        items = self.remove_duplicates(news_items)
        
        # 2. 最近の記事のみに絞る
        items = self.filter_by_date(items, days_back=7)
        
        # 3. AI関連記事をフィルタリング
        items = self.filter_ai_related(items)
        
        # 4. 重要度でソート
        items = self.sort_by_importance(items)
        
        # 5. 最大記事数に制限
        if len(items) > self.config.max_items:
            items = items[:self.config.max_items]
            logger.info(f"Limited to {self.config.max_items} articles")
        
        return items
    
    def create_report(self, news_items: List[NewsItem]) -> NewsReport:
        """NewsReportオブジェクトを作成"""
        processed_items = self.process_items(news_items)
        
        report = NewsReport(config=self.config)
        
        # ストーリーを追加
        for item in processed_items:
            report.add_story(item)
        
        # ソート
        report.sort_by_importance()
        
        # 統計情報を更新
        report.update_stats()
        
        logger.info(f"Created report with {len(report.top_stories)} top stories")
        return report