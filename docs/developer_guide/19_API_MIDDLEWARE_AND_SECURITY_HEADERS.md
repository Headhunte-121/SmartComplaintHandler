# Guide 19: Defensive HTTP: ASGI Middlewares, Security Headers, and Perimeter Protections

Welcome to the systems engineering manual for defensive HTTP architecture within the **SmartComplaintHandler** platform. In an automated civic infrastructure platform handling citizen grievances, municipal worker dispatches, and public records, the HTTP perimeter is the primary line of defense against denial of service, cross-site scripting, distributed session tampering, and malicious data exfiltration.

This guide details the internal mechanics of Asynchronous Server Gateway Interface (ASGI) middlewares, cryptographic and browser security headers, distributed correlation tracing, rate limiting algorithms, and perimeter defense layers.

---

## Prerequisites and Cross-Document Reference Map

To fully assimilate the engineering concepts presented herein, reference the following upstream architectural guides:
* [Guide 01: Python Language and Runtime Mechanics](01_PYTHON_LANGUAGE_AND_RUNTIME_MECHANICS.md) - Deep dive into Python's `asyncio` event loop, coroutines, and task scheduling primitives.
* [Guide 02: FastAPI ASGI Web Architecture](02_FASTAPI_ASGI_WEB_ARCHITECTURE.md) - ASGI specification details (`scope`, `receive`, `send`), request lifecycles, and Uvicorn worker internals.
* [Guide 03: Pydantic V2 Data Validation and Schemas](03_PYDANTIC_V2_DATA_VALIDATION_AND_SCHEMAS.md) - Schema validation and structured error generation modeled after RFC 7807 Problem Details.
* [Guide 09: Axios, Fetch and REST Protocols](09_AXIOS_FETCH_AND_REST_PROTOCOLS.md) - Client-side HTTP requests, CORS preflight negotiations, and Axios response interceptors.
* [Guide 12: Pytest and Automated Test Systems](12_PYTEST_AND_AUTOMATED_TEST_SYSTEMS.md) - Unit and integration testing strategies using Starlette's `TestClient`.
* [Guide 14: Python-Multipart and Streaming Uploads](14_PYTHON_MULTIPART_AND_STREAMING_UPLOADS.md) - Inbound request body stream ingestion and memory buffering constraints.

---

