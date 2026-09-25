"""
SmartComplaintHandler - Priority Scoring Engine
Blueprint Reference: V1/M3/backend/01_priority_engine.md
Role: Scans emergency indicators to calculate priority level (CRITICAL, HIGH, MEDIUM, LOW).
"""
import re
from typing import Any, Dict, List, Set

# Item 1: Standardized Priority String Constants
PRIORITY_CRITICAL: str = "CRITICAL"
PRIORITY_HIGH: str = "HIGH"
PRIORITY_MEDIUM: str = "MEDIUM"
PRIORITY_LOW: str = "LOW"

# Item 2: Severity Indicator Keyword Dictionaries
CRITICAL_KEYWORDS: Set[str] = {
    "fire",
    "spark",
    "sparks",
    "sparking",
    "shock",
    "electric shock",
    "smoke",
    "smoking",
    "gas leak",
    "flood",
    "flooding",
    "danger",
    "emergency",
    "blast",
    "explosion",
    "short circuit",
    "collapse",
    "live wire",
}

HIGH_KEYWORDS: Set[str] = {
    "burst",
    "blackout",
    "no power",
    "major leak",
    "broken lock",
    "overflow",
    "overflowing",
    "sewage",
    "contaminated",
    "fallen",
    "lift stuck",
    "elevator stuck",
    "water shortage",
}

LOW_KEYWORDS: Set[str] = {
    "paint",
    "peeling",
    "scratch",
    "scratched",
    "faded",
    "stain",
    "cosmetic",
    "dust",
    "poster",
    "dirty mark",
    "aesthetic",
    "loose screw",
}


def _find_matching_keywords(text: str, keyword_set: Set[str]) -> List[str]:
    """
    Search for whole-word boundary matches of keywords within the normalized text.
    Prevents false substring matches like 'paint' inside 'complaint'.
    """
    matches: List[str] = []
    for kw in sorted(keyword_set, key=len, reverse=True):
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, text, re.IGNORECASE):
            matches.append(kw)
    return matches


def calculate_priority(title: str, description: str) -> Dict[str, Any]:
    """
    Calculate deterministic priority based on hierarchical safety hazard and severity rules.
    
    Sequence:
    1. Life-safety hazard check -> CRITICAL (hazard_detected=True)
    2. Major infrastructure failure check -> HIGH
    3. Cosmetic defect check -> LOW
    4. Default fallback -> MEDIUM
    """
    text = f"{title or ''} {description or ''}".lower()

    # Step 1: Critical Life-Safety Hazard Check (Short-Circuit)
    critical_matches = _find_matching_keywords(text, CRITICAL_KEYWORDS)
    if critical_matches:
        reason = f"Physical safety hazard detected: {', '.join(critical_matches)}"
        return {
            "priority": PRIORITY_CRITICAL,
            "suggested_priority": PRIORITY_CRITICAL,
            "hazard_detected": True,
            "detected_keywords": critical_matches,
            "matched_keywords": critical_matches,
            "reason": reason,
            "reasoning": reason,
        }

    # Step 2: Major Infrastructure & Utility Disruption Check
    high_matches = _find_matching_keywords(text, HIGH_KEYWORDS)
    if high_matches:
        reason = f"Major operational disruption detected: {', '.join(high_matches)}"
        return {
            "priority": PRIORITY_HIGH,
            "suggested_priority": PRIORITY_HIGH,
            "hazard_detected": False,
            "detected_keywords": high_matches,
            "matched_keywords": high_matches,
            "reason": reason,
            "reasoning": reason,
        }

    # Step 3: Cosmetic & Minor Aesthetic Check
    low_matches = _find_matching_keywords(text, LOW_KEYWORDS)
    if low_matches:
        reason = f"Cosmetic or minor aesthetic defect detected: {', '.join(low_matches)}"
        return {
            "priority": PRIORITY_LOW,
            "suggested_priority": PRIORITY_LOW,
            "hazard_detected": False,
            "detected_keywords": low_matches,
            "matched_keywords": low_matches,
            "reason": reason,
            "reasoning": reason,
        }

    # Step 4: Default Fallback - Standard Maintenance
    default_reason = "Standard operational maintenance issue."
    return {
        "priority": PRIORITY_MEDIUM,
        "suggested_priority": PRIORITY_MEDIUM,
        "hazard_detected": False,
        "detected_keywords": [],
        "matched_keywords": [],
        "reason": default_reason,
        "reasoning": default_reason,
    }
