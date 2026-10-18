"""
SmartComplaintHandler - Taxonomy Classifier
Blueprint Reference: V1/M3/backend/02_classifier_engine.md
Role: 5-domain taxonomy classifier with title weighting and normalized confidence scoring.
"""
import re
from typing import Any, Dict, List, Set

# Item 1: Department Taxonomy Registry
# Item 1: Department Taxonomy Registry with Comprehensive Multi-Domain Vocabulary
DEPARTMENTS_TAXONOMY: Dict[int, Dict[str, Any]] = {
    1: {
        "name": "Electrical",
        "keywords": {
            "fan", "ceiling fan", "regulator", "light", "bulb", "tube light", "led", "wire", "wiring",
            "spark", "sparks", "sparking", "switch", "switchboard", "socket", "power", "power cut",
            "blackout", "voltage", "fluctuation", "ac", "air conditioner", "cooler", "desert cooler",
            "short circuit", "mcb", "fuse", "outlet", "plug", "inverter", "generator", "generator backup",
            "choke", "starter", "lamp", "study lamp", "exhaust fan", "geyser thermostat", "electrical",
            "shock", "current", "bijli", "panka"
        }
    },
    2: {
        "name": "Plumbing",
        "keywords": {
            "pipe", "pipeline", "leak", "leaking", "leakage", "water", "tap", "drain", "drainage",
            "clog", "clogged", "flush", "flushing", "cistern", "tank", "water tank", "sewage", "faucet",
            "dripping", "overflow", "overflowing", "geyser", "water heater", "washroom", "bathroom",
            "toilet", "commode", "sink", "washbasin", "urinal", "jet spray", "health faucet", "bidet",
            "shower", "shower head", "siphon", "p-trap", "water cooler", "water purifier", "ro purifier",
            "flooding", "burst", "pani", "nal"
        }
    },
    3: {
        "name": "Sanitation",
        "keywords": {
            "garbage", "trash", "cleaning", "dustbin", "bin", "smell", "foul smell", "stink", "stinking",
            "odor", "waste", "dirty", "pest", "pests", "mosquito", "mosquitoes", "cockroach", "cockroaches",
            "rat", "rats", "mice", "bedbug", "bedbugs", "termite", "termites", "sanitary", "sweeping",
            "mopping", "litter", "hygiene", "vomit", "stained", "fungus", "mold", "dust", "spider web",
            "cobweb", "kachra", "safai"
        }
    },
    4: {
        "name": "Carpentry",
        "category_alias": "Infrastructure",
        "keywords": {
            "door", "doors", "window", "windows", "desk", "study desk", "chair", "study chair", "bench",
            "table", "cupboard", "almirah", "wardrobe", "drawer", "handle", "door handle", "lock",
            "door lock", "padlock", "latch", "hinge", "hinges", "wooden", "furniture", "board",
            "soft board", "notice board", "whiteboard", "bed", "bed frame", "cot", "plywood", "shelf",
            "bookshelf", "curtain rod", "wood", "darwaza", "khidki"
        }
    },
    5: {
        "name": "IT Support",
        "keywords": {
            "wifi", "wi-fi", "internet", "network", "lan", "lan port", "ethernet", "rj45", "cat6",
            "cable", "router", "access point", "eduroam", "printer", "projector", "hdmi", "vga",
            "computer", "lab pc", "desktop", "system", "portal", "student portal", "moodle", "login",
            "screen", "monitor", "keyboard", "mouse", "ip address", "dns", "gateway", "firewall", "intranet"
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
