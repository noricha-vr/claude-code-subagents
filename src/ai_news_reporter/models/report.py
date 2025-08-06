"""レポートのデータモデル定義"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from .news_item import NewsItem


class ReportConfig(BaseModel):
    """レポート生成の設定"""
    
    max_items: int = Field(10, ge=1, le=100, description="最大記事数")
    min_ai_relevance: float = Field(0.5, ge=0.0, le=1.0, description="最小AI関連度")
    include_summary: bool = Field(True, description="概要を含むかどうか")
    language: str = Field("ja", description="レポート言語（ja=日本語）")
    output_format: str = Field("markdown", description="出力フォーマット（markdown/html）")


class NewsReport(BaseModel):
    """ニュースレポートのデータモデル"""
    
    generated_at: datetime = Field(default_factory=datetime.now, description="生成日時")
    title: str = Field("AIニュース日報", description="レポートタイトル")
    
    # ニュースデータ
    top_stories: List[NewsItem] = Field(default_factory=list, description="トップストーリー")
    all_stories: List[NewsItem] = Field(default_factory=list, description="全ストーリー")
    
    # 統計情報
    total_collected: int = Field(0, description="総収集記事数")
    ai_related_count: int = Field(0, description="AI関連記事数")
    sources_count: int = Field(0, description="使用ソース数")
    
    # レポート設定
    config: ReportConfig = Field(default_factory=ReportConfig, description="生成設定")
    
    class Config:
        """Pydanticの設定"""
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
    
    @property
    def formatted_date(self) -> str:
        """フォーマット済み日付を返す"""
        return self.generated_at.strftime("%Y年%m月%d日 %H:%M")
    
    def add_story(self, item: NewsItem) -> None:
        """ストーリーを追加"""
        self.all_stories.append(item)
        if item.is_ai_related and item.ai_relevance_score >= self.config.min_ai_relevance:
            self.top_stories.append(item)
    
    def sort_by_importance(self) -> None:
        """重要度でソート"""
        self.top_stories.sort(key=lambda x: x.importance_score, reverse=True)
        self.all_stories.sort(key=lambda x: x.importance_score, reverse=True)
    
    def update_stats(self) -> None:
        """統計情報を更新"""
        self.total_collected = len(self.all_stories)
        self.ai_related_count = len([item for item in self.all_stories if item.is_ai_related])
        self.sources_count = len(set(item.source for item in self.all_stories))