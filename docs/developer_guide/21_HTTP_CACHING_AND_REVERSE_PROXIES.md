# Guide 21: HTTP Caching, Conditional Requests, and Reverse Proxy Edge Architecture

Welcome to the systems engineering manual for HTTP caching topologies, conditional request validation, and reverse proxy edge optimizations within the **SmartComplaintHandler** platform. 

In a municipal complaint infrastructure, read traffic heavily dominates write operations: thousands of citizens, department supervisors, and field technicians query complaint lists, departmental statistics, SLA metrics, and geographic boundary definitions every minute. Without an optimized caching hierarchy, redundant database reads ([Guide 04: SQLite Storage Mechanics and WAL Mode](04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md)) and JSON serialization pipelines exhaust CPU resources.

This guide details the end-to-end caching pipeline: from browser caches and modern reverse proxy layers (NGINX/Cloudflare) to conditional HTTP validators (`ETag`, `If-None-Match`), 304 Not Modified responses, and active cache invalidation mechanics.

---

## Prerequisites and Cross-Document Reference Map

To derive maximum architectural value from this manual, reference the following upstream guides:
* [Guide 02: FastAPI ASGI Web Architecture](02_FASTAPI_ASGI_WEB_ARCHITECTURE.md) - Request-response lifecycles, HTTP response objects, and ASGI header manipulation.
* [Guide 04: SQLite Storage Mechanics and WAL Mode](04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md) - Understanding disk I/O bottlenecks and reducing read query contention.
* [Guide 05: SQLAlchemy ORM and Data Layer](05_SQLALCHEMY_ORM_AND_DATA_LAYER.md) - Schema version columns (`version_id`, `updated_at`) utilized for fast entity validation.
* [Guide 09: Axios, Fetch and REST Protocols](09_AXIOS_FETCH_AND_REST_PROTOCOLS.md) - Client-side HTTP requests, caching headers, and conditional request dispatching.
* [Guide 10: Vite and Modern Build Toolchains](10_VITE_AND_MODERN_BUILD_TOOLCHAINS.md) - Immutable asset content hashing (`main.[hash].js`) and static caching headers.
* [Guide 19: Defensive HTTP: ASGI Middlewares, Security Headers, and Perimeter Protections](19_API_MIDDLEWARE_AND_SECURITY_HEADERS.md) - Perimeter middlewares, reverse proxy IP resolution, and defensive header configurations.
* [Guide 20: Form State Machines and Optimistic UI: Resilient Client-Side Mutation Architecture](20_FORM_STATE_MACHINES_AND_OPTIMISTIC_UI.md) - Optimistic UI mutations and ETag-based concurrency control.

---

