"""Agent pipeline orchestration using LangGraph."""

from datetime import datetime, UTC
from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from src.orchestration.state import AgentPipelineState
from src.agents.audience_identification import identify_audiences
from src.agents.clarity_agent import evaluate_clarity
from src.agents.technical_level_agent import evaluate_technical_level
from src.agents.importance_agent import evaluate_importance
from src.agents.voice_agent import evaluate_voice
from src.agents.vividness_agent import evaluate_vividness
from src.agents.citation_validation_agent import validate_citations
from src.agents.synthesis_agent import generate_report
from src.utils.logger import get_logger

logger = get_logger(__name__)


class CriticalFailureError(Exception):
    """
    Exception raised for critical failures that require fail-fast behavior.

    Critical failures include:
    - Audience identification failures (cannot proceed without audiences)
    - Citation validation failures (cannot generate report without validated citations)
    - Ingestion failures (inaccessible content, insufficient content)

    These failures should stop processing immediately and notify the user.
    """

    pass


def audience_identification_node(state: AgentPipelineState) -> Dict[str, Any]:
    """
    Identify audiences from content.

    CRITICAL: This is a critical agent. Failures must fail fast.
    """
    try:
        result = identify_audiences(state["content"], state.get("user_provided_audience"))
        audiences = result.get("audiences", [])
        logger.info("Audience identification completed", {"audience_count": len(audiences)})

        # Validate that audiences were identified
        if not audiences or len(audiences) == 0:
            error_msg = (
                "Audience identification failed: No audiences could be identified from content. "
                "Please ensure your content contains clear information about your target audiences."
            )
            logger.error("Critical failure: No audiences identified")
            raise CriticalFailureError(error_msg)

        return {
            "audiences": audiences,
            "agent_outputs": {"audience_identification": result},
        }
    except CriticalFailureError:
        # Re-raise critical failures
        raise
    except Exception as e:
        logger.error("Critical failure in audience identification", exc_info=True)
        raise CriticalFailureError(
            f"Audience identification failed: {str(e)}. "
            "This is a critical failure and processing cannot continue."
        ) from e


def clarity_evaluation_node(state: AgentPipelineState) -> Dict[str, Any]:
    """
    Evaluate clarity for all audiences (can run in parallel).

    NON-CRITICAL: Failures are tracked but processing continues with partial results.
    """
    clarity_outputs = []
    failed_audiences = []
    for audience in state.get("audiences", []):
        try:
            result = evaluate_clarity(audience, state["content"])
            clarity_outputs.append(result)
        except Exception as e:
            audience_id = audience.get("id", "unknown")
            logger.warning(
                f"Error evaluating clarity for audience {audience_id}: {e}",
                {"audience_id": audience_id, "error": str(e)},
            )
            failed_audiences.append(audience_id)
            # Continue with other audiences

    # Track failures if any occurred
    failed_agents = state.get("failed_agents", [])
    if failed_audiences:
        if "clarity_agent" not in failed_agents:
            failed_agents = failed_agents + ["clarity_agent"]

    return {
        "agent_outputs": {"clarity_agent": clarity_outputs},
        "failed_agents": failed_agents,
    }


def technical_level_node(state: AgentPipelineState) -> Dict[str, Any]:
    """
    Evaluate technical level for all audiences.

    NON-CRITICAL: Failures are tracked but processing continues with partial results.
    """
    technical_outputs = []
    failed_audiences = []
    for audience in state.get("audiences", []):
        try:
            result = evaluate_technical_level(audience, state["content"])
            technical_outputs.append(result)
        except Exception as e:
            audience_id = audience.get("id", "unknown")
            logger.warning(
                f"Error evaluating technical level for audience {audience_id}: {e}",
                {"audience_id": audience_id, "error": str(e)},
            )
            failed_audiences.append(audience_id)
            # Continue with other audiences

    # Track failures if any occurred
    failed_agents = state.get("failed_agents", [])
    if failed_audiences:
        if "technical_level_agent" not in failed_agents:
            failed_agents = failed_agents + ["technical_level_agent"]

    return {
        "agent_outputs": {"technical_level_agent": technical_outputs},
        "failed_agents": failed_agents,
    }


