#!/bin/bash

# エージェント割り当て必須化スクリプト
# すべてのタスクでエージェントの明示的な割り当てを強制

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}🤖 エージェント割り当て必須システム 🤖${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${RED}⚠️  重要ルール:${NC}"
echo -e "${YELLOW}すべてのタスクには必ず適切なエージェントを割り当ててください。${NC}"
echo ""

echo -e "${BLUE}📋 タスクタイプ別エージェント割り当てガイド:${NC}"
echo ""
echo -e "  ${GREEN}計画・設計${NC}         → ${MAGENTA}@planner${NC} または ${MAGENTA}@プランナー${NC}"
echo -e "  ${GREEN}実装・コーディング${NC}  → ${MAGENTA}@executor${NC}"
echo -e "  ${GREEN}品質レビュー${NC}       → ${MAGENTA}@code-quality-reviewer${NC}"
echo -e "  ${GREEN}デバッグ・調査${NC}     → ${MAGENTA}@debug-investigator${NC} または ${MAGENTA}@入れ子エージェント${NC}"
echo -e "  ${GREEN}フロントエンド${NC}     → ${MAGENTA}@typescript-frontend-architect${NC}"
echo -e "  ${GREEN}バックエンド${NC}       → ${MAGENTA}@backend-implementation-expert${NC}"
echo -e "  ${GREEN}GCP/Cloud Run${NC}     → ${MAGENTA}@gcp-cloud-architect${NC}"
echo -e "  ${GREEN}リント・修正${NC}       → ${MAGENTA}@linter-error-fixer${NC}"
echo -e "  ${GREEN}ドキュメント管理${NC}   → ${MAGENTA}@claude-md-maintainer${NC}"
echo -e "  ${GREEN}タスク進捗管理${NC}     → ${MAGENTA}@task-progress-manager${NC}"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}💡 Taskツール使用時の必須パラメータ:${NC}"
echo -e "   ${BLUE}subagent_type${NC}: エージェントタイプを必ず指定"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${MAGENTA}📌 エージェント選択の原則:${NC}"
echo -e "  1. タスクの性質に最も適したエージェントを選択"
echo -e "  2. 不明な場合は ${MAGENTA}@planner${NC} で計画から開始"
echo -e "  3. 複雑なタスクは ${MAGENTA}@planner${NC} で分割してから実行"
echo -e "  4. 実装後は必ず ${MAGENTA}@code-quality-reviewer${NC} でレビュー"
echo ""

echo -e "${RED}🚫 エージェントなしでのタスク実行は禁止です！${NC}"
echo ""