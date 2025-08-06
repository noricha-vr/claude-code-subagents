"""ベースコレクタークラス"""

import time
from abc import ABC, abstractmethod
from typing import List, Optional
import requests
from requests.adapters import HTTPAdapter
from requests.exceptions import RequestException
from urllib3.util.retry import Retry

from ..models.news_item import NewsItem, NewsSource
from config.settings import settings, logger


class BaseCollector(ABC):
    """ニュースコレクターのベースクラス"""
    
    def __init__(self, source_name: str, rate_limit: float = 1.0, timeout: int = 30):
        self.source_name = source_name
        self.rate_limit = rate_limit
        self.timeout = timeout
        self.last_request_time = 0.0
        self.session = self._create_session()
        
    def _create_session(self) -> requests.Session:
        """HTTPセッションを作成"""
        session = requests.Session()
        
        # リトライ戦略
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # ユーザーエージェント設定
        session.headers.update({
            'User-Agent': 'AI News Reporter/1.0 (Educational Purpose)'
        })
        
        return session
    
    def _rate_limit_wait(self) -> None:
        """レート制限の待機処理"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit:
            wait_time = self.rate_limit - elapsed
            logger.debug(f"Rate limit wait: {wait_time:.2f}s for {self.source_name}")
            time.sleep(wait_time)
        self.last_request_time = time.time()
    
    def _make_request(self, url: str, **kwargs) -> Optional[requests.Response]:
        """HTTP リクエストを実行"""
        self._rate_limit_wait()
        
        try:
            response = self.session.get(url, timeout=self.timeout, **kwargs)
            response.raise_for_status()
            return response
            
        except RequestException as e:
            logger.error(f"Request failed for {url}: {e}")
            return None
    
    @abstractmethod
    def collect(self, limit: int = 10) -> List[NewsItem]:
        """ニュースを収集する（サブクラスで実装）"""
        pass
    
    @abstractmethod
    def get_source_type(self) -> NewsSource:
        """ニュースソースタイプを返す（サブクラスで実装）"""
        pass
        
    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(source={self.source_name})"