#!/usr/bin/env python3
"""
株価データモデルとyfinance設定のテストスクリプト
"""

import sys
import logging
from pathlib import Path

# プロジェクトルートをPATHに追加  
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.stock_reporter.models import StockPrice, IndexPrice, StockReportConfig
from src.stock_reporter.config import YFinanceConfig
from config.stock_settings import setup_stock_logger

def test_models():
    """データモデルの基本テスト"""
    logger = setup_stock_logger()
    
    logger.info("=== Step 002 - 株価データモデル・yfinance設定テスト ===")
    
    # StockReportConfigのテスト
    logger.info("1. StockReportConfig作成テスト")
    config = StockReportConfig()
    logger.info(f"対象指数: {config.target_indices}")
    logger.info(f"対象銘柄数: {len(config.target_stocks)}")
    logger.info(f"リトライ回数: {config.max_retries}")
    
    # 銘柄コード検証テスト
    logger.info("2. 銘柄コード検証テスト")
    test_symbols = ["7203.T", "^N225", "INVALID", ""]
    for symbol in test_symbols:
        is_valid = YFinanceConfig.validate_symbol(symbol)
        logger.info(f"  {symbol or '(空文字)'}: {'有効' if is_valid else '無効'}")
    
    # yfinanceからデータ取得テスト（トヨタ自動車）
    logger.info("3. yfinanceデータ取得テスト（7203.T - トヨタ自動車）")
    try:
        stock_data = YFinanceConfig.get_stock_data("7203.T", period="2d")
        if stock_data:
            stock_model = YFinanceConfig.create_stock_price(stock_data)
            if stock_model:
                logger.info(f"  銘柄名: {stock_model.name}")
                logger.info(f"  現在価格: {stock_model.current_price}円")
                logger.info(f"  前日比: {stock_model.change_amount}円 ({stock_model.change_percent:.2f}%)")
                logger.info(f"  出来高: {stock_model.volume:,}株" if stock_model.volume else "  出来高: データなし")
            else:
                logger.error("  StockPriceモデルの作成に失敗")
        else:
            logger.warning("  株価データの取得に失敗")
    except Exception as e:
        logger.error(f"  株価データ取得エラー: {e}")
    
    # 日経平均指数テスト
    logger.info("4. 指数データ取得テスト（^N225 - 日経平均）")
    try:
        index_data = YFinanceConfig.get_index_data("^N225", period="2d")
        if index_data:
            index_model = YFinanceConfig.create_index_price(index_data)
            if index_model:
                logger.info(f"  指数名: {index_model.name}")
                logger.info(f"  現在値: {index_model.current_value}ポイント")
                logger.info(f"  前日比: {index_model.change_amount}ポイント ({index_model.change_percent:.2f}%)")
            else:
                logger.error("  IndexPriceモデルの作成に失敗")
        else:
            logger.warning("  指数データの取得に失敗")
    except Exception as e:
        logger.error(f"  指数データ取得エラー: {e}")
    
    logger.info("=== Step 002 テスト完了 ===")

if __name__ == "__main__":
    test_models()