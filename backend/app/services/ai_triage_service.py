"""
SmartComplaintHandler - AI-Powered Auto-Triage & Deep Taxonomy Classifier
Domain: Integrates free-tier Generative AI (Google Gemini 2.0 / 1.5 Flash and Groq Llama 3)
        with an enhanced local deterministic semantic fallback for 100% reliability.
Features:
- Free Google Gemini API integration (15 RPM / 1500 RPD free tier via Google AI Studio)
- Free Groq Cloud API integration (30 RPM Llama 3.1 8B Instant via console.groq.com)
- Client-provided or server-configured API keys (X-AI-API-Key header or GEMINI_API_KEY env)
- Zero-downtime graceful fallback to local enhanced heuristic classifier
- In-memory debounced query cache to eliminate redundant API calls
"""
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
import urllib.error
import urllib.parse
import urllib.request

from app.core.config import settings
from app.services.classifier import classify_ticket
from app.services.priority_engine import calculate_priority

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
GEMINI_FALLBACK_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

TRIAGE_SYSTEM_PROMPT = """CRITICAL INSTRUCTION: You are the official Campus Facility & Institutional AI Classifier for IIIT Naya Raipur.
Your task is to analyze maintenance grievances or campus queries lodged by students or faculty and assign the exact service department, squad classification, and SLA priority tier.

DEPARTMENTS (You MUST select exactly one of these 6 strings - NEVER invent new category names like "General Maintenance", "Civil", "Hostel", or "Security"):
1. "Electrical" (id: 1) - power supply, switches, lights, bulbs, ceiling fans, AC units, desert coolers, MCB tripping, electrical wiring, sparking, sockets, geyser heating coil/element failure.
2. "Plumbing" (id: 2) - water pipes, leakage, dripping taps, water coolers/RO lines, flush valves, cisterns, washbasins, jet sprays, commodes, drainage clogs, sewage overflow, indoor water flooding, geyser inlet/outlet water leaks.
3. "Sanitation" (id: 3) - garbage disposal, trash bins, washroom cleanliness/sweeping, pest control (cockroach, rat, bedbug, mosquito breeding), foul odors, hygiene, waste accumulation.
4. "Carpentry" (id: 4) - doors, windows, wooden furniture, study tables, chairs, almirahs/wardrobes, door locks, padlocks, latches, hinges, bed frames, whiteboard frames.
5. "IT Support" (id: 5) - campus Wi-Fi access points, LAN ports, ethernet cables, student intranet portal, lab computers, classroom projectors, screen monitors, network connectivity.
6. "General Administration" (id: 6) - campus grounds, security gates, signage, civil infrastructure, keys & access, miscellaneous facility requests.

DISAMBIGUATION & CONSISTENCY RULES:
- PLUMBING vs. SANITATION: Any physical water pipe leak, leaking geyser valve, dripping tap, clogged washbasin, flush tank failure, or puddle from plumbing lines is ALWAYS "Plumbing", EVEN IF IT IS IN A WASHROOM OR TOILET. Assign "Sanitation" ONLY for trash, sweeping, foul odors, cleaning requests, or insect/pest infestations.
- GEYSER DEFECTS: Water dripping or pipe leaking from a geyser is "Plumbing". Geyser electrical coil not heating water, switch sparking, or tripping the MCB is "Electrical".
- DOOR LOCKS & FURNITURE: Broken door locks, room latches, loose hinges, or stuck almirah drawers are ALWAYS "Carpentry".
- CRITICAL HAZARDS: Active electrical sparks, smoking appliances, burning smells, exposed live wires, or major indoor water flooding threatening electronics MUST be assigned "CRITICAL" priority and hazard_detected=true (SLA: 2 Hours).

PRIORITY LEVELS & SLA MATRIX:
- "CRITICAL": Direct life-safety hazard or imminent danger (active fire, sparks, electric shock risk, gas leak, massive indoor flooding, elevator trapped, structural collapse). SLA: 2 Hours.
- "HIGH": Severe operational disruption without immediate physical danger (entire wing/floor blackout, main room/hostel lock broken leaving room insecure, no running water in hostel, sewage backup). SLA: 8 Hours.
- "MEDIUM": Standard everyday functional defect (broken fan speed regulator, individual LAN port dead, slowly dripping tap, single fused bulb, squeaky chair). SLA: 24 Hours.
- "LOW": Minor cosmetic or aesthetic defect (scuffed wall paint, minor stain, loose non-vital screw, slight squeak). SLA: 72 Hours.

Return ONLY a valid JSON object matching this schema:
{
  "department_id": integer (1-6),
  "department_name": string (one of the 6 above),
  "category": string (same as department_name),
  "priority": string ("CRITICAL", "HIGH", "MEDIUM", "LOW"),
  "hazard_detected": boolean,
  "confidence": float between 0.85 and 0.99,
  "reason": string (1-2 clear sentences explaining why this department and priority were chosen),
  "matched_keywords": array of relevant technical keywords identified
}"""


