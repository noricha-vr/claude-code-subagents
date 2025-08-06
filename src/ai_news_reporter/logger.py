"""ログ設定モジュール

構造化ログ（structlog）を使用した開発環境向けログ設定。
コンソール出力とファイル出力の両方をサポート。
"""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Any, Dict

import structlog
from structlog.typing import Processor


def setup_logger(
    level: str = "DEBUG",
    log_file: str = "ai_news_reporter.log",
    logs_dir: str = "logs",
    enable_file_logging: bool = True,
    enable_console_logging: bool = True,
) -> structlog.stdlib.BoundLogger:
    """
    ログシステムを設定する
    
    Args:
        level: ログレベル (DEBUG, INFO, WARNING, ERROR)
        log_file: ログファイル名
        logs_dir: ログディレクトリ
        enable_file_logging: ファイルログの有効/無効
        enable_console_logging: コンソールログの有効/無効
        
    Returns:
        structlog.stdlib.BoundLogger: 設定済みロガー
    """
    
    # ログディレクトリ作成
    log_dir_path = Path(logs_dir)
    log_dir_path.mkdir(exist_ok=True)
    
    # ログレベル設定
    log_level = getattr(logging, level.upper(), logging.DEBUG)
    
    # ハンドラーリスト
    handlers = []
    
    # コンソールハンドラー
    if enable_console_logging:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        handlers.append(console_handler)
    
    # ファイルハンドラー
    if enable_file_logging:
        log_file_path = log_dir_path / log_file
        
        # ローテーティングファイルハンドラー（10MB, 5世代保持）
        file_handler = logging.handlers.RotatingFileHandler(
            log_file_path,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding="utf-8"
        )
        file_handler.setLevel(log_level)
        handlers.append(file_handler)
    
    # structlogの設定
    processors: list[Processor] = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]
    
    # 開発環境用の見やすいフォーマット
    if enable_console_logging:
        processors.append(
            structlog.dev.ConsoleRenderer(
                colors=True,
                force_colors=True,
            )
        )
    else:
        processors.append(structlog.processors.JSONRenderer())
    
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # 標準ライブラリのloggingを設定
    logging.basicConfig(
        format="%(message)s",
        level=log_level,
        handlers=handlers,
        force=True,
    )
    
    # サードパーティライブラリのログレベルを調整
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("aiohttp").setLevel(logging.WARNING)
    
    # 設定済みロガーを返す
    logger = structlog.get_logger("ai_news_reporter")
    logger.info("ログシステムを初期化しました", 
               level=level, 
               file_logging=enable_file_logging,
               console_logging=enable_console_logging,
               log_file=str(log_file_path) if enable_file_logging else None)
    
    return logger


def get_logger(name: str = "ai_news_reporter") -> structlog.stdlib.BoundLogger:
    """
    既存の設定でロガーインスタンスを取得
    
    Args:
        name: ロガー名
        
    Returns:
        structlog.stdlib.BoundLogger: ロガーインスタンス
    """
    return structlog.get_logger(name)


class LoggerMixin:
    """ロガー機能を提供するMixin"""
    
    @property
    def logger(self) -> structlog.stdlib.BoundLogger:
        """ロガーインスタンスを取得"""
        class_name = self.__class__.__name__
        return get_logger(f"ai_news_reporter.{class_name}")


def log_execution_time(func_name: str):
    """関数実行時間をログに記録するデコレータ"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            import time
            logger = get_logger()
            start_time = time.time()
            
            logger.debug("関数実行開始", function=func_name)
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                logger.info("関数実行完了", 
                           function=func_name, 
                           execution_time_seconds=round(execution_time, 3))
                return result
            except Exception as e:
                execution_time = time.time() - start_time
                logger.error("関数実行エラー", 
                            function=func_name, 
                            execution_time_seconds=round(execution_time, 3),
                            error=str(e))
                raise
        return wrapper
    return decorator


def create_component_logger(component: str) -> structlog.stdlib.BoundLogger:
    """コンポーネント専用のロガーを作成
    
    Args:
        component: コンポーネント名 (collector, processor, generator等)
        
    Returns:
        structlog.stdlib.BoundLogger: コンポーネント用ロガー
    """
    return get_logger(f"ai_news_reporter.{component}")


# 開発環境での便利なログ関数
def debug_news_item(news_item, logger: structlog.stdlib.BoundLogger = None):
    """NewsItemの詳細をデバッグログに出力"""
    if logger is None:
        logger = get_logger()
    
    logger.debug("NewsItem詳細",
                title=news_item.title,
                url=str(news_item.url),
                source=news_item.source_name,
                category=news_item.category.value if news_item.category else None,
                importance=news_item.importance.value if news_item.importance else None,
                score=news_item.score,
                published_at=news_item.published_at.isoformat() if news_item.published_at else None,
                keywords=news_item.keywords[:5])  # 最初の5個のキーワードのみ


def debug_processing_stats(stats, logger: structlog.stdlib.BoundLogger = None):
    """処理統計をデバッグログに出力"""
    if logger is None:
        logger = get_logger()
    
    logger.info("処理統計",
               total_sources=stats.total_sources_checked,
               successful_sources=stats.successful_sources,
               failed_sources=stats.failed_sources,
               total_items=stats.total_items_collected,
               duplicates_removed=stats.duplicates_removed,
               final_items=stats.items_after_filtering,
               processing_time=f"{stats.processing_time_seconds:.2f}秒",
               errors_count=len(stats.errors),
               warnings_count=len(stats.warnings))