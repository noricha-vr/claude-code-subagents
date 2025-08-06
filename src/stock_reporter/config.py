"""
株価レポートシステム設定モジュール
"""

# 設定ファイルの場所をconfigディレクトリから import
import sys
from pathlib import Path

# プロジェクトルートをPATHに追加
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from config.stock_settings import StockSettings, StockSymbol, setup_stock_logger

__all__ = ["StockSettings", "StockSymbol", "setup_stock_logger"]