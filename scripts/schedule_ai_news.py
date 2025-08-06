#!/usr/bin/env python3
"""AI ニュース収集スケジューラー"""

import os
import sys
import schedule
import time
import subprocess
from datetime import datetime
from pathlib import Path

# プロジェクトルートをPATHに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.settings import settings, logger


def run_news_collection():
    """ニュース収集を実行"""
    logger.info("スケジュール実行: AI ニュース収集を開始")
    
    script_path = Path(__file__).parent / "collect_ai_news.py"
    
    try:
        # collect_ai_news.py を実行
        result = subprocess.run([
            sys.executable, str(script_path),
            "--limit", "20",
            "--max-articles", "15", 
            "--format", "both",
            "--min-relevance", "0.2"
        ], capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            logger.info("スケジュール実行: ニュース収集が正常に完了")
            logger.info(f"標準出力: {result.stdout}")
        else:
            logger.error(f"スケジュール実行: ニュース収集が失敗 (終了コード: {result.returncode})")
            logger.error(f"標準エラー出力: {result.stderr}")
    
    except subprocess.TimeoutExpired:
        logger.error("スケジュール実行: ニュース収集がタイムアウト")
    except Exception as e:
        logger.error(f"スケジュール実行: 予期しないエラー: {e}")


def main():
    """スケジューラーメイン"""
    logger.info("AI ニュース収集スケジューラーを開始")
    
    # スケジュール設定
    # 毎日 8:00 と 20:00 に実行
    schedule.every().day.at("08:00").do(run_news_collection)
    schedule.every().day.at("20:00").do(run_news_collection)
    
    # 開発/テスト用: 10分ごとに実行（コメントアウトされた状態）
    # schedule.every(10).minutes.do(run_news_collection)
    
    logger.info("スケジュール設定完了:")
    logger.info("- 毎日 08:00 にニュース収集")
    logger.info("- 毎日 20:00 にニュース収集")
    
    # 最初の実行
    logger.info("初回実行を開始...")
    run_news_collection()
    
    # スケジューラーのメインループ
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # 1分ごとにチェック
    except KeyboardInterrupt:
        logger.info("スケジューラーを停止します")


if __name__ == "__main__":
    main()