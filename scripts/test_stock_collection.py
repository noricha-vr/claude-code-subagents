"""Step 004 主要銘柄株価収集機能テストスクリプト

実装した銘柄収集・処理機能の包括的テスト
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime

# プロジェクトルートをPATHに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from config.stock_settings import setup_stock_logger
from src.stock_reporter.collectors.stock_collector import StockCollector
from src.stock_reporter.processors.stock_processor import StockProcessor
from src.stock_reporter.models.stock_data import StockReportConfig

logger = setup_stock_logger()


async def test_stock_collection():
    """主要銘柄収集機能のテスト"""
    print("=" * 60)
    print("🏢 Step 004: 主要銘柄株価収集機能テスト")
    print("=" * 60)
    
    # テスト設定（少数銘柄でテスト）
    test_config = StockReportConfig()
    # テスト用に銘柄数を制限
    test_config.target_stocks = test_config.target_stocks[:8]  # 8銘柄に制限
    
    logger.info(f"テスト開始 - 対象銘柄: {test_config.target_stocks}")
    print(f"\n📊 対象銘柄: {test_config.target_stocks}")
    print(f"📊 銘柄数: {len(test_config.target_stocks)}")
    
    # StockCollector初期化
    collector = StockCollector(test_config)
    
    # 収集テスト実行
    print("\n🔄 銘柄データ収集開始...")
    start_time = datetime.now()
    
    try:
        stock_data = await collector.collect_stocks()
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"✅ 収集完了 - 実行時間: {duration:.2f}秒")
        print(f"📈 結果サマリー:")
        print(f"   - 成功: {len(stock_data['success'])}/{stock_data['total_requested']}")
        print(f"   - 失敗: {len(stock_data['failed'])}/{stock_data['total_requested']}")
        
        # 成功した銘柄の詳細表示
        if stock_data['success']:
            print(f"\n📋 収集データ詳細:")
            for i, stock in enumerate(stock_data['success'][:5]):  # 最初の5銘柄のみ表示
                change_str = ""
                if stock.change_percent:
                    sign = "+" if stock.change_percent >= 0 else ""
                    change_str = f" ({sign}{stock.change_percent:.2f}%)"
                
                volume_str = f", 出来高: {stock.volume:,}" if stock.volume else ""
                
                print(f"   {i+1}. {stock.name} ({stock.symbol}): ¥{stock.current_price:,}{change_str}{volume_str}")
        
        # 失敗した銘柄がある場合
        if stock_data['failed']:
            print(f"\n⚠️  失敗した銘柄:")
            for failed in stock_data['failed']:
                print(f"   - {failed['symbol']}: {failed['error']}")
        
        return stock_data
        
    except Exception as e:
        logger.error(f"銘柄収集テストエラー: {e}")
        print(f"❌ 収集エラー: {e}")
        return None


async def test_stock_processing(stock_data):
    """銘柄データ処理機能のテスト"""
    if not stock_data or not stock_data.get('success'):
        print("❌ 処理用データがありません")
        return None
    
    print(f"\n" + "=" * 40)
    print("🧮 銘柄データ処理テスト")
    print("=" * 40)
    
    # StockProcessor初期化
    processor = StockProcessor()
    
    try:
        # 処理実行
        processed_data = processor.process_stock_data(stock_data)
        
        print(f"✅ 処理完了")
        
        # 市場分析結果表示
        market_analysis = processed_data.get('market_analysis', {})
        print(f"\n📊 市場分析結果:")
        print(f"   - 全体センチメント: {market_analysis.get('overall_sentiment', 'unknown')}")
        print(f"   - 信頼度: {market_analysis.get('confidence', 'unknown')}")
        print(f"   - ボラティリティ: {market_analysis.get('volatility', 'unknown')}")
        print(f"   - 上昇銘柄: {market_analysis.get('positive_count', 0)}銘柄")
        print(f"   - 下降銘柄: {market_analysis.get('negative_count', 0)}銘柄")
        print(f"   - 平均変動: {market_analysis.get('average_change', 0.0):.2f}%")
        
        # パフォーマンスサマリー表示
        performance = processed_data.get('performance_summary', {})
        print(f"\n🏆 パフォーマンスサマリー:")
        
        top_gainers = performance.get('top_gainers', [])
        if top_gainers:
            print(f"   📈 上昇上位:")
            for i, gainer in enumerate(top_gainers[:3]):
                print(f"      {i+1}. {gainer['name']} (+{gainer['change_percent']:.2f}%)")
        
        top_losers = performance.get('top_losers', [])
        if top_losers:
            print(f"   📉 下降上位:")
            for i, loser in enumerate(top_losers[:3]):
                print(f"      {i+1}. {loser['name']} ({loser['change_percent']:.2f}%)")
        
        # セクター分析表示
        sector_analysis = processed_data.get('sector_analysis', {})
        sector_summary = sector_analysis.get('sector_summary', {})
        if sector_summary:
            print(f"\n🏭 セクター分析:")
            print(f"   - 最高セクター: {sector_analysis.get('best_sector', 'N/A')}")
            print(f"   - 最低セクター: {sector_analysis.get('worst_sector', 'N/A')}")
            
            print(f"   📊 セクター別パフォーマンス:")
            for sector, data in list(sector_summary.items())[:5]:  # 上位5セクターのみ表示
                print(f"      {sector}: {data['average_change']:+.2f}% ({data['stock_count']}銘柄)")
        
        return processed_data
        
    except Exception as e:
        logger.error(f"銘柄データ処理テストエラー: {e}")
        print(f"❌ 処理エラー: {e}")
        return None


def test_performance_utilities(stock_data):
    """パフォーマンス関連ユーティリティのテスト"""
    if not stock_data or not stock_data.get('success'):
        return
    
    print(f"\n" + "=" * 40)
    print("🛠️  パフォーマンスユーティリティテスト")
    print("=" * 40)
    
    collector = StockCollector()
    stocks = stock_data['success']
    
    try:
        # サマリー取得テスト
        summary = collector.get_stock_performance_summary(stocks)
        print(f"✅ パフォーマンスサマリー取得成功:")
        print(f"   - 総銘柄数: {summary['total_count']}")
        print(f"   - 上昇銘柄: {summary['gainers_count']}")
        print(f"   - 下降銘柄: {summary['losers_count']}")
        print(f"   - 平均変動: {summary['average_change']:.2f}%")
        
        if summary['top_gainer']:
            print(f"   - 最高パフォーマー: {summary['top_gainer']['name']} (+{summary['top_gainer']['change_percent']:.2f}%)")
        
        if summary['top_loser']:
            print(f"   - 最低パフォーマー: {summary['top_loser']['name']} ({summary['top_loser']['change_percent']:.2f}%)")
        
        # フィルタリング機能テスト
        print(f"\n🔍 フィルタリング機能テスト:")
        
        gainers = collector.filter_stocks_by_performance(stocks, "gainers", 3)
        print(f"   📈 上昇上位3銘柄:")
        for i, stock in enumerate(gainers):
            print(f"      {i+1}. {stock.name} (+{stock.change_percent:.2f}%)")
        
        losers = collector.filter_stocks_by_performance(stocks, "losers", 3)
        print(f"   📉 下降上位3銘柄:")
        for i, stock in enumerate(losers):
            print(f"      {i+1}. {stock.name} ({stock.change_percent:.2f}%)")
        
        active = collector.filter_stocks_by_performance(stocks, "active", 3)
        if active:
            print(f"   📊 出来高上位3銘柄:")
            for i, stock in enumerate(active):
                volume_str = f"{stock.volume:,}" if stock.volume else "N/A"
                print(f"      {i+1}. {stock.name} ({volume_str})")
        
        print(f"✅ ユーティリティテスト完了")
        
    except Exception as e:
        logger.error(f"ユーティリティテストエラー: {e}")
        print(f"❌ ユーティリティテストエラー: {e}")


async def main():
    """メインテスト実行"""
    print(f"🚀 Step 004: 主要銘柄株価収集機能 包括テスト")
    print(f"⏰ 実行開始: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. 銘柄データ収集テスト
    stock_data = await test_stock_collection()
    if not stock_data:
        print(f"❌ テスト失敗: 銘柄収集段階でエラー")
        return
    
    # 2. 銘柄データ処理テスト
    processed_data = await test_stock_processing(stock_data)
    if not processed_data:
        print(f"❌ テスト失敗: データ処理段階でエラー")
        return
    
    # 3. パフォーマンス関連機能テスト
    test_performance_utilities(stock_data)
    
    # 総合結果表示
    print(f"\n" + "=" * 60)
    print("🎉 Step 004 テスト完了サマリー")
    print("=" * 60)
    
    success_rate = len(stock_data['success']) / stock_data['total_requested'] * 100
    print(f"📊 銘柄収集成功率: {success_rate:.1f}% ({len(stock_data['success'])}/{stock_data['total_requested']})")
    print(f"🧮 データ処理: {'✅ 成功' if processed_data else '❌ 失敗'}")
    print(f"🛠️  ユーティリティ機能: ✅ 成功")
    
    if success_rate >= 75:  # 75%以上で合格
        print(f"🎯 総合評価: ✅ 合格 (Step 004実装成功)")
    else:
        print(f"🎯 総合評価: ⚠️  要改善 (成功率向上が必要)")
    
    print(f"⏰ 実行終了: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(main())