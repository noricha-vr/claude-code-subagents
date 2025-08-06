"""データモデル定義

AI News Reporterで使用するすべてのデータ構造をPydanticのBaseModelで定義。
バリデーション、シリアライゼーション、型安全性を提供。
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from pydantic import BaseModel, Field, HttpUrl, field_validator


class SourceType(str, Enum):
    """ニュースソースの種類"""
    RSS = "rss"
    API = "api"
    SCRAPING = "scraping"


class NewsCategory(str, Enum):
    """AIニュースのカテゴリ"""
    GENERAL = "general"
    MACHINE_LEARNING = "machine_learning"
    NATURAL_LANGUAGE_PROCESSING = "nlp"
    COMPUTER_VISION = "computer_vision"
    ROBOTICS = "robotics"
    RESEARCH = "research"
    INDUSTRY = "industry"
    ETHICS = "ethics"
    TOOLS = "tools"


class ImportanceLevel(str, Enum):
    """重要度レベル"""
    CRITICAL = "critical"    # 業界に大きな影響
    HIGH = "high"           # 注目すべき内容
    MEDIUM = "medium"       # 一般的な興味
    LOW = "low"             # 補足的な情報


class NewsSource(BaseModel):
    """ニュースソース設定"""
    name: str = Field(..., description="ソース名")
    url: HttpUrl = Field(..., description="ソースURL")
    source_type: SourceType = Field(..., description="ソースの種類")
    enabled: bool = Field(default=True, description="有効/無効")
    priority: int = Field(default=5, ge=1, le=10, description="優先度(1-10)")
    update_interval_minutes: int = Field(default=60, ge=5, description="更新間隔(分)")
    
    # API固有の設定
    api_key: Optional[str] = Field(default=None, description="APIキー")
    api_headers: Optional[Dict[str, str]] = Field(default=None, description="APIヘッダー")
    
    # スクレイピング固有の設定
    selectors: Optional[Dict[str, str]] = Field(default=None, description="CSSセレクター")
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v: HttpUrl) -> HttpUrl:
        """URLの妥当性検証"""
        parsed = urlparse(str(v))
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("Invalid URL format")
        return v


class NewsItem(BaseModel):
    """ニュースアイテム"""
    title: str = Field(..., description="タイトル")
    url: HttpUrl = Field(..., description="記事URL")
    description: Optional[str] = Field(default=None, description="記事の説明")
    content: Optional[str] = Field(default=None, description="記事の内容")
    author: Optional[str] = Field(default=None, description="著者")
    source_name: str = Field(..., description="ソース名")
    published_at: Optional[datetime] = Field(default=None, description="公開日時")
    
    # 分析結果
    category: Optional[NewsCategory] = Field(default=None, description="カテゴリ")
    importance: Optional[ImportanceLevel] = Field(default=None, description="重要度")
    keywords: List[str] = Field(default_factory=list, description="キーワード")
    score: Optional[float] = Field(default=None, ge=0, le=100, description="スコア(0-100)")
    
    # メタデータ
    language: str = Field(default="en", description="言語")
    word_count: Optional[int] = Field(default=None, ge=0, description="文字数")
    collected_at: datetime = Field(default_factory=datetime.now, description="収集日時")
    processed_at: Optional[datetime] = Field(default=None, description="処理日時")
    
    # 重複排除用
    content_hash: Optional[str] = Field(default=None, description="コンテンツハッシュ")
    
    def __hash__(self) -> int:
        """重複排除のためのハッシュ"""
        return hash((str(self.url), self.title))
    
    def __eq__(self, other: object) -> bool:
        """重複排除のための等価比較"""
        if not isinstance(other, NewsItem):
            return False
        return str(self.url) == str(other.url) or self.title == other.title


class ReportSection(BaseModel):
    """レポートセクション"""
    title: str = Field(..., description="セクションタイトル")
    news_items: List[NewsItem] = Field(..., description="ニュースアイテムリスト")
    summary: Optional[str] = Field(default=None, description="セクション要約")


class Report(BaseModel):
    """生成レポート"""
    title: str = Field(..., description="レポートタイトル")
    generated_at: datetime = Field(default_factory=datetime.now, description="生成日時")
    period_start: datetime = Field(..., description="対象期間開始")
    period_end: datetime = Field(..., description="対象期間終了")
    
    # レポート構成
    summary: Optional[str] = Field(default=None, description="全体サマリー")
    sections: List[ReportSection] = Field(..., description="レポートセクション")
    
    # 統計情報
    total_news_count: int = Field(default=0, ge=0, description="総ニュース数")
    sources_used: List[str] = Field(default_factory=list, description="使用ソース")
    top_keywords: List[str] = Field(default_factory=list, description="上位キーワード")
    
    # 出力設定
    format: str = Field(default="markdown", description="出力フォーマット")
    language: str = Field(default="ja", description="出力言語")
    
    @field_validator('sections')
    @classmethod
    def validate_sections(cls, v: List[ReportSection]) -> List[ReportSection]:
        """セクションの妥当性検証"""
        if not v:
            raise ValueError("At least one section is required")
        return v


class ProcessingStats(BaseModel):
    """処理統計情報"""
    total_sources_checked: int = Field(default=0, ge=0)
    successful_sources: int = Field(default=0, ge=0)
    failed_sources: int = Field(default=0, ge=0)
    total_items_collected: int = Field(default=0, ge=0)
    duplicates_removed: int = Field(default=0, ge=0)
    items_after_filtering: int = Field(default=0, ge=0)
    processing_time_seconds: float = Field(default=0.0, ge=0)
    
    errors: List[str] = Field(default_factory=list, description="エラーログ")
    warnings: List[str] = Field(default_factory=list, description="警告ログ")


class CollectionResult(BaseModel):
    """収集結果"""
    success: bool = Field(..., description="収集成功フラグ")
    news_items: List[NewsItem] = Field(default_factory=list, description="収集したニュース")
    source_name: str = Field(..., description="ソース名")
    collected_at: datetime = Field(default_factory=datetime.now, description="収集日時")
    error_message: Optional[str] = Field(default=None, description="エラーメッセージ")
    processing_time: float = Field(default=0.0, ge=0, description="処理時間(秒)")


# 設定用のモデル群
class FilterConfig(BaseModel):
    """フィルタリング設定"""
    min_score: float = Field(default=20.0, ge=0, le=100, description="最小スコア")
    max_age_hours: int = Field(default=168, ge=1, description="最大経過時間(時間)")  # 7日
    exclude_keywords: List[str] = Field(default_factory=list, description="除外キーワード")
    require_keywords: List[str] = Field(default_factory=list, description="必須キーワード")
    min_word_count: int = Field(default=50, ge=0, description="最小文字数")
    max_news_per_source: int = Field(default=10, ge=1, description="ソース別最大ニュース数")


class ScoringConfig(BaseModel):
    """スコアリング設定"""
    keyword_weights: Dict[str, float] = Field(
        default_factory=lambda: {
            "AI": 5.0,
            "machine learning": 4.0,
            "neural network": 4.0,
            "deep learning": 4.0,
            "ChatGPT": 3.0,
            "OpenAI": 3.0,
            "Google": 2.0,
            "research": 2.0,
        },
        description="キーワード重み"
    )
    
    source_weights: Dict[str, float] = Field(
        default_factory=lambda: {
            "arxiv": 4.0,
            "openai": 4.0,
            "google": 3.5,
            "microsoft": 3.0,
            "techcrunch": 2.5,
            "default": 1.0,
        },
        description="ソース重み"
    )
    
    recency_weight: float = Field(default=2.0, ge=0, description="新しさの重み")
    length_weight: float = Field(default=1.0, ge=0, description="長さの重み")