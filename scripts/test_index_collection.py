#!/usr/bin/env python3
"""日本株価指数収集機能のテストスクリプト

Step 003の実装である指数収集機能をテストし、動作確認を行う
"""

import asyncio
import sys
from pathlib import Path
import json
from datetime import datetime

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "src"))

from stock_reporter.collectors.index_collector import IndexCollector
from stock_reporter.processors.index_processor import IndexProcessor
from stock_reporter.models.stock_data import StockReportConfig


async def test_index_collection():
    """指数収集機能の包括的テスト"""
    print("=" * 60)
    print("日本株価指数収集機能テスト開始")
    print("=" * 60)
    
    try:
        # 設定作成
        config = StockReportConfig(
            target_indices=["^N225", "1306.T", "2516.T"],  # 日経225、TOPIX ETF、東証マザーズETF
            max_retries=2,
            timeout_seconds=30
        )
        
        print(f"対象指数: {config.target_indices}")
        print(f"最大リトライ回数: {config.max_retries}")
        print()
        
        # IndexCollectorのテスト
        print("1. IndexCollector 初期化テスト")
        collector = IndexCollector(config)
        print("✅ IndexCollector初期化成功")
        print()
        
        # 指数データ収集テスト
        print("2. 指数データ収集テスト")
        collection_results = await collector.collect_indices()
        
        print(f"収集結果:")
        print(f"  - 成功: {len(collection_results['success'])}")
        print(f"  - 失敗: {len(collection_results['failed'])}")
        print(f"  - 総リクエスト数: {collection_results['total_requested']}")
        print()
        
        if collection_results["success"]:
            print("3. 収集データ詳細:")
            for index in collection_results["success"]:
                change_info = ""
                if index.change_percent is not None:
                    sign = "+" if index.change_percent >= 0 else ""
                    change_info = f" ({sign}{index.change_percent:.2f}%)"
                
                print(f"  📊 {index.name} ({index.symbol}): {index.current_value:,.2f}{change_info}")
        else:
            print("⚠️  収集に成功した指数がありません")
        
        if collection_results["failed"]:
            print("\n❌ 失敗した指数:")
            for failed in collection_results["failed"]:
                print(f"  - {failed['symbol']}: {failed['error']}")
        
        print()
        
        # IndexProcessorのテスト
        print("4. IndexProcessor データ処理テスト")
        processor = IndexProcessor()
        processed_data = processor.process_indices_data(collection_results)
        
        print(f"処理結果ステータス: {processed_data['status']}")
        
        if processed_data["status"] == "success":
            summary = processed_data["summary"]
            trend = processed_data["market_trend"]
            
            print(f"市場サマリー:")
            print(f"  - 方向: {summary['market_direction']}")
            print(f"  - センチメント: {summary['market_sentiment']}")
            print(f"  - 信頼度: {summary['confidence']}")
            print(f"  - 平均変動: {summary['average_change']:.2f}%")
            print(f"  - 上昇指数: {summary['positive_indices']}")
            print(f"  - 下降指数: {summary['negative_indices']}")
            
            if summary["best_performer"]:
                bp = summary["best_performer"]
                print(f"  - 最高パフォーマンス: {bp['name']} ({bp['change_percent']:+.2f}%)")
            
            if summary["worst_performer"]:
                wp = summary["worst_performer"]
                print(f"  - 最低パフォーマンス: {wp['name']} ({wp['change_percent']:+.2f}%)")
        
        print()
        
        # レポート用データ作成テスト
        print("5. レポート用データ作成テスト")
        report_data = processor.create_report_data(processed_data)
        
        if report_data["status"] == "success":
            print(f"レポート用データ作成成功 - 指数数: {report_data['total_count']}")
            
            print("レポート形式のデータ:")
            for index in report_data["indices"]:
                print(f"  {index['trend_icon']} {index['name']}: {index['current_value']} {index['change']}")
        else:
            print("⚠️  レポート用データ作成失敗")
        
        print()
        
        # サマリー情報のテスト
        print("6. IndexCollector サマリー機能テスト")
        summary_info = collector.get_index_summary(collection_results)
        
        print(f"サマリー情報:")
        print(f"  - ステータス: {summary_info['status']}")
        if summary_info["status"] == "success":
            print(f"  - 指数数: {summary_info['indices_count']}")
            print(f"  - 上昇数: {summary_info['positive_count']}")
            print(f"  - 下降数: {summary_info['negative_count']}")
        
        print()
        
        # リトライ機能のテスト（軽量版）
        print("7. リトライ機能テスト")
        retry_results = await collector.collect_with_retry(max_retries=1)
        retry_success_count = len(retry_results["success"])
        print(f"リトライ機能テスト完了 - 成功指数数: {retry_success_count}")
        
        print()
        
        # 結果の保存
        test_results = {
            "test_timestamp": datetime.now().isoformat(),
            "collection_results": {
                "success_count": len(collection_results["success"]),
                "failed_count": len(collection_results["failed"]),
                "total_requested": collection_results["total_requested"]
            },
            "processing_results": {
                "status": processed_data["status"],
                "market_direction": processed_data["summary"]["market_direction"] if processed_data["status"] == "success" else None
            },
            "report_data_status": report_data["status"]
        }
        
        # テスト結果をファイルに保存
        output_path = project_root / "logs" / f"index_collection_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(test_results, f, indent=2, ensure_ascii=False)
        
        print(f"テスト結果保存: {output_path}")
        
        # 総合評価
        print("\n" + "=" * 60)
        print("テスト総合結果")
        print("=" * 60)
        
        success_indicators = [
            bool(collection_results["success"]),  # データ収集成功
            processed_data["status"] == "success",  # データ処理成功
            report_data["status"] == "success",  # レポートデータ作成成功
            summary_info["status"] == "success",  # サマリー作成成功
        ]
        
        success_count = sum(success_indicators)
        total_tests = len(success_indicators)
        
        if success_count == total_tests:
            print("🎉 すべてのテストが成功しました！")
            print("   Step 003の指数収集機能は正常に動作しています。")
        elif success_count > total_tests // 2:
            print("✅ 主要機能のテストが成功しました")
            print(f"   成功: {success_count}/{total_tests}")
        else:
            print("⚠️  複数のテストが失敗しています")
            print(f"   成功: {success_count}/{total_tests}")
            print("   詳細なログを確認してください。")
        
        return success_count == total_tests
        
    except Exception as e:
        print(f"❌ テスト実行中にエラーが発生: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # 非同期実行
    success = asyncio.run(test_index_collection())
    sys.exit(0 if success else 1)