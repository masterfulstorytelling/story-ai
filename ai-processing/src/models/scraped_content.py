"""ScrapedContent model for web scraping results."""

from typing import Optional
from pydantic import BaseModel, Field


class PageContent(BaseModel):
    """Content from a single page."""

    text: str = Field(..., description="Extracted text content from the page")
    url: str = Field(..., description="URL of the page")
    word_count: int = Field(..., description="Number of words in the text")


class ScrapedContent(BaseModel):
    """Model for scraped website content."""

    homepage: PageContent = Field(..., description="Content from homepage")
    about_page: Optional[PageContent] = Field(None, description="Content from About page")
    total_word_count: int = Field(..., description="Total word count across all pages")

    def to_dict(self) -> dict:
        """Convert to dictionary format for agent inputs."""
        result = {
            "homepage": {
                "text": self.homepage.text,
                "url": self.homepage.url,
            }
        }
        if self.about_page:
            result["about_page"] = {
                "text": self.about_page.text,
                "url": self.about_page.url,
            }
        return result
