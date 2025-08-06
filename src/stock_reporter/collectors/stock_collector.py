"""日本株主要銘柄収集モジュール

日本の主要銘柄（Top30）の株価データを収集し、前日比・変動率を計算する機能を実装
"""

import time
import asyncio
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import datetime
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from ..models.stock_data import StockPrice, StockReportConfig
from ..config.yfinance_config import YFinanceConfig
from .base_collector import BaseStockCollector

logger = logging.getLogger(__name__)


class StockCollector(BaseStockCollector):
    """日本株主要銘柄収集クラス"""

    def __init__(self, config: Optional[StockReportConfig] = None):
        super().__init__()
        self.config = config or StockReportConfig()
        self.yfinance_config = YFinanceConfig()
        
        # レート制限のための設定
        self.request_delay = YFinanceConfig.REQUEST_DELAY
        self.max_concurrent = 5  # 同時実行数制限
        
        logger.info(f"StockCollector初期化完了 - 対象銘柄数: {len(self.config.target_stocks)}")

    async def collect_stocks(self) -> Dict[str, Any]:
        """主要銘柄データを収集
        
        Returns:
            銘柄データ辞書（成功/失敗情報含む）
        """
        logger.info(f"主要銘柄データ収集開始 - 対象: {len(self.config.target_stocks)}銘柄")
        
        results = {
            "success": [],
            "failed": [],
            "timestamp": datetime.now(),
            "total_requested": len(self.config.target_stocks)
        }
        
        # 並列処理でパフォーマンス向上（制限付き）
        await self._collect_stocks_batch(results)
        
        # 結果集計
        success_count = len(results["success"])
        failed_count = len(results["failed"])
        
        logger.info(
            f"主要銘柄収集完了 - 成功: {success_count}/{results['total_requested']}, "
            f"失敗: {failed_count}/{results['total_requested']}"
        )
        
        return results

    async def _collect_stocks_batch(self, results: Dict[str, Any]) -> None:
        """バッチ処理で銘柄データを収集"""
        # 銘柄をバッチに分割
        batch_size = self.max_concurrent
        stock_batches = [
            self.config.target_stocks[i:i + batch_size]
            for i in range(0, len(self.config.target_stocks), batch_size)
        ]
        
        for batch_idx, batch in enumerate(stock_batches):
            logger.info(f"バッチ {batch_idx + 1}/{len(stock_batches)} 処理開始: {len(batch)}銘柄")
            
            # 各バッチを並列処理
            tasks = []
            for symbol in batch:
                task = asyncio.create_task(self._collect_single_stock(symbol))
                tasks.append(task)
            
            # バッチ内の全タスク完了を待機
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 結果を分類
            for symbol, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    logger.error(f"銘柄データ取得エラー: {symbol} - {result}")
                    results["failed"].append({
                        "symbol": symbol,
                        "error": str(result)
                    })
                elif result:
                    results["success"].append(result)
                    logger.info(
                        f"銘柄データ取得成功: {symbol} = {result.current_price}"
                        f"({result.change_percent:.2f}%)" if result.change_percent else ""
                    )
                else:
                    logger.warning(f"銘柄データ取得失敗: {symbol} - データなし")
                    results["failed"].append({
                        "symbol": symbol,
                        "error": "データ取得失敗"
                    })
            
            # バッチ間の待機（レート制限対応）
            if batch_idx < len(stock_batches) - 1:
                await asyncio.sleep(self.request_delay)

    async def _collect_single_stock(self, symbol: str) -> Optional[StockPrice]:
        """単一銘柄のデータを収集（リトライ付き）"""
        for attempt in range(self.config.max_retries):
            try:
                # 非同期でyfinanceのデータ取得を実行
                stock_data = await asyncio.to_thread(
                    self.yfinance_config.get_stock_data,
                    symbol,
                    "2d"  # 2日分のデータで前日比計算
                )
                
                if stock_data:
                    stock_price = self.yfinance_config.create_stock_price(stock_data)
                    if stock_price:
                        return stock_price
                    else:
                        raise ValueError(f"StockPriceモデル作成失敗: {symbol}")
                else:
                    raise ValueError(f"株価データ取得失敗: {symbol}")
                    
            except Exception as e:
                if attempt < self.config.max_retries - 1:
                    retry_delay = (attempt + 1) * 2  # 指数バックオフ
                    logger.warning(
                        f"銘柄データ取得リトライ: {symbol} "
                        f"(試行 {attempt + 1}/{self.config.max_retries}) - {e}"
                    )
                    await asyncio.sleep(retry_delay)
                else:
                    logger.error(f"銘柄データ取得最終失敗: {symbol} - {e}")
                    raise e
        
        return None

    async def collect_indices(self) -> Dict[str, Any]:
        """指数データ収集（BaseStockCollectorの実装）
        
        Note: このクラスは銘柄収集専用のため、指数収集は未実装
        """
        logger.warning("StockCollectorは指数収集に対応していません。IndexCollectorを使用してください。")
        return {
            "success": [],
            "failed": [],
            "timestamp": datetime.now(),
            "total_requested": 0
        }

    def get_stock_performance_summary(self, stocks: List[StockPrice]) -> Dict[str, Any]:
        """銘柄パフォーマンスサマリーを生成"""
        if not stocks:
            return {
                "total_count": 0,
                "gainers_count": 0,
                "losers_count": 0,
                "unchanged_count": 0,
                "average_change": 0.0,
                "top_gainer": None,
                "top_loser": None
            }
        
        gainers = [s for s in stocks if s.change_percent and s.change_percent > 0]
        losers = [s for s in stocks if s.change_percent and s.change_percent < 0]
        unchanged = [s for s in stocks if s.change_percent and s.change_percent == 0]
        
        # 平均変動率計算
        valid_changes = [s.change_percent for s in stocks if s.change_percent is not None]
        average_change = sum(valid_changes) / len(valid_changes) if valid_changes else 0.0
        
        # トップパフォーマー取得
        top_gainer = max(gainers, key=lambda x: x.change_percent) if gainers else None
        top_loser = min(losers, key=lambda x: x.change_percent) if losers else None
        
        return {
            "total_count": len(stocks),
            "gainers_count": len(gainers),
            "losers_count": len(losers),
            "unchanged_count": len(unchanged),
            "average_change": round(average_change, 2),
            "top_gainer": {
                "symbol": top_gainer.symbol,
                "name": top_gainer.name,
                "change_percent": float(top_gainer.change_percent)
            } if top_gainer else None,
            "top_loser": {
                "symbol": top_loser.symbol,
                "name": top_loser.name,
                "change_percent": float(top_loser.change_percent)
            } if top_loser else None
        }

    def filter_stocks_by_performance(
        self, 
        stocks: List[StockPrice], 
        filter_type: str = "all", 
        limit: int = 10
    ) -> List[StockPrice]:
        """パフォーマンスによる銘柄フィルタリング
        
        Args:
            stocks: 銘柄リスト
            filter_type: フィルタタイプ（"gainers", "losers", "active", "all"）
            limit: 取得件数制限
            
        Returns:
            フィルタリング済み銘柄リスト
        """
        if filter_type == "gainers":
            # 上昇率上位
            valid_stocks = [s for s in stocks if s.change_percent and s.change_percent > 0]
            return sorted(valid_stocks, key=lambda x: x.change_percent, reverse=True)[:limit]
        
        elif filter_type == "losers":
            # 下落率上位
            valid_stocks = [s for s in stocks if s.change_percent and s.change_percent < 0]
            return sorted(valid_stocks, key=lambda x: x.change_percent)[:limit]
        
        elif filter_type == "active":
            # 出来高上位
            valid_stocks = [s for s in stocks if s.volume and s.volume > 0]
            return sorted(valid_stocks, key=lambda x: x.volume, reverse=True)[:limit]
        
        else:
            # すべて（変動率の絶対値順）
            valid_stocks = [s for s in stocks if s.change_percent is not None]
            return sorted(
                valid_stocks, 
                key=lambda x: abs(x.change_percent), 
                reverse=True
            )[:limit]