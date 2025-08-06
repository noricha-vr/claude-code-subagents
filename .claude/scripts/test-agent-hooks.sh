#!/bin/bash

# エージェント割り当てフックのテストスクリプト

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 エージェント割り当てフック動作テスト${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# テスト1: エージェント一覧取得
echo -e "${YELLOW}テスト1: エージェント一覧の取得${NC}"
echo -e "${MAGENTA}コマンド: /Users/main/.claude/scripts/agent-assignment.sh \"新機能を実装する\"${NC}"
echo ""
/Users/main/.claude/scripts/agent-assignment.sh "新機能を実装する" 2>&1 | head -30
echo ""

# テスト2: Pre-Task Hook
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}テスト2: Pre-Task Hook（Taskツール使用前）${NC}"
echo -e "${MAGENTA}コマンド: /Users/main/.claude/scripts/pre-task-check.sh${NC}"
echo ""
/Users/main/.claude/scripts/pre-task-check.sh
echo ""

# テスト3: 各タスクタイプの推奨エージェント
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}テスト3: タスクタイプ別推奨エージェント${NC}"
echo ""

test_tasks=(
    "新しい機能の計画を立てる"
    "バグを修正する"
    "コードレビューを実行"
    "エラーをデバッグする"
    "Reactコンポーネントを作成"
    "APIエンドポイントを実装"
    "Cloud Runにデプロイ"
    "リントエラーを修正"
    "CLAUDE.mdを更新"
    "タスクの進捗を管理"
)

for task in "${test_tasks[@]}"; do
    echo -e "${BLUE}タスク:${NC} \"$task\""
    output=$(/Users/main/.claude/scripts/agent-assignment.sh "$task" 2>&1)
    recommended=$(echo "$output" | grep "推奨エージェント" | sed 's/.*@//' | sed 's/ .*//')
    if [ -n "$recommended" ]; then
        echo -e "${GREEN}  → 推奨: @$recommended${NC}"
    fi
done

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ テスト完了${NC}"
echo ""
echo -e "${YELLOW}📝 確認事項:${NC}"
echo -e "  1. settings.jsonのPreToolUseフックが正しく設定されている"
echo -e "  2. Taskツール使用時にpre-task-check.shが自動実行される"
echo -e "  3. エージェント一覧が正しく表示される"
echo -e "  4. タスクに応じた適切なエージェントが推奨される"
echo ""
echo -e "${MAGENTA}💡 使用方法:${NC}"
echo -e "  Taskツールを使用すると自動的にエージェント一覧が表示され、"
echo -e "  適切なエージェントの割り当てを促します。"
echo -e "  例: Task(subagent_type=\"planner\", ...)"
echo ""