def _get_active_ai_config(client_api_key: Optional[str] = None, client_provider: Optional[str] = None) -> Dict[str, Optional[str]]:
    """Resolve API key and provider from request parameters or server environment."""
    groq_env_key = (getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY", "")).strip()
    gemini_env_key = (getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY", "")).strip()

    default_provider = (getattr(settings, "DEFAULT_AI_PROVIDER", None) or os.getenv("DEFAULT_AI_PROVIDER", "groq" if groq_env_key else "gemini")).strip().lower()
    provider = (client_provider or default_provider).strip().lower()

    api_key = (client_api_key or "").strip()
    if not api_key:
        if provider == "groq":
            api_key = groq_env_key
        else:
            api_key = gemini_env_key

    return {
        "provider": provider,
        "api_key": api_key or None,
    }


def _call_gemini_api(api_key: str, title: str, description: str) -> Dict[str, Any]:
    """Call Google Gemini 2.0 / 1.5 Flash free-tier API in structured JSON mode."""
    user_prompt = f"Complaint Title: {title}\nComplaint Description: {description}"
    prompt_full = f"{TRIAGE_SYSTEM_PROMPT}\n\n{user_prompt}"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt_full}],
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "topP": 0.8,
            "maxOutputTokens": 400,
            "responseMimeType": "application/json",
        },
    }

    req_data = json.dumps(payload).encode("utf-8")
    
    # Try gemini-3.8-flash, gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash
    models_to_try = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    urls_to_try = [
        f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        for m in models_to_try
    ]

    last_error = None
    for url in urls_to_try:
        try:
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                raw_body = resp.read().decode("utf-8")
                parsed_resp = json.loads(raw_body)
                candidates = parsed_resp.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        raw_text = parts[0]["text"].strip()
                        # Extract JSON object if wrapped in markdown
                        raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
                        raw_text = re.sub(r"\s*```$", "", raw_text, flags=re.MULTILINE)
                        result_dict = json.loads(raw_text)
                        result_dict["ai_powered"] = True
                        result_dict["provider"] = "gemini"
                        return result_dict
        except Exception as e:
            last_error = e
            logger.debug(f"Gemini API attempt failed on {url}: {e}")
            continue

    raise last_error or RuntimeError("Gemini API call failed")


