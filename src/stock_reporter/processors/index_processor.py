"""株価指数データ処理モジュール

収集した株価指数データの分析・加工・レポート用データ変換を実装
"""

from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal
from datetime import datetime
import logging

from ..models.stock_data import IndexPrice, MarketSummary

logger = logging.getLogger(__name__)


class IndexProcessor:
    """株価指数データ処理クラス"""

    def __init__(self):
        logger.info("IndexProcessor初期化完了")

    def process_indices_data(
        self, collection_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """収集した指数データを処理・分析
        
        Args:
            collection_results: IndexCollectorから取得した結果
            
        Returns:
            処理済み指数データ
        """
        logger.info("指数データ処理開始")
        
        if not collection_results.get("success"):
            logger.warning("処理対象の指数データがありません")
            return {
                "status": "no_data",
                "processed_indices": [],
                "market_trend": "unknown",
                "summary": self._create_empty_summary()
            }
        
        indices: List[IndexPrice] = collection_results["success"]
        
        # 各指数の詳細分析
        processed_indices = []
        for index in indices:
            processed_index = self._analyze_single_index(index)
            processed_indices.append(processed_index)
            logger.debug(f"指数分析完了: {index.symbol}")
        
        # 市場全体の傾向分析
        market_trend = self._analyze_market_trend(indices)
        
        # サマリー情報作成
        summary = self._create_market_summary(indices, market_trend)
        
        result = {
            "status": "success",
            "processed_indices": processed_indices,
            "market_trend": market_trend,
            "summary": summary,
            "processing_timestamp": datetime.now(),
            "total_indices": len(indices)
        }
        
        logger.info(
            f"指数データ処理完了 - 処理指数数: {len(indices)}, "
            f"市場傾向: {market_trend['overall_direction']}"
        )
        
        return result

    def _analyze_single_index(self, index: IndexPrice) -> Dict[str, Any]:
        """個別指数の詳細分析
        
        Args:
            index: 指数データ
            
        Returns:
            分析結果辞書
        """
        change_percent = index.change_percent or Decimal(0)
        change_amount = index.change_amount or Decimal(0)
        
        # 変動幅の評価
        magnitude = self._evaluate_change_magnitude(abs(change_percent))
        
        # 傾向分析
        trend = "positive" if change_percent > 0 else ("negative" if change_percent < 0 else "flat")
        
        return {
            "symbol": index.symbol,
            "name": index.name,
            "current_value": float(index.current_value),
            "change_amount": float(change_amount),
            "change_percent": float(change_percent),
            "previous_close": float(index.previous_close) if index.previous_close else None,
            "trend": trend,
            "magnitude": magnitude,
            "is_positive": change_percent > 0,
            "formatted_change": self._format_change(change_amount, change_percent),
            "performance_rating": self._rate_performance(change_percent),
            "timestamp": index.timestamp.isoformat()
        }

    def _analyze_market_trend(self, indices: List[IndexPrice]) -> Dict[str, Any]:
        """市場全体の傾向を分析
        
        Args:
            indices: 指数データのリスト
            
        Returns:
            市場傾向分析結果
        """
        if not indices:
            return {
                "overall_direction": "unknown",
                "positive_count": 0,
                "negative_count": 0,
                "flat_count": 0,
                "average_change": 0.0,
                "confidence": "low"
            }
        
        positive_count = 0
        negative_count = 0
        flat_count = 0
        total_change = Decimal(0)
        
        for index in indices:
            change = index.change_percent or Decimal(0)
            total_change += change
            
            if change > Decimal("0.1"):  # 0.1%以上の上昇
                positive_count += 1
            elif change < Decimal("-0.1"):  # -0.1%以下の下落
                negative_count += 1
            else:
                flat_count += 1
        
        average_change = total_change / len(indices)
        
        # 全体方向の決定
        if positive_count > negative_count:
            overall_direction = "positive"
            confidence = "high" if positive_count >= len(indices) * 0.8 else "medium"
        elif negative_count > positive_count:
            overall_direction = "negative"
            confidence = "high" if negative_count >= len(indices) * 0.8 else "medium"
        else:
            overall_direction = "mixed"
            confidence = "medium" if flat_count > 0 else "low"
        
        return {
            "overall_direction": overall_direction,
            "positive_count": positive_count,
            "negative_count": negative_count,
            "flat_count": flat_count,
            "average_change": float(average_change),
            "confidence": confidence,
            "dominant_trend": "bullish" if positive_count > len(indices) * 0.6 else (
                "bearish" if negative_count > len(indices) * 0.6 else "neutral"
            )
        }

    def _evaluate_change_magnitude(self, abs_change_percent: Decimal) -> str:
        """変動幅の大きさを評価
        
        Args:
            abs_change_percent: 変動率の絶対値
            
        Returns:
            変動の大きさ（small, medium, large, very_large）
        """
        if abs_change_percent < Decimal("0.5"):
            return "small"
        elif abs_change_percent < Decimal("1.5"):
            return "medium"
        elif abs_change_percent < Decimal("3.0"):
            return "large"
        else:
            return "very_large"

    def _format_change(self, change_amount: Decimal, change_percent: Decimal) -> str:
        """変動情報をフォーマット
        
        Args:
            change_amount: 変動額
            change_percent: 変動率
            
        Returns:
            フォーマットされた変動情報
        """
        sign = "+" if change_amount >= 0 else ""
        return f"{sign}{change_amount:.2f} ({sign}{change_percent:.2f}%)"

    def _rate_performance(self, change_percent: Decimal) -> str:
        """パフォーマンスを評価
        
        Args:
            change_percent: 変動率
            
        Returns:
            パフォーマンス評価（excellent, good, fair, poor, very_poor）
        """
        if change_percent >= Decimal("2.0"):
            return "excellent"
        elif change_percent >= Decimal("1.0"):
            return "good"
        elif change_percent >= Decimal("-1.0"):
            return "fair"
        elif change_percent >= Decimal("-2.0"):
            return "poor"
        else:
            return "very_poor"

    def _create_market_summary(
        self, indices: List[IndexPrice], market_trend: Dict[str, Any]
    ) -> Dict[str, Any]:
        """市場サマリーを作成
        
        Args:
            indices: 指数データリスト
            market_trend: 市場傾向分析結果
            
        Returns:
            市場サマリー辞書
        """
        if not indices:
            return self._create_empty_summary()
        
        # 最も変動が大きい指数を特定
        best_performer = max(
            indices, 
            key=lambda x: x.change_percent or Decimal(0),
            default=indices[0]
        )
        worst_performer = min(
            indices, 
            key=lambda x: x.change_percent or Decimal(0),
            default=indices[0]
        )
        
        return {
            "total_indices": len(indices),
            "market_direction": market_trend["overall_direction"],
            "confidence": market_trend["confidence"],
            "average_change": market_trend["average_change"],
            "positive_indices": market_trend["positive_count"],
            "negative_indices": market_trend["negative_count"],
            "best_performer": {
                "symbol": best_performer.symbol,
                "name": best_performer.name,
                "change_percent": float(best_performer.change_percent or 0)
            },
            "worst_performer": {
                "symbol": worst_performer.symbol,
                "name": worst_performer.name,
                "change_percent": float(worst_performer.change_percent or 0)
            },
            "market_sentiment": self._determine_market_sentiment(market_trend)
        }

    def _create_empty_summary(self) -> Dict[str, Any]:
        """空のサマリーを作成"""
        return {
            "total_indices": 0,
            "market_direction": "unknown",
            "confidence": "none",
            "average_change": 0.0,
            "positive_indices": 0,
            "negative_indices": 0,
            "best_performer": None,
            "worst_performer": None,
            "market_sentiment": "unknown"
        }

    def _determine_market_sentiment(self, market_trend: Dict[str, Any]) -> str:
        """市場センチメントを判定
        
        Args:
            market_trend: 市場傾向分析結果
            
        Returns:
            市場センチメント（optimistic, pessimistic, cautious, neutral）
        """
        direction = market_trend["overall_direction"]
        confidence = market_trend["confidence"]
        average_change = abs(market_trend["average_change"])
        
        if direction == "positive" and confidence == "high" and average_change > 1.0:
            return "optimistic"
        elif direction == "negative" and confidence == "high" and average_change > 1.0:
            return "pessimistic"
        elif direction == "mixed" or confidence == "low":
            return "cautious"
        else:
            return "neutral"

    def create_report_data(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """レポート生成用のデータを作成
        
        Args:
            processed_data: 処理済み指数データ
            
        Returns:
            レポート用データ
        """
        if processed_data["status"] != "success":
            return {
                "status": "no_data",
                "indices": [],
                "summary": {},
                "generated_at": datetime.now().isoformat()
            }
        
        # レポート用に整形
        report_indices = []
        for index_data in processed_data["processed_indices"]:
            report_indices.append({
                "name": index_data["name"],
                "symbol": index_data["symbol"],
                "current_value": f"{index_data['current_value']:,.2f}",
                "change": index_data["formatted_change"],
                "trend_icon": "📈" if index_data["is_positive"] else ("📉" if index_data["change_percent"] < 0 else "📊"),
                "performance": index_data["performance_rating"],
                "magnitude": index_data["magnitude"]
            })
        
        return {
            "status": "success",
            "indices": report_indices,
            "summary": processed_data["summary"],
            "market_trend": processed_data["market_trend"],
            "generated_at": datetime.now().isoformat(),
            "total_count": len(report_indices)
        }