## Table of Contents
1. [Chapter 1: The Anatomy of an ASGI Middleware Pipeline](#chapter-1-the-anatomy-of-an-asgi-middleware-pipeline)
2. [Chapter 2: Starlette BaseHTTPMiddleware vs Pure ASGI `__call__(scope, receive, send)`](#chapter-2-starlette-basehttpmiddleware-vs-pure-asgi-__call__scope-receive-send)
3. [Chapter 3: Request Correlation & Distributed Tracing: The X-Request-ID Pattern](#chapter-3-request-correlation-distributed-tracing-the-x-request-id-pattern)
4. [Chapter 4: Structured Access Logging Middleware](#chapter-4-structured-access-logging-middleware)
5. [Chapter 5: Cross-Origin Resource Sharing (CORS) Deep Dive](#chapter-5-cross-origin-resource-sharing-cors-deep-dive)
6. [Chapter 6: Implementing Production CORS in FastAPI](#chapter-6-implementing-production-cors-in-fastapi)
7. [Chapter 7: HTTP Strict Transport Security (HSTS) & SSL/TLS Redirection Mechanics](#chapter-7-http-strict-transport-security-hsts-ssltls-redirection-mechanics)
8. [Chapter 8: Content Security Policy (CSP) & Defense-in-Depth Against Cross-Site Scripting (XSS)](#chapter-8-content-security-policy-csp-defense-in-depth-against-cross-site-scripting-xss)
9. [Chapter 9: Clickjacking Defense: `X-Frame-Options` and `frame-ancestors` Directives](#chapter-9-clickjacking-defense-x-frame-options-and-frame-ancestors-directives)
10. [Chapter 10: MIME Sniffing Mitigation: `X-Content-Type-Options: nosniff`](#chapter-10-mime-sniffing-mitigation-x-content-type-options-nosniff)
11. [Chapter 11: Privacy & Leaks: `Referrer-Policy` and `Permissions-Policy`](#chapter-11-privacy-leaks-referrer-policy-and-permissions-policy)
12. [Chapter 12: Building a Consolidated Security Headers Middleware](#chapter-12-building-a-consolidated-security-headers-middleware)
13. [Chapter 13: Denial-of-Service Defense: Request Body Size Limiting Middleware](#chapter-13-denial-of-service-defense-request-body-size-limiting-middleware)
14. [Chapter 14: Rate Limiting Architectures: Fixed Window, Sliding Window, Token Bucket, and Leaky Bucket Algorithms](#chapter-14-rate-limiting-architectures-fixed-window-sliding-window-token-bucket-and-leaky-bucket-algorithms)
15. [Chapter 15: In-Memory Token Bucket Rate Limiter with Client IP & Token Identification](#chapter-15-in-memory-token-bucket-rate-limiter-with-client-ip-token-identification)
16. [Chapter 16: Distributed Rate Limiting with Redis and Sliding Window Counter](#chapter-16-distributed-rate-limiting-with-redis-and-sliding-window-counter)
17. [Chapter 17: Uniform Exception Trapping & RFC 7807 Problem Details Middleware](#chapter-17-uniform-exception-trapping-rfc-7807-problem-details-middleware)
18. [Chapter 18: Client IP Resolution: Traversal of `X-Forwarded-For` and `X-Real-IP` Behind Reverse Proxies](#chapter-18-client-ip-resolution-traversal-of-x-forwarded-for-and-x-real-ip-behind-reverse-proxies)
19. [Chapter 19: Testing ASGI Middlewares with FastAPI TestClient](#chapter-19-testing-asgi-middlewares-with-fastapi-testclient)
20. [Chapter 20: Client-Side Defensive Integration: Axios Response Interceptors for `X-Request-ID` and 429 Retry-After](#chapter-20-client-side-defensive-integration-axios-response-interceptors-for-x-request-id-and-429-retry-after)
21. [Chapter 21: Operational Monitoring: Alerting on Rate Limit Violations and 5xx Spikes](#chapter-21-operational-monitoring-alerting-on-rate-limit-violations-and-5xx-spikes)
22. [Chapter 22: Defensive HTTP Production Readiness Checklist & OWASP Compliance Matrix](#chapter-22-defensive-http-production-readiness-checklist-owasp-compliance-matrix)

---

## Chapter 1: The Anatomy of an ASGI Middleware Pipeline

In the ASGI architecture ([Guide 02: FastAPI ASGI Web Architecture](02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)), an application is structured as a series of concentric wrapper functions forming an **onion-skin execution pipeline**. Every incoming client HTTP request traverses inward through the outer middlewares before reaching the FastAPI routing table; conversely, the generated HTTP response traverses back outward through the stack in reverse order.

```
Incoming Request ----> [ Middleware A (Ingress) ]
                            |
                       [ Middleware B (Ingress) ]
                            |
                       [ FastAPI Route Handler ] (Database Query / Computation)
                            |
                       [ Middleware B (Egress)  ]
                            |
<---- Outgoing Response [ Middleware A (Egress)  ]
```

### Pipeline Capabilities
Middlewares execute three distinct operations:
1. **Pre-Processing (Ingress)**: Inspect and sanitize incoming headers, validate Origin policies, resolve real client IP addresses, enforce body size caps, and inject correlation IDs.
2. **Short-Circuiting**: Terminate requests immediately without invoking downstream handlers (e.g., returning HTTP 429 Too Many Requests or HTTP 403 Forbidden).
3. **Post-Processing (Egress)**: Mutate outbound headers (e.g., appending HSTS or Content-Security-Policy headers), record latency metrics, and write structured access logs.

---

## Chapter 2: Starlette BaseHTTPMiddleware vs Pure ASGI `__call__(scope, receive, send)`

Developers building FastAPI applications typically encounter two approaches for authoring custom middleware:
1. Subclassing Starlette's `BaseHTTPMiddleware` and implementing `dispatch(request, call_next)`.
2. Authoring a **Pure ASGI Middleware** class implementing the async `__call__(scope, receive, send)` interface.

### The Hidden Costs of BaseHTTPMiddleware
While `BaseHTTPMiddleware` offers an ergonomic API utilizing high-level `Request` and `Response` objects, it introduces substantial runtime trade-offs:
* **Background Task Isolation**: It runs the downstream route handler in an isolated `anyio` task group, detaching context variables (`contextvars`) and breaking certain async generator lifecycles.
* **Streaming Response Buffering**: It can disrupt HTTP/2 chunked streaming and Server-Sent Events ([Guide 18: Real-Time Communication: WebSockets, SSE, and Resilient Polling Architecture](18_REALTIME_COMMUNICATION_WEBSOCKETS_SSE.md)) by attempting to buffer response chunks into memory before returning.
* **Overhead**: Allocates internal channels and coroutines per request, adding measurable memory pressure under thousands of concurrent requests per second.

### Pure ASGI Middleware Architecture
A pure ASGI middleware bypasses all intermediate allocations by operating directly on the ASGI protocol contract:

```python
from typing import Callable, Awaitable, Dict, Any  # Import typing primitives for ASGI signatures

class PureAsgiTimingMiddleware:  # High-performance zero-allocation ASGI timing middleware
    def __init__(self, app: Callable[[Dict[str, Any], Callable, Callable], Awaitable[None]]):  # Store next ASGI application
        self.app = app  # Retain reference to inner ASGI handler

    async def __call__(self, scope: Dict[str, Any], receive: Callable, send: Callable) -> None:  # Protocol entrypoint
        if scope["type"] != "http":  # Bypass non-HTTP protocols such as raw WebSockets or lifespan events
            await self.app(scope, receive, send)  # Forward non-HTTP scope directly to inner application
            return  # Exit early to avoid processing overhead

        import time  # Import time module for monotonic wall-clock delta calculation
        start_time = time.monotonic()  # Record high-resolution request start timestamp

        async def timing_send_wrapper(message: Dict[str, Any]) -> None:  # Intercept egress ASGI events
            if message["type"] == "http.response.start":  # Intercept HTTP header transmission event
                duration_ms = (time.monotonic() - start_time) * 1000.0  # Compute total processing latency in milliseconds
                headers = list(message.get("headers", []))  # Copy existing header tuples list
                headers.append((b"x-process-time-ms", f"{duration_ms:.2f}".encode("latin-1")))  # Append latency header
                message["headers"] = headers  # Replace header list with mutated version
            await send(message)  # Forward ASGI message to Uvicorn socket worker

        await self.app(scope, receive, timing_send_wrapper)  # Invoke downstream pipeline with wrapped sender
```

---

## Chapter 3: Request Correlation & Distributed Tracing: The X-Request-ID Pattern

In high-volume municipal complaint systems, diagnosing a failed transaction requires correlating logs across web proxies, ASGI workers, background cron jobs ([Guide 11: APScheduler and In-Process Jobs](11_APSCHEDULER_AND_IN_PROCESS_JOBS.md)), and database queries ([Guide 05: SQLAlchemy ORM and Data Layer](05_SQLALCHEMY_ORM_AND_DATA_LAYER.md)).

Without a unified identifier, debugging a transient 500 Internal Server Error amidst 10,000 concurrent logs is virtually impossible. The **Request Correlation Pattern** solves this:
1. If the client or upstream proxy sends an `X-Request-ID` header, validate and preserve it.
2. If missing, generate a new cryptographically random UUIDv4.
3. Store the correlation ID in Python's thread-safe / async-safe `contextvars.ContextVar`.
4. Inject `X-Request-ID` into the response headers so the citizen or client application can quote it during support escalations.

```python
import uuid  # Import UUID library for generating cryptographically random correlation identifiers
from contextvars import ContextVar  # Import context variables for async-safe request context propagation
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint  # Import middleware base classes
from starlette.requests import Request  # Import Starlette Request abstraction
from starlette.responses import Response  # Import Starlette Response abstraction

request_id_ctx_var: ContextVar[str] = ContextVar("request_id", default="")  # Async-safe context storage for request ID

class CorrelationIdMiddleware(BaseHTTPMiddleware):  # Enforce pervasive request tracking across system boundaries
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:  # Intercept request and response
        incoming_request_id = request.headers.get("x-request-id")  # Extract upstream correlation header if provided
        
        # Preserve upstream identifier if valid, otherwise generate new random UUIDv4 string
        correlation_id = incoming_request_id if incoming_request_id else str(uuid.uuid4())  # Establish correlation ID
        token = request_id_ctx_var.set(correlation_id)  # Bind correlation identifier to active asyncio context
        
        try:  # Enclose downstream processing to guarantee context cleanup and header injection
            response = await call_next(request)  # Delegate processing to inner application pipeline
            response.headers["x-request-id"] = correlation_id  # Inject correlation ID into outbound client response
            return response  # Deliver updated response back to caller
        finally:  # Ensure context variable token is reset upon request completion
            request_id_ctx_var.reset(token)  # Reset context variable to prevent cross-request contamination
```

---

## Chapter 4: Structured Access Logging Middleware

Standard text logs (`127.0.0.1 - "GET /api/v1/complaints" 200 OK`) are difficult to parse in log aggregators such as ElasticSearch, Loki, or Datadog. Modern systems require **Structured JSON Logging**, recording precise client IPs, request paths, HTTP verbs, response status codes, duration in milliseconds, and the `X-Request-ID`.

```python
import time  # Import time module for monotonic duration calculations
import json  # Import JSON serialization library for structured logging output
import logging  # Import standard logging module
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint  # Import base middleware primitives
from starlette.requests import Request  # Import Request wrapper
from starlette.responses import Response  # Import Response wrapper

logger = logging.getLogger("structured_access")  # Instantiate dedicated structured access logger

class StructuredAccessLoggingMiddleware(BaseHTTPMiddleware):  # Emit machine-readable access logs in JSON format
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:  # Process request telemetry
        start_time = time.monotonic()  # Capture precise start timestamp before handler execution
        client_host = request.client.host if request.client else "unknown"  # Extract connected client IP address
        method = request.method  # Record HTTP verb (GET, POST, PUT, DELETE)
        path = request.url.path  # Record request URL path
        
        try:  # Enclose handler execution to capture both successes and unhandled exceptions
            response = await call_next(request)  # Execute downstream route handler
            status_code = response.status_code  # Read final HTTP response status code
            return response  # Return response to client
        except Exception as exc:  # Intercept unhandled application exceptions
            status_code = 500  # Mark status code as internal server error
            raise exc  # Re-raise exception for downstream error trapping middlewares
        finally:  # Always emit structured log entry regardless of execution outcome
            duration_ms = (time.monotonic() - start_time) * 1000.0  # Calculate total execution duration in milliseconds
            log_record = {  # Construct structured JSON telemetry dictionary
                "timestamp": time.time(),  # Record Unix epoch timestamp
                "client_ip": client_host,  # Record client network IP
                "method": method,  # Record HTTP request method
                "path": path,  # Record targeted route path
                "status_code": status_code,  # Record HTTP status code
                "duration_ms": round(duration_ms, 2)  # Record execution time rounded to 2 decimal places
            }  # Finalize JSON payload
            logger.info(json.dumps(log_record))  # Emit serialized JSON log record to standard output
```

---

## Chapter 5: Cross-Origin Resource Sharing (CORS) Deep Dive

In modern web development, the React frontend runs on `http://localhost:5173` (served by Vite, [Guide 10: Vite and Modern Build Toolchains](10_VITE_AND_MODERN_BUILD_TOOLCHAINS.md)), while the FastAPI backend runs on `http://localhost:8000`. Because the origin (Scheme + Host + Port) differs, the browser's **Same-Origin Policy (SOP)** blocks the frontend from accessing responses unless the backend explicitly grants permission via **CORS (Cross-Origin Resource Sharing)** headers.

### The CORS Handshake Lifecycle
For non-simple HTTP requests (such as `POST` carrying `Content-Type: application/json` or requests with custom `Authorization` headers), the browser executes an automatic **Preflight Check** before transmitting the actual payload:

```
Browser (localhost:5173)              FastAPI (localhost:8000)
       |                                       |
       |--- OPTIONS /api/v1/complaints ------->| (Preflight Request)
       |    Origin: http://localhost:5173      |
       |    Access-Control-Request-Method: POST|
       |    Access-Control-Request-Headers:    |
       |      Authorization, Content-Type      |
       |                                       |
       |<-- 200 OK ----------------------------| (Preflight Response)
       |    Access-Control-Allow-Origin:       |
       |      http://localhost:5173            |
       |    Access-Control-Allow-Methods:      |
       |      POST, GET, OPTIONS               |
       |    Access-Control-Allow-Headers:      |
       |      Authorization, Content-Type      |
       |    Access-Control-Max-Age: 86400      |
       |                                       |
       |--- POST /api/v1/complaints ---------->| (Actual Request with Payload)
       |<-- 201 Created -----------------------|
```

### Critical CORS Rules
1. **Never use `allow_origins=["*"]` with `allow_credentials=True`**: Browsers reject any response containing `Access-Control-Allow-Origin: *` when credentials (cookies or HTTP basic auth) are attached.
2. **Preflight Caching (`Access-Control-Max-Age`)**: By returning `Access-Control-Max-Age: 86400`, the browser caches preflight permissions for 24 hours, eliminating thousands of redundant `OPTIONS` round-trips.

---

## Chapter 6: Implementing Production CORS in FastAPI

In FastAPI, Cross-Origin Resource Sharing is implemented via Starlette's `CORSMiddleware`. However, improper configuration can lead to security vulnerabilities or subtle production outages.

### Common Production CORS Pitfalls
1. **Trailing Slashes in Origins**: Configuring `allow_origins=["https://complaints.gov/"]` will fail because the browser sends `Origin: https://complaints.gov` (without trailing slash). CORS origin matching performs exact string equality.
2. **Dynamic Preview Deployments**: In staging environments (e.g., Vercel or Netlify preview URLs like `https://complaint-pr-42.vercel.app`), fixed origin lists break. Instead, use `allow_origin_regex` to safely match dynamic staging hostnames while prohibiting open wildcards.
3. **Exposed Response Headers**: By default, browsers restrict JavaScript from reading non-standard response headers. To allow the frontend to access `X-Request-ID` or `X-Process-Time-Ms`, they must be explicitly declared in `expose_headers`.

```python
from fastapi import FastAPI  # Import FastAPI application framework
from fastapi.middleware.cors import CORSMiddleware  # Import standard Starlette CORS middleware

app = FastAPI(title="ProductionCorsApp")  # Instantiate FastAPI application

# Configure rigorous origin policies balancing security and environment flexibility
app.add_middleware(  # Register CORS middleware into ASGI pipeline
    CORSMiddleware,  # Target Starlette CORS middleware class
    allow_origins=[  # Specify deterministic list of authorized production origins
        "http://localhost:5173",  # Local Vite development frontend
        "https://complaints.smartcity.gov",  # Production municipal portal domain
    ],  # Conclude static origins whitelist
    allow_origin_regex=r"^https:\/\/smart-complaint-.*\.vercel\.app$",  # Safely match branch preview deployments
    allow_credentials=True,  # Authorize cookies and Authorization headers in cross-origin requests
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  # Explicitly restrict permitted HTTP methods
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],  # Explicitly restrict authorized request headers
    expose_headers=["X-Request-ID", "X-Process-Time-Ms"],  # Allow browser JavaScript to read correlation telemetry
    max_age=86400  # Cache preflight permissions in browser for 24 hours to reduce latency
)  # Conclude middleware registration
```

---

## Chapter 7: HTTP Strict Transport Security (HSTS) & SSL/TLS Redirection Mechanics

When a citizen navigates to `http://complaints.smartcity.gov`, an unencrypted cleartext connection is initially established before the server redirects to `https://`. During this brief HTTP exchange, an attacker performing a Man-In-The-Middle (MITM) attack or ARP spoofing can intercept the session via **SSL Stripping**.

### The HSTS Header Defense
The `Strict-Transport-Security` header instructs the browser that the site must **only** be accessed via HTTPS for a designated time window. Subsequent visits automatically upgrade cleartext `http://` URLs to `https://` internally before sending any network packets:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

* `max-age=63072000`: Enforces HTTPS enforcement for 2 years (63,072,000 seconds).
* `includeSubDomains`: Extends the rule to all subdomains (e.g., `api.complaints.smartcity.gov`).
* `preload`: Authorizes inclusion in the Chrome/Firefox browser-hardcoded HSTS preload list, ensuring even the very first connection is made over TLS.

```python
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint  # Import middleware primitives
from starlette.requests import Request  # Import Request class
from starlette.responses import Response  # Import Response class

class StrictTransportSecurityMiddleware(BaseHTTPMiddleware):  # Enforce encrypted TLS communication
    def __init__(self, app, max_age: int = 63072000, include_subdomains: bool = True, preload: bool = True):  # Configure HSTS
        super().__init__(app)  # Initialize parent BaseHTTPMiddleware class
        directives = [f"max-age={max_age}"]  # Initialize directive list with mandatory max-age duration
        if include_subdomains:  # Append subdomain coverage flag if enabled
            directives.append("includeSubDomains")  # Extend TLS mandate to all municipal subdomains
        if preload:  # Append browser vendor preload flag if enabled
            directives.append("preload")  # Request inclusion in browser vendor preload databases
        self.hsts_header_value = "; ".join(directives)  # Build standardized semicolon-delimited header string

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:  # Process response headers
        response = await call_next(request)  # Delegate request execution to downstream route handlers
        # Only attach HSTS if request arrived over secure TLS channel or trusted secure proxy
        if request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https":  # Check HTTPS transport
            response.headers["Strict-Transport-Security"] = self.hsts_header_value  # Inject HSTS policy header
        return response  # Return secured HTTP response
```

---

## Chapter 8: Content Security Policy (CSP) & Defense-in-Depth Against Cross-Site Scripting (XSS)

Cross-Site Scripting (XSS) occurs when malicious JavaScript executes within a victim's browser session—often through unsanitized citizen complaint descriptions or injected file metadata ([Guide 14: Python-Multipart and Streaming Uploads](14_PYTHON_MULTIPART_AND_STREAMING_UPLOADS.md)).

While React provides robust baseline escaping ([Guide 07: React 18 and Virtual DOM Architecture](07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)), **Content Security Policy (CSP)** provides defense-in-depth at the browser parser layer. CSP restricts the origins from which scripts, stylesheets, images, and fonts can load or execute.

```python
from typing import Dict, List  # Import collection types for directive definitions

class ContentSecurityPolicyBuilder:  # Construct standardized Content-Security-Policy headers
    def __init__(self):  # Initialize empty directive policy map
        self._directives: Dict[str, List[str]] = {}  # Map CSP directive names to allowed origin sources

    def add_directive(self, directive_name: str, *sources: str) -> "ContentSecurityPolicyBuilder":  # Add source whitelist
        if directive_name not in self._directives:  # Verify if directive exists in dictionary
            self._directives[directive_name] = []  # Allocate empty source array for new directive
        self._directives[directive_name].extend(sources)  # Append authorized origin sources to directive
        return self  # Enable fluent builder chaining

    def build(self) -> str:  # Assemble directives into formatted CSP header value
        tokens = []  # Store individual directive declaration strings
        for directive, sources in self._directives.items():  # Iterate across configured directives
            tokens.append(f"{directive} {' '.join(sources)}")  # Format directive name with space-delimited sources
        return "; ".join(tokens)  # Return completed semicolon-delimited policy string

def get_default_complaint_csp() -> str:  # Generate baseline CSP policy for SmartComplaintHandler
    builder = ContentSecurityPolicyBuilder()  # Instantiate policy builder
    builder.add_directive("default-src", "'self'")  # Restrict unclassified resources to same-origin only
    builder.add_directive("script-src", "'self'")  # Strictly prohibit inline script tags and remote unapproved CDNs
    builder.add_directive("style-src", "'self'", "'unsafe-inline'")  # Permit inline Tailwind CSS style blocks
    builder.add_directive("img-src", "'self'", "data:", "blob:")  # Authorize local images and attachment previews
    builder.add_directive("font-src", "'self'", "data:")  # Authorize local typography and embedded vector fonts
    builder.add_directive("connect-src", "'self'", "ws:", "wss:")  # Authorize REST APIs and WebSocket endpoints
    builder.add_directive("frame-ancestors", "'none'")  # Prohibit framing in any iframe (clickjacking defense)
    return builder.build()  # Return compiled policy header
```

---

## Chapter 9: Clickjacking Defense: `X-Frame-Options` and `frame-ancestors` Directives

Clickjacking is an attack where a malicious website embeds the municipal portal inside an invisible `<iframe>` overlaying an innocuous game or button. When an authenticated supervisor clicks the decoy, they inadvertently trigger high-privilege municipal actions (such as dismissing a formal corruption complaint).

### Defense-in-Depth Framing Controls
Modern browsers provide two complementary headers to prevent framing:
1. **`X-Frame-Options: DENY`**: Legacy HTTP header supported across all browsers preventing any embedding.
2. **CSP `frame-ancestors 'none'`**: Modern, granular standard defined in CSP Level 2 that supersedes `X-Frame-Options` where supported.

Both headers should be delivered simultaneously to protect legacy and modern browser clients:

```python
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint  # Import middleware base classes
from starlette.requests import Request  # Import Request class
from starlette.responses import Response  # Import Response class

class AntiClickjackingMiddleware(BaseHTTPMiddleware):  # Prevent unauthorized iframe embedding
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:  # Inject framing protections
        response = await call_next(request)  # Process request downstream
        response.headers["X-Frame-Options"] = "DENY"  # Reject all framing attempts across legacy browsers
        return response  # Return protected HTTP response
```

---

## Chapter 10: MIME Sniffing Mitigation: `X-Content-Type-Options: nosniff`

When a citizen uploads a file (e.g., an attachment named `photo.jpg`), legacy or lax browsers might inspect the first few bytes of the file rather than trusting the server's `Content-Type: image/jpeg` header. If the file contains HTML or `<script>` tags, the browser might "sniff" the file as `text/html` and execute the payload within the municipal domain context!

The `X-Content-Type-Options: nosniff` header strictly commands the browser to **respect the server-declared MIME type**:

```http
X-Content-Type-Options: nosniff
```

If the server sends `Content-Type: application/octet-stream` or `image/png`, the browser refuses to execute it as JavaScript or HTML, neutralizing drive-by upload exploits ([Guide 14: Python-Multipart and Streaming Uploads](14_PYTHON_MULTIPART_AND_STREAMING_UPLOADS.md)).

---

## Chapter 11: Privacy & Leaks: `Referrer-Policy` and `Permissions-Policy`

In addition to injection defenses, modern defensive HTTP architectures enforce client privacy and hardware isolation:

### Referrer-Policy
When a user clicks a link from `https://complaints.smartcity.gov/tickets/CMP-904` to an external contractor site, the browser's default behavior might include the entire path in the `Referer` header. This leaks private complaint tracking tokens and citizen identifiers.
* Enforce **`Referrer-Policy: strict-origin-when-cross-origin`**: For same-origin requests, full URL paths are retained; for cross-origin HTTPS requests, only the origin (`https://complaints.smartcity.gov`) is sent; for downgrades to unencrypted HTTP, no referrer is sent.

### Permissions-Policy (Feature-Policy)
The `Permissions-Policy` header explicitly disables access to sensitive browser hardware APIs (camera, microphone, accelerometer, USB, payment requests) unless explicitly required:

```http
Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=()
```
By declaring `camera=()`, even if a rogue dependency or malicious advertisement executes in the DOM, the browser strictly denies access to the citizen's web camera.

---

## Chapter 12: Building a Consolidated Security Headers Middleware

Registering five separate middlewares adds unnecessary stack depth and CPU allocations. Instead, we combine all defensive headers into a single high-performance **Consolidated Security Headers Middleware**:

```python
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint  # Import middleware base classes
from starlette.requests import Request  # Import Request abstraction
from starlette.responses import Response  # Import Response abstraction
from typing import Dict  # Import dictionary typing

class ConsolidatedSecurityHeadersMiddleware(BaseHTTPMiddleware):  # Inject enterprise defensive headers
    def __init__(self, app, csp_policy: str, enable_hsts: bool = True):  # Initialize with custom CSP policy
        super().__init__(app)  # Initialize parent BaseHTTPMiddleware class
        self.enable_hsts = enable_hsts  # Flag controlling HSTS header injection
        self.static_headers: Dict[str, str] = {  # Pre-compute static header dictionary for rapid iteration
            "Content-Security-Policy": csp_policy,  # Restrict unauthorized script and asset execution
            "X-Frame-Options": "DENY",  # Neutralize clickjacking attempts
            "X-Content-Type-Options": "nosniff",  # Prevent MIME sniffing exploits
            "Referrer-Policy": "strict-origin-when-cross-origin",  # Protect URL paths from cross-origin leaks
            "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=()",  # Restrict device APIs
            "X-XSS-Protection": "0",  # Disable legacy buggy XSS filters in favor of robust CSP
        }  # Conclude header map definition

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:  # Process response
        response = await call_next(request)  # Delegate processing to inner application pipeline
        
        # Inject all pre-computed baseline security headers in a single loop
        for header_name, header_val in self.static_headers.items():  # Iterate across static security headers
            response.headers[header_name] = header_val  # Set header value on outbound HTTP response
            
        # Conditionally attach HSTS if transport is secure
        if self.enable_hsts and (request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"):  # HTTPS check
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"  # Attach HSTS
            
        return response  # Return fully hardened HTTP response
```

---

## Chapter 13: Denial-of-Service Defense: Request Body Size Limiting Middleware

A malicious client can initiate an HTTP `POST` upload with a stream of 10 Gigabytes of zeroed bytes. If the backend attempts to read this unconstrained stream into memory or disk ([Guide 14: Python-Multipart and Streaming Uploads](14_PYTHON_MULTIPART_AND_STREAMING_UPLOADS.md)), the server experiences disk exhaustion or memory death.

A pure ASGI middleware provides the fastest defense by reading the `content-length` header upfront and tracking incoming byte chunks during ingestion, immediately terminating the connection with `HTTP 413 (Payload Too Large)`:

```python
from starlette.responses import JSONResponse  # Import JSONResponse for fast structured error delivery
from typing import Callable, Dict, Any  # Import typing primitives for ASGI protocol

class RequestSizeLimitMiddleware:  # Enforce hard byte limits on incoming HTTP request payloads
    def __init__(self, app: Callable, max_bytes: int = 10 * 1024 * 1024):  # Default 10 MB payload ceiling
        self.app = app  # Retain inner ASGI application
        self.max_bytes = max_bytes  # Store maximum permissible body size in bytes

    async def __call__(self, scope: Dict[str, Any], receive: Callable, send: Callable) -> None:  # ASGI execution entrypoint
        if scope["type"] != "http":  # Pass through non-HTTP scopes
            await self.app(scope, receive, send)  # Delegate to downstream application
            return  # Exit early

        # 1. Fast-path: Check declared Content-Length header
        headers = dict(scope.get("headers", []))  # Extract header tuples into dictionary
        content_length_header = headers.get(b"content-length")  # Retrieve content-length byte value
        if content_length_header:  # Validate if header is present
            try:  # Enclose integer parsing
                declared_length = int(content_length_header.decode("latin-1"))  # Decode header to integer
                if declared_length > self.max_bytes:  # Compare declared size against maximum limit
                    response = JSONResponse(  # Construct error response
                        {"error": "Payload Too Large", "max_bytes": self.max_bytes},  # Include diagnostic metadata
                        status_code=413  # Return standard HTTP 413 status
                    )  # Finalize JSONResponse
                    await response(scope, receive, send)  # Deliver error directly to client
                    return  # Terminate request processing immediately
            except ValueError:  # Handle malformed non-integer header values
                pass  # Fall through to dynamic chunk counter

        # 2. Dynamic stream counter for chunked transfers without Content-Length
        received_bytes = 0  # Initialize cumulative byte counter

        async def guarded_receive() -> Dict[str, Any]:  # Wrap ASGI receive callable
            nonlocal received_bytes  # Mutate outer byte counter
            message = await receive()  # Await next chunk from Uvicorn socket
            if message["type"] == "http.request":  # Inspect incoming request chunk
                body_chunk = message.get("body", b"")  # Extract chunk bytes
                received_bytes += len(body_chunk)  # Accumulate chunk size
                if received_bytes > self.max_bytes:  # Check if cumulative bytes exceed maximum
                    raise ValueError("Payload size exceeded configured limit during streaming")  # Trigger abort
            return message  # Return valid chunk to parser

        try:  # Guard inner application execution against size violations
            await self.app(scope, guarded_receive, send)  # Execute pipeline with guarded receiver
        except ValueError:  # Intercept stream size threshold breach
            response = JSONResponse({"error": "Payload Too Large during streaming"}, status_code=413)  # Create 413
            await response(scope, receive, send)  # Send error response to client
```

---

## Chapter 14: Rate Limiting Architectures: Fixed Window, Sliding Window, Token Bucket, and Leaky Bucket Algorithms

Unconstrained APIs invite credential stuffing, ticket spamming, and denial of service. To prevent resource starvation, backend architects evaluate four foundational rate-limiting algorithms:

```
+---------------------+-------------------------------+-----------------------------------+
| Algorithm           | Mechanics                     | Trade-offs                        |
+---------------------+-------------------------------+-----------------------------------+
| Fixed Window        | Resets counter at interval T  | Vulnerable to 2x burst at boundary|
| Sliding Window Log  | Stores exact request timestamps| High memory usage (stores timestamps)|
| Sliding Window Ctr  | Blends previous and current T | Highly efficient, minimal error   |
| Token Bucket        | Refills tokens at constant rate| Allows controlled bursts, smooth  |
| Leaky Bucket        | FIFO queue drains at steady rate| Drops bursts, smoothest egress    |
+---------------------+-------------------------------+-----------------------------------+
```

### The Token Bucket Algorithm
The Token Bucket is optimal for web APIs because it accommodates natural human bursts (e.g., submitting a complaint with multiple image attachments) while bounding the long-term consumption rate:
* A bucket holds up to $B$ tokens (Capacity).
* Tokens are replenished continuously at a rate of $R$ tokens per second.
* Each incoming HTTP request consumes 1 token. If tokens remain $\ge 1$, the request proceeds. If $0$, it is rejected with HTTP 429.

---

## Chapter 15: In-Memory Token Bucket Rate Limiter with Client IP & Token Identification

For single-instance deployments, an in-memory token bucket provides microsecond-speed rate limiting without requiring external infrastructure:

```python
import time  # Import time module for monotonic timestamp delta calculations
from typing import Dict, Tuple  # Import typing primitives for cache storage
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint  # Import middleware base classes
from starlette.requests import Request  # Import Request abstraction
from starlette.responses import JSONResponse, Response  # Import Response abstractions

class InMemoryTokenBucketLimiter(BaseHTTPMiddleware):  # Microsecond rate limiting for single instances
    def __init__(self, app, rate_per_sec: float = 5.0, capacity: float = 20.0):  # Configure rate and capacity
        super().__init__(app)  # Initialize base class
        self.rate = rate_per_sec  # Tokens added per second
        self.capacity = capacity  # Maximum bucket capacity
        # Map client identifier (IP) -> (current_tokens, last_update_timestamp)
        self.buckets: Dict[str, Tuple[float, float]] = {}  # In-memory token storage

    def _consume_token(self, client_id: str) -> bool:  # Evaluate and decrement client token count
        now = time.monotonic()  # Read current monotonic timestamp
        if client_id not in self.buckets:  # Initialize bucket for first-time client
            self.buckets[client_id] = (self.capacity - 1.0, now)  # Consume 1 token and record timestamp
            return True  # Request accepted

        tokens, last_time = self.buckets[client_id]  # Unpack existing bucket state
        elapsed = now - last_time  # Compute seconds elapsed since last update
        # Replenish tokens based on elapsed duration, capped at maximum bucket capacity
        tokens = min(self.capacity, tokens + (elapsed * self.rate))  # Calculate refreshed token count

        if tokens >= 1.0:  # Check if sufficient tokens are available
            self.buckets[client_id] = (tokens - 1.0, now)  # Deduct 1 token and update timestamp
            return True  # Request accepted
        else:  # Insufficient tokens available
            self.buckets[client_id] = (tokens, now)  # Update timestamp without deducting tokens
            return False  # Request rejected

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:  # Process request
        client_ip = request.client.host if request.client else "127.0.0.1"  # Extract client IP address
        if not self._consume_token(client_ip):  # Attempt token deduction
            return JSONResponse(  # Return HTTP 429 Too Many Requests response
                {"error": "Rate limit exceeded", "detail": "Please slow down your requests"},  # Error detail
                status_code=429,  # Standard HTTP 429 status code
                headers={"Retry-After": "2"}  # Instruct client to wait 2 seconds before retrying
            )  # Conclude 429 response
        return await call_next(request)  # Delegate request to downstream route handler
```

---

## Chapter 16: Distributed Rate Limiting with Redis and Sliding Window Counter

In a multi-worker cluster ([Guide 18: Real-Time Communication: WebSockets, SSE, and Resilient Polling Architecture](18_REALTIME_COMMUNICATION_WEBSOCKETS_SSE.md)), an in-memory bucket fails because requests from a client are load-balanced across multiple processes. A single client could bypass limits by spreading requests across all four workers.

To solve this, we implement a **Distributed Sliding Window Counter** using Redis Sorted Sets (`ZSET`):

```python
import time  # Import time module for millisecond epoch calculations
from typing import Optional  # Import optional typing

class RedisSlidingWindowRateLimiter:  # Enforce cluster-wide rate limits across multi-worker deployments
    def __init__(self, redis_client, max_requests: int = 60, window_seconds: int = 60):  # Configure limit window
        self.redis = redis_client  # Async Redis client instance
        self.max_requests = max_requests  # Maximum permissible requests per window
        self.window_seconds = window_seconds  # Window duration in seconds

    async def is_rate_limited(self, client_id: str) -> bool:  # Check and record request in Redis sorted set
        now = time.time()  # Current Unix timestamp in seconds
        clear_before = now - self.window_seconds  # Calculate threshold for expired window timestamps
        key = f"rate_limit:{client_id}"  # Build Redis key for target client identifier

        pipeline = self.redis.pipeline()  # Open atomic Redis command pipeline
        pipeline.zremrangebyscore(key, 0, clear_before)  # Prune expired timestamps older than window threshold
        pipeline.zadd(key, {str(now): now})  # Add current request timestamp to sorted set
        pipeline.zcard(key)  # Query count of requests within active rolling window
        pipeline.expire(key, self.window_seconds + 1)  # Set TTL to ensure unused keys self-prune

        results = await pipeline.execute()  # Atomically execute all batched operations
        current_request_count = results[2]  # Extract zcard count from pipeline execution results

        return current_request_count > self.max_requests  # Return True if client exceeded limit
```

---

## Chapter 17: Uniform Exception Trapping & RFC 7807 Problem Details Middleware

When an unexpected exception occurs inside a route handler (e.g., database connection timeout or null pointer), returning a raw Python traceback (`Traceback (most recent call last)...`) exposes sensitive server paths, library versions, and database schemas to attackers.

### The RFC 7807 Standard
RFC 7807 specifies the `application/problem+json` media type for standardized, machine-readable API error messages:
* `type`: URI reference identifying the error type category.
* `title`: Short human-readable summary of the problem.
* `status`: HTTP status code.
* `detail`: Specific explanation of the occurrence.
* `instance`: URI of the endpoint invoked.
* `request_id`: Attached correlation identifier ([Chapter 3: Request Correlation & Distributed Tracing: The X-Request-ID Pattern](#chapter-3-request-correlation-distributed-tracing-the-x-request-id-pattern)).

```python
import traceback  # Import traceback module for internal diagnostic logging
import logging  # Import logging framework
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint  # Import middleware classes
from starlette.requests import Request  # Import Request class
from starlette.responses import JSONResponse, Response  # Import response abstractions

logger = logging.getLogger("exception_trapping")  # Instantiate dedicated exception logger

class UniformExceptionMiddleware(BaseHTTPMiddleware):  # Sanitize errors into standardized RFC 7807 payloads
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:  # Catch all errors
        try:  # Enclose route execution pipeline
            return await call_next(request)  # Process request normally
        except Exception as unhandled_err:  # Intercept all uncaught application exceptions
            correlation_id = request.headers.get("x-request-id", "unknown")  # Retrieve request correlation ID
            # Log full stack trace internally with correlation ID for engineer debugging
            logger.error(f"Unhandled Exception [ID: {correlation_id}]: {unhandled_err}\n{traceback.format_exc()}")  # Log
            
            # Deliver sanitized machine-readable error payload without leaking internal implementation details
            return JSONResponse(  # Return RFC 7807 Problem Details response
                status_code=500,  # Standard HTTP 500 Internal Server Error
                media_type="application/problem+json",  # Standard RFC 7807 MIME content type
                content={  # Structure problem details dictionary
                    "type": "https://complaints.smartcity.gov/errors/internal-server-error",  # Problem URI
                    "title": "Internal Server Error",  # Generic problem title
                    "status": 500,  # Explicit status code
                    "detail": "An unexpected error occurred while processing your request.",  # Safe user message
                    "instance": request.url.path,  # URI path of invoked endpoint
                    "request_id": correlation_id  # Correlation identifier for citizen support inquiries
                }  # Finalize problem payload
            )  # Conclude JSONResponse instantiation
```

---

## Chapter 18: Client IP Resolution: Traversal of `X-Forwarded-For` and `X-Real-IP` Behind Reverse Proxies

When deployed behind an NGINX reverse proxy, Cloudflare, or AWS Application Load Balancer, the TCP socket connects directly between Uvicorn and the proxy. Consequently, `request.client.host` reports the proxy's IP (such as `127.0.0.1` or `10.0.0.15`).

If rate limiting or geolocation relies directly on `request.client.host`, **all citizens sharing the load balancer get grouped into a single bucket**, leading to catastrophic false-positive rate limit blocks!

### The X-Forwarded-For Traversal Header
The `X-Forwarded-For` header contains a comma-separated list of IP addresses:

```http
X-Forwarded-For: <client_ip>, <untrusted_proxy>, <trusted_load_balancer>
```

A malicious client can forge fake IPs by injecting their own `X-Forwarded-For: 8.8.8.8` header. To prevent IP spoofing, the backend must resolve the client IP by inspecting the header from **right to left**, stripping known trusted proxies:

```python
from typing import List, Set  # Import list and set types for IP whitelisting
from starlette.requests import Request  # Import Request abstraction

class TrustedProxyResolver:  # Safely extract genuine client IP through reverse proxy chains
    def __init__(self, trusted_proxies: Set[str]):  # Configure set of trusted proxy IP addresses
        self.trusted_proxies = trusted_proxies  # Store trusted reverse proxy IP set

    def resolve_client_ip(self, request: Request) -> str:  # Safely parse genuine origin IP
        socket_ip = request.client.host if request.client else "127.0.0.1"  # Read direct socket IP
        
        # If the connecting socket is not a trusted proxy, trust only the direct socket connection
        if socket_ip not in self.trusted_proxies:  # Check if socket IP is external/untrusted
            return socket_ip  # Return direct socket IP to prevent spoofing
            
        forwarded_for = request.headers.get("x-forwarded-for")  # Extract upstream proxy chain header
        if not forwarded_for:  # Check if forwarding header is missing
            return socket_ip  # Fall back to socket IP
            
        # Parse IPs from right to left, stripping trusted intermediate proxies
        hop_ips: List[str] = [ip.strip() for ip in forwarded_for.split(",")]  # Split comma-delimited hops
        for hop in reversed(hop_ips):  # Traverse proxy hops from nearest to furthest
            if hop not in self.trusted_proxies:  # Identify first untrusted hop in chain
                return hop  # Return validated genuine client IP
                
        return socket_ip  # Fallback return when all hops are trusted
```

---

## Chapter 19: Testing ASGI Middlewares with FastAPI TestClient

Thorough automated testing guarantees that security middlewares correctly inject headers, reject oversized bodies, and enforce rate limits without false positives ([Guide 12: Pytest and Automated Test Systems](12_PYTEST_AND_AUTOMATED_TEST_SYSTEMS.md)):

```python
import pytest  # Import pytest framework for test declarations
from fastapi import FastAPI  # Import FastAPI application class
from fastapi.testclient import TestClient  # Import Starlette TestClient for synchronous HTTP testing
from starlette.middleware.base import BaseHTTPMiddleware  # Import BaseHTTPMiddleware for test harness

test_app = FastAPI(title="MiddlewareHarness")  # Initialize isolated test application

class TestSecurityHeaderMiddleware(BaseHTTPMiddleware):  # Test middleware injecting target security headers
    async def dispatch(self, request, call_next):  # Process test request
        response = await call_next(request)  # Delegate downstream
        response.headers["X-Content-Type-Options"] = "nosniff"  # Set MIME sniffing defense header
        response.headers["X-Frame-Options"] = "DENY"  # Set anti-clickjacking header
        return response  # Return modified response

test_app.add_middleware(TestSecurityHeaderMiddleware)  # Register test middleware

@test_app.get("/ping")  # Declare test route
def ping_endpoint():  # Route handler returning success message
    return {"status": "ok"}  # Deliver standard test dictionary

def test_security_headers_injected_successfully():  # Verify headers presence in response
    client = TestClient(test_app)  # Instantiate test client
    response = client.get("/ping")  # Issue GET request to test route
    assert response.status_code == 200  # Assert HTTP status OK
    assert response.headers.get("x-content-type-options") == "nosniff"  # Verify nosniff header
    assert response.headers.get("x-frame-options") == "DENY"  # Verify DENY header
```

---

## Chapter 20: Client-Side Defensive Integration: Axios Response Interceptors for `X-Request-ID` and 429 Retry-After

On the client side ([Guide 09: Axios, Fetch and REST Protocols](09_AXIOS_FETCH_AND_REST_PROTOCOLS.md)), the frontend must cooperate with defensive backend middlewares:
1. Preserve and log `X-Request-ID` returned by the server.
2. Intercept `HTTP 429 Too Many Requests` responses, read the `Retry-After` header, and gracefully handle backoff before retrying or alerting the user.

```javascript
import axios from 'axios'; // Import Axios HTTP client library

export const secureApiClient = axios.create({ // Instantiate configured Axios client
  baseURL: '/api/v1', // Base API routing path
  timeout: 10000, // Enforce 10-second request timeout
}); // Conclude Axios instance configuration

// Response interceptor inspecting defensive headers and handling rate-limiting
secureApiClient.interceptors.response.use( // Attach response interceptor
  (response) => { // Handle successful HTTP 2xx responses
    const serverRequestId = response.headers['x-request-id']; // Extract correlation identifier
    if (serverRequestId) { // Check if server delivered correlation ID
      sessionStorage.setItem('last_server_request_id', serverRequestId); // Cache identifier for support modal
    } // Conclude correlation caching
    return response; // Return response to caller
  }, // Conclude success handler
  async (error) => { // Intercept non-2xx HTTP errors
    if (error.response && error.response.status === 429) { // Detect rate-limiting 429 response
      const retryAfterSeconds = parseInt(error.response.headers['retry-after'] || '5', 10); // Parse Retry-After
      console.warn(`Rate limited by server. Recommended wait: ${retryAfterSeconds} seconds`); // Log warning
      // Attach parsed wait duration to error object for reactive UI countdown display
      error.retryAfter = retryAfterSeconds; // Enrich error instance with wait duration
    } // Conclude rate limit handling
    return Promise.reject(error); // Reject promise to trigger catch handlers
  } // Conclude error handler
); // Conclude interceptor registration
```

---

## Chapter 21: Operational Monitoring: Alerting on Rate Limit Violations and 5xx Spikes

Maintaining a defensive perimeter requires real-time observability into rejection trends. A sudden spike in HTTP 429s signals either a distributed bot attack or an overly aggressive rate-limit policy impacting legitimate citizens. Similarly, a surge in HTTP 413s indicates an ongoing buffer-exhaustion campaign.

```python
from collections import Counter  # Import Counter collection for telemetry tallying
from typing import Dict, Any  # Import typing primitives for metrics export

class SecurityTelemetryTracker:  # Aggregate defensive HTTP security events and rejection telemetry
    def __init__(self):  # Initialize metric counters
        self.blocked_rate_limits = Counter()  # Track rate-limited requests keyed by client IP or route
        self.rejected_payload_sizes = 0  # Count of HTTP 413 oversized body rejections
        self.cors_rejections = 0  # Count of unauthorized cross-origin requests
        self.server_errors = 0  # Count of unhandled 500 exceptions

    def record_rate_limit(self, client_ip: str) -> None:  # Increment rate-limit block metric
        self.blocked_rate_limits[client_ip] += 1  # Increment tally for offending client IP

    def record_payload_too_large(self) -> None:  # Increment body size rejection metric
        self.rejected_payload_sizes += 1  # Increment 413 rejection counter

    def record_server_error(self) -> None:  # Increment 500 internal server error metric
        self.server_errors += 1  # Increment 500 exception counter

    def export_metrics(self) -> Dict[str, Any]:  # Export snapshot for Prometheus or health dashboards
        return {  # Construct telemetry dictionary
            "rate_limit_blocks_total": sum(self.blocked_rate_limits.values()),  # Cumulative rate limit rejections
            "payload_size_rejections_total": self.rejected_payload_sizes,  # Total oversized payloads blocked
            "server_errors_5xx_total": self.server_errors,  # Total unhandled server exceptions
            "top_rate_limited_ips": self.blocked_rate_limits.most_common(5)  # Top 5 most throttled IP addresses
        }  # Return telemetry dictionary
```

---

## Chapter 22: Defensive HTTP Production Readiness Checklist & OWASP Compliance Matrix

Before promoting any API or municipal service to public internet exposure, verify compliance against this 15-point perimeter defense checklist:

| Check # | Category | Defense Mechanism & Technical Requirement |
|:---|:---|:---|
| 1 | **HSTS** | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` enforced on all TLS responses. |
| 2 | **Clickjacking** | `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` delivered simultaneously. |
| 3 | **MIME Sniffing** | `X-Content-Type-Options: nosniff` attached to all responses, including file downloads. |
| 4 | **CSP** | Content-Security-Policy disallows unapproved script domains and restricts inline script execution. |
| 5 | **Privacy** | `Referrer-Policy: strict-origin-when-cross-origin` configured to prevent path data leaks. |
| 6 | **Device Isolation** | `Permissions-Policy` explicitly disables camera, microphone, and sensitive sensors. |
| 7 | **CORS Whitelist** | Deterministic allowed origin lists enforced; wildcard `*` with credentials strictly prohibited. |
| 8 | **Preflight Cache** | `Access-Control-Max-Age: 86400` declared to minimize preflight round-trip latency. |
| 9 | **Tracing** | `X-Request-ID` generated or propagated, bound to `contextvars`, and included in response headers. |
| 10 | **Access Logs** | Structured JSON access logs record client IP, method, path, status, and latency duration in ms. |
| 11 | **Error Sanitization**| RFC 7807 Problem Details delivered on 500 errors; internal Python tracebacks never exposed. |
| 12 | **Body Size Limits** | Inbound HTTP request body sizes strictly capped at 10 MB to prevent memory exhaustion DoS. |
| 13 | **Rate Limiting** | Token bucket or sliding window rate limiting applied to login, ticket creation, and search routes. |
| 14 | **Proxy Resolution** | Genuine client IPs resolved by traversing `X-Forwarded-For` from trusted upstream proxies only. |
| 15 | **Client Backoff** | Frontend Axios interceptors inspect `Retry-After` headers and delay requests on HTTP 429. |
