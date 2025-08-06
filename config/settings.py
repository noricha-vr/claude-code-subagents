"""アプリケーション設定"""

import logging
from pathlib import Path
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class LoggingConfig(BaseModel):
    """ログ設定"""
    level: str = Field("DEBUG", description="ログレベル")
    format: str = Field(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="ログフォーマット"
    )
    file_path: str = Field("logs/ai_news_reporter.log", description="ログファイルパス")
    max_bytes: int = Field(10 * 1024 * 1024, description="最大ログファイルサイズ（バイト）")
    backup_count: int = Field(5, description="ローテーション保持数")


class NewsSourceConfig(BaseModel):
    """ニュースソース設定"""
    name: str = Field(..., description="ソース名")
    url: str = Field(..., description="ソースURL")
    enabled: bool = Field(True, description="有効フラグ")
    rate_limit: float = Field(1.0, description="レート制限（秒間隔）")
    timeout: int = Field(30, description="タイムアウト（秒）")
    headers: Dict[str, str] = Field(default_factory=dict, description="HTTPヘッダー")


class AIKeywords(BaseModel):
    """AI関連キーワード設定"""
    primary: List[str] = Field(
        default_factory=lambda: [
            "artificial intelligence", "AI", "machine learning", "ML",
            "deep learning", "neural network", "GPT", "LLM", "ChatGPT",
            "OpenAI", "Google AI", "anthropic", "claude", "automation",
            "computer vision", "natural language processing", "NLP",
            "reinforcement learning", "generative AI", "AGI"
        ],
        description="主要AIキーワード"
    )
    secondary: List[str] = Field(
        default_factory=lambda: [
            "algorithm", "data science", "robotics", "autonomous",
            "intelligent", "cognitive", "prediction", "optimization",
            "pattern recognition", "speech recognition", "recommendation"
        ],
        description="副次的AIキーワード"
    )
    exclusions: List[str] = Field(
        default_factory=lambda: [
            "air", "aid", "aimed", "airline", "aiming"
        ],
        description="除外キーワード"
    )


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # 基本設定
    app_name: str = Field("AI News Reporter", description="アプリケーション名")
    version: str = Field("0.1.0", description="バージョン")
    debug: bool = Field(True, description="デバッグモード")
    
    # ログ設定
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    
    # ニュースソース設定
    news_sources: List[NewsSourceConfig] = Field(
        default_factory=lambda: [
            NewsSourceConfig(
                name="Hacker News",
                url="https://hacker-news.firebaseio.com/v0",
                rate_limit=1.0
            ),
            NewsSourceConfig(
                name="MIT Technology Review AI",
                url="https://www.technologyreview.com/topic/artificial-intelligence/feed/",
                rate_limit=2.0
            ),
            NewsSourceConfig(
                name="Towards Data Science",
                url="https://towardsdatascience.com/feed",
                rate_limit=2.0
            ),
            NewsSourceConfig(
                name="AI News",
                url="https://www.artificialintelligence-news.com/feed/",
                rate_limit=2.0
            ),
            NewsSourceConfig(
                name="Machine Learning Mastery",
                url="https://machinelearningmastery.com/feed/",
                rate_limit=2.0
            ),
            NewsSourceConfig(
                name="OpenAI Blog",
                url="https://openai.com/blog/rss.xml",
                rate_limit=3.0
            ),
            NewsSourceConfig(
                name="DeepMind Blog",
                url="https://deepmind.com/blog/feed/basic/",
                rate_limit=3.0
            ),
            NewsSourceConfig(
                name="Ars Technica AI",
                url="https://feeds.arstechnica.com/arstechnica/technology-lab",
                rate_limit=2.0
            ),
            NewsSourceConfig(
                name="WIRED AI",
                url="https://www.wired.com/feed/category/business/artificial-intelligence/latest/rss",
                rate_limit=2.0
            )
        ]
    )
    
    # AI判定設定
    ai_keywords: AIKeywords = Field(default_factory=AIKeywords)
    
    # レポート設定
    max_articles_per_report: int = Field(20, description="レポート最大記事数")
    min_ai_relevance_score: float = Field(0.3, description="最小AI関連度スコア")
    
    # 出力設定
    output_dir: str = Field("output", description="出力ディレクトリ")
    
    class Config:
        env_file = "env.local"
        env_prefix = "AI_NEWS_"
        case_sensitive = False


def setup_logging(config: LoggingConfig) -> logging.Logger:
    """ログ設定をセットアップ"""
    # logsディレクトリを作成
    log_path = Path(config.file_path)
    log_path.parent.mkdir(exist_ok=True)
    
    # ロガー設定
    logger = logging.getLogger("ai_news_reporter")
    logger.setLevel(getattr(logging, config.level.upper()))
    
    # 既存ハンドラーをクリア
    logger.handlers.clear()
    
    # コンソールハンドラー
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, config.level.upper()))
    console_formatter = logging.Formatter(config.format)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # ファイルハンドラー（ローテーション付き）
    from logging.handlers import RotatingFileHandler
    file_handler = RotatingFileHandler(
        config.file_path,
        maxBytes=config.max_bytes,
        backupCount=config.backup_count
    )
    file_handler.setLevel(getattr(logging, config.level.upper()))
    file_formatter = logging.Formatter(config.format)
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    return logger


# グローバル設定インスタンス
settings = Settings()
logger = setup_logging(settings.logging)