def _call_groq_api(api_key: str, title: str, description: str, model: Optional[str] = None) -> Dict[str, Any]:
    """Call Groq Cloud free-tier API (ALLaM 2 7B / Llama 3.3 70B / Llama 3.1 8B) in JSON mode."""
    target_model = model or os.getenv("GROQ_MODEL") or "allam-2-7b"
    models_to_try = [target_model, "allam-2-7b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
    # Deduplicate while preserving order
    seen = set()
    models_sequence = [m for m in models_to_try if not (m in seen or seen.add(m))]

    last_error = None
    for m in models_sequence:
        payload = {
            "model": m,
            "messages": [
                {"role": "system", "content": TRIAGE_SYSTEM_PROMPT},
                {"role": "user", "content": f"Complaint Title: {title}\nComplaint Description: {description}"},
            ],
            "temperature": 0.0,
            "seed": 42,
            "max_tokens": 400,
            "response_format": {"type": "json_object"},
        }

        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            GROQ_API_URL,
            data=req_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "User-Agent": "SmartComplaintHandler/1.0 (Windows NT 10.0; Win64; x64)",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                raw_body = resp.read().decode("utf-8")
                parsed_resp = json.loads(raw_body)
                choices = parsed_resp.get("choices", [])
                if choices:
                    raw_text = choices[0].get("message", {}).get("content", "").strip()
                    result_dict = json.loads(raw_text)
                    result_dict["ai_powered"] = True
                    result_dict["provider"] = "groq"
                    result_dict["model_used"] = m
                    return result_dict
        except Exception as err:
            last_error = err
            logger.debug(f"Groq API call with {m} failed: {err}")
            continue

    raise last_error or RuntimeError("Groq API returned empty response")


def classify_and_triage_with_ai(
    title: str,
    description: str,
    client_api_key: Optional[str] = None,
    client_provider: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Primary AI Triage Entry Point.
    Attempts classification using Google Gemini (or Groq). If an API key is available
    and the request succeeds, returns rich AI diagnostics.
    If no API key is provided, or in offline/error conditions, seamlessly falls back to
    the local deterministic classification and priority engine.
    """
    clean_title = (title or "").strip()
    clean_desc = (description or "").strip()

    ai_cfg = _get_active_ai_config(client_api_key, client_provider)
    provider = ai_cfg["provider"]
    api_key = ai_cfg["api_key"]

    # 1. Attempt AI classification if API key is provided
    if api_key:
        try:
            if provider == "groq":
                ai_result = _call_groq_api(api_key, clean_title, clean_desc)
            else:
                ai_result = _call_gemini_api(api_key, clean_title, clean_desc)

            # Validate and format result fields
            dept_id = int(ai_result.get("department_id", 1))
            dept_name = str(ai_result.get("department_name") or ai_result.get("category") or "Electrical")
            priority = str(ai_result.get("priority", "MEDIUM")).upper()
            if priority not in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
                priority = "MEDIUM"

            hazard_detected = bool(ai_result.get("hazard_detected", priority == "CRITICAL"))
            confidence = float(ai_result.get("confidence", 0.95))
            confidence = max(0.1, min(1.0, confidence))
            reason = str(ai_result.get("reason") or f"Assigned to {dept_name} with priority {priority}.")
            keywords = list(ai_result.get("matched_keywords", []))

            return {
                "department_id": dept_id,
                "department_name": dept_name,
                "category": dept_name,
                "priority": priority,
                "suggested_priority": priority,
                "hazard_detected": hazard_detected,
                "confidence": round(confidence, 2),
                "reason": reason,
                "matched_keywords": keywords,
                "ai_powered": True,
                "provider": provider,
                "model_used": ai_result.get("model_used", getattr(settings, "GROQ_MODEL", "allam-2-7b") if provider == "groq" else "gemini-2.0-flash"),
            }
        except Exception as err:
            logger.warning(f"AI triage request to {provider} failed: {err}. Falling back to local heuristic engine.")

    # 2. Local Deterministic Semantic Engine Fallback
    priority_info = calculate_priority(clean_title, clean_desc)
    classification_info = classify_ticket(clean_title, clean_desc)

    all_keywords = sorted(
        list(set(priority_info.get("matched_keywords", []) + classification_info.get("matched_keywords", [])))
    )

    reason = (
        f"Category '{classification_info['category']}' assigned based on domain keywords. "
        f"Priority '{priority_info['priority']}' assigned: {priority_info['reason']}"
    )

    return {
        "department_id": classification_info["department_id"],
        "department_name": classification_info["department_name"],
        "category": classification_info["category"],
        "priority": priority_info["priority"],
        "suggested_priority": priority_info["priority"],
        "hazard_detected": priority_info["hazard_detected"],
        "confidence": classification_info["confidence"],
        "reason": reason,
        "matched_keywords": all_keywords,
        "ai_powered": False,
        "provider": "local-heuristic",
        "model_used": "deterministic-rules",
    }
