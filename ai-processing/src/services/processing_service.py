"""Processing service that orchestrates ingestion, agent pipeline, and report generation."""

import concurrent.futures
from typing import Optional, List, Dict, Any
from google.cloud import storage

from src.ingestion.ingestion_service import IngestionService
from src.orchestration.pipeline import process_evaluation
from src.utils.logger import get_logger

logger = get_logger(__name__)


class ProcessingTimeoutError(Exception):
    """Exception raised when processing exceeds the timeout limit."""

    pass


class ProcessingService:
    """Service for processing evaluation requests through the full pipeline."""

    def __init__(self, storage_client: Optional[storage.Client] = None):
        """Initialize processing service."""
        self.ingestion_service = IngestionService(storage_client=storage_client)
        self.storage_client = storage_client or storage.Client()

    def process_evaluation_request(
        self,
        submission_id: str,
        url: Optional[str] = None,
        file_paths: Optional[List[Dict[str, str]]] = None,
        user_provided_audience: Optional[str] = None,
        bucket_name: Optional[str] = None,
        timeout_seconds: int = 600,  # 10 minutes default (FR-030)
    ) -> Dict[str, Any]:
        """
        Process an evaluation request through the full pipeline.

        Orchestrates:
        1. Content ingestion (scraping URL and/or parsing files)
        2. Agent pipeline (audience identification, assessments, synthesis)
        3. Report generation (via synthesis agent)

        Args:
            submission_id: Unique identifier for the submission
            url: Website URL to scrape (optional)
            file_paths: List of dicts with 'bucket', 'path', 'filename' for files (optional)
            user_provided_audience: Optional user-specified audience
            bucket_name: Cloud Storage bucket name for file downloads
            timeout_seconds: Maximum processing time in seconds (default: 600 = 10 minutes)

        Returns:
            Dictionary with:
                - audiences: List of identified audiences
                - assessments: Agent outputs (clarity, technical_level, etc.)
                - report: Generated report
                - status: Processing status ('completed' or 'failed')
                - validated_citations: List of validated citations
                - error: Error message if status is 'failed'

        Raises:
            ProcessingTimeoutError: If processing exceeds timeout_seconds
            ScrapingError: If URL scraping fails
            InsufficientContentError: If scraped content is insufficient
            UnsupportedFileFormatError: If file format is unsupported
            FileParsingError: If file parsing fails
        """
        logger.info(
            "Starting evaluation processing",
            {
                "submission_id": submission_id,
                "has_url": bool(url),
                "has_files": bool(file_paths),
                "user_provided_audience": bool(user_provided_audience),
                "timeout_seconds": timeout_seconds,
            },
        )

        def _process() -> Dict[str, Any]:
            """Internal processing function to run with timeout."""
            # Step 1: Ingest content (scrape URL and/or parse files)
            content = self.ingestion_service.ingest_content(
                url=url, file_paths=file_paths, bucket_name=bucket_name
            )

            logger.info(
                "Content ingestion completed",
                {
                    "submission_id": submission_id,
                    "has_scraped_content": bool(content.get("scraped_content")),
                    "uploaded_content_count": len(content.get("uploaded_content", [])),
                },
            )

            # Step 2: Process through agent pipeline
            result = process_evaluation(
                content=content, user_provided_audience=user_provided_audience
            )

            # Add submission_id to result
            result["submission_id"] = submission_id

            logger.info(
                "Evaluation processing completed",
                {
                    "submission_id": submission_id,
                    "status": result.get("status"),
                    "audience_count": len(result.get("audiences", [])),
                    "has_report": bool(result.get("report")),
                },
            )

            return result

        try:
            # Execute processing with timeout
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_process)
                try:
                    result = future.result(timeout=timeout_seconds)
                    return result
                except concurrent.futures.TimeoutError:
                    # Log timeout error
                    timeout_msg = (
                        f"Processing timeout after {timeout_seconds} seconds "
                        f"for submission {submission_id}"
                    )
                    logger.error(timeout_msg, exc_info=True)
                    raise ProcessingTimeoutError(
                        f"Processing exceeded timeout of {timeout_seconds} seconds "
                        f"({timeout_seconds // 60} minutes). "
                        "Please try again or contact support if the issue persists."
                    )

        except ProcessingTimeoutError:
            # Re-raise timeout errors
            raise
        except Exception as e:
            logger.error(
                f"Evaluation processing failed for submission {submission_id}: {str(e)}",
                exc_info=True,
            )
            # Re-raise to let caller handle
            raise