def importance_node(state: AgentPipelineState) -> Dict[str, Any]:
    """
    Evaluate importance for all audiences.

    NON-CRITICAL: Failures are tracked but processing continues with partial results.
    """
    importance_outputs = []
    failed_audiences = []
    for audience in state.get("audiences", []):
        try:
            result = evaluate_importance(audience, state["content"])
            importance_outputs.append(result)
        except Exception as e:
            audience_id = audience.get("id", "unknown")
            logger.warning(
                f"Error evaluating importance for audience {audience_id}: {e}",
                {"audience_id": audience_id, "error": str(e)},
            )
            failed_audiences.append(audience_id)
            # Continue with other audiences

    # Track failures if any occurred
    failed_agents = state.get("failed_agents", [])
    if failed_audiences:
        if "importance_agent" not in failed_agents:
            failed_agents = failed_agents + ["importance_agent"]

    return {
        "agent_outputs": {"importance_agent": importance_outputs},
        "failed_agents": failed_agents,
    }


def voice_node(state: AgentPipelineState) -> Dict[str, Any]:
    """
    Evaluate voice and personality.

    NON-CRITICAL: Failures are tracked but processing continues with partial results.
    """
    failed_agents = state.get("failed_agents", [])
    try:
        result = evaluate_voice(state["content"])
        return {
            "agent_outputs": {"voice_agent": result},
            "failed_agents": failed_agents,
        }
    except Exception as e:
        logger.warning(f"Error evaluating voice: {e}", {"error": str(e)})
        # Track failure but continue processing
        if "voice_agent" not in failed_agents:
            failed_agents = failed_agents + ["voice_agent"]
        return {
            "agent_outputs": {},
            "failed_agents": failed_agents,
        }


def vividness_node(state: AgentPipelineState) -> Dict[str, Any]:
    """
    Evaluate vividness and storytelling.

    NON-CRITICAL: Failures are tracked but processing continues with partial results.
    """
    failed_agents = state.get("failed_agents", [])
    try:
        result = evaluate_vividness(state["content"])
        return {
            "agent_outputs": {"vividness_agent": result},
            "failed_agents": failed_agents,
        }
    except Exception as e:
        logger.warning(f"Error evaluating vividness: {e}", {"error": str(e)})
        # Track failure but continue processing
        if "vividness_agent" not in failed_agents:
            failed_agents = failed_agents + ["vividness_agent"]
        return {
            "agent_outputs": {},
            "failed_agents": failed_agents,
        }


def citation_validation_node(state: AgentPipelineState) -> Dict[str, Any]:
    """
    Validate all citations.

    CRITICAL: This is a critical agent. Failures must fail fast.
    """
    try:
        result = validate_citations(state["agent_outputs"], state["content"])
        validated_citations = result.get("validated_citations", [])

        # Note: Citation validation failure doesn't necessarily mean we should fail
        # if there are no citations to validate. But if validation itself fails
        # (e.g., cannot access source material), that's critical.
        return {
            "validated_citations": validated_citations,
            "agent_outputs": {"citation_validation_agent": result},
        }
    except CriticalFailureError:
        # Re-raise critical failures
        raise
    except Exception as e:
        logger.error("Critical failure in citation validation", exc_info=True)
        raise CriticalFailureError(
            f"Citation validation failed: {str(e)}. "
            "This is a critical failure and processing cannot continue."
        ) from e


def synthesis_node(state: AgentPipelineState) -> Dict[str, Any]:
    """
    Generate final report.

    NON-CRITICAL: Can handle partial results and note limitations.
    Processing continues even if some agents failed.
    """
    failed_agents = state.get("failed_agents", [])
    agent_outputs = state.get("agent_outputs", {})

    try:
        # Pass failed agents info to synthesis agent so it can note limitations
        result = generate_report(agent_outputs, failed_agents=failed_agents)
        logger.info(
            "Report generation completed",
            {
                "failed_agents_count": len(failed_agents),
                "has_failed_agents": len(failed_agents) > 0,
            },
        )
        return {
            "report": result,
            "status": "completed",
        }
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}", exc_info=True)
        # Even if synthesis fails, we don't want to fail the entire pipeline
        # Return a basic report noting the limitation
        return {
            "report": {
                "agent_name": "synthesis_agent",
                "timestamp": datetime.now(UTC).isoformat() + "Z",
                "report_content": (
                    "Report generation encountered an error. "
                    "Some assessments may be incomplete. "
                    f"Failed agents: {', '.join(failed_agents) if failed_agents else 'none'}"
                ),
                "limitations": {
                    "synthesis_failed": True,
                    "failed_agents": failed_agents,
                },
            },
            "status": "completed",  # Still mark as completed with limitations
        }


