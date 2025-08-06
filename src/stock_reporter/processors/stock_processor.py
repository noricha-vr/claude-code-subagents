"""日本株銘柄データ処理モジュール

収集した主要銘柄データの分析・加工処理を実装
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import logging
from decimal import Decimal

from ..models.stock_data import StockPrice, MarketSummary

logger = logging.getLogger(__name__)


class StockProcessor:
    """日本株銘柄データ処理クラス"""

    def __init__(self):
        self.logger = logger
        logger.info("StockProcessor初期化完了")

    def process_stock_data(self, stock_data: Dict[str, Any]) -> Dict[str, Any]:
        """収集した銘柄データを分析・加工
        
        Args:
            stock_data: StockCollectorからの収集データ
            
        Returns:
            分析済みデータ辞書
        """
        logger.info(f"銘柄データ処理開始 - 成功銘柄: {len(stock_data.get('success', []))}")
        
        success_stocks = stock_data.get("success", [])
        if not success_stocks:
            logger.warning("処理対象の銘柄データがありません")
            return self._create_empty_result()
        
        # 基本分析
        market_analysis = self._analyze_market_sentiment(success_stocks)
        performance_summary = self._calculate_performance_summary(success_stocks)
        sector_analysis = self._analyze_by_sector(success_stocks)
        
        # レポート用データ生成
        report_data = self._generate_report_data(
            success_stocks, market_analysis, performance_summary, sector_analysis
        )
        
        result = {
            "processed_at": datetime.now(),
            "total_stocks": len(success_stocks),
            "failed_stocks": len(stock_data.get("failed", [])),
            "market_analysis": market_analysis,
            "performance_summary": performance_summary,
            "sector_analysis": sector_analysis,
            "report_data": report_data,
            "raw_data": stock_data
        }
        
        logger.info(
            f"銘柄データ処理完了 - 処理銘柄数: {len(success_stocks)}, "
            f"市場傾向: {market_analysis.get('overall_sentiment', 'unknown')}"
        )
        
        return result

    def _analyze_market_sentiment(self, stocks: List[StockPrice]) -> Dict[str, Any]:
        """市場センチメント分析"""
        if not stocks:
            return {"overall_sentiment": "neutral", "confidence": "low"}
        
        # 変動率データ取得
        valid_changes = []
        for stock in stocks:
            if stock.change_percent is not None:
                valid_changes.append(float(stock.change_percent))
        
        if not valid_changes:
            return {"overall_sentiment": "neutral", "confidence": "low"}
        
        # 基本統計
        positive_count = sum(1 for change in valid_changes if change > 0)
        negative_count = sum(1 for change in valid_changes if change < 0)
        unchanged_count = sum(1 for change in valid_changes if change == 0)
        
        positive_ratio = positive_count / len(valid_changes)
        average_change = sum(valid_changes) / len(valid_changes)
        
        # センチメント判定
        if positive_ratio >= 0.7 and average_change > 1.0:
            sentiment = "very_positive"
        elif positive_ratio >= 0.6 and average_change > 0.5:
            sentiment = "positive"
        elif positive_ratio <= 0.3 and average_change < -1.0:
            sentiment = "very_negative"
        elif positive_ratio <= 0.4 and average_change < -0.5:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        # 信頼度計算
        sample_size = len(valid_changes)
        if sample_size >= 20:
            confidence = "high"
        elif sample_size >= 10:
            confidence = "medium"
        else:
            confidence = "low"
        
        # 変動幅評価
        max_change = max(valid_changes) if valid_changes else 0
        min_change = min(valid_changes) if valid_changes else 0
        volatility_range = max_change - min_change
        
        if volatility_range >= 10.0:
            volatility = "very_high"
        elif volatility_range >= 5.0:
            volatility = "high"
        elif volatility_range >= 2.0:
            volatility = "medium"
        else:
            volatility = "low"
        
        return {
            "overall_sentiment": sentiment,
            "confidence": confidence,
            "volatility": volatility,
            "positive_ratio": round(positive_ratio, 3),
            "average_change": round(average_change, 2),
            "positive_count": positive_count,
            "negative_count": negative_count,
            "unchanged_count": unchanged_count,
            "max_gain": round(max_change, 2),
            "max_loss": round(min_change, 2),
            "sample_size": sample_size
        }

    def _calculate_performance_summary(self, stocks: List[StockPrice]) -> Dict[str, Any]:
        """パフォーマンスサマリー計算"""
        if not stocks:
            return {}
        
        # 上昇・下降銘柄の分類
        gainers = []
        losers = []
        high_volume = []
        
        for stock in stocks:
            if stock.change_percent is not None:
                if stock.change_percent > 0:
                    gainers.append(stock)
                elif stock.change_percent < 0:
                    losers.append(stock)
            
            if stock.volume and stock.volume > 0:
                high_volume.append(stock)
        
        # 上位銘柄取得（トップ5）
        top_gainers = sorted(gainers, key=lambda x: x.change_percent, reverse=True)[:5]
        top_losers = sorted(losers, key=lambda x: x.change_percent)[:5]
        most_active = sorted(high_volume, key=lambda x: x.volume, reverse=True)[:5]
        
        return {
            "top_gainers": [self._stock_to_dict(stock) for stock in top_gainers],
            "top_losers": [self._stock_to_dict(stock) for stock in top_losers],
            "most_active": [self._stock_to_dict(stock) for stock in most_active],
            "gainers_count": len(gainers),
            "losers_count": len(losers),
            "total_volume": sum(stock.volume for stock in stocks if stock.volume)
        }

    def _analyze_by_sector(self, stocks: List[StockPrice]) -> Dict[str, Any]:
        """セクター別分析（簡易版）"""
        # 銘柄コードからセクター推定（簡易実装）
        sector_mapping = self._get_sector_mapping()
        sector_performance = {}
        
        for stock in stocks:
            sector = sector_mapping.get(stock.symbol, "その他")
            
            if sector not in sector_performance:
                sector_performance[sector] = {
                    "stocks": [],
                    "total_change": 0.0,
                    "count": 0
                }
            
            sector_performance[sector]["stocks"].append(stock)
            if stock.change_percent:
                sector_performance[sector]["total_change"] += float(stock.change_percent)
            sector_performance[sector]["count"] += 1
        
        # セクター別平均変動率計算
        sector_summary = {}
        for sector, data in sector_performance.items():
            avg_change = data["total_change"] / data["count"] if data["count"] > 0 else 0.0
            sector_summary[sector] = {
                "average_change": round(avg_change, 2),
                "stock_count": data["count"],
                "best_performer": max(
                    data["stocks"], 
                    key=lambda x: x.change_percent if x.change_percent else -999
                ).symbol if data["stocks"] else None,
                "worst_performer": min(
                    data["stocks"], 
                    key=lambda x: x.change_percent if x.change_percent else 999
                ).symbol if data["stocks"] else None
            }
        
        # パフォーマンス順にソート
        sorted_sectors = sorted(
            sector_summary.items(),
            key=lambda x: x[1]["average_change"],
            reverse=True
        )
        
        return {
            "sector_summary": dict(sorted_sectors),
            "best_sector": sorted_sectors[0][0] if sorted_sectors else None,
            "worst_sector": sorted_sectors[-1][0] if sorted_sectors else None
        }

    def _get_sector_mapping(self) -> Dict[str, str]:
        """銘柄コードとセクターのマッピング（簡易版）"""
        return {
            "7203.T": "自動車",       # トヨタ自動車
            "6758.T": "エレクトロニクス", # ソニーグループ
            "9984.T": "通信",         # ソフトバンクグループ
            "9983.T": "小売",         # ファーストリテイリング
            "6861.T": "電子部品",     # キーエンス
            "8035.T": "商社",         # 東京エレクトロン
            "4063.T": "化学",         # 信越化学工業
            "6367.T": "機械",         # ダイキン工業
            "7974.T": "エンターテインメント", # 任天堂
            "4519.T": "医薬品",       # 中外製薬
            "9020.T": "運輸",         # 東日本旅客鉄道
            "8031.T": "商社",         # 三井物産
            "2914.T": "食品・飲料",   # 日本たばこ産業
            "9432.T": "通信",         # 日本電信電話
            "4661.T": "サービス",     # オリエンタルランド
            "6098.T": "サービス",     # リクルートホールディングス
            "6954.T": "機械",         # ファナック
            "7741.T": "精密機器",     # HOYA
            "4543.T": "医薬品",       # テルモ
            "7832.T": "エンターテインメント", # バンダイナムコホールディングス
        }

    def _generate_report_data(
        self, 
        stocks: List[StockPrice], 
        market_analysis: Dict[str, Any],
        performance_summary: Dict[str, Any],
        sector_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """レポート生成用データ作成"""
        return {
            "market_overview": {
                "sentiment": market_analysis.get("overall_sentiment", "neutral"),
                "confidence": market_analysis.get("confidence", "low"),
                "total_stocks": len(stocks),
                "gainers": performance_summary.get("gainers_count", 0),
                "losers": performance_summary.get("losers_count", 0),
                "average_change": market_analysis.get("average_change", 0.0)
            },
            "highlights": {
                "best_performer": performance_summary.get("top_gainers", [{}])[0] if performance_summary.get("top_gainers") else None,
                "worst_performer": performance_summary.get("top_losers", [{}])[0] if performance_summary.get("top_losers") else None,
                "most_active": performance_summary.get("most_active", [{}])[0] if performance_summary.get("most_active") else None,
                "best_sector": sector_analysis.get("best_sector"),
                "worst_sector": sector_analysis.get("worst_sector")
            },
            "detailed_data": {
                "top_gainers": performance_summary.get("top_gainers", []),
                "top_losers": performance_summary.get("top_losers", []),
                "sector_performance": sector_analysis.get("sector_summary", {})
            }
        }

    def _stock_to_dict(self, stock: StockPrice) -> Dict[str, Any]:
        """StockPriceオブジェクトを辞書に変換"""
        return {
            "symbol": stock.symbol,
            "name": stock.name,
            "current_price": float(stock.current_price),
            "change_amount": float(stock.change_amount) if stock.change_amount else None,
            "change_percent": float(stock.change_percent) if stock.change_percent else None,
            "volume": stock.volume,
            "market_cap": float(stock.market_cap) if stock.market_cap else None
        }

    def _create_empty_result(self) -> Dict[str, Any]:
        """空の結果を作成"""
        return {
            "processed_at": datetime.now(),
            "total_stocks": 0,
            "failed_stocks": 0,
            "market_analysis": {"overall_sentiment": "neutral", "confidence": "low"},
            "performance_summary": {"top_gainers": [], "top_losers": [], "most_active": []},
            "sector_analysis": {"sector_summary": {}},
            "report_data": {"market_overview": {}, "highlights": {}, "detailed_data": {}},
            "raw_data": {}
        }

    def create_market_summary(
        self, 
        stocks: List[StockPrice],
        indices: Optional[List] = None
    ) -> MarketSummary:
        """MarketSummaryオブジェクトを作成"""
        # トップパフォーマーを抽出
        gainers = [s for s in stocks if s.change_percent and s.change_percent > 0]
        losers = [s for s in stocks if s.change_percent and s.change_percent < 0]
        active = [s for s in stocks if s.volume and s.volume > 0]
        
        top_gainers = sorted(gainers, key=lambda x: x.change_percent, reverse=True)[:5]
        top_losers = sorted(losers, key=lambda x: x.change_percent)[:5]
        most_active = sorted(active, key=lambda x: x.volume, reverse=True)[:5]
        
        return MarketSummary(
            date=datetime.now(),
            indices=indices or [],
            top_gainers=top_gainers,
            top_losers=top_losers,
            most_active=most_active,
            total_stocks_analyzed=len(stocks)
        )