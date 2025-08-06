"""yfinance設定モジュール

yfinanceライブラリの設定とヘルパー関数を定義
"""

import yfinance as yf
import pandas as pd
from typing import Dict, List, Optional, Any
from decimal import Decimal
from datetime import datetime, timedelta
import logging

from ..models.stock_data import StockPrice, IndexPrice

logger = logging.getLogger(__name__)


class YFinanceConfig:
    """yfinance設定クラス"""

    # 日本市場の主要指数マッピング
    JAPANESE_INDICES = {
        "^N225": "日経平均株価", 
        "1306.T": "TOPIX連動型上場投資信託", 
        "2516.T": "東証マザーズETF"
    }

    # リクエスト間隔（秒）
    REQUEST_DELAY = 1.0

    # タイムアウト設定
    TIMEOUT = 30

    @classmethod
    def get_stock_data(
        cls, symbol: str, period: str = "2d"
    ) -> Optional[Dict[str, Any]]:
        """個別銘柄データを取得

        Args:
            symbol: 銘柄コード（例: 7203.T）
            period: 取得期間（1d, 2d, 5d, 1mo等）

        Returns:
            株価データ辞書またはNone
        """
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, timeout=cls.TIMEOUT)
            info = ticker.info

            if hist.empty:
                logger.warning(f"No historical data found for {symbol}")
                return None

            latest = hist.iloc[-1]
            previous = hist.iloc[-2] if len(hist) > 1 else None

            return {
                "symbol": symbol,
                "name": info.get("shortName", symbol),
                "current_price": Decimal(str(latest["Close"])),
                "open_price": Decimal(str(latest["Open"]))
                if pd.notna(latest["Open"])
                else None,
                "high_price": Decimal(str(latest["High"]))
                if pd.notna(latest["High"])
                else None,
                "low_price": Decimal(str(latest["Low"]))
                if pd.notna(latest["Low"])
                else None,
                "previous_close": Decimal(str(previous["Close"]))
                if previous is not None and pd.notna(previous["Close"])
                else None,
                "volume": int(latest["Volume"]) if pd.notna(latest["Volume"]) else None,
                "market_cap": info.get("marketCap"),
                "timestamp": datetime.now(),
            }

        except Exception as e:
            logger.error(f"Failed to fetch data for {symbol}: {e}")
            return None

    @classmethod
    def get_index_data(
        cls, symbol: str, period: str = "2d"
    ) -> Optional[Dict[str, Any]]:
        """株価指数データを取得

        Args:
            symbol: 指数コード（例: ^N225）
            period: 取得期間

        Returns:
            指数データ辞書またはNone
        """
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, timeout=cls.TIMEOUT)

            if hist.empty:
                logger.warning(f"No historical data found for index {symbol}")
                return None

            latest = hist.iloc[-1]
            previous = hist.iloc[-2] if len(hist) > 1 else None

            return {
                "symbol": symbol,
                "name": cls.JAPANESE_INDICES.get(symbol, symbol),
                "current_value": Decimal(str(latest["Close"])),
                "open_value": Decimal(str(latest["Open"]))
                if pd.notna(latest["Open"])
                else None,
                "high_value": Decimal(str(latest["High"]))
                if pd.notna(latest["High"])
                else None,
                "low_value": Decimal(str(latest["Low"]))
                if pd.notna(latest["Low"])
                else None,
                "previous_close": Decimal(str(previous["Close"]))
                if previous is not None and pd.notna(previous["Close"])
                else None,
                "volume": int(latest["Volume"]) if pd.notna(latest["Volume"]) else None,
                "timestamp": datetime.now(),
            }

        except Exception as e:
            logger.error(f"Failed to fetch data for index {symbol}: {e}")
            return None

    @classmethod
    def create_stock_price(cls, data: Dict[str, Any]) -> Optional[StockPrice]:
        """辞書データからStockPriceモデルを作成"""
        try:
            return StockPrice(**data)
        except Exception as e:
            logger.error(f"Failed to create StockPrice model: {e}")
            return None

    @classmethod
    def create_index_price(cls, data: Dict[str, Any]) -> Optional[IndexPrice]:
        """辞書データからIndexPriceモデルを作成"""
        try:
            return IndexPrice(**data)
        except Exception as e:
            logger.error(f"Failed to create IndexPrice model: {e}")
            return None

    @classmethod
    def validate_symbol(cls, symbol: str) -> bool:
        """銘柄コードの妥当性をチェック

        Args:
            symbol: 銘柄コード

        Returns:
            有効かどうか
        """
        if not symbol:
            return False

        # 日本株の場合は.Tで終わる
        if symbol.endswith(".T"):
            # 4桁の数字 + .T
            code = symbol[:-2]
            return code.isdigit() and len(code) == 4

        # 指数の場合は^で始まるか、JAPANESE_INDICESに含まれる
        if symbol.startswith("^") or symbol in cls.JAPANESE_INDICES:
            return symbol in cls.JAPANESE_INDICES

        return False
