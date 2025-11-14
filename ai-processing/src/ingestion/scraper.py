"""Web scraper for extracting content from websites."""

import re
from typing import Optional
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests

from playwright.sync_api import (
    sync_playwright,
    Page,
    TimeoutError as PlaywrightTimeoutError,
    Error as PlaywrightError,
)

from src.models.scraped_content import ScrapedContent, PageContent
from src.utils.logger import get_logger

logger = get_logger(__name__)


class ScrapingError(Exception):
    """Exception raised for scraping errors."""

    pass


class InsufficientContentError(ScrapingError):
    """Exception raised when scraped content is insufficient."""

    pass


def count_words(text: str) -> int:
    """Count words in text."""
    return len(re.findall(r"\b\w+\b", text))


def check_robots_txt(url: str) -> bool:
    """Check if URL is allowed by robots.txt."""
    try:
        parsed = urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"

        rp = RobotFileParser()
        rp.set_url(robots_url)
        rp.read()

        return rp.can_fetch("*", url)
    except Exception as e:
        logger.warning(f"Could not check robots.txt for {url}: {e}")
        # If we can't check robots.txt, allow scraping (fail open)
        return True


def find_about_page_url(homepage_url: str, page: Page) -> Optional[str]:
    """Find About page URL from homepage."""
    try:
        # Common About page patterns
        about_patterns = [
            r"/about",
            r"/about-us",
            r"/about/",
            r"/company",
            r"/who-we-are",
        ]

        # Get all links
        links = page.query_selector_all("a[href]")
        for link in links:
            href = link.get_attribute("href")
            if not href:
                continue

            # Make absolute URL
            absolute_url = urljoin(homepage_url, href)
            parsed = urlparse(absolute_url)

            # Check if it matches About page patterns
            for pattern in about_patterns:
                if re.search(pattern, parsed.path, re.IGNORECASE):
                    return absolute_url

        return None
    except Exception as e:
        logger.warning(f"Error finding About page: {e}")
        return None


def scrape_page(page: Page, url: str, timeout: int = 30000) -> PageContent:
    """Scrape content from a single page."""
    try:
        response = page.goto(url, wait_until="networkidle", timeout=timeout)
        if response and response.status >= 400:
            raise ScrapingError(f"HTTP {response.status} error for {url}")

        # Extract text content
        text = page.inner_text("body")
        # Clean up text
        text = re.sub(r"\s+", " ", text).strip()

        word_count = count_words(text)

        return PageContent(text=text, url=url, word_count=word_count)
    except PlaywrightTimeoutError:
        raise ScrapingError(f"Timeout while scraping {url}")
    except Exception as e:
        raise ScrapingError(f"Error scraping {url}: {str(e)}")


def scrape_website(url: str, timeout: int = 30000, max_redirects: int = 5) -> ScrapedContent:
    """
    Scrape website content (homepage and About page).

    Args:
        url: URL to scrape
        timeout: Timeout in milliseconds
        max_redirects: Maximum number of redirects to follow

    Returns:
        ScrapedContent object with homepage and optionally About page

    Raises:
        ScrapingError: If scraping fails
        InsufficientContentError: If content is less than 200 words
    """
    # Check robots.txt
    if not check_robots_txt(url):
        raise ScrapingError(f"robots.txt disallows scraping of {url}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Check redirect count using requests (Playwright follows redirects automatically)
            # This allows us to detect redirect chains before using Playwright
            try:
                # Count redirects by following them manually
                redirect_count = 0
                current_check_url = url
                visited_urls = {current_check_url}

                # Follow redirects manually to count them
                while (
                    redirect_count < max_redirects + 1
                ):  # Check one more than max to detect excess
                    check_response = requests.head(
                        current_check_url, allow_redirects=False, timeout=5
                    )

                    # Check if it's a redirect (3xx status)
                    if check_response.status_code in (301, 302, 303, 307, 308):
                        redirect_location = check_response.headers.get("Location")
                        if not redirect_location:
                            break

                        # Make absolute URL
                        redirect_url = urljoin(current_check_url, redirect_location)

                        # Check for redirect loops
                        if redirect_url in visited_urls:
                            raise ScrapingError(
                                f"Redirect loop detected: {redirect_url} already visited"
                            )

                        visited_urls.add(redirect_url)
                        redirect_count += 1
                        current_check_url = redirect_url

                        # If we've exceeded max redirects, raise error
                        if redirect_count > max_redirects:
                            raise ScrapingError(
                                f"Too many redirects ({redirect_count} > {max_redirects}) for {url}"
                            )
                    else:
                        # Not a redirect, we're done
                        break
            except requests.RequestException:
                # If requests fails, proceed with Playwright and let it handle redirects
                # This is a fallback for cases where requests can't access the URL
                pass

            # Now use Playwright to actually scrape the content
            # Playwright will follow redirects automatically
            try:
                response = page.goto(url, wait_until="networkidle", timeout=timeout)
            except PlaywrightTimeoutError as e:
                raise ScrapingError(f"Timeout while accessing {url}: {str(e)}") from e
            except PlaywrightError as e:
                raise ScrapingError(f"Error accessing {url}: {str(e)}") from e

            if response and response.status >= 400:
                raise ScrapingError(f"HTTP {response.status} error for {url}")

            final_url = page.url

            # Scrape homepage
            try:
                homepage = scrape_page(page, final_url, timeout)
            except PlaywrightTimeoutError as e:
                raise ScrapingError(f"Timeout while scraping {final_url}: {str(e)}") from e
            except PlaywrightError as e:
                raise ScrapingError(f"Error scraping {final_url}: {str(e)}") from e

            # Find and scrape About page
            about_page = None
            about_url = find_about_page_url(final_url, page)
            if about_url:
                try:
                    about_page = scrape_page(page, about_url, timeout)
                except ScrapingError as e:
                    logger.warning(f"Could not scrape About page: {e}")
                    # Continue without About page
                except PlaywrightTimeoutError as e:
                    logger.warning(f"Timeout scraping About page: {e}")
                    # Continue without About page
                except PlaywrightError as e:
                    logger.warning(f"Error scraping About page: {e}")
                    # Continue without About page

            # Calculate total word count
            total_words = homepage.word_count
            if about_page:
                total_words += about_page.word_count

            # Check minimum content requirement
            if total_words < 200:
                raise InsufficientContentError(
                    f"Insufficient content: {total_words} words (minimum 200 required)"
                )

            return ScrapedContent(
                homepage=homepage,
                about_page=about_page,
                total_word_count=total_words,
            )

        except (ScrapingError, InsufficientContentError):
            # Re-raise our custom errors
            raise
        except PlaywrightTimeoutError as e:
            # Wrap Playwright timeout errors
            raise ScrapingError(f"Timeout while scraping {url}: {str(e)}") from e
        except PlaywrightError as e:
            # Wrap other Playwright errors
            raise ScrapingError(f"Error scraping {url}: {str(e)}") from e
        finally:
            context.close()
            browser.close()
