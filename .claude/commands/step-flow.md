---
name: step-flow
description: Step単位での計画→実装→レビューのフローを自動管理
color: yellow
---

# @step-flow コマンド

## 概要
@agent-planner → @agent-executor → @agent-reviewer のフローをStep単位で自動的に実行し、小さな変更ごとにレビューを受けるワークフローを提供します。

## 使用方法

### 基本使用
```bash
@step-flow start "実装したい機能の説明"
```

### フロー制御
```bash
@step-flow continue  # 次のステップを実行
@step-flow pause     # 一時停止
@step-flow status    # 現在の状態を確認
@step-flow review    # 強制レビュー実行
```

## 自動実行フロー

```mermaid
graph TD
    A[start: タスク受付] --> B[@planner: Phase/Step分解]
    B --> C[docs/context/plan.md生成]
    C --> D[Step 1開始]
    
    D --> E[@executor: 1ファイル実装]
    E --> F[✓ レビュー必須チェック]
    F -->|未実施| F2[🛑 停止: レビュー呼び出し強制]
    F2 --> G[@reviewer: 即レビュー]
    F -->|実施済み| G
    G --> H{合格?}
    
    H -->|No| I[@executor: 修正]
    I --> F
    
    H -->|Yes| J[Step完了記録]
    J --> K{全Step完了?}
    
    K -->|No| L[次Step]
    L --> E
    
    K -->|Yes| M[Phase完了]
    M --> N{全Phase完了?}
    
    N -->|No| O[次Phase]
    O --> D
    
    N -->|Yes| P[プロジェクト完了]
```

### 🛑 レビュー強制メカニズム
各ステップの実装完了後、以下のチェックが自動実行されます：
1. `docs/results/step_XXX.md`の存在確認
2. `@reviewer`の呼び出し履歴確認
3. `docs/reviews/step_XXX_review.md`の存在確認

いずれかが欠けている場合、次のステップに進めません。

## ステップ管理

### 自動生成される構造
```
docs/
├── context/
│   ├── plan.md          # 全体計画（Phase/Step構造）
│   ├── current_step.md  # 現在実行中のStep
│   └── status.md        # 進捗状況
├── steps/
│   ├── phase_01/
│   │   ├── step_01_impl.md    # 実装結果
│   │   ├── step_01_review.md  # レビュー結果
│   │   └── step_01_fixed.md   # 修正結果
│   └── phase_02/
│       └── ...
└── summary/
    └── progress.md      # 全体サマリー
```

## コマンド詳細

### start - 新規フロー開始
```bash
@step-flow start [options] "タスク説明"

Options:
  --max-steps <n>      # 最大ステップ数（デフォルト: 50）
  --step-size <lines>  # 1ステップの最大行数（デフォルト: 20）
  --review-mode <mode> # strict|normal|light（デフォルト: normal）
  --auto-continue      # 自動的に次のステップへ進む
```

### continue - 次のステップ実行
```bash
@step-flow continue [options]

Options:
  --skip-review   # レビューをスキップ（非推奨）
  --force         # エラーがあっても続行
```

### status - 現在の状態確認
```bash
@step-flow status [options]

Options:
  --verbose       # 詳細情報を表示
  --format <fmt>  # json|table|summary
```

出力例：
```
📊 Step Flow Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1: User Authentication (60% complete)
  ✅ Step 1.1: Add user model fields (completed)
  ✅ Step 1.2: Add password methods (completed)
  🔄 Step 1.3: Create serializer (in review)
  ⏸️ Step 1.4: Create view (pending)
  ⏸️ Step 1.5: Add routes (pending)

Phase 2: Testing (0% complete)
  ⏸️ Step 2.1-2.4: (pending)

Summary:
- Total Steps: 9
- Completed: 2
- In Progress: 1
- Pending: 6
- Review Cycles: 3
```

### review - 強制レビュー
```bash
@step-flow review [step-id]

# 現在のステップをレビュー
@step-flow review

# 特定のステップをレビュー
@step-flow review 1.3
```

### rollback - ステップの巻き戻し
```bash
@step-flow rollback [step-id]

# 1つ前に戻る
@step-flow rollback

# 特定のステップまで戻る
@step-flow rollback 1.2
```

## 設定とカスタマイズ

### .claude/config/step-flow.yaml
```yaml
step_flow:
  # ステップサイズ
  step_size:
    max_files: 1          # 1ステップの最大ファイル数
    max_lines: 20         # 1ステップの最大行数
    max_duration: 60      # 最大実行時間（秒）
  
  # レビュー設定
    mode: normal          # strict|normal|light
    auto_fix: true        # 自動修正を試みる
    max_retries: 3        # 最大再試行回数
    force_review: true    # レビューを強制実行
    skip_review_check: false # レビューチェックをスキップ（非推奨）
  
  # 自動化設定
  automation:
    auto_continue: false  # 自動的に次へ進む
    pause_on_error: true  # エラー時に停止
    commit_interval: 5    # n Steps毎にコミット
  
  # 通知設定
  notifications:
    on_phase_complete: true
    on_error: true
    on_review_fail: true
```

## インタラクティブモード

```bash
@step-flow interactive
```

```
🎮 Step Flow Interactive Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> What would you like to implement?
> User authentication with email and password

📋 Creating plan...
Found 2 phases with 9 total steps

Phase 1: Backend Implementation (5 steps)
Phase 2: Testing (4 steps)

> Start implementation? [Y/n] Y

▶️ Starting Step 1.1: Add email field to User model
  [=====>    ] 50% Implementing...
  
✅ Step 1.1 completed successfully
⚡ Review in progress...
✅ Review passed

> Continue to Step 1.2? [Y/n/review] Y
...
```

## エラーハンドリング

### レビュー失敗時
```
⚠️ Step 1.3 failed review
Issues found:
- Missing input validation
- No error handling

Actions:
[A]uto-fix  [M]anual fix  [S]kip  [R]eview details
> A

🔧 Attempting auto-fix...
✅ Auto-fix successful
🔄 Re-reviewing...
✅ Review passed
```

### 実装エラー時
```
❌ Step 2.1 implementation failed
Error: Import 'unittest' not found

Actions:
[R]etry  [S]kip  [M]odify plan  [A]bort
> M

📝 Modifying plan...
Updated: Using pytest instead of unittest
🔄 Retrying Step 2.1...
```

## 統計とレポート

```bash
@step-flow report
```

```
📈 Step Flow Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project: User Authentication
Duration: 45 minutes
Efficiency: 89%

Steps Breakdown:
- Total: 9
- Completed: 9
- First-time success: 7 (78%)
- Required fixes: 2 (22%)

Review Statistics:
- Total reviews: 11
- Passed: 9
- Failed: 2
- Auto-fixed: 2

Code Metrics:
- Files changed: 6
- Lines added: 145
- Lines modified: 23
- Test coverage: 85%

Recommendations:
✨ Consider breaking Step 2.3 into smaller pieces
⚡ Step 1.4 pattern can be reused for similar features
```
