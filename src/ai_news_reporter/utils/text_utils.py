"""テキスト処理ユーティリティ"""

import re
from typing import List, Set
from config.settings import settings


def clean_text(text: str) -> str:
    """テキストをクリーンアップ"""
    if not text:
        return ""
    
    # HTMLタグを削除
    text = re.sub(r'<[^>]+>', '', text)
    # 改行・タブを正規化
    text = re.sub(r'\s+', ' ', text)
    # 前後の空白を削除
    text = text.strip()
    
    return text


def extract_keywords(text: str, min_length: int = 3) -> List[str]:
    """テキストからキーワードを抽出"""
    if not text:
        return []
    
    # 英数字のワードのみ抽出
    words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9]*\b', text.lower())
    # 最小長でフィルタリング
    keywords = [word for word in words if len(word) >= min_length]
    
    return list(set(keywords))


def calculate_ai_relevance_score(title: str, content: str = "") -> float:
    """AI関連度スコアを計算"""
    text = f"{title} {content}".lower()
    
    if not text.strip():
        return 0.0
    
    # 除外キーワードのチェック
    for exclusion in settings.ai_keywords.exclusions:
        if exclusion in text:
            # 除外キーワードが含まれる場合は大幅減点
            return 0.1
    
    # プライマリキーワードのマッチ
    primary_matches = 0
    for keyword in settings.ai_keywords.primary:
        if keyword.lower() in text:
            primary_matches += 1
    
    # セカンダリキーワードのマッチ
    secondary_matches = 0
    for keyword in settings.ai_keywords.secondary:
        if keyword.lower() in text:
            secondary_matches += 1
    
    # スコア計算
    primary_score = min(primary_matches * 0.4, 0.8)  # 最大80%
    secondary_score = min(secondary_matches * 0.1, 0.2)  # 最大20%
    
    total_score = primary_score + secondary_score
    return min(total_score, 1.0)


def calculate_importance_score(
    ai_relevance: float,
    upvotes: int = 0,
    comments_count: int = 0,
    title_length: int = 0
) -> float:
    """重要度スコアを計算"""
    if ai_relevance < 0.3:
        return 0.0
    
    # ベーススコアはAI関連度
    base_score = ai_relevance * 0.5
    
    # アップボート数による加算（正規化）
    upvote_score = min(upvotes / 100.0, 0.3)
    
    # コメント数による加算（正規化）
    comment_score = min(comments_count / 50.0, 0.2)
    
    # タイトル長による微調整（短すぎる/長すぎるタイトルは減点）
    title_score = 0.0
    if 20 <= title_length <= 100:
        title_score = 0.1
    elif 10 <= title_length < 20 or 100 < title_length <= 150:
        title_score = 0.05
    
    total_score = base_score + upvote_score + comment_score + title_score
    return min(total_score, 1.0)