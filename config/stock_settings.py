"""
株価レポートシステム設定
"""

import logging
from pathlib import Path
from typing import Dict, List
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class StockSymbol(BaseModel):
    """株式銘柄情報"""
    symbol: str = Field(..., description="Yahoo Finance銘柄シンボル")
    name: str = Field(..., description="銘柄名")
    sector: str = Field(..., description="セクター")


class StockSettings(BaseSettings):
    """株価システム設定"""
    
    # ログ設定
    log_level: str = Field(default="INFO", description="ログレベル")
    log_file: Path = Field(default=Path("logs/stock_reporter.log"), description="ログファイルパス")
    
    # データ収集設定
    retry_count: int = Field(default=3, description="エラー時のリトライ回数")
    request_timeout: int = Field(default=30, description="リクエストタイムアウト(秒)")
    
    # 出力設定
    output_dir: Path = Field(default=Path("output"), description="出力ディレクトリ")
    template_dir: Path = Field(default=Path("templates"), description="テンプレートディレクトリ")
    
    # 主要指数
    major_indices: Dict[str, str] = Field(default_factory=lambda: {
        "^N225": "日経平均株価",
        "^TOPX": "TOPIX",
        "^MOTHERS": "マザーズ指数"
    })
    
    # 主要銘柄（Top20）
    major_stocks: List[StockSymbol] = Field(default_factory=lambda: [
        StockSymbol(symbol="7203.T", name="トヨタ自動車", sector="自動車"),
        StockSymbol(symbol="6758.T", name="ソニーグループ", sector="テクノロジー"),
        StockSymbol(symbol="9984.T", name="ソフトバンクグループ", sector="通信"),
        StockSymbol(symbol="8306.T", name="三菱UFJフィナンシャル・グループ", sector="金融"),
        StockSymbol(symbol="6861.T", name="キーエンス", sector="電機"),
        StockSymbol(symbol="4519.T", name="中外製薬", sector="医薬品"),
        StockSymbol(symbol="9434.T", name="ソフトバンク", sector="通信"),
        StockSymbol(symbol="8035.T", name="東京エレクトロン", sector="半導体"),
        StockSymbol(symbol="4661.T", name="オリエンタルランド", sector="サービス"),
        StockSymbol(symbol="7974.T", name="任天堂", sector="エンターテインメント"),
        StockSymbol(symbol="6594.T", name="日本電産", sector="電機"),
        StockSymbol(symbol="8316.T", name="三井住友フィナンシャルグループ", sector="金融"),
        StockSymbol(symbol="4063.T", name="信越化学工業", sector="化学"),
        StockSymbol(symbol="9983.T", name="ファーストリテイリング", sector="小売"),
        StockSymbol(symbol="2914.T", name="日本たばこ産業", sector="食品"),
        StockSymbol(symbol="8058.T", name="三菱商事", sector="商社"),
        StockSymbol(symbol="6367.T", name="ダイキン工業", sector="機械"),
        StockSymbol(symbol="4578.T", name="大塚ホールディングス", sector="医薬品"),
        StockSymbol(symbol="9432.T", name="NTT", sector="通信"),
        StockSymbol(symbol="6902.T", name="デンソー", sector="自動車部品"),
    ])
    
    class Config:
        env_file = "env.local"
        env_prefix = "STOCK_"


def setup_stock_logger() -> logging.Logger:
    """株価システム用のロガーを設定"""
    settings = StockSettings()
    
    # ログディレクトリの作成
    settings.log_file.parent.mkdir(exist_ok=True)
    
    # ロガーの設定
    logger = logging.getLogger("stock_reporter")
    logger.setLevel(getattr(logging, settings.log_level))
    
    # ハンドラーが既に設定されている場合はスキップ
    if logger.handlers:
        return logger
    
    # ファイルハンドラー
    file_handler = logging.FileHandler(settings.log_file, encoding="utf-8")
    file_handler.setLevel(getattr(logging, settings.log_level))
    
    # コンソールハンドラー（開発環境用）
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    
    # フォーマッターの設定
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # ハンドラーの追加
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger