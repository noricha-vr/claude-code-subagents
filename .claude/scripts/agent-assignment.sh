#!/bin/bash

# エージェント割り当てスクリプト
# タスク実行前にエージェント一覧を取得して適切に割り当てる

AGENTS_DIR="/Users/main/project/claude-code-agents/.claude/agents"
TASK_DESC="$1"

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== エージェント自動割り当てシステム ===${NC}"
echo ""

# エージェント一覧を取得
echo -e "${YELLOW}利用可能なエージェント:${NC}"
echo ""

# agents copyディレクトリも含めて検索
agents=()
agent_descriptions=()

# メインディレクトリのエージェント
for agent_file in "$AGENTS_DIR"/*.md; do
    if [ -f "$agent_file" ]; then
        agent_name=$(basename "$agent_file" .md)
        agent_desc=$(grep "^description:" "$agent_file" | sed 's/description: //')
        agents+=("$agent_name")
        agent_descriptions+=("$agent_desc")
        echo -e "  ${GREEN}@$agent_name${NC} - $agent_desc"
    fi
done

# agents copyディレクトリのエージェント
if [ -d "$AGENTS_DIR/agents copy" ]; then
    for agent_file in "$AGENTS_DIR/agents copy"/*.md; do
        if [ -f "$agent_file" ]; then
            agent_name=$(basename "$agent_file" .md)
            agent_desc=$(grep "^description:" "$agent_file" | sed 's/description: //')
            agents+=("$agent_name")
            agent_descriptions+=("$agent_desc")
            echo -e "  ${GREEN}@$agent_name${NC} - $agent_desc"
        fi
    done
fi

echo ""
echo -e "${YELLOW}タスク:${NC} $TASK_DESC"
echo ""

# タスクキーワードに基づいて推奨エージェントを選択
recommended=""

# キーワードマッチング
if [[ "$TASK_DESC" =~ "計画"|"プラン"|"plan"|"設計"|"アーキテクチャ" ]]; then
    recommended="planner"
elif [[ "$TASK_DESC" =~ "実装"|"実行"|"コード"|"作成"|"修正" ]]; then
    recommended="executor"
elif [[ "$TASK_DESC" =~ "レビュー"|"品質"|"チェック"|"確認" ]]; then
    recommended="code-quality-reviewer"
elif [[ "$TASK_DESC" =~ "デバッグ"|"バグ"|"エラー"|"問題" ]]; then
    recommended="debug-investigator"
elif [[ "$TASK_DESC" =~ "フロントエンド"|"TypeScript"|"React"|"Vue" ]]; then
    recommended="typescript-frontend-architect"
elif [[ "$TASK_DESC" =~ "バックエンド"|"API"|"サーバー" ]]; then
    recommended="backend-implementation-expert"
elif [[ "$TASK_DESC" =~ "GCP"|"Cloud Run"|"Google Cloud" ]]; then
    recommended="gcp-cloud-architect"
elif [[ "$TASK_DESC" =~ "lint"|"リント"|"フォーマット" ]]; then
    recommended="linter-error-fixer"
elif [[ "$TASK_DESC" =~ "CLAUDE.md"|"ドキュメント" ]]; then
    recommended="claude-md-maintainer"
elif [[ "$TASK_DESC" =~ "進捗"|"タスク管理"|"TODO" ]]; then
    recommended="task-progress-manager"
else
    # デフォルトはplanner
    recommended="planner"
fi

echo -e "${RED}⚠️  警告: タスクにはエージェントの割り当てが必須です${NC}"
echo -e "${GREEN}✓ 推奨エージェント: @$recommended${NC}"
echo ""
echo -e "使用例: ${BLUE}@$recommended \"$TASK_DESC\"${NC}"
echo ""

# エージェントが指定されていない場合は警告を返す
if [ -z "$2" ]; then
    echo -e "${RED}エラー: エージェントが指定されていません。${NC}"
    echo -e "${YELLOW}タスクを実行するには、必ずエージェントを指定してください。${NC}"
    exit 1
fi