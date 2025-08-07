---
name: loop
description: ワークフローループを実行（計画→実装→レビューを繰り返し）
---

# Loopコマンド - 自動ループ実行

## 使い方
```
/loop "タスクの説明"
```

## 実行内容
このコマンドを受け取ったら、以下を自動実行：

```python
def execute_workflow_loop(task):
    # 初回計画
    call("@agent-planner", task)
    
    while not is_completed():
        # 現在のステップを取得
        current_step = get_current_step_from_context()
        
        # 実装
        call("@agent-executor", f"Step {current_step}を実装")
        
        # レビュー
        call("@agent-reviewer", "直前の実装をレビュー")
        
        # レビュー結果確認
        if has_critical_issues():
            call("@agent-executor", "レビュー指摘を修正")
            call("@agent-reviewer", "修正内容を再レビュー")
        
        # 次のステップへ
        if has_more_steps():
            call("@agent-planner", "次のステップを計画")
        else:
            break
    
    return "完了"
```

## 実行例
```
/loop "動画→MP3変換アプリを実装"
```

これにより：
1. 全ステップが自動的に実行される
2. 各ステップでレビューが入る
3. 必要に応じて修正が行われる
4. 完了まで自動的に継続