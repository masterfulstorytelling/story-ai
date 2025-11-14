"""Agent pipeline orchestration using LangGraph."""

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


def audience_identification_node(state: AgentPipelineState) -> Dict[str, Any]:
    """Identify audiences from content."""
    try:
        result = identify_audiences(state["content"], state.get("user_provided_audience"))
        audiences = result.get("audiences", [])
        logger.info("Audience identification completed", {"audience_count": len(audiences)})
        return {
            "audiences": audiences,
            "agent_outputs": {"audience_identification": result},
        }
    except Exception as e:
        logger.error("Error in audience identification", error=e)
        return {
            "status": "failed",
            "error_message": f"Audience identification failed: {str(e)}",
        }


def clarity_evaluation_node(state: AgentPipelineState) -> Dict[str, Any]:
    """Evaluate clarity for all audiences (can run in parallel)."""
    clarity_outputs = []
    for audience in state.get("audiences", []):
        try:
            result = evaluate_clarity(audience, state["content"])
            clarity_outputs.append(result)
        except Exception as e:
            logger.warning(f"Error evaluating clarity for audience {audience.get('id')}: {e}")
            # Continue with other audiences
    return {
        "agent_outputs": {"clarity_agent": clarity_outputs},
    }


def technical_level_node(state: AgentPipelineState) -> Dict[str, Any]:
    """Evaluate technical level for all audiences."""
    technical_outputs = []
    for audience in state.get("audiences", []):
        try:
            result = evaluate_technical_level(audience, state["content"])
            technical_outputs.append(result)
        except Exception as e:
            logger.warning(f"Error evaluating technical level: {e}")
    return {
        "agent_outputs": {"technical_level_agent": technical_outputs},
    }


def importance_node(state: AgentPipelineState) -> Dict[str, Any]:
    """Evaluate importance for all audiences."""
    importance_outputs = []
    for audience in state.get("audiences", []):
        try:
            result = evaluate_importance(audience, state["content"])
            importance_outputs.append(result)
        except Exception as e:
            logger.warning(f"Error evaluating importance: {e}")
    return {
        "agent_outputs": {"importance_agent": importance_outputs},
    }


def voice_node(state: AgentPipelineState) -> Dict[str, Any]:
    """Evaluate voice and personality."""
    try:
        result = evaluate_voice(state["content"])
        return {
            "agent_outputs": {"voice_agent": result},
        }
    except Exception as e:
        logger.warning(f"Error evaluating voice: {e}")
        return {}


def vividness_node(state: AgentPipelineState) -> Dict[str, Any]:
    """Evaluate vividness and storytelling."""
    try:
        result = evaluate_vividness(state["content"])
        return {
            "agent_outputs": {"vividness_agent": result},
        }
    except Exception as e:
        logger.warning(f"Error evaluating vividness: {e}")
        return {}


def citation_validation_node(state: AgentPipelineState) -> Dict[str, Any]:
    """Validate all citations."""
    try:
        result = validate_citations(state["agent_outputs"], state["content"])
        return {
            "validated_citations": result.get("validated_citations", []),
            "agent_outputs": {"citation_validation_agent": result},
        }
    except Exception as e:
        logger.warning(f"Error validating citations: {e}")
        return {}


def synthesis_node(state: AgentPipelineState) -> Dict[str, Any]:
    """Generate final report."""
    try:
        result = generate_report(state["agent_outputs"])
        logger.info("Report generation completed")
        return {
            "report": result,
            "status": "completed",
        }
    except Exception as e:
        logger.error("Error generating report", error=e)
        return {
            "status": "failed",
            "error_message": f"Report generation failed: {str(e)}",
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
    }

    # Create and run pipeline
    pipeline = create_pipeline()
    config = {"configurable": {"thread_id": "1"}}

    try:
        final_state = pipeline.invoke(initial_state, config)
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
    except Exception as e:
        logger.error("Pipeline execution failed", error=e)
        return {
            "audiences": [],
            "assessments": {},
            "report": None,
            "status": "failed",
            "error": str(e),
        }
