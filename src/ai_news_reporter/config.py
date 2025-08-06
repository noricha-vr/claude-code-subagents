"""設定管理モジュール

Pydantic Settingsを使用した環境変数対応の設定管理。
開発・本番環境での設定の切り替えをサポート。
"""

from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from .models import FilterConfig, NewsSource, ScoringConfig, SourceType


class Settings(BaseSettings):
    """アプリケーション設定
    
    環境変数から設定値を読み込み、デフォルト値と組み合わせて使用。
    環境変数の接頭辞は 'AI_NEWS_' を使用。
    """
    
    model_config = SettingsConfigDict(
        env_prefix="AI_NEWS_",
        env_file=".env.local",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # 基本設定
    debug: bool = Field(default=True, description="デバッグモード")
    log_level: str = Field(default="DEBUG", description="ログレベル")
    
    # ログ設定
    log_file: str = Field(default="ai_news_reporter.log", description="ログファイル名")
    logs_dir: str = Field(default="logs", description="ログディレクトリ")
    enable_file_logging: bool = Field(default=True, description="ファイルログ有効")
    enable_console_logging: bool = Field(default=True, description="コンソールログ有効")
    
    # データベース・ストレージ設定
    data_dir: str = Field(default="data", description="データディレクトリ")
    reports_dir: str = Field(default="reports", description="レポート出力ディレクトリ")
    cache_dir: str = Field(default="cache", description="キャッシュディレクトリ")
    
    # 収集設定
    max_workers: int = Field(default=5, ge=1, le=20, description="最大ワーカー数")
    request_timeout: int = Field(default=30, ge=5, description="リクエストタイムアウト(秒)")
    retry_attempts: int = Field(default=3, ge=1, description="リトライ回数")
    retry_delay: float = Field(default=1.0, ge=0.1, description="リトライ遅延(秒)")
    
    # フィルタリング・スコアリング設定
    filter_config: FilterConfig = Field(default_factory=FilterConfig)
    scoring_config: ScoringConfig = Field(default_factory=ScoringConfig)
    
    # レポート生成設定
    report_title_template: str = Field(
        default="AIニュースレポート - {date}",
        description="レポートタイトルテンプレート"
    )
    report_format: str = Field(default="markdown", description="レポートフォーマット")
    report_language: str = Field(default="ja", description="レポート言語")
    max_news_per_section: int = Field(default=10, ge=1, description="セクション別最大ニュース数")
    
    # スケジュール設定
    enable_scheduler: bool = Field(default=False, description="スケジューラー有効")
    schedule_time: str = Field(default="09:00", description="実行時刻 (HH:MM)")
    schedule_days: List[str] = Field(
        default_factory=lambda: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        description="実行曜日"
    )
    
    # 外部API設定
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI APIキー")
    news_api_key: Optional[str] = Field(default=None, description="News APIキー")
    
    # 通知設定
    enable_notifications: bool = Field(default=False, description="通知有効")
    slack_webhook_url: Optional[str] = Field(default=None, description="Slack Webhook URL")
    email_smtp_server: Optional[str] = Field(default=None, description="SMTPサーバー")
    email_smtp_port: int = Field(default=587, description="SMTPポート")
    email_username: Optional[str] = Field(default=None, description="メールユーザー名")
    email_password: Optional[str] = Field(default=None, description="メールパスワード")
    email_to: Optional[str] = Field(default=None, description="送信先メールアドレス")
    
    @field_validator('log_level')
    @classmethod
    def validate_log_level(cls, v):
        """ログレベルの妥当性検証"""
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in valid_levels:
            raise ValueError(f"Invalid log level. Must be one of: {valid_levels}")
        return v.upper()
    
    @field_validator('report_format')
    @classmethod
    def validate_report_format(cls, v):
        """レポートフォーマットの妥当性検証"""
        valid_formats = ['markdown', 'html', 'json']
        if v.lower() not in valid_formats:
            raise ValueError(f"Invalid report format. Must be one of: {valid_formats}")
        return v.lower()
    
    @field_validator('schedule_time')
    @classmethod
    def validate_schedule_time(cls, v):
        """スケジュール時刻の妥当性検証"""
        try:
            hours, minutes = map(int, v.split(':'))
            if not (0 <= hours <= 23 and 0 <= minutes <= 59):
                raise ValueError()
        except (ValueError, AttributeError):
            raise ValueError("Invalid time format. Use HH:MM format (e.g., '09:00')")
        return v
    
    def create_directories(self) -> None:
        """必要なディレクトリを作成"""
        directories = [
            self.data_dir,
            self.reports_dir,
            self.cache_dir,
            self.logs_dir,
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)


def get_default_news_sources() -> List[NewsSource]:
    """デフォルトのニュースソース設定を取得"""
    return [
        NewsSource(
            name="Hacker News AI",
            url="https://hnrss.org/newest?q=AI+OR+machine+learning",
            source_type=SourceType.RSS,
            priority=8,
            update_interval_minutes=30,
        ),
        NewsSource(
            name="ArXiv CS.AI",
            url="http://export.arxiv.org/rss/cs.AI",
            source_type=SourceType.RSS,
            priority=9,
            update_interval_minutes=60,
        ),
        NewsSource(
            name="MIT Technology Review AI",
            url="https://www.technologyreview.com/topic/artificial-intelligence/feed/",
            source_type=SourceType.RSS,
            priority=7,
            update_interval_minutes=120,
        ),
        NewsSource(
            name="TechCrunch AI",
            url="https://techcrunch.com/category/artificial-intelligence/feed/",
            source_type=SourceType.RSS,
            priority=6,
            update_interval_minutes=60,
        ),
        NewsSource(
            name="Google AI Blog",
            url="https://ai.googleblog.com/feeds/posts/default",
            source_type=SourceType.RSS,
            priority=8,
            update_interval_minutes=240,
        ),
        NewsSource(
            name="OpenAI Blog",
            url="https://openai.com/blog/rss.xml",
            source_type=SourceType.RSS,
            priority=9,
            update_interval_minutes=480,
        ),
        NewsSource(
            name="DeepMind Blog",
            url="https://deepmind.com/blog/feed/basic/",
            source_type=SourceType.RSS,
            priority=8,
            update_interval_minutes=480,
        ),
        NewsSource(
            name="AI News - The Next Web",
            url="https://thenextweb.com/artificial-intelligence/feed/",
            source_type=SourceType.RSS,
            priority=5,
            update_interval_minutes=120,
        ),
    ]


def load_news_sources_from_file(file_path: str = "news_sources.json") -> List[NewsSource]:
    """JSONファイルからニュースソース設定を読み込み
    
    Args:
        file_path: 設定ファイルパス
        
    Returns:
        List[NewsSource]: ニュースソースのリスト
    """
    import json
    from pathlib import Path
    
    config_file = Path(file_path)
    if not config_file.exists():
        # デフォルト設定でファイルを作成
        default_sources = get_default_news_sources()
        sources_data = [source.model_dump() for source in default_sources]
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(sources_data, f, indent=2, ensure_ascii=False, default=str)
        
        return default_sources
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            sources_data = json.load(f)
        
        return [NewsSource(**source_data) for source_data in sources_data]
    
    except (json.JSONDecodeError, ValidationError) as e:
        print(f"設定ファイル読み込みエラー: {e}")
        print("デフォルト設定を使用します")
        return get_default_news_sources()


def save_news_sources_to_file(sources: List[NewsSource], file_path: str = "news_sources.json") -> None:
    """ニュースソース設定をJSONファイルに保存
    
    Args:
        sources: ニュースソースのリスト
        file_path: 保存先ファイルパス
    """
    import json
    
    sources_data = [source.model_dump() for source in sources]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(sources_data, f, indent=2, ensure_ascii=False, default=str)


# グローバル設定インスタンス
settings = Settings()

# 初期化時にディレクトリを作成
settings.create_directories()


if __name__ == "__main__":
    # 設定の確認とテスト
    print("=== AI News Reporter 設定 ===")
    print(f"デバッグモード: {settings.debug}")
    print(f"ログレベル: {settings.log_level}")
    print(f"データディレクトリ: {settings.data_dir}")
    print(f"レポートディレクトリ: {settings.reports_dir}")
    print(f"最大ワーカー数: {settings.max_workers}")
    print(f"スケジューラー有効: {settings.enable_scheduler}")
    
    # デフォルトニュースソースの表示
    print("\n=== デフォルトニュースソース ===")
    sources = get_default_news_sources()
    for i, source in enumerate(sources, 1):
        print(f"{i}. {source.name} ({source.source_type.value}) - Priority: {source.priority}")
    
    # 設定ファイルの作成テスト
    print("\n=== 設定ファイル作成テスト ===")
    try:
        save_news_sources_to_file(sources, "test_news_sources.json")
        print("設定ファイル作成成功: test_news_sources.json")
        
        # 読み込みテスト
        loaded_sources = load_news_sources_from_file("test_news_sources.json")
        print(f"設定ファイル読み込み成功: {len(loaded_sources)}個のソースを読み込み")
        
    except Exception as e:
        print(f"設定ファイルテストエラー: {e}")