## Table of Contents
1. [Chapter 1: The Caching Hierarchy: From Browser Heaps to Edge Reverse Proxies](#chapter-1-the-caching-hierarchy-from-browser-heaps-to-edge-reverse-proxies)
2. [Chapter 2: RFC 7234 & RFC 9111 HTTP Caching Mechanics](#chapter-2-rfc-7234-rfc-9111-http-caching-mechanics)
3. [Chapter 3: Mastering Cache-Control Directives](#chapter-3-mastering-cache-control-directives)
4. [Chapter 4: Conditional Validation Primitives: Strong ETags vs Weak ETags vs Last-Modified](#chapter-4-conditional-validation-primitives-strong-etags-vs-weak-etags-vs-last-modified)
5. [Chapter 5: The HTTP 304 Not Modified Protocol Exchange](#chapter-5-the-http-304-not-modified-protocol-exchange)
6. [Chapter 6: Fast ETag Generation & Verification in FastAPI](#chapter-6-fast-etag-generation-verification-in-fastapi)
7. [Chapter 7: Short-Circuiting Database Queries via Entity Version Vectors](#chapter-7-short-circuiting-database-queries-via-entity-version-vectors)
8. [Chapter 8: The Vary Header: Avoiding Cache Poisoning Across Encodings and Auth](#chapter-8-the-vary-header-avoiding-cache-poisoning-across-encodings-and-auth)
9. [Chapter 9: NGINX Reverse Proxy Cache Architecture (`proxy_cache_path`, Zones, Keys)](#chapter-9-nginx-reverse-proxy-cache-architecture-proxy_cache_path-zones-keys)
10. [Chapter 10: Cache Stampede Mitigation: `proxy_cache_use_stale` and `proxy_cache_lock`](#chapter-10-cache-stampede-mitigation-proxy_cache_use_stale-and-proxy_cache_lock)
11. [Chapter 11: Active Cache Invalidation: FastAPI Background Tasks & Purge Hooks](#chapter-11-active-cache-invalidation-fastapi-background-tasks-purge-hooks)
12. [Chapter 12: Tag-Based Invalidation: Surrogate-Key and Cache-Tags Routing](#chapter-12-tag-based-invalidation-surrogate-key-and-cache-tags-routing)
13. [Chapter 13: Stale-While-Revalidate: Background Asynchronous Cache Refreshing](#chapter-13-stale-while-revalidate-background-asynchronous-cache-refreshing)
14. [Chapter 14: Client-Side Cache Layering: TanStack Query / SWR Caching Semantics](#chapter-14-client-side-cache-layering-tanstack-query-swr-caching-semantics)
15. [Chapter 15: In-Memory LRU Cache Implementation for High-Frequency Read Queries](#chapter-15-in-memory-lru-cache-implementation-for-high-frequency-read-queries)
16. [Chapter 16: Caching Multi-Tenant Civic Data: Preventing Cross-Citizen Cache Leaks](#chapter-16-caching-multi-tenant-civic-data-preventing-cross-citizen-cache-leaks)
17. [Chapter 17: End-to-End Caching Tests with FastAPI TestClient](#chapter-17-end-to-end-caching-tests-with-fastapi-testclient)
18. [Chapter 18: Frontend Cache Testing: Verifying Deduplication and Stale Updates with Vitest](#chapter-18-frontend-cache-testing-verifying-deduplication-and-stale-updates-with-vitest)
19. [Chapter 19: Operational Observability: Monitoring Cache Hit Ratio (CHR) and Latency Metrics](#chapter-19-operational-observability-monitoring-cache-hit-ratio-chr-and-latency-metrics)
20. [Chapter 20: Troubleshooting Edge Cache Anomalies: Inspecting `X-Cache-Status` Headers](#chapter-20-troubleshooting-edge-cache-anomalies-inspecting-x-cache-status-headers)
21. [Chapter 21: Failure Recovery Playbook: Instant Edge Cache Purging during Corrupted Deployments](#chapter-21-failure-recovery-playbook-instant-edge-cache-purging-during-corrupted-deployments)
22. [Chapter 22: Production HTTP Caching Readiness Checklist & Edge Hardening Guidelines](#chapter-22-production-http-caching-readiness-checklist-edge-hardening-guidelines)

---

## Chapter 1: The Caching Hierarchy: From Browser Heaps to Edge Reverse Proxies

In a distributed web system, caching is not a singular component; it is a **multi-tiered topological continuum**. When a citizen views the municipal complaint portal, the request traverses up to four distinct caching layers:

```
[ Tier 1: Client Memory ]   --> React / TanStack Query memory cache (0 ms latency)
          |
[ Tier 2: Browser Storage]   --> HTTP Disk Cache governed by Cache-Control (0-5 ms)
          |
[ Tier 3: Edge / Proxy ]     --> NGINX Reverse Proxy / Cloudflare Edge (5-20 ms)
          |
[ Tier 4: Server Memory ]   --> FastAPI in-memory / Redis application cache (1-5 ms)
          |
[ Canonical Storage ]       --> SQLite Database via WAL Mode (> 20 ms disk I/O)
```

### Layer Responsibilities
1. **Private Browser Cache**: Dedicated exclusively to a single user. Caches private complaint drafts, user session profile data, and authenticated user views.
2. **Shared Gateway / Reverse Proxy Cache**: Positioned between the internet and the ASGI backend (e.g., NGINX). Caches public municipal datasets, department lists, and aggregate statistics to shield Uvicorn workers from redundant traffic.
3. **Application Cache**: In-process Python dictionaries or Redis instances caching complex database query aggregations.

---

## Chapter 2: RFC 7234 & RFC 9111 HTTP Caching Mechanics

The IETF HTTP Caching specifications ([RFC 7234](https://datatracker.ietf.org/doc/html/rfc7234) and [RFC 9111](https://datatracker.ietf.org/doc/html/rfc9111)) define two core concepts that govern whether a stored response can satisfy an incoming request: **Freshness** and **Validation**.

### Freshness vs Validation
* **Freshness**: A cached response is *fresh* if its age has not exceeded its declared `max-age` lifetime. While fresh, a cache serves the representation immediately without communicating with the origin server.
* **Validation (Revalidation)**: Once a cached response becomes *stale* (age > `max-age`), the cache cannot serve it directly. It must send a **conditional request** to the origin server to verify if the representation has changed. If unchanged, the server returns `304 Not Modified` with zero body bytes!

---

## Chapter 3: Mastering Cache-Control Directives

The `Cache-Control` HTTP header is the central policy engine for HTTP caching. Improper configuration leads to either stale municipal data displayed to citizens or complete cache bypassing that overloads origin databases.

```
+---------------------------+-------------------------------------------------------------------------+
| Directive                 | Technical Specification & Runtime Semantics                             |
+---------------------------+-------------------------------------------------------------------------+
| public                    | Response may be stored by ANY cache (Browser, CDN, NGINX).             |
| private                   | Response is intended for a single user; shared proxies MUST NOT store it.|
| no-cache                  | Cache may store the response, but MUST revalidate with origin before use.|
| no-store                  | Caches MUST NOT store any part of the request or response (sensitive). |
| max-age=N                 | Resource is fresh for N seconds relative to request timestamp.          |
| s-maxage=N                | Overrides max-age specifically for shared intermediate caches (CDN/NGINX)|
| must-revalidate           | Once stale, cache MUST NOT serve resource without origin confirmation.  |
| stale-while-revalidate=N  | Serve stale copy immediately while asynchronously fetching fresh copy.  |
| stale-if-error=N          | Serve stale copy if origin returns 5xx error during revalidation.       |
+---------------------------+-------------------------------------------------------------------------+
```

### Common Architectural Recipes
* **Static Assets (JS/CSS/Fonts)**: Assets built by Vite ([Guide 10: Vite and Modern Build Toolchains](10_VITE_AND_MODERN_BUILD_TOOLCHAINS.md)) include content hashes (`index-a8f1b2.js`). They can be cached forever:
  ```http
  Cache-Control: public, max-age=31536000, immutable
  ```
* **Public Complaint Category List**: Rarely mutates; shared across all citizens:
  ```http
  Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=60
  ```
* **Authenticated Citizen Complaint Details**: Contains private citizen phone numbers and home addresses:
  ```http
  Cache-Control: private, no-cache
  ```

---

## Chapter 4: Conditional Validation Primitives: Strong ETags vs Weak ETags vs Last-Modified

When a resource is stale, the client issues a conditional request using HTTP validators:

### Strong vs Weak Entity Tags (ETags)
An **ETag** is an opaque string token generated by the server representing the exact version of the resource:
* **Strong ETag (`"33a64df5"`)**: Guarantees byte-for-byte identity of both content and headers. If even one byte changes (e.g., whitespace or compression format), the ETag changes.
* **Weak ETag (`W/"33a64df5"`)**: Guarantees **semantic equivalence**. Two representations are interchangeable even if minor byte formatting differences exist (e.g., gzip vs br compression or JSON key ordering).

```python
import hashlib  # Import cryptographic hash library for SHA-256 ETag computation
import json  # Import JSON module for payload serialization
from typing import Dict, Any, Tuple  # Import typing primitives

def compute_weak_etag_for_payload(data: Dict[str, Any]) -> str:  # Generate deterministic semantic ETag
    # Serialize JSON with sorted keys to ensure deterministic byte representation regardless of dict order
    normalized_json_bytes = json.dumps(data, sort_keys=True).encode("utf-8")  # Generate canonical bytes
    hasher = hashlib.sha256()  # Initialize SHA-256 hasher
    hasher.update(normalized_json_bytes)  # Ingest canonical payload bytes into digest buffer
    digest_hex = hasher.hexdigest()[:16]  # Extract first 16 characters of hexadecimal digest
    return f'W/"{digest_hex}"'  # Return standardized weak ETag string
```

---

## Chapter 5: The HTTP 304 Not Modified Protocol Exchange

The HTTP `304 Not Modified` status code is one of the most powerful bandwidth and latency optimizations in modern systems engineering:

```
Citizen Browser                            FastAPI / ASGI Origin
       |                                             |
       |--- GET /api/v1/departments ---------------->|
       |                                             | (Compute response, ETag: W/"9f8a1")
       |<-- 200 OK ----------------------------------|
       |    Cache-Control: public, max-age=60        |
       |    ETag: W/"9f8a1"                          |
       |    [Body: 45 KB JSON Payload]               |
       |                                             |
       | (Wait 61 seconds; cache becomes stale)      |
       |                                             |
       |--- GET /api/v1/departments ---------------->|
       |    If-None-Match: W/"9f8a1"                 | (Conditional Request)
       |                                             |
       |                                             | (Origin verifies ETag == W/"9f8a1")
       |<-- 304 Not Modified ------------------------|
       |    Cache-Control: public, max-age=60        |
       |    ETag: W/"9f8a1"                          |
       |    [Zero Body Bytes! 0 KB Transferred]      |
```

When receiving `304 Not Modified`:
1. The server **omits the response body entirely**, saving massive network bandwidth and transmission time.
2. The browser automatically updates the stored cache item's freshness headers (`max-age`) and continues serving the cached representation locally.

---

## Chapter 6: Fast ETag Generation & Verification in FastAPI

Implementing conditional responses directly within FastAPI route handlers allows the server to evaluate client freshness tokens and short-circuit response execution before serializing heavy Pydantic models ([Guide 03: Pydantic V2 Data Validation and Schemas](03_PYDANTIC_V2_DATA_VALIDATION_AND_SCHEMAS.md)):

```python
from fastapi import FastAPI, Request, Response, HTTPException, status  # Import FastAPI core primitives
from typing import Dict, Any, Optional  # Import typing primitives

app = FastAPI(title="ConditionalCachingApp")  # Instantiate demonstration application

def evaluate_preconditions_and_etag(request: Request, current_etag: str) -> Optional[Response]:  # Check ETag match
    client_if_none_match = request.headers.get("if-none-match")  # Extract client's cached ETag from request header
    if client_if_none_match:  # Check if client sent conditional validation header
        # Support both exact matches and comma-delimited multi-ETag validation lists
        client_tags = [tag.strip() for tag in client_if_none_match.split(",")]  # Parse individual ETag tokens
        if current_etag in client_tags or "*" in client_tags:  # Match current ETag or wildcard
            # Short-circuit immediately with HTTP 304 Not Modified without serializing body bytes
            return Response(  # Return empty 304 response object
                status_code=status.HTTP_304_NOT_MODIFIED,  # Standard 304 status code
                headers={"ETag": current_etag, "Cache-Control": "public, max-age=60"}  # Refresh cache headers
            )  # Conclude 304 response instantiation
    return None  # Preconditions not met; full response generation required
```

---

## Chapter 7: Short-Circuiting Database Queries via Entity Version Vectors

The true architectural efficiency of conditional HTTP is realized when the database query itself is short-circuited. 

In a standard endpoint, loading a complaint executes joins across the `complaints`, `citizen_profiles`, `attachments`, and `audit_logs` tables ([Guide 05: SQLAlchemy ORM and Data Layer](05_SQLALCHEMY_ORM_AND_DATA_LAYER.md)). However, if the client already possesses the current representation, we only need to query the **version column** from the primary index:

```python
from sqlalchemy.orm import Session  # Import SQLAlchemy database session
from sqlalchemy import text  # Import raw SQL construct for high-speed lightweight indexing
from fastapi import APIRouter, Depends, Request, Response, Header  # Import routing components
from typing import Optional  # Import optional typing

router = APIRouter(prefix="/api/v1/complaints")  # Instantiate complaints sub-router

@router.get("/{complaint_id}")  # Declare complaint retrieval endpoint
def get_complaint_with_short_circuit(complaint_id: str, request: Request, if_none_match: Optional[str] = Header(None)):  # Route
    # 1. Fast-path: Query only the primary key index and version timestamp (0.1 ms index seek)
    # simulated database query fetching only lightweight metadata
    simulated_entity_version = "v12-20260912"  # Fast-path version identifier
    computed_etag = f'W/"{complaint_id}-{simulated_entity_version}"'  # Construct weak ETag

    # 2. Check if client's cached version matches current entity version
    if if_none_match and if_none_match.strip() == computed_etag:  # Compare incoming ETag against current
        return Response(status_code=304, headers={"ETag": computed_etag, "Cache-Control": "private, max-age=120"})  # 304

    # 3. Slow-path: Entity was modified; execute full database joins and serialize heavy payload
    full_complaint_payload = {  # Build full response payload dictionary
        "id": complaint_id,  # Identifier
        "title": "Water pipeline burst on 5th avenue",  # Title text
        "version": simulated_entity_version,  # Current entity version
        "status": "IN_PROGRESS"  # Lifecycle status
    }  # Conclude payload dictionary

    return Response(  # Return full 200 OK response
        content=str(full_complaint_payload),  # Serialized content
        media_type="application/json",  # JSON content type
        headers={"ETag": computed_etag, "Cache-Control": "private, max-age=120"}  # Attach ETag and caching rules
    )  # Conclude 200 response
```

---

## Chapter 8: The Vary Header: Avoiding Cache Poisoning Across Encodings and Auth

When an intermediate reverse proxy (e.g., NGINX) caches a response, it uses a **Cache Key** (typically `Scheme + Host + URI`). If two different clients request the identical URI with different request headers, a naive proxy might serve the first client's cached response to the second!

### The Catastrophic "Missing Vary" Scenarios
1. **Compression Corruption**: Client A requests `/api/v1/complaints` with `Accept-Encoding: gzip`. NGINX compresses the JSON and caches the raw gzipped binary. Client B (a legacy sensor) requests the same URL with `Accept-Encoding: identity`. Without `Vary: Accept-Encoding`, NGINX serves the gzipped binary to Client B, which crashes trying to parse it as UTF-8 text!
2. **Private Identity Leakage**: If an endpoint returns personalized municipal notifications based on the `Authorization` header, caching without `Vary: Authorization` serves Citizen A's confidential grievance dashboard to Citizen B!

### Enforcing the Vary Header
Whenever response content depends on request headers, the origin must declare them in the `Vary` header:

```http
Vary: Accept-Encoding, Authorization, Accept
```

This commands all intermediate caches to partition their cache keys by both the URL and the exact values of the specified request headers.

---

## Chapter 9: NGINX Reverse Proxy Cache Architecture (`proxy_cache_path`, Zones, Keys)

In production, an NGINX reverse proxy sits in front of Uvicorn workers ([Guide 02: FastAPI ASGI Web Architecture](02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)) to terminate TLS, serve static Vite bundles, and cache public municipal API responses:

```nginx
# Configure shared memory cache zone and disk storage path
proxy_cache_path /var/cache/nginx/smart_complaints # Disk path for storing serialized HTTP responses
                 levels=1:2 # Two-tier sub-directory hierarchy to avoid filesystem directory scan limits
                 keys_zone=COMPLAINT_API_CACHE:20m # Allocate 20 megabytes of shared RAM for cache keys
                 max_size=2g # Cap total cached disk payload storage at 2 gigabytes
                 inactive=120m # Evict cached items not accessed within 120 minutes
                 use_temp_path=off; # Write directly to cache directory to avoid extra disk copy operations

server { # Declare HTTP server block
    listen 80; # Listen on standard HTTP port
    server_name complaints.smartcity.gov; # Match municipal portal hostname

    location /api/v1/public/ { # Route public unauthenticated civic endpoints through edge cache
        proxy_pass http://127.0.0.1:8000; # Forward requests to backend FastAPI Uvicorn worker
        proxy_cache COMPLAINT_API_CACHE; # Bind location block to configured shared memory cache zone
        proxy_cache_key "$scheme$request_method$host$request_uri"; # Deterministic composite cache key

        # Respect origin Cache-Control headers while setting fallback caching boundaries
        proxy_cache_valid 200 304 5m; # Cache successful 200 and 304 responses for 5 minutes
        proxy_cache_valid 404 1m; # Cache 404 Not Found responses for 1 minute to mitigate scanning DoS

        # Expose cache diagnostics header to assist operations and debugging
        add_header X-Cache-Status $upstream_cache_status; # Output HIT, MISS, EXPIRED, or BYPASS
    } # Conclude public location block
} # Conclude server block
```

---

## Chapter 10: Cache Stampede Mitigation: `proxy_cache_use_stale` and `proxy_cache_lock`

When a popular cached dataset (e.g., the city-wide power outage map) expires at 09:00:00 AM, 500 concurrent citizens may request that URL at 09:00:01 AM. If NGINX forwards all 500 requests to Uvicorn simultaneously, the sudden spike is termed a **Cache Stampede (Thundering Herd)**, which can crash the database.

### The Double-Lock & Stale Defense
NGINX provides two directives to completely neutralize cache stampedes:
1. **`proxy_cache_lock on;`**: When a cache miss occurs, only **one** request is permitted to query the Uvicorn origin. The other 499 requests are held in a light queue. Once the first request populates the cache, the remaining 499 requests are immediately fulfilled from the fresh cache!
2. **`proxy_cache_use_stale updating;`**: While the single designated request updates the cache in the background, all other incoming requests are served the **stale copy immediately**, eliminating all client waiting time!

```nginx
location /api/v1/outages/ { # High-traffic outage telemetry endpoint
    proxy_pass http://127.0.0.1:8000; # Proxy to FastAPI backend
    proxy_cache COMPLAINT_API_CACHE; # Use shared cache zone
    proxy_cache_lock on; # Allow only one request to fetch from origin on cache miss
    proxy_cache_lock_timeout 5s; # Fallback timeout if origin query hangs
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503; # Serve stale on errors or refresh
} # Conclude outage location block
```

---

## Chapter 11: Active Cache Invalidation: FastAPI Background Tasks & Purge Hooks

While TTL expiration ensures that cached representations eventually update, municipal emergency updates (e.g., resolving a critical gas leak) demand **immediate edge cache invalidation**. Waiting 5 minutes for a TTL to expire leaves citizens unaware of critical safety resolutions.

FastAPI provides `BackgroundTasks` ([Guide 02: FastAPI ASGI Web Architecture](02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)) to dispatch cache eviction hooks asynchronously after committing a database transaction:

```python
import httpx  # Import HTTP client for dispatching asynchronous edge purge requests
from fastapi import APIRouter, BackgroundTasks, HTTPException, status  # Import FastAPI routing primitives
import logging  # Import logging framework for recording purge outcomes

logger = logging.getLogger("cache_invalidation")  # Instantiate dedicated cache logger
router = APIRouter(prefix="/api/v1/complaints")  # Instantiate complaint management router

async def purge_edge_cache_for_complaint(complaint_id: str) -> None:  # Invalidate edge cache entry
    edge_purge_url = f"http://127.0.0.1:80/purge/api/v1/public/complaints/{complaint_id}"  # Build NGINX purge URL
    async with httpx.AsyncClient(timeout=5.0) as http_client:  # Initialize asynchronous HTTP client session
        try:  # Enclose edge purge request in error shield
            purge_response = await http_client.request("PURGE", edge_purge_url)  # Issue HTTP PURGE command
            if purge_response.status_code == 200:  # Verify successful edge cache eviction
                logger.info(f"Successfully evicted edge cache for complaint: {complaint_id}")  # Log success
            else:  # Log non-200 edge response
                logger.warning(f"Edge cache purge returned status {purge_response.status_code} for {complaint_id}")  # Warn
        except Exception as purge_err:  # Intercept network and timeout failures
            logger.error(f"Failed to communicate with edge proxy during cache purge: {purge_err}")  # Log error

@router.post("/{complaint_id}/resolve")  # Endpoint resolving municipal complaint
def resolve_complaint(complaint_id: str, background_tasks: BackgroundTasks):  # Route handler with background task
    # 1. Update database record status to RESOLVED (simulated database transaction)
    # 2. Schedule non-blocking edge cache invalidation after HTTP response delivery
    background_tasks.add_task(purge_edge_cache_for_complaint, complaint_id)  # Enqueue background purge task
    return {"status": "resolved", "id": complaint_id}  # Return immediate acknowledgment to officer
```

---

## Chapter 12: Tag-Based Invalidation: Surrogate-Key and Cache-Tags Routing

When an entire municipal department updates its operating hours or supervisor roster, hundreds of individual complaint endpoints become stale. Purging hundreds of URLs individually via HTTP requests is inefficient.

### The Surrogate-Key Architecture
Edge proxies (Cloudflare, Fastly, or NGINX Plus) support **Tag-Based Invalidation** via the `Surrogate-Key` or `Cache-Tag` response header:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=3600
Surrogate-Key: dept-water city-zone-4 complaint-4019
```

By tagging responses with hierarchical categories, a single API command purges all cached representations associated with `dept-water` across the entire global edge network in under 150 milliseconds!

---

## Chapter 13: Stale-While-Revalidate: Background Asynchronous Cache Refreshing

The `stale-while-revalidate` directive ([RFC 5861](https://datatracker.ietf.org/doc/html/rfc5861)) eliminates latency spikes for users without serving indefinitely outdated data:

```http
Cache-Control: max-age=60, stale-while-revalidate=300
```

1. **Window 0 to 60s**: The cached copy is fresh; served directly from local memory ($0\text{ ms}$).
2. **Window 61 to 360s**: The cached copy is stale. The cache **immediately serves the stale copy to the user** ($0\text{ ms}$ perceived latency) while silently dispatching a background revalidation request to the origin server.
3. **Beyond 360s**: The cached copy is dead; the user must wait for a synchronous origin fetch.

---

## Chapter 14: Client-Side Cache Layering: TanStack Query / SWR Caching Semantics

On the frontend ([Guide 07: React 18 and Virtual DOM Architecture](07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)), caching eliminates redundant network calls when citizens switch between tabs or navigate between complaint views. 

We implement an in-memory client cache that mirrors `stale-while-revalidate` semantics:

```javascript
import { useState, useEffect, useRef } from 'react'; // Import React lifecycle hooks

const memoryCache = new Map(); // Global in-memory cache map retaining parsed responses

export function useCachedFetch(url, cacheTtlMs = 60000) { // SWR-style caching hook
  const [data, setData] = useState(() => { // Initialize state from memory cache if present
    const cachedEntry = memoryCache.get(url); // Retrieve cached entry for target URL
    return cachedEntry ? cachedEntry.data : null; // Return cached payload or null
  }); // Conclude state initialization
  const [isValidating, setIsValidating] = useState(false); // Track background revalidation state
  const isMountedRef = useRef(true); // Retain mount state to prevent memory leak updates

  useEffect(() => { // Manage data fetching and background revalidation lifecycle
    isMountedRef.current = true; // Mark component as mounted
    const now = Date.now(); // Read current timestamp
    const cachedEntry = memoryCache.get(url); // Check for existing cached record

    const fetchFreshData = async () => { // Async fetch function retrieving fresh data
      setIsValidating(true); // Indicate background fetch is running
      try { // Guard fetch operation
        const response = await fetch(url); // Execute HTTP fetch query
        const freshPayload = await response.json(); // Parse response JSON payload
        memoryCache.set(url, { data: freshPayload, timestamp: Date.now() }); // Update memory cache
        if (isMountedRef.current) { // Verify component remains mounted in DOM
          setData(freshPayload); // Update React component state with fresh data
        } // Conclude mount check
      } catch (err) { // Handle network errors
        console.error('Background revalidation failed:', err); // Log revalidation error
      } finally { // Conclude fetch execution
        if (isMountedRef.current) setIsValidating(false); // Reset validation tracking flag
      } // Conclude finally block
    }; // Conclude fetchFreshData definition

    if (!cachedEntry || (now - cachedEntry.timestamp) > cacheTtlMs) { // Check if entry is absent or expired
      fetchFreshData(); // Execute immediate fetch
    } // Conclude freshness check

    return () => { // Teardown hook
      isMountedRef.current = false; // Flag unmounted component
    }; // Conclude teardown
  }, [url, cacheTtlMs]); // Re-execute when URL or TTL parameter transitions

  return { data, isValidating }; // Return reactive data and revalidation indicator
} // Conclude useCachedFetch hook
```

---

## Chapter 15: In-Memory LRU Cache Implementation for High-Frequency Read Queries

For server-side computations that do not mutate frequently (e.g., aggregate SLA compliance reports calculated across 50,000 complaints), caching results in an **in-memory Least-Recently-Used (LRU)** cache reduces SQLite contention ([Guide 04: SQLite Storage Mechanics and WAL Mode](04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md)):

```python
import time  # Import time module for TTL timestamp calculations
from collections import OrderedDict  # Import OrderedDict for constant-time LRU eviction
from typing import Any, Optional, Tuple  # Import typing primitives including Tuple

class ThreadSafeLruCache:  # High-performance in-process LRU cache with TTL eviction
    def __init__(self, max_capacity: int = 1000, default_ttl_seconds: float = 300.0):  # Configure size & TTL
        self.max_capacity = max_capacity  # Maximum items stored before evicting least-recently-used
        self.default_ttl = default_ttl_seconds  # Default item lifespan in seconds
        # OrderedDict maintains insertion/access order: oldest at front, newest at back
        self._store: OrderedDict[str, Tuple[Any, float]] = OrderedDict()  # In-memory storage dictionary

    def get(self, key: str) -> Optional[Any]:  # Retrieve item with LRU order updating
        if key not in self._store:  # Check if key exists in storage
            return None  # Key missing
        value, expires_at = self._store[key]  # Extract value and expiration timestamp
        if time.time() > expires_at:  # Check if item exceeded TTL
            del self._store[key]  # Evict expired entry
            return None  # Expired
        # Mark as recently used by moving key to the end of OrderedDict
        self._store.move_to_end(key)  # Update LRU ordering
        return value  # Return valid cached value

    def set(self, key: str, value: Any, ttl_seconds: Optional[float] = None) -> None:  # Store item
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl  # Resolve target TTL
        expires_at = time.time() + ttl  # Calculate expiration epoch timestamp
        if key in self._store:  # If key already exists
            self._store.move_to_end(key)  # Move to end
        self._store[key] = (value, expires_at)  # Insert or update entry
        if len(self._store) > self.max_capacity:  # Check capacity ceiling
            self._store.popitem(last=False)  # Evict oldest entry (least-recently-used at front)

```

---

## Chapter 16: Caching Multi-Tenant Civic Data: Preventing Cross-Citizen Cache Leaks

A catastrophic flaw in civic platforms is caching personalized endpoints on shared edge proxies. If an endpoint returning citizen phone numbers or sensitive harassment complaints is cached with `Cache-Control: public`, an edge proxy serves Citizen A's personal data to Citizen B!

### Rules for Safe Multi-Tenant Caching
1. **Always declare `Cache-Control: private, no-cache` for personalized endpoints**: Instructs intermediate reverse proxies that the response must NEVER be stored in shared caches.
2. **Never include authentication tokens in cache keys**: Cache keys should rely on deterministic IDs or tenant scopes, not raw bearer tokens.
3. **Partition application caches by citizen or tenant ID**:
```python
citizen_id = "CITIZEN_401"  # Simulated citizen identifier
cache_key = f"user_profile:{citizen_id}"  # Explicit tenant isolation in cache keys
```

---

## Chapter 17: End-to-End Caching Tests with FastAPI TestClient

Automated regression testing guarantees that conditional request handling properly validates entity ETags, returns HTTP 304 Not Modified, and suppresses response bodies ([Guide 12: Pytest and Automated Test Systems](12_PYTEST_AND_AUTOMATED_TEST_SYSTEMS.md)):

```python
import pytest  # Import pytest framework for assertions
from fastapi import FastAPI, Request, Response, Header  # Import FastAPI components
from fastapi.testclient import TestClient  # Import Starlette TestClient
from typing import Optional  # Import optional typing

test_app = FastAPI(title="CachingTestApp")  # Instantiate isolated test application

@test_app.get("/api/v1/public/departments")  # Declare test caching route
def get_departments(if_none_match: Optional[str] = Header(None)):  # Inspect If-None-Match header
    dataset_etag = 'W/"depts-static-v1"'  # Define deterministic entity tag
    if if_none_match and if_none_match.strip() == dataset_etag:  # Check conditional tag match
        return Response(status_code=304, headers={"ETag": dataset_etag, "Cache-Control": "public, max-age=300"})  # 304
    return Response(  # Return full 200 OK payload on first request
        content='[{"id":"WATER","name":"Water Dept"}]',  # Body bytes
        media_type="application/json",  # Content type
        headers={"ETag": dataset_etag, "Cache-Control": "public, max-age=300"}  # Cache headers
    )  # Conclude 200 response

def test_conditional_etag_returns_304_and_zero_body():  # Verify caching handshake via TestClient
    client = TestClient(test_app)  # Instantiate test client
    # 1. Initial request: server returns 200 OK with full payload and ETag
    initial_response = client.get("/api/v1/public/departments")  # Issue initial GET request
    assert initial_response.status_code == 200  # Verify status OK
    assert "etag" in initial_response.headers  # Verify ETag presence
    returned_etag = initial_response.headers["etag"]  # Extract ETag value

    # 2. Subsequent conditional request sending matching If-None-Match header
    conditional_response = client.get("/api/v1/public/departments", headers={"If-None-Match": returned_etag})  # Re-request
    assert conditional_response.status_code == 304  # Verify 304 Not Modified status
    assert len(conditional_response.content) == 0  # Assert zero body bytes transmitted across wire!
```

---

## Chapter 18: Frontend Cache Testing: Verifying Deduplication and Stale Updates with Vitest

In high-concurrency React dashboards ([Guide 07: React 18 and Virtual DOM Architecture](07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)), multiple child components frequently query the same resource simultaneously. Testing ensures that the client cache deduplicates concurrent requests into a single network execution:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'; // Import Vitest runner utilities

describe('Client Cache Request Deduplication', () => { // Test suite validating request deduplication
  beforeEach(() => { // Reset test environment
    vi.restoreAllMocks(); // Restore any mocked functions
  }); // Conclude setup

  it('deduplicates concurrent fetches for identical URLs into single network call', async () => { // Test
    let networkCallCount = 0; // Counter tracking actual network invocations
    const mockPayload = { department: 'ROADS', active_tickets: 4 }; // Simulated data

    // Stub global fetch to track invocation frequency
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => { // Mock fetch implementation
      networkCallCount += 1; // Increment network counter
      return { ok: true, json: async () => mockPayload }; // Deliver mock payload
    })); // Conclude fetch mock

    const inflightPromises = new Map(); // Simple request deduplication map
    const deduplicatedFetch = (url) => { // Deduplicating fetch wrapper
      if (!inflightPromises.has(url)) { // Check if request is already in-flight
        const promise = fetch(url).finally(() => inflightPromises.delete(url)); // Create promise
        inflightPromises.set(url, promise); // Cache active promise
      } // Conclude check
      return inflightPromises.get(url); // Return shared promise
    }; // Conclude wrapper

    // Trigger two simultaneous queries for the identical resource URL
    const [resA, resB] = await Promise.all([ // Await concurrent dispatches
      deduplicatedFetch('/api/v1/departments/roads'), // Request A
      deduplicatedFetch('/api/v1/departments/roads'), // Request B
    ]); // Conclude Promise.all

    expect(networkCallCount).toBe(1); // Assert only a single HTTP network request was executed
  }); // Conclude test
}); // Conclude describe block
```

---

## Chapter 19: Operational Observability: Monitoring Cache Hit Ratio (CHR) and Latency Metrics

A well-architected reverse proxy cache should maintain a **Cache Hit Ratio (CHR)** above 85% for public civic endpoints:

$$\text{CHR} = \left( \frac{\text{Hits}}{\text{Hits} + \text{Misses}} \right) \times 100\%$$

```python
from collections import Counter  # Import Counter collection for telemetry aggregation
from typing import Dict, Any  # Import typing primitives

class CacheObservabilityCollector:  # Track edge and application caching performance
    def __init__(self):  # Initialize telemetry counters
        self.status_counts: Counter = Counter()  # Histogram tracking HIT, MISS, EXPIRED, BYPASS
        self.not_modified_304_count = 0  # Counter tracking 304 responses delivered to clients
        self.saved_bandwidth_bytes = 0  # Estimated bytes saved by serving 304s and cache hits

    def record_status(self, cache_status: str, estimated_body_size: int = 0) -> None:  # Record event
        normalized_status = cache_status.upper()  # Normalize status string
        self.status_counts[normalized_status] += 1  # Increment status counter
        if normalized_status in ("HIT", "STALE"):  # Check if served from cache
            self.saved_bandwidth_bytes += estimated_body_size  # Accumulate saved bandwidth

    def record_304(self, estimated_body_size: int = 15000) -> None:  # Record 304 validation
        self.not_modified_304_count += 1  # Increment 304 counter
        self.saved_bandwidth_bytes += estimated_body_size  # Add avoided body bytes

    def get_cache_hit_ratio_percentage(self) -> float:  # Compute aggregate cache efficiency
        hits = self.status_counts["HIT"] + self.status_counts["STALE"]  # Calculate total cache hits
        misses = self.status_counts["MISS"] + self.status_counts["EXPIRED"]  # Calculate total cache misses
        total_evaluable = hits + misses  # Aggregate evaluable requests
        return round((hits / total_evaluable * 100.0), 2) if total_evaluable > 0 else 0.0  # Return percentage
```

---

## Chapter 20: Troubleshooting Edge Cache Anomalies: Inspecting `X-Cache-Status` Headers

When debugging stale representations or unexpected database load spikes, inspect the `X-Cache-Status` response header returned by NGINX ([Chapter 9: NGINX Reverse Proxy Cache Architecture](#chapter-9-nginx-reverse-proxy-cache-architecture-proxy_cache_path-zones-keys)):

```
+-------------------+---------------------------------------------------------------------------------+
| Status Code       | Diagnostic Meaning & Root Cause Analysis                                        |
+-------------------+---------------------------------------------------------------------------------+
| HIT               | Served directly from edge RAM/disk; origin Uvicorn worker was never contacted. |
| MISS              | Key was absent from cache; request fetched from origin and saved to edge cache. |
| EXPIRED           | TTL expired; request sent to origin to fetch a fresh representation.            |
| BYPASS            | Cache explicitly skipped due to proxy_cache_bypass rules or client auth cookies.|
| STALE             | Stale copy served immediately while background async revalidation runs.         |
| UPDATING          | Lock request is actively refreshing origin; concurrent request served stale copy|
+-------------------+---------------------------------------------------------------------------------+
```

---

## Chapter 21: Failure Recovery Playbook: Instant Edge Cache Purging during Corrupted Deployments

If a faulty deployment or corrupted database migration leaks sensitive municipal data into public cached endpoints:
1. **Targeted Purge via Curl**: Issue an authenticated HTTP `PURGE` command to NGINX for the compromised path:
   ```bash
   curl -X PURGE https://complaints.smartcity.gov/api/v1/public/complaints/CMP-4019
   ```
2. **Global Nuclear Flush**: If corrupted data is widespread, purge the entire NGINX cache directory directly on the proxy host:
   ```bash
   rm -rf /var/cache/nginx/smart_complaints/* && nginx -s reload
   ```
3. **Emergency Origin Header Override**: Temporarily deploy an emergency middleware injecting `Cache-Control: no-store, no-cache, must-revalidate` across all responses until the incident is contained.

---

## Chapter 22: Production HTTP Caching Readiness Checklist & Edge Hardening Guidelines

Before opening civic endpoints to public edge caching, verify adherence to this 15-point systems checklist:

| Check # | Architectural Area | Verification Requirement |
|:---|:---|:---|
| 1 | **RFC 9111 Specs** | Caching rules adhere to standard `Cache-Control` directives with explicit `public` or `private` scopes. |
| 2 | **Immutable Hashes** | Static assets compiled by Vite declare `max-age=31536000, immutable` with content hashes. |
| 3 | **Tenant Isolation** | All personalized citizen endpoints declare `Cache-Control: private, no-cache` to prevent leaks. |
| 4 | **Deterministic ETags**| Fast weak ETags generated via sorted JSON hashes or entity version columns. |
| 5 | **Short-Circuit 304**| Endpoints return HTTP 304 Not Modified with zero body bytes when `If-None-Match` matches. |
| 6 | **DB Short-Circuit** | Database reads for cached entities check primary key version columns before joining heavy tables. |
| 7 | **Vary Header** | `Vary: Accept-Encoding, Authorization` declared to avoid compression and auth poisoning. |
| 8 | **Stampede Lock** | NGINX configured with `proxy_cache_lock on;` to prevent database crashes on cache expiration. |
| 9 | **Stale-While-Reval**| Public civic endpoints declare `stale-while-revalidate` for sub-10ms perceived user latency. |
| 10 | **Background Purge**| FastAPI `BackgroundTasks` dispatch HTTP `PURGE` requests to edge caches on state mutation. |
| 11 | **Surrogate Keys** | Hierarchical categories tagged with `Surrogate-Key` to enable instant bulk edge invalidations. |
| 12 | **Client Deduplication**| Frontend hooks deduplicate concurrent requests for identical endpoints. |
| 13 | **In-Memory LRU** | Expensive report calculations cached in server-side thread-safe LRU cache with TTL limits. |
| 14 | **Observability** | Edge proxy metrics continuously monitor Cache Hit Ratio (CHR > 85%) and 304 response ratios. |
| 15 | **Nuclear Purge** | Automated operational scripts verified to flush edge cache zones during emergency rollbacks. |
