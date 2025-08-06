#!/usr/bin/env python3
"""
株価データ収集スクリプト

Usage:
    python scripts/collect_stock_data.py
    uv run scripts/collect_stock_data.py
"""

import asyncio
import sys
from datetime import datetime
from pathlib import Path

# プロジェクトルートをPATHに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.stock_reporter.config import setup_stock_logger, StockSettings

logger = setup_stock_logger()


async def main() -> None:
    """メイン処理"""
    logger.info("株価データ収集を開始")
    
    try:
        settings = StockSettings()
        logger.info(f"設定読み込み完了: ログファイル={settings.log_file}")
        
        # 出力ディレクトリの作成
        settings.output_dir.mkdir(exist_ok=True)
        
        # 現在のタイムスタンプ
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        logger.info(f"実行時刻: {timestamp}")
        
        # 主要指数の一覧表示
        logger.info(f"監視対象指数: {list(settings.major_indices.keys())}")
        logger.info(f"監視対象銘柄数: {len(settings.major_stocks)}")
        
        # 設定の表示
        logger.info(f"リトライ回数: {settings.retry_count}")
        logger.info(f"タイムアウト: {settings.request_timeout}秒")
        
        logger.info("株価データ収集が完了（Step 002以降で実装予定）")
        
    except Exception as e:
        logger.error(f"株価データ収集でエラーが発生: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())