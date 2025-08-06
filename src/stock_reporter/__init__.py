"""
株価レポートシステム

日本の主要株価指数と銘柄を自動収集し、市場サマリーをHTML形式で出力するシステム。
"""

from .config import YFinanceConfig

__version__ = "0.1.0"
__all__ = ["YFinanceConfig"]