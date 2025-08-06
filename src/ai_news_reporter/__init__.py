"""
AI News Reporter - AIニュース自動収集・レポート生成システム

複数のニュースソースからAI関連ニュースを収集し、
重要度ランキング付きの日本語レポートを生成します。
"""

__version__ = "0.1.0"
__author__ = "Claude Code Agent"

from .models.news_item import NewsItem
from .models.report import NewsReport

__all__ = ["NewsItem", "NewsReport"]