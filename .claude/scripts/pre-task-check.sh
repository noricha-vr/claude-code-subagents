#!/bin/bash

# Pre-Task Hook: エージェント割り当てチェック
# Taskツール使用前に実行され、エージェントが適切に割り当てられているか確認

# 入力パラメータ（Taskツールの引数）を解析
TASK_INPUT="$@"

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🤖 エージェント割り当てチェックシステム${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# エージェントディレクトリ
AGENTS_DIR="/Users/main/project/claude-code-agents/.claude/agents"

# 利用可能なエージェントをリスト表示
echo -e "${YELLOW}📋 利用可能なエージェント一覧:${NC}"
echo ""

# エージェント情報を配列に格納
declare -A agent_info

# メインディレクトリのエージェント
for agent_file in "$AGENTS_DIR"/*.md; do
    if [ -f "$agent_file" ]; then
        agent_name=$(basename "$agent_file" .md)
        agent_desc=$(grep "^description:" "$agent_file" | sed 's/description: //')
        agent_info["$agent_name"]="$agent_desc"
        echo -e "  ${GREEN}✓ @$agent_name${NC}"
        echo -e "    └─ $agent_desc"
    fi
done

# agents copyディレクトリのエージェント
if [ -d "$AGENTS_DIR/agents copy" ]; then
    echo ""
    echo -e "${YELLOW}📁 追加エージェント (agents copy):${NC}"
    echo ""
    for agent_file in "$AGENTS_DIR/agents copy"/*.md; do
        if [ -f "$agent_file" ]; then
            agent_name=$(basename "$agent_file" .md)
            agent_desc=$(grep "^description:" "$agent_file" | sed 's/description: //')
            agent_info["$agent_name"]="$agent_desc"
            echo -e "  ${GREEN}✓ @$agent_name${NC}"
            echo -e "    └─ $agent_desc"
        fi
    done
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# タスクタイプごとの推奨エージェント
echo -e "${YELLOW}🎯 タスクタイプ別推奨エージェント:${NC}"
echo ""
echo -e "  ${BLUE}計画・設計${NC} → @planner"
echo -e "  ${BLUE}実装・実行${NC} → @executor"
echo -e "  ${BLUE}品質レビュー${NC} → @code-quality-reviewer"
echo -e "  ${BLUE}デバッグ${NC} → @debug-investigator"
echo -e "  ${BLUE}フロントエンド${NC} → @typescript-frontend-architect"
echo -e "  ${BLUE}バックエンド${NC} → @backend-implementation-expert"
echo -e "  ${BLUE}GCP/Cloud${NC} → @gcp-cloud-architect"
echo -e "  ${BLUE}リント修正${NC} → @linter-error-fixer"
echo -e "  ${BLUE}ドキュメント${NC} → @claude-md-maintainer"
echo -e "  ${BLUE}タスク管理${NC} → @task-progress-manager"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}⚠️  重要: すべてのタスクには適切なエージェントの割り当てが必須です${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# エージェント割り当てのベストプラクティス
echo -e "${YELLOW}💡 エージェント選択のベストプラクティス:${NC}"
echo ""
echo -e "  1. タスクの目的を明確にする"
echo -e "  2. 専門性の高いエージェントを優先的に選択"
echo -e "  3. 複雑なタスクは@plannerで分割してから実行"
echo -e "  4. 実装後は必ず@code-quality-reviewerでレビュー"
echo ""

# タスクが指定されている場合は推奨を表示
if [ -n "$TASK_INPUT" ]; then
    echo -e "${BLUE}現在のタスク:${NC} $TASK_INPUT"
    echo ""
    echo -e "${GREEN}✨ タスクにはsubagent_typeパラメータでエージェントを指定してください${NC}"
    echo ""
fi