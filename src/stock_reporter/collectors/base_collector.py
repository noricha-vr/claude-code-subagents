"""
株価データ収集のベースクラス
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any
from ..config import setup_stock_logger

logger = setup_stock_logger()


class BaseStockCollector(ABC):
    """株価データ収集のベースクラス"""
    
    def __init__(self) -> None:
        self.logger = logger
    
    @abstractmethod
    async def collect_indices(self) -> Dict[str, Any]:
        """株価指数データを収集"""
        pass
    
    @abstractmethod
    async def collect_stocks(self) -> List[Dict[str, Any]]:
        """株式データを収集"""
        pass