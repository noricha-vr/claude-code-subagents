"""日本株価指数収集モジュール

主要日本株価指数（日経平均、TOPIX、マザーズ指数）のデータを収集する機能を実装
"""

import time
import asyncio
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import datetime
import logging

from ..models.stock_data import IndexPrice, StockReportConfig
from ..config.yfinance_config import YFinanceConfig
from .base_collector import BaseStockCollector

logger = logging.getLogger(__name__)


class IndexCollector(BaseStockCollector):
    """日本株価指数収集クラス"""

    def __init__(self, config: Optional[StockReportConfig] = None):
        super().__init__()
        self.config = config or StockReportConfig()
        self.yfinance_config = YFinanceConfig()
        
        # レート制限のための設定
        self.request_delay = YFinanceConfig.REQUEST_DELAY
        
        logger.info(f"IndexCollector初期化完了 - 対象指数: {self.config.target_indices}")

    async def collect_indices(self) -> Dict[str, Any]:
        """株価指数データを収集
        
        Returns:
            指数データ辞書（成功/失敗情報含む）
        """
        logger.info("株価指数データ収集開始")
        
        results = {
            "success": [],
            "failed": [],
            "timestamp": datetime.now(),
            "total_requested": len(self.config.target_indices)
        }
        
        for i, index_symbol in enumerate(self.config.target_indices):
            try:
                logger.info(f"指数データ取得開始: {index_symbol}")
                
                # レート制限
                if i > 0:
                    await asyncio.sleep(self.request_delay)
                
                # yfinanceからデータ取得
                index_data = self.yfinance_config.get_index_data(
                    symbol=index_symbol,
                    period="2d"
                )
                
                if index_data:
                    # Pydanticモデルに変換
                    index_price = self.yfinance_config.create_index_price(index_data)
                    
                    if index_price:
                        results["success"].append(index_price)
                        logger.info(
                            f"指数データ取得成功: {index_symbol} = "
                            f"{index_price.current_value:,.2f}"
                            f"({index_price.change_percent:.2f}%)"
                            if index_price.change_percent
                            else f"{index_price.current_value:,.2f}"
                        )
                    else:
                        error_msg = f"IndexPriceモデル作成失敗: {index_symbol}"
                        results["failed"].append({"symbol": index_symbol, "error": error_msg})
                        logger.error(error_msg)
                else:
                    error_msg = f"指数データ取得失敗: {index_symbol}"
                    results["failed"].append({"symbol": index_symbol, "error": error_msg})
                    logger.warning(error_msg)
                    
            except Exception as e:
                error_msg = f"指数収集中の予期しないエラー: {index_symbol} - {e}"
                results["failed"].append({"symbol": index_symbol, "error": str(e)})
                logger.error(error_msg, exc_info=True)
        
        # 結果サマリー
        success_count = len(results["success"])
        failed_count = len(results["failed"])
        total_count = results["total_requested"]
        
        logger.info(
            f"指数収集完了 - 成功: {success_count}/{total_count}, "
            f"失敗: {failed_count}/{total_count}"
        )
        
        return results

    async def collect_stocks(self) -> List[Dict[str, Any]]:
        """個別株式データを収集（このクラスでは実装しない）
        
        Returns:
            空のリスト（指数収集専用クラスのため）
        """
        logger.warning("IndexCollectorは個別株式収集には対応していません")
        return []

    def get_index_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """指数収集結果のサマリーを生成
        
        Args:
            results: collect_indices()の結果
            
        Returns:
            サマリー情報辞書
        """
        if not results["success"]:
            return {
                "status": "no_data",
                "message": "指数データの取得に成功した項目がありません",
                "indices_count": 0
            }
        
        # 指数別の詳細情報
        indices_detail = []
        total_positive = 0
        total_negative = 0
        
        for index in results["success"]:
            change_percent = index.change_percent or Decimal(0)
            is_positive = change_percent > 0
            
            if change_percent > 0:
                total_positive += 1
            elif change_percent < 0:
                total_negative += 1
            
            indices_detail.append({
                "symbol": index.symbol,
                "name": index.name,
                "value": float(index.current_value),
                "change_percent": float(change_percent),
                "change_amount": float(index.change_amount or 0),
                "is_positive": is_positive,
                "timestamp": index.timestamp.isoformat()
            })
        
        return {
            "status": "success",
            "indices_count": len(results["success"]),
            "failed_count": len(results["failed"]),
            "positive_count": total_positive,
            "negative_count": total_negative,
            "indices_detail": indices_detail,
            "collection_timestamp": results["timestamp"].isoformat()
        }

    async def collect_with_retry(self, max_retries: Optional[int] = None) -> Dict[str, Any]:
        """リトライ機能付きで指数データを収集
        
        Args:
            max_retries: 最大リトライ回数（指定しない場合は設定値を使用）
            
        Returns:
            指数データ収集結果
        """
        retry_count = max_retries or self.config.max_retries
        last_exception = None
        
        for attempt in range(retry_count + 1):
            try:
                logger.info(f"指数データ収集試行 {attempt + 1}/{retry_count + 1}")
                results = await self.collect_indices()
                
                # 成功した指数が1つでもあれば成功とみなす
                if results["success"]:
                    if attempt > 0:
                        logger.info(f"指数データ収集成功（リトライ {attempt} 回後）")
                    return results
                
                # 全て失敗した場合はリトライ
                if attempt < retry_count:
                    wait_time = (attempt + 1) * 2  # 指数バックオフ
                    logger.warning(
                        f"指数収集で全て失敗、{wait_time}秒後にリトライ（{attempt + 1}/{retry_count}）"
                    )
                    await asyncio.sleep(wait_time)
                
            except Exception as e:
                last_exception = e
                logger.error(f"指数収集試行でエラー: {e}")
                
                if attempt < retry_count:
                    wait_time = (attempt + 1) * 2
                    logger.info(f"{wait_time}秒後にリトライ（{attempt + 1}/{retry_count}）")
                    await asyncio.sleep(wait_time)
        
        # すべてのリトライが失敗した場合
        error_msg = f"指数収集が{retry_count + 1}回の試行ですべて失敗しました"
        if last_exception:
            error_msg += f": {last_exception}"
        
        logger.error(error_msg)
        
        return {
            "success": [],
            "failed": [{"symbol": "all", "error": error_msg}],
            "timestamp": datetime.now(),
            "total_requested": len(self.config.target_indices)
        }