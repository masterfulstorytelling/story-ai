"""PDF report generator using WeasyPrint."""

from typing import Dict, Any, Optional
from pathlib import Path
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration

from src.utils.logger import get_logger

logger = get_logger(__name__)


def generate_pdf_report(report_data: Dict[str, Any]) -> bytes:
    """
    Generate PDF report from report data.

    Args:
        report_data: Dictionary containing report sections:
            - executive_summary: str
            - audience_analysis: str
            - clarity_assessment: Optional[Dict[str, str]]
            - technical_appropriateness: Optional[Dict[str, str]]
            - importance_value: Optional[Dict[str, str]]
            - voice_personality: Optional[str]
            - storytelling_memorability: Optional[str]
            - recommendations: str
            - next_steps: Optional[str]
            - citations: Optional[List[Dict[str, Any]]]
            - scores: Optional[Dict[str, int]]

    Returns:
        bytes: PDF content
    """
    logger.info("Generating PDF report")

    # Load template
    template_path = Path(__file__).parent / "templates" / "report_template.html"
    with open(template_path, "r", encoding="utf-8") as f:
        template = f.read()

    # Render template with data
    html_content = _render_template(template, report_data)

    # Generate PDF
    font_config = FontConfiguration()
    html = HTML(string=html_content)
    pdf_bytes = html.write_pdf(font_config=font_config)

    logger.info("PDF report generated", {"size_bytes": len(pdf_bytes)})

    return pdf_bytes


def _render_template(template: str, data: Dict[str, Any]) -> str:
    """
    Render template with data (simple string replacement).

    Args:
        template: HTML template string
        data: Dictionary of data to render

    Returns:
        Rendered HTML string
    """
    html = template

    # Replace simple variables
    html = html.replace("{{ executive_summary }}", _escape_html(data.get("executive_summary", "")))
    html = html.replace("{{ audience_analysis }}", _escape_html(data.get("audience_analysis", "")))
    html = html.replace("{{ recommendations }}", _escape_html(data.get("recommendations", "")))

    # Handle optional sections
    if data.get("voice_personality"):
        html = html.replace("{{ voice_personality }}", _escape_html(data["voice_personality"]))
    else:
        html = _remove_section(html, "voice_personality")

    if data.get("storytelling_memorability"):
        html = html.replace(
            "{{ storytelling_memorability }}",
            _escape_html(data["storytelling_memorability"]),
        )
    else:
        html = _remove_section(html, "storytelling_memorability")

    if data.get("next_steps"):
        html = html.replace("{{ next_steps }}", _escape_html(data["next_steps"]))
    else:
        html = _remove_section(html, "next_steps")

    # Handle dictionary sections (clarity, technical, importance)
    html = _render_dict_section(html, "clarity_assessment", data.get("clarity_assessment"))
    html = _render_dict_section(
        html, "technical_appropriateness", data.get("technical_appropriateness")
    )
    html = _render_dict_section(html, "importance_value", data.get("importance_value"))

    # Handle citations
    citations = data.get("citations", [])
    if citations:
        citations_html = ""
        for citation in citations:
            quote = _escape_html(citation.get("quote", ""))
            source = _escape_html(citation.get("source", ""))
            location = _escape_html(citation.get("location", ""))
            citations_html += f'<div class="citation"><strong>Quote:</strong> "{quote}"<br>'
            citations_html += f"<strong>Source:</strong> {source}<br>"
            if location:
                citations_html += f"<strong>Location:</strong> {location}"
            citations_html += "</div>"
        html = html.replace("{% for citation in citations %}", "")
        html = html.replace("{% endfor %}", "")
        citation_template = (
            '<div class="citation">\n            <strong>Quote:</strong> '
            '"{{ citation.quote }}"<br>\n            <strong>Source:</strong> '
            "{{ citation.source }}<br>\n            {% if citation.location %}\n            "
            "<strong>Location:</strong> {{ citation.location }}\n            "
            "{% endif %}\n        </div>"
        )
        html = html.replace(citation_template, citations_html)
    else:
        html = _remove_section(html, "citations")

    # Clean up any remaining template tags
    import re

    html = re.sub(r"\{\{.*?\}\}", "", html)
    html = re.sub(r"\{%.*?%}", "", html)

    return html


def _render_dict_section(html: str, section_name: str, data: Optional[Dict[str, str]]) -> str:
    """Render a dictionary section (e.g., clarity_assessment per audience)."""
    if not data:
        return _remove_section(html, section_name)

    # Handle case where data is a string instead of dict (e.g., error messages)
    if isinstance(data, str):
        # Render as simple text instead of dict
        html = html.replace(f"{{% if {section_name} %}}", "")
        html = html.replace("{% endif %}", "")
        pattern = (
            r"\{\% for audience, assessment in "
            + section_name
            + r"\.items\(\) \%\}.*?\{\% endfor \%\}"
        )
        import re

        escaped_data = _escape_html(data)
        html = re.sub(pattern, f"<div>{escaped_data}</div>", html, flags=re.DOTALL)
        return html

    section_html = ""
    for audience, assessment in data.items():
        audience_escaped = _escape_html(audience)
        assessment_escaped = _escape_html(assessment)
        audience_html = f"<h3>{audience_escaped}</h3>\n        "
        assessment_html = f"<div>{assessment_escaped}</div>\n        "
        section_html += audience_html + assessment_html

    # Replace the template loop with rendered content
    import re

    pattern = (
        r"\{\% for audience, assessment in " + section_name + r"\.items\(\) \%\}.*?\{\% endfor \%\}"
    )
    html = re.sub(pattern, section_html, html, flags=re.DOTALL)

    return html


def _remove_section(html: str, section_name: str) -> str:
    """Remove a section from HTML if data is not available."""
    # Remove the conditional block
    import re

    pattern = r"\{\% if " + section_name + r" \%\}.*?\{\% endif \%\}"
    html = re.sub(pattern, "", html, flags=re.DOTALL)
    return html


def _escape_html(text: str) -> str:
    """Escape HTML special characters."""
    if not text:
        return ""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#x27;")
    )
