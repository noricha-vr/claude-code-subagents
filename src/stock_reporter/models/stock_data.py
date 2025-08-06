"""株価データモデル定義モジュール

日本株価システムで使用するデータ構造をPydanticモデルで定義
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator


class StockPrice(BaseModel):
    """個別株価データモデル"""

    symbol: str = Field(..., description="銘柄コード（例: 7203.T）")
    name: str = Field(..., description="銘柄名（例: トヨタ自動車）")
    current_price: Decimal = Field(..., description="現在価格")
    open_price: Optional[Decimal] = Field(None, description="始値")
    high_price: Optional[Decimal] = Field(None, description="高値")
    low_price: Optional[Decimal] = Field(None, description="安値")
    previous_close: Optional[Decimal] = Field(None, description="前日終値")
    volume: Optional[int] = Field(None, description="出来高")
    market_cap: Optional[Decimal] = Field(None, description="時価総額")
    timestamp: datetime = Field(default_factory=datetime.now, description="データ取得時刻")

    @property
    def change_amount(self) -> Optional[Decimal]:
        """前日比金額"""
        if self.previous_close:
            return self.current_price - self.previous_close
        return None

    @property
    def change_percent(self) -> Optional[Decimal]:
        """前日比パーセント"""
        if self.previous_close and self.previous_close != 0:
            return (
                (self.current_price - self.previous_close) / self.previous_close
            ) * 100
        return None

    @property
    def is_positive_change(self) -> Optional[bool]:
        """前日比がプラスかどうか"""
        change = self.change_amount
        return change > 0 if change is not None else None


class IndexPrice(BaseModel):
    """株価指数データモデル"""

    symbol: str = Field(..., description="指数コード（例: ^N225）")
    name: str = Field(..., description="指数名（例: 日経平均株価）")
    current_value: Decimal = Field(..., description="現在値")
    open_value: Optional[Decimal] = Field(None, description="始値")
    high_value: Optional[Decimal] = Field(None, description="高値")
    low_value: Optional[Decimal] = Field(None, description="安値")
    previous_close: Optional[Decimal] = Field(None, description="前日終値")
    volume: Optional[int] = Field(None, description="出来高")
    timestamp: datetime = Field(default_factory=datetime.now, description="データ取得時刻")

    @property
    def change_amount(self) -> Optional[Decimal]:
        """前日比ポイント"""
        if self.previous_close:
            return self.current_value - self.previous_close
        return None

    @property
    def change_percent(self) -> Optional[Decimal]:
        """前日比パーセント"""
        if self.previous_close and self.previous_close != 0:
            return (
                (self.current_value - self.previous_close) / self.previous_close
            ) * 100
        return None


class MarketSummary(BaseModel):
    """市場サマリーデータモデル"""

    date: datetime = Field(default_factory=datetime.now, description="データ日付")
    indices: List[IndexPrice] = Field(default_factory=list, description="主要指数リスト")
    top_gainers: List[StockPrice] = Field(default_factory=list, description="値上がり上位銘柄")
    top_losers: List[StockPrice] = Field(default_factory=list, description="値下がり上位銘柄")
    most_active: List[StockPrice] = Field(default_factory=list, description="出来高上位銘柄")
    total_stocks_analyzed: int = Field(0, description="分析対象銘柄数")

    @property
    def positive_stocks_count(self) -> int:
        """値上がり銘柄数"""
        return sum(
            1
            for stock in (self.top_gainers + self.top_losers + self.most_active)
            if stock.is_positive_change is True
        )

    @property
    def negative_stocks_count(self) -> int:
        """値下がり銘柄数"""
        return sum(
            1
            for stock in (self.top_gainers + self.top_losers + self.most_active)
            if stock.is_positive_change is False
        )


class StockReportConfig(BaseModel):
    """株価レポート設定モデル"""

    target_indices: List[str] = Field(
        default=["^N225", "^TOPX", "^MOTHERS"], description="取得対象指数"
    )
    target_stocks: List[str] = Field(
        default=[
            "7203.T",
            "6758.T",
            "9984.T",
            "9983.T",
            "6861.T",  # トヨタ、ソニー、SB、ファストリ、キーエンス
            "8035.T",
            "4063.T",
            "6367.T",
            "7974.T",
            "4519.T",  # 三菱UFJ、信越化学、ダイキン、任天堂、中外製薬
            "9020.T",
            "8031.T",
            "2914.T",
            "9432.T",
            "4661.T",  # JR東日本、三井物産、JT、NTT、オリエンタルランド
            "6098.T",
            "6954.T",
            "7741.T",
            "4543.T",
            "7832.T",  # リクルート、ファナック、HOYA、テルモ、バンダイナムコ
        ],
        description="取得対象銘柄コードリスト",
    )
    max_retries: int = Field(3, description="最大リトライ回数")
    timeout_seconds: int = Field(30, description="タイムアウト秒数")
    output_format: str = Field("html", description="出力フォーマット")

    @validator("target_indices")
    def validate_indices(cls, v):
        if not v:
            raise ValueError("target_indices must not be empty")
        return v

    @validator("target_stocks")
    def validate_stocks(cls, v):
        if not v:
            raise ValueError("target_stocks must not be empty")
        return v
