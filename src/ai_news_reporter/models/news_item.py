"""ニュースアイテムのデータモデル定義"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl


class NewsSource(str, Enum):
    """ニュースソースの種類"""
    HACKER_NEWS = "hacker_news"
    RSS_FEED = "rss_feed"
    REDDIT = "reddit"
    WEB_SEARCH = "web_search"


class NewsItem(BaseModel):
    """ニュース記事のデータモデル"""
    
    title: str = Field(..., description="記事タイトル")
    url: HttpUrl = Field(..., description="記事URL")
    source: NewsSource = Field(..., description="ニュースソース")
    published_at: datetime = Field(..., description="公開日時")
    
    # オプショナルフィールド
    summary: Optional[str] = Field(None, description="記事概要")
    content: Optional[str] = Field(None, description="記事本文")
    author: Optional[str] = Field(None, description="著者")
    tags: List[str] = Field(default_factory=list, description="タグ")
    
    # AI判定・スコアリング用
    ai_relevance_score: float = Field(0.0, ge=0.0, le=1.0, description="AI関連度スコア")
    importance_score: float = Field(0.0, ge=0.0, le=1.0, description="重要度スコア")
    is_ai_related: bool = Field(False, description="AI関連記事かどうか")
    
    # メタデータ
    source_id: Optional[str] = Field(None, description="ソース固有のID")
    comments_count: Optional[int] = Field(None, description="コメント数")
    upvotes: Optional[int] = Field(None, description="アップボート数")
    
    class Config:
        """Pydanticの設定"""
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
        
    def __str__(self) -> str:
        return f"NewsItem(title='{self.title[:50]}...', source={self.source.value})"
        
    def __repr__(self) -> str:
        return self.__str__()