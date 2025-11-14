"""LangGraph state model for agent pipeline orchestration."""

from typing import Dict, Any, List, Optional, Annotated
from typing_extensions import TypedDict


def merge_dicts(left: Dict[str, Any], right: Dict[str, Any]) -> Dict[str, Any]:
    """Merge two dictionaries, with right taking precedence."""
    result = left.copy()
    result.update(right)
    return result


class AgentPipelineState(TypedDict):
    """State object for agent pipeline orchestration."""

    # Input content
    content: Dict[str, Any]  # scraped_content and/or uploaded_content
    user_provided_audience: Optional[str]

    # Audience identification output
    audiences: List[Dict[str, Any]]

    # Agent outputs (keyed by agent name) - can be updated by multiple nodes
    agent_outputs: Annotated[Dict[str, Any], merge_dicts]

    # Validated citations
    validated_citations: List[Dict[str, Any]]

    # Final report
    report: Optional[Dict[str, Any]]

    # Processing metadata
    submission_id: str
    status: str  # pending, processing, completed, failed
    error_message: Optional[str]

    # Non-critical agent failures (for partial results tracking)
    failed_agents: List[str]  # List of agent names that failed
