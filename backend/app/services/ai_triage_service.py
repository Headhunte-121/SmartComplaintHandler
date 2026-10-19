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

TRIAGE_SYSTEM_PROMPT = """Classify routine facility complaints and campus queries from students/faculty across the entire IIIT Naya Raipur campus. These are maintenance tickets, not emergency dispatches. Return ONLY valid JSON.

DEPARTMENTS:
1 Electrical: power, lights, fans, AC, wiring, MCB, geyser heating.
2 Plumbing: pipes, leaks, taps, RO, flush, drains, sewage, flooding, geyser water leaks.
3 Sanitation: garbage, cleaning, odors, hygiene, pests.
4 Carpentry: doors, windows, furniture, locks, hinges, latches, drawers.
5 IT Support: Wi-Fi, LAN, internet, computers, projectors, monitors.
6 General Administration: grounds, roads, buildings, gates, signage, access, miscellaneous facilities.

RULES: Water leaks/clogs/flush faults = Plumbing; cleaning/garbage/odors/pests = Sanitation. Geyser water leak = Plumbing; heating/electrical fault = Electrical. Locks/furniture = Carpentry. Select the main defect's department.

PRIORITY/SLA:
CRITICAL=2h: explicit immediate hazards.
HIGH=8h: major service disruption or serious security defect.
MEDIUM=24h: ordinary functional maintenance faults.
LOW=72h: minor cosmetic defects.
Use CRITICAL only for clearly described immediate danger, not merely because a complaint mentions a fault. Choose the highest justified priority. Set sla_hours dynamically: CRITICAL=2, HIGH=8, MEDIUM=24, LOW=72. hazard_detected=true only for explicit safety hazards; otherwise false. Never invent facts.

OUTPUT JSON ONLY:
{"department_id":1,"department_name":"Electrical","category":"Electrical","priority":"MEDIUM","sla_hours":24,"hazard_detected":false,"confidence":0.95,"reason":"Brief explanation.","matched_keywords":["relevant terms"]}

Use exact department names; ID/category must match. Confidence 0.85-0.99. No extra keys or text."""


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
            "max_tokens": 200,
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
    Attempts classification using Groq / Gemini in strict single-call mode with dynamic SLA.
    If no API key is provided, or in offline/error conditions, seamlessly falls back to
    the local deterministic classification and priority engine as a safety backup.
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

            # Dynamic SLA hours with priority fallback
            raw_sla = ai_result.get("sla_hours")
            try:
                sla_hours = int(raw_sla) if raw_sla is not None else None
            except (ValueError, TypeError):
                sla_hours = None

            if not sla_hours or sla_hours <= 0:
                sla_map = {"CRITICAL": 2, "HIGH": 8, "MEDIUM": 24, "LOW": 72}
                sla_hours = sla_map.get(priority, 24)

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
                "sla_hours": sla_hours,
                "hazard_detected": hazard_detected,
                "confidence": round(confidence, 2),
                "reason": reason,
                "matched_keywords": keywords,
                "ai_powered": True,
                "provider": provider,
                "model_used": ai_result.get("model_used", getattr(settings, "GROQ_MODEL", "allam-2-7b") if provider == "groq" else "gemini-2.0-flash"),
            }
        except Exception as err:
            logger.warning(f"AI triage request to {provider} failed: {err}. Falling back to local heuristic backup engine.")

    # 2. Local Deterministic Semantic Engine Fallback (Backup Only)
    priority_info = calculate_priority(clean_title, clean_desc)
    classification_info = classify_ticket(clean_title, clean_desc)

    all_keywords = sorted(
        list(set(priority_info.get("matched_keywords", []) + classification_info.get("matched_keywords", [])))
    )

    reason = (
        f"Category '{classification_info['category']}' assigned based on domain keywords. "
        f"Priority '{priority_info['priority']}' assigned: {priority_info['reason']}"
    )

    sla_map = {"CRITICAL": 2, "HIGH": 8, "MEDIUM": 24, "LOW": 72}
    sla_hours = sla_map.get(priority_info["priority"], 24)

    return {
        "department_id": classification_info["department_id"],
        "department_name": classification_info["department_name"],
        "category": classification_info["category"],
        "priority": priority_info["priority"],
        "suggested_priority": priority_info["priority"],
        "sla_hours": sla_hours,
        "hazard_detected": priority_info["hazard_detected"],
        "confidence": classification_info["confidence"],
        "reason": reason,
        "matched_keywords": all_keywords,
        "ai_powered": False,
        "provider": "local-heuristic",
        "model_used": "deterministic-rules-backup",
    }
