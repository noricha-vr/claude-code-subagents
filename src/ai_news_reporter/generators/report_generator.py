"""レポート生成機能"""

from pathlib import Path
from typing import Optional
from jinja2 import Environment, FileSystemLoader, Template

from ..models.report import NewsReport
from config.settings import settings, logger


class ReportGenerator:
    """日本語レポート生成"""
    
    def __init__(self, template_dir: Optional[str] = None):
        self.template_dir = template_dir or "templates"
        self._setup_jinja2()
    
    def _setup_jinja2(self) -> None:
        """Jinja2 環境をセットアップ"""
        template_path = Path(self.template_dir)
        
        if template_path.exists():
            self.env = Environment(loader=FileSystemLoader(str(template_path)))
        else:
            # テンプレートディレクトリがない場合は文字列テンプレートを使用
            self.env = Environment()
            logger.warning(f"Template directory not found: {template_path}")
    
    def _get_markdown_template(self) -> Template:
        """Markdown テンプレートを取得"""
        template_str = """# {{ report.title }}

**生成日時:** {{ report.formatted_date }}

## 📊 統計情報

- **総収集記事数:** {{ report.total_collected }}
- **AI関連記事数:** {{ report.ai_related_count }}
- **利用ソース数:** {{ report.sources_count }}
- **トップ記事数:** {{ report.top_stories|length }}

---

## 🔥 注目のAIニュース

{% for item in report.top_stories[:10] %}
### {{ loop.index }}. {{ item.title }}

**ソース:** {{ item.source.value|replace('_', ' ')|title }}  
**公開日時:** {{ item.published_at.strftime('%Y-%m-%d %H:%M') }}  
**重要度:** {{ "★" * (item.importance_score * 5)|int }}{{ "☆" * (5 - (item.importance_score * 5)|int) }} ({{ item.importance_score|round(2) }})  
**AI関連度:** {{ (item.ai_relevance_score * 100)|round(1) }}%

{% if item.summary %}
**概要:** {{ item.summary[:200] }}{% if item.summary|length > 200 %}...{% endif %}
{% endif %}

**リンク:** [記事を読む]({{ item.url }})

{% if item.upvotes or item.comments_count %}
**エンゲージメント:** 
{%- if item.upvotes %} {{ item.upvotes }} upvotes{% endif %}
{%- if item.comments_count %} / {{ item.comments_count }} comments{% endif %}
{% endif %}

---

{% endfor %}

## 📈 その他のAI関連記事

{% for item in report.all_stories[10:] %}
- **[{{ item.title }}]({{ item.url }})** - {{ item.source.value|replace('_', ' ')|title }} ({{ item.published_at.strftime('%m/%d %H:%M') }}) - AI関連度: {{ (item.ai_relevance_score * 100)|round(1) }}%
{% endfor %}

---

*このレポートは AI News Reporter により自動生成されました。*
"""
        return self.env.from_string(template_str)
    
    def _get_html_template(self) -> Template:
        """HTML テンプレートを取得"""
        template_str = """<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ report.title }}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
        .article { border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 20px; padding: 20px; }
        .article h3 { color: #495057; margin-top: 0; }
        .article-meta { color: #6c757d; font-size: 0.9em; margin-bottom: 10px; }
        .importance { color: #ffc107; }
        .relevance { background: #e3f2fd; padding: 3px 8px; border-radius: 15px; font-size: 0.8em; }
        .source { background: #f8f9fa; padding: 3px 8px; border-radius: 15px; font-size: 0.8em; }
        .summary { background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 10px 0; }
        .link { display: inline-block; background: #667eea; color: white; padding: 8px 16px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
        .link:hover { background: #5a6fd8; }
        .other-articles { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .other-articles ul { list-style-type: none; padding: 0; }
        .other-articles li { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .other-articles a { text-decoration: none; color: #495057; }
        .other-articles a:hover { color: #667eea; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ report.title }}</h1>
        <p>生成日時: {{ report.formatted_date }}</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-number">{{ report.total_collected }}</div>
            <div>総収集記事数</div>
        </div>
        <div class="stat">
            <div class="stat-number">{{ report.ai_related_count }}</div>
            <div>AI関連記事数</div>
        </div>
        <div class="stat">
            <div class="stat-number">{{ report.sources_count }}</div>
            <div>利用ソース数</div>
        </div>
        <div class="stat">
            <div class="stat-number">{{ report.top_stories|length }}</div>
            <div>トップ記事数</div>
        </div>
    </div>
    
    <h2>🔥 注目のAIニュース</h2>
    
    {% for item in report.top_stories[:10] %}
    <div class="article">
        <h3>{{ loop.index }}. {{ item.title }}</h3>
        <div class="article-meta">
            <span class="source">{{ item.source.value|replace('_', ' ')|title }}</span>
            {{ item.published_at.strftime('%Y-%m-%d %H:%M') }}
            <span class="importance">{{ "★" * (item.importance_score * 5)|int }}{{ "☆" * (5 - (item.importance_score * 5)|int) }}</span>
            <span class="relevance">AI関連度: {{ (item.ai_relevance_score * 100)|round(1) }}%</span>
        </div>
        
        {% if item.summary %}
        <div class="summary">
            {{ item.summary[:200] }}{% if item.summary|length > 200 %}...{% endif %}
        </div>
        {% endif %}
        
        <a href="{{ item.url }}" class="link" target="_blank">記事を読む</a>
        
        {% if item.upvotes or item.comments_count %}
        <div style="margin-top: 10px; font-size: 0.9em; color: #6c757d;">
            {% if item.upvotes %}{{ item.upvotes }} upvotes{% endif %}
            {% if item.comments_count %} / {{ item.comments_count }} comments{% endif %}
        </div>
        {% endif %}
    </div>
    {% endfor %}
    
    {% if report.all_stories[10:] %}
    <div class="other-articles">
        <h2>📈 その他のAI関連記事</h2>
        <ul>
        {% for item in report.all_stories[10:] %}
            <li>
                <a href="{{ item.url }}" target="_blank">{{ item.title }}</a>
                <span style="color: #6c757d; font-size: 0.8em;">
                    - {{ item.source.value|replace('_', ' ')|title }} 
                    ({{ item.published_at.strftime('%m/%d %H:%M') }})
                    - AI関連度: {{ (item.ai_relevance_score * 100)|round(1) }}%
                </span>
            </li>
        {% endfor %}
        </ul>
    </div>
    {% endif %}
    
    <footer style="text-align: center; margin-top: 40px; color: #6c757d; font-size: 0.9em;">
        <p>このレポートは AI News Reporter により自動生成されました。</p>
    </footer>
</body>
</html>"""
        return self.env.from_string(template_str)
    
    def generate_markdown(self, report: NewsReport) -> str:
        """Markdownレポートを生成"""
        template = self._get_markdown_template()
        return template.render(report=report)
    
    def generate_html(self, report: NewsReport) -> str:
        """HTMLレポートを生成"""
        template = self._get_html_template()
        return template.render(report=report)
    
    def save_report(self, report: NewsReport, output_path: str, format: str = "markdown") -> None:
        """レポートをファイルに保存"""
        output_file = Path(output_path)
        output_file.parent.mkdir(exist_ok=True)
        
        if format.lower() == "html":
            content = self.generate_html(report)
            if not output_file.suffix:
                output_file = output_file.with_suffix('.html')
        else:
            content = self.generate_markdown(report)
            if not output_file.suffix:
                output_file = output_file.with_suffix('.md')
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"Report saved to: {output_file}")
    
    def generate_report(self, report: NewsReport, format: str = "markdown") -> str:
        """指定形式でレポートを生成"""
        if format.lower() == "html":
            return self.generate_html(report)
        else:
            return self.generate_markdown(report)