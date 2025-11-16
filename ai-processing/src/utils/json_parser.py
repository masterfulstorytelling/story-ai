"""Utility functions for parsing JSON from LLM responses."""

import json
import re
from typing import Optional, Union


def extract_json_from_text(text: str) -> Optional[Union[dict, list]]:
    """
    Extract and parse JSON from text that may contain markdown, explanations, etc.

    Handles:
    - JSON in markdown code blocks (```json ... ```)
    - JSON objects/arrays embedded in text
    - Multiple JSON objects/arrays (returns the first valid one)
    - Trailing commas (attempts to fix)

    Args:
        text: Text that may contain JSON

    Returns:
        Parsed JSON object (dict or list), or None if no valid JSON found
    """
    if not text:
        return None

    # Strategy 1: Look for JSON in markdown code blocks
    # Match ```json ... ``` or ``` ... ``` (with json language tag)
    # Use a more robust pattern that captures the entire code block content
    # Try both greedy and non-greedy patterns to handle nested structures
    code_block_patterns = [
        r"```json\s*(.*?)```",  # Explicit json tag
        r"```\s*(.*?)```",  # Generic code block
    ]

    for pattern in code_block_patterns:
        matches = list(re.finditer(pattern, text, re.DOTALL))
        if matches:
            # Use the last match (most likely to be complete) or try all matches
            for match in reversed(matches):  # Try from end to start
                code_block_content = match.group(1).strip()
                if not code_block_content:
                    continue

                # Try to find the outermost JSON structure
                json_str = balance_json(code_block_content)
                if json_str:
                    try:
                        result = json.loads(json_str)
                        if isinstance(result, (dict, list)):
                            return result
                    except json.JSONDecodeError:
                        # Try fixing trailing commas
                        json_str_fixed = fix_trailing_commas(json_str)
                        try:
                            result = json.loads(json_str_fixed)
                            if isinstance(result, (dict, list)):
                                return result
                        except json.JSONDecodeError:
                            pass

                # If balance_json didn't work, try direct parsing
                try:
                    result = json.loads(code_block_content)
                    if isinstance(result, (dict, list)):
                        return result
                except json.JSONDecodeError:
                    json_str_fixed = fix_trailing_commas(code_block_content)
                    try:
                        result = json.loads(json_str_fixed)
                        if isinstance(result, (dict, list)):
                            return result
                    except json.JSONDecodeError:
                        continue

    # Strategy 2: Check if text looks like JSON missing opening brace (do this EARLY)
    # This must run before Strategy 3 to avoid matching nested arrays/objects
    trimmed_text = text.strip()
    looks_like_missing_brace = (
        not trimmed_text.startswith("{")
        and not trimmed_text.startswith("[")
        and "}" in trimmed_text
        and '"' in trimmed_text
    )

    # Strategy 4 (moved earlier): Handle responses that look like JSON but are missing opening brace
    # This must run BEFORE Strategy 3 to avoid matching nested structures
    if looks_like_missing_brace or (
        "}" in trimmed_text and '"' in trimmed_text and not trimmed_text.startswith("{")
    ):
        # Try multiple approaches to reconstruct the JSON

        # Approach 1: Find the last } and reconstruct from there
        last_brace = trimmed_text.rfind("}")
        if last_brace != -1:
            # Extract content up to the last }
            potential_content = trimmed_text[: last_brace + 1].strip()

            # Check if this looks like JSON object content (has key-value pairs)
            # Pattern: "key": value or "key": "value" (more flexible to handle various key names)
            json_like_pattern = r'["\'][^"\']+["\']\s*:\s*[^,}]+'
            if re.search(json_like_pattern, potential_content, re.DOTALL):
                # Try adding opening brace if missing
                if not potential_content.strip().startswith("{"):
                    reconstructed = "{" + potential_content
                else:
                    reconstructed = potential_content

                try:
                    result = json.loads(reconstructed)
                    # Only return if it's a dict (not a list or other type)
                    if isinstance(result, dict):
                        return result
                except json.JSONDecodeError:
                    # Try fixing trailing commas
                    reconstructed_fixed = fix_trailing_commas(reconstructed)
                    try:
                        result = json.loads(reconstructed_fixed)
                        if isinstance(result, dict):
                            return result
                    except json.JSONDecodeError:
                        pass

        # Approach 2: Look for the first quoted key and reconstruct from there
        # Find the first occurrence of a quoted key followed by colon (handle multiline)
        first_key_match = re.search(r'["\']([^"\']+)["\']\s*:', trimmed_text, re.MULTILINE)
        if first_key_match:
            start_pos = first_key_match.start()
            # Find the last closing brace after this position
            last_brace_after_start = trimmed_text.rfind("}", start_pos)
            if last_brace_after_start != -1:
                # Start from before the first key (where { should be)
                potential_content = trimmed_text[
                    max(0, start_pos - 1) : last_brace_after_start + 1
                ].strip()
                # Ensure it starts with {
                if not potential_content.startswith("{"):
                    potential_content = "{" + potential_content.lstrip()

                try:
                    result = json.loads(potential_content)
                    if isinstance(result, dict):
                        return result
                except json.JSONDecodeError:
                    potential_content_fixed = fix_trailing_commas(potential_content)
                    try:
                        result = json.loads(potential_content_fixed)
                        if isinstance(result, dict):
                            return result
                    except json.JSONDecodeError:
                        pass

        # Approach 3: Try to reconstruct by finding the content between first key and last brace
        # This handles multiline strings and complex nested structures
        # Find the first key and the last closing brace
        first_key_match = re.search(
            r'["\']([^"\']+)["\']\s*:', trimmed_text, re.MULTILINE | re.DOTALL
        )
        last_brace = trimmed_text.rfind("}")

        if first_key_match and last_brace != -1 and last_brace > first_key_match.start():
            # Extract everything from before the first key to the last brace
            # Start a bit before the first key to capture any leading whitespace/newlines
            start_idx = max(0, first_key_match.start() - 2)
            content = trimmed_text[start_idx : last_brace + 1].strip()

            # Ensure it starts with {
            if not content.startswith("{"):
                content = "{" + content.lstrip()

            # Try parsing
            try:
                result = json.loads(content)
                if isinstance(result, dict):
                    return result
            except json.JSONDecodeError:
                # If it fails, try fixing trailing commas
                content_fixed = fix_trailing_commas(content)
                try:
                    result = json.loads(content_fixed)
                    if isinstance(result, dict):
                        return result
                except json.JSONDecodeError:
                    # Last resort: try to extract just the object content
                    # Find where the actual object content starts (first key)
                    obj_start = first_key_match.start()
                    obj_content = trimmed_text[obj_start : last_brace + 1]
                    reconstructed = "{" + obj_content
                    try:
                        result = json.loads(reconstructed)
                        if isinstance(result, dict):
                            return result
                    except json.JSONDecodeError:
                        reconstructed_fixed = fix_trailing_commas(reconstructed)
                        try:
                            result = json.loads(reconstructed_fixed)
                            if isinstance(result, dict):
                                return result
                        except json.JSONDecodeError:
                            pass

    # Strategy 2: Look for JSON objects/arrays in the text
    # Try to find the first valid JSON object or array
    patterns = [
        r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}",  # JSON object (nested braces)
        r"\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]",  # JSON array (nested brackets)
    ]

    for pattern in patterns:
        matches = re.finditer(pattern, text, re.DOTALL)
        for match in matches:
            json_str = match.group(0)
            try:
                parsed = json.loads(json_str)
                # Prefer dicts over arrays if we're looking for object responses
                if isinstance(parsed, dict):
                    return parsed
                # Only return arrays if no dicts found
                if isinstance(parsed, list) and not any(isinstance(m, dict) for m in matches):
                    return parsed
            except json.JSONDecodeError:
                # Try fixing trailing commas
                json_str_fixed = fix_trailing_commas(json_str)
                try:
                    parsed = json.loads(json_str_fixed)
                    if isinstance(parsed, dict):
                        return parsed
                except json.JSONDecodeError:
                    continue

    # Strategy 3: Try to find JSON by looking for common JSON patterns
    # Look for content between first { and last } or first [ and last ]
    brace_start = text.find("{")
    brace_end = text.rfind("}")
    if brace_start != -1 and brace_end != -1 and brace_end > brace_start:
        json_str = text[brace_start : brace_end + 1]
        try:
            result = json.loads(json_str)
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            json_str_fixed = fix_trailing_commas(json_str)
            try:
                result = json.loads(json_str_fixed)
                if isinstance(result, dict):
                    return result
            except json.JSONDecodeError:
                pass

    bracket_start = text.find("[")
    bracket_end = text.rfind("]")
    if bracket_start != -1 and bracket_end != -1 and bracket_end > bracket_start:
        json_str = text[bracket_start : bracket_end + 1]
        try:
            result = json.loads(json_str)
            # Only return arrays as last resort
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            json_str_fixed = fix_trailing_commas(json_str)
            try:
                result = json.loads(json_str_fixed)
                if isinstance(result, list):
                    return result
            except json.JSONDecodeError:
                pass

    return None


def balance_json(json_str: str) -> str:
    """
    Attempt to balance braces and brackets in a JSON string.

    This tries to extract a complete JSON structure by finding matching braces/brackets.
    Returns the outermost complete structure.

    Args:
        json_str: JSON string that may be incomplete or have extra content

    Returns:
        Balanced JSON string (outermost complete structure), or empty string if none found
    """
    if not json_str:
        return ""

    # Find the first opening brace or bracket
    start_idx = -1
    for i, char in enumerate(json_str):
        if char in "{[":
            start_idx = i
            break

    if start_idx == -1:
        return ""

    # Track depth to find the matching closing brace/bracket
    depth = 0
    end_idx = -1
    opening_char = json_str[start_idx]
    closing_char = "}" if opening_char == "{" else "]"

    for i in range(start_idx, len(json_str)):
        char = json_str[i]
        if char == opening_char:
            depth += 1
        elif char == closing_char:
            depth -= 1
            if depth == 0:
                end_idx = i
                break

    if end_idx != -1:
        return json_str[start_idx : end_idx + 1]

    return ""


def fix_trailing_commas(json_str: str) -> str:
    """
    Attempt to fix trailing commas in JSON strings.

    This is a simple fix that removes trailing commas before closing braces/brackets.
    More complex fixes would require a proper JSON parser.

    Args:
        json_str: JSON string that may have trailing commas

    Returns:
        JSON string with trailing commas removed
    """
    # Remove trailing commas before } or ]
    # This regex matches: ,\s*} or ,\s*]
    fixed = re.sub(r",\s*([}\]])", r"\1", json_str)
    return fixed
