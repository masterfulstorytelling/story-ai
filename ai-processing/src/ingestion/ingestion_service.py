"""Content ingestion service that orchestrates scraping and file parsing."""

from typing import Optional, List, Dict, Any
from google.cloud import storage

from src.ingestion.scraper import scrape_website, ScrapingError, InsufficientContentError
from src.ingestion.file_parser import parse_file, UnsupportedFileFormatError, FileParsingError
from src.utils.logger import get_logger

logger = get_logger(__name__)


class IngestionService:
    """Service for ingesting content from URLs and files."""

    def __init__(self, storage_client: Optional[storage.Client] = None):
        """Initialize ingestion service."""
        self.storage_client = storage_client or storage.Client()

    def download_file_from_storage(self, bucket_name: str, file_path: str) -> bytes:
        """Download file from Cloud Storage."""
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(file_path)
        return blob.download_as_bytes()

    def ingest_content(
        self,
        url: Optional[str] = None,
        file_paths: Optional[List[Dict[str, str]]] = None,
        bucket_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Ingest content from URL and/or files.

        Args:
            url: Website URL to scrape
            file_paths: List of dicts with 'bucket', 'path', 'filename' for files
            bucket_name: Cloud Storage bucket name

        Returns:
            Dictionary with 'scraped_content' and/or 'uploaded_content'
        """
        result: Dict[str, Any] = {
            "scraped_content": None,
            "uploaded_content": [],
        }

        # Scrape URL if provided
        if url:
            try:
                scraped = scrape_website(url)
                result["scraped_content"] = scraped.to_dict()
            except InsufficientContentError as e:
                logger.error(f"Insufficient content from {url}: {e}")
                raise
            except ScrapingError as e:
                logger.error(f"Error scraping {url}: {e}")
                raise

        # Parse files if provided
        if file_paths:
            for file_info in file_paths:
                file_bucket = file_info.get("bucket", bucket_name)
                file_path = file_info["path"]
                filename = file_info.get("filename", file_path.split("/")[-1])

                try:
                    # Download file from storage
                    file_content = self.download_file_from_storage(file_bucket, file_path)

                    # Parse file
                    parsed = parse_file(file_content, filename)
                    result["uploaded_content"].append(parsed.to_dict())
                except UnsupportedFileFormatError as e:
                    logger.error(f"Unsupported file format: {e}")
                    raise
                except FileParsingError as e:
                    logger.error(f"Error parsing file {filename}: {e}")
                    raise

        return result