def create_pipeline() -> StateGraph:
    """Create and configure the agent pipeline."""
    workflow = StateGraph(AgentPipelineState)

    # Add nodes
    workflow.add_node("audience_identification", audience_identification_node)
    workflow.add_node("clarity_evaluation", clarity_evaluation_node)
    workflow.add_node("technical_level", technical_level_node)
    workflow.add_node("importance", importance_node)
    workflow.add_node("voice", voice_node)
    workflow.add_node("vividness", vividness_node)
    workflow.add_node("citation_validation", citation_validation_node)
    workflow.add_node("synthesis", synthesis_node)

    # Define edges
    workflow.set_entry_point("audience_identification")
    workflow.add_edge("audience_identification", "clarity_evaluation")
    workflow.add_edge("clarity_evaluation", "technical_level")
    workflow.add_edge("technical_level", "importance")
    # Voice and vividness can run in parallel after importance
    workflow.add_edge("importance", "voice")
    workflow.add_edge("importance", "vividness")
    # Both must complete before citation validation
    workflow.add_edge("voice", "citation_validation")
    workflow.add_edge("vividness", "citation_validation")
    workflow.add_edge("citation_validation", "synthesis")
    workflow.add_edge("synthesis", END)

    return workflow.compile(checkpointer=MemorySaver())


def process_evaluation(
    content: Dict[str, Any], user_provided_audience: Optional[str] = None
) -> Dict[str, Any]:
    """
    Process evaluation through the agent pipeline.

    Args:
        content: Content dictionary with scraped_content and/or uploaded_content
        user_provided_audience: Optional user-specified audience

    Returns:
        Dictionary with audiences, assessments, and report
    """
    # Initialize state
    initial_state: AgentPipelineState = {
        "content": content,
        "user_provided_audience": user_provided_audience,
        "audiences": [],
        "agent_outputs": {},
        "validated_citations": [],
        "report": None,
        "submission_id": "",
        "status": "processing",
        "error_message": None,
        "failed_agents": [],  # Track non-critical agent failures
    }

    # Create and run pipeline
    pipeline = create_pipeline()
    config = {"configurable": {"thread_id": "1"}}

    try:
        final_state = pipeline.invoke(initial_state, config)

        # Check for critical failures in final state
        if final_state.get("status") == "failed":
            error_message = final_state.get("error_message", "Unknown error")
            logger.error("Pipeline completed with failed status", {"error": error_message})
            raise CriticalFailureError(f"Pipeline failed: {error_message}")

        agent_outputs = final_state.get("agent_outputs", {})
        report = final_state.get("report", {})
        return {
            "audiences": final_state.get("audiences", []),
            "assessments": agent_outputs,
            "report": report,
            "status": final_state.get("status", "completed"),
            # Also include agent outputs at top level for test compatibility
            **{k: v for k, v in agent_outputs.items()},
            "validated_citations": final_state.get("validated_citations", []),
            # Include report_content and pdf_content for test compatibility
            "report_content": report.get("report_content") if isinstance(report, dict) else None,
            "pdf_content": report.get("pdf_content") if isinstance(report, dict) else None,
        }
    except CriticalFailureError:
        # Re-raise critical failures - these should fail fast
        logger.error("Critical failure in pipeline execution - failing fast")
        raise
    except Exception as e:
        logger.error("Pipeline execution failed", exc_info=True)
        # For unexpected errors, treat as critical failure
        raise CriticalFailureError(f"Pipeline execution failed: {str(e)}") from e
