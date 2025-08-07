---
name: step_flow
description: ワークフロー全体を管理し、planner→executor→reviewerの順序で自動実行します
---

# Step Flow ワークフローコマンド

## 🎯 概要
このコマンドは、エージェント間のワークフローを自動化し、適切な順序でタスクを実行します。

## 🚀 使用方法

### 新規ワークフロー開始
```bash
/step_flow start "タスクの説明"
```

### 既存ワークフローの継続
```bash
/step_flow resume
```

### ワークフロー状態確認
```bash
/step_flow status
```

### 特定ステップから再開
```bash
/step_flow resume-from "Step 1.2"
```

## 🔄 実行フロー

1. **初期化フェーズ**
   - workflow_state.jsonの作成/読み込み
   - 現在の状態を確認

2. **計画フェーズ** 
   - @agent-plannerを呼び出し
   - docs/context/plan.mdを生成
   - current_step.mdを更新

3. **実装フェーズ**
   - @agent-executorを呼び出し
   - docs/results/step_XXX.mdを生成
   - エラーがあればdocs/results/step_XXX_error.mdに記録

4. **レビューフェーズ**
   - @agent-reviewerを自動呼び出し
   - docs/reviews/step_XXX_review.mdを生成
   - improvement_tasks.mdを更新

5. **評価フェーズ**
   - レビュー結果を確認
   - 必須修正があれば実装フェーズに戻る
   - 問題なければ次のステップへ

6. **完了判定**
   - すべてのステップが完了したら終了
   - 未完了のステップがあれば2に戻る

## 📋 コマンド実行時の処理

### `start`コマンド
```javascript
// 擬似コード
function startWorkflow(taskDescription) {
  // 1. workflow_state.jsonを初期化
  const state = {
    workflow_id: generateId(),
    started_at: new Date(),
    current_phase: "planning",
    current_step: null,
    current_agent: "planner"
  };
  
  // 2. @workflow-orchestratorを起動
  await callAgent("workflow-orchestrator", taskDescription);
  
  // 3. 自動的にplanner→executor→reviewerの順で実行
  while (!isWorkflowComplete(state)) {
    state = await executeNextPhase(state);
  }
}
```

### `resume`コマンド
```javascript
function resumeWorkflow() {
  // 1. workflow_state.jsonを読み込み
  const state = loadWorkflowState();
  
  // 2. 中断地点から再開
  await callAgent("workflow-orchestrator", "--resume");
}
```

### `status`コマンド
```javascript
function showStatus() {
  // 1. 現在の状態を表示
  const state = loadWorkflowState();
  
  console.log(`
    現在のフェーズ: ${state.current_phase}
    現在のステップ: ${state.current_step}
    実行中のエージェント: ${state.current_agent}
    完了ステップ数: ${state.completed_steps}/${state.total_steps}
  `);
}
```

## 🔍 自動チェックポイント

各フェーズ完了時に以下を自動確認：

### Planning完了時
- ✅ plan.mdが存在する
- ✅ current_step.mdが更新されている
- ✅ 実装対象が明確である

### Executing完了時
- ✅ results/step_XXX.mdが存在する
- ✅ 変更ファイルが記録されている
- ✅ テスト結果が含まれている

### Reviewing完了時
- ✅ reviews/step_XXX_review.mdが存在する
- ✅ 改善提案が記録されている
- ✅ 優先度が明確である

## 🛡️ エラーハンドリング

### タイムアウト処理
- 各エージェントの実行時間上限：5分
- タイムアウト時は状態を保存して中断

### リトライ機能
- エラー時は最大3回まで自動リトライ
- リトライ間隔：10秒

### ロールバック
- 致命的エラー時は前の安定状態に戻る
- workflow_state.jsonのバックアップを使用

## 📊 実行ログ

すべての実行はdocs/workflow_log.mdに記録：

```markdown
[2025-08-07 10:00:00] ワークフロー開始: wf_20250807_001
[2025-08-07 10:00:05] @agent-planner 起動
[2025-08-07 10:05:00] @agent-planner 完了 → plan.md生成
[2025-08-07 10:05:05] @agent-executor 起動
[2025-08-07 10:10:00] @agent-executor 完了 → step_001.md生成
[2025-08-07 10:10:05] @agent-reviewer 自動起動
[2025-08-07 10:15:00] @agent-reviewer 完了 → step_001_review.md生成
[2025-08-07 10:15:05] レビュー結果: 要修正
[2025-08-07 10:15:10] @agent-executor 修正実行
```

## 🎯 実際の呼び出し例

### 例1: 新機能の実装
```bash
/step_flow start "ユーザー認証機能を追加。JWT認証、ログイン/ログアウト、パスワードリセット機能を含む"
```

### 例2: 中断からの再開
```bash
# 前回の作業を中断した後
/step_flow resume
# → 自動的に中断地点から再開
```

### 例3: 進捗確認
```bash
/step_flow status
# 出力:
# 現在のフェーズ: reviewing
# 現在のステップ: Step 2.3
# 完了: 8/20ステップ
# 経過時間: 1時間23分
```

## ⚙️ 設定オプション

### 並列実行モード
```bash
/step_flow start "タスク" --parallel
# 独立したステップを並列実行
```

### ドライランモード
```bash
/step_flow start "タスク" --dry-run
# 実際の実行はせず、計画のみ作成
```

### 詳細ログモード
```bash
/step_flow start "タスク" --verbose
# 詳細なデバッグ情報を出力
```

## 🔧 トラブルシューティング

### ワークフローが進まない場合
1. `workflow_state.json`を確認
2. 最後に実行されたエージェントの出力を確認
3. `docs/workflow_log.md`でエラーを確認

### 無限ループに陥った場合
1. Ctrl+Cで中断
2. `/step_flow reset`で状態をリセット
3. 問題のステップを手動で修正

### ファイルが見つからない場合
1. `docs/`ディレクトリ構造を確認
2. 必要なファイルを手動作成
3. `/step_flow resume`で再開

## 📝 注意事項

- このコマンドは@workflow-orchestratorエージェントをラップしています
- 各エージェントは独立して動作し、ファイルを通じて通信します
- 大規模なタスクは自動的に小さなステップに分割されます
- レビュー失敗時は自動的に修正ループに入ります