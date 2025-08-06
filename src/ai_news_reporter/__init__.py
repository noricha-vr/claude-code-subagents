"""AI News Reporter - 自動ニュースレポート生成システム

複数のソースから最新のAIニュースを自動収集し、重要度に基づいて選別・整理して、
日本語でわかりやすいレポートを生成する自動実行スクリプトシステム。
"""

__version__ = "0.1.0"
__author__ = "Claude Code Assistant"

from .models import NewsItem, Report, NewsSource
from .config import Settings
from .logger import setup_logger

__all__ = [
    "NewsItem",
    "Report", 
    "NewsSource",
    "Settings",
    "setup_logger",
]