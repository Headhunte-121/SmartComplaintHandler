"""
SmartComplaintHandler - Taxonomy Classifier
Blueprint Reference: V1/M3/backend/02_classifier_engine.md
Role: 5-domain taxonomy classifier with title weighting and normalized confidence scoring.
"""
import re
from typing import Any, Dict, List, Set

# Item 1: Department Taxonomy Registry
DEPARTMENTS_TAXONOMY: Dict[int, Dict[str, Any]] = {
    1: {
        "name": "Electrical",
        "keywords": {
            "fan", "light", "bulb", "wire", "spark", "sparking", "switch", "socket",
            "power", "blackout", "voltage", "ac", "cooler", "short circuit", "mcb",
            "fuse", "tube light", "outlet", "switchboard", "electrical"
        }
    },
    2: {
        "name": "Plumbing",
        "keywords": {
            "pipe", "leak", "water", "tap", "drain", "flush", "tank", "sewage",
            "faucet", "clog", "dripping", "overflow", "geyser", "washroom",
            "sink", "flooding", "burst"
        }
    },
    3: {
        "name": "Sanitation",
        "keywords": {
            "garbage", "trash", "cleaning", "dustbin", "smell", "odor", "waste",
            "dirty", "pest", "mosquito", "cockroach", "sanitary", "sweeping",
            "litter", "hygiene"
        }
    },
    4: {
        "name": "Carpentry",
        "category_alias": "Infrastructure",
        "keywords": {
            "door", "window", "desk", "chair", "bench", "table", "cupboard",
            "handle", "lock", "hinge", "wooden", "furniture", "board", "bed"
        }
    },
    5: {
        "name": "IT Support",
        "keywords": {
            "wifi", "internet", "network", "lan", "ethernet", "router", "printer",
            "projector", "computer", "system", "portal", "login", "screen", "monitor"
        }
    },
    6: {
        "name": "General Administration",
        "category_alias": "General",
        "keywords": set()
    }
}

# Item 2: Field Weighting Multipliers
TITLE_WEIGHT: float = 2.0
DESCRIPTION_WEIGHT: float = 1.0


def _match_keywords_in_text(text: str, keywords: Set[str]) -> List[str]:
    """
    Find whole-word boundary keyword matches in normalized text.
    """
    found: List[str] = []
    for kw in sorted(keywords, key=len, reverse=True):
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, text, re.IGNORECASE):
            found.append(kw)
    return found


def classify_ticket(title: str, description: str) -> Dict[str, Any]:
    """
    Classify a complaint into one of 6 departmental domains using field-weighted keyword scoring.
    Title matches are weighted 2.0x compared to description matches (1.0x).
    """
    title_text = (title or "").lower()
    desc_text = (description or "").lower()

    dept_scores: Dict[int, float] = {}
    dept_matches: Dict[int, List[str]] = {}
    total_matches = 0

    for dept_id, info in DEPARTMENTS_TAXONOMY.items():
        kws = info["keywords"]
        if not kws:
            continue

        title_matches = _match_keywords_in_text(title_text, kws)
        desc_matches = _match_keywords_in_text(desc_text, kws)
        all_unique = list(set(title_matches + desc_matches))

        score = (len(title_matches) * TITLE_WEIGHT) + (len(desc_matches) * DESCRIPTION_WEIGHT)
        dept_scores[dept_id] = score
        dept_matches[dept_id] = all_unique
        total_matches += len(all_unique)

    # Determine highest scoring department
    if not dept_scores or max(dept_scores.values()) == 0:
        # Fallback to General Administration (ID 6)
        fallback_name = DEPARTMENTS_TAXONOMY[6]["name"]
        return {
            "department_id": 6,
            "department_name": fallback_name,
            "category": "General",
            "confidence": 0.0,
            "matched_keywords": []
        }

    winning_dept_id = max(dept_scores, key=lambda k: (dept_scores[k], -k))
    winning_score = dept_scores[winning_dept_id]
    winning_matches = dept_matches[winning_dept_id]
    winning_name = DEPARTMENTS_TAXONOMY[winning_dept_id]["name"]
    category_label = DEPARTMENTS_TAXONOMY[winning_dept_id].get("category_alias", winning_name)

    # Normalized confidence calculation bounded between 0.0 and 1.0
    confidence = min(1.0, (winning_score / (total_matches + 1.0)) + 0.3)
    confidence = round(confidence, 2)

    return {
        "department_id": winning_dept_id,
        "department_name": winning_name,
        "category": category_label,
        "confidence": confidence,
        "matched_keywords": winning_matches
    }


# Backwards compatibility and blueprint naming alias
def classify_complaint(title: str, description: str) -> Dict[str, Any]:
    """
    Alias for classify_ticket to support all blueprints and test suites.
    """
    return classify_ticket(title, description)
