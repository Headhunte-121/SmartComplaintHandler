# Guide 01B: HTTP Network Protocols, TCP Sockets, and Wire Framing Mechanics

Welcome to the foundational systems engineering manual for computer networking, transport-layer sockets, and HTTP wire framing within the **SmartComplaintHandler** ecosystem. 

Before building asynchronous web servers with FastAPI ([Guide 02: FastAPI ASGI Web Architecture](02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)), dispatching HTTP mutations with Axios ([Guide 09: Axios, Fetch and REST Protocols](09_AXIOS_FETCH_AND_REST_PROTOCOLS.md)), or tuning reverse proxy caching layers ([Guide 21: HTTP Caching, Conditional Requests & Reverse Proxies](21_HTTP_CACHING_AND_REVERSE_PROXIES.md)), every systems engineer must understand the physical and electrical transport foundations that move bits across network interfaces.

This manual establishes the foundational mechanics of the TCP/IP stack, socket programming, byte-level request/response parsing, and the RFC specifications governing the modern web.

---

## Prerequisites and Cross-Document Reference Map

This manual serves as the direct prerequisite for all network and web communication manuals across the repository:
* [Guide 01: Python Language and Runtime Mechanics](01_PYTHON_LANGUAGE_AND_RUNTIME_MECHANICS.md) - Core Python data types, bytes, strings, and context managers.
* [Guide 02: FastAPI ASGI Web Architecture](02_FASTAPI_ASGI_WEB_ARCHITECTURE.md) - How Uvicorn translates raw TCP streams into ASGI scope dictionaries.
* [Guide 09: Axios, Fetch and REST Protocols](09_AXIOS_FETCH_AND_REST_PROTOCOLS.md) - Client-side HTTP abstractions built upon these wire foundations.
* [Guide 14: Python-Multipart and Streaming Uploads](14_PYTHON_MULTIPART_AND_STREAMING_UPLOADS.md) - Parsing multipart MIME boundaries over TCP streams.
* [Guide 18: Real-Time Communication: WebSockets, SSE, and Resilient Polling Architecture](18_REALTIME_COMMUNICATION_WEBSOCKETS_SSE.md) - Protocol upgrades from HTTP/1.1 to persistent full-duplex TCP streams.
* [Guide 19: Defensive HTTP: ASGI Middlewares, Security Headers, and Perimeter Protections](19_API_MIDDLEWARE_AND_SECURITY_HEADERS.md) - Defensive header injection and perimeter protection.
* [Guide 21: HTTP Caching, Conditional Requests & Reverse Proxies](21_HTTP_CACHING_AND_REVERSE_PROXIES.md) - HTTP validation, ETags, and 304 Not Modified mechanics.

---

## Table of Contents
1. [Chapter 1: The Computer Networking Hierarchy: Physical Links to Application Protocols](#chapter-1-the-computer-networking-hierarchy-physical-links-to-application-protocols)
2. [Chapter 2: The Transport Layer: TCP Reliability, Ports, and Socket Bindings](#chapter-2-the-transport-layer-tcp-reliability-ports-and-socket-bindings)
3. [Chapter 3: The TCP Three-Way Handshake and Connection Teardown](#chapter-3-the-tcp-three-way-handshake-and-connection-teardown)
4. [Chapter 4: Sockets in Python: Low-Level `socket` Programming and Byte Transmission](#chapter-4-sockets-in-python-low-level-socket-programming-and-byte-transmission)
5. [Chapter 5: The Uniform Resource Identifier (URI) Anatomy: Scheme, Host, Port, Path, and Query](#chapter-5-the-uniform-resource-identifier-uri-anatomy-scheme-host-port-path-and-query)
6. [Chapter 6: The HTTP/1.1 Wire Protocol: Request Line, Headers, and Delimiters](#chapter-6-the-http11-wire-protocol-request-line-headers-and-delimiters)
7. [Chapter 7: HTTP Verbs & Semantic Contracts](#chapter-7-http-verbs-semantic-contracts)
8. [Chapter 8: Safe vs Idempotent HTTP Methods: Architectural Axioms in REST](#chapter-8-safe-vs-idempotent-http-methods-architectural-axioms-in-rest)
9. [Chapter 9: The Anatomy of an HTTP Response: Status Line, Headers, and Payload](#chapter-9-the-anatomy-of-an-http-response-status-line-headers-and-payload)
10. [Chapter 10: The HTTP Status Code Taxonomy: 1xx, 2xx, 3xx, 4xx, and 5xx Semantics](#chapter-10-the-http-status-code-taxonomy-1xx-2xx-3xx-4xx-and-5xx-semantics)
11. [Chapter 11: Content Negotiation and MIME Media Types (`Content-Type`, `Accept`)](#chapter-11-content-negotiation-and-mime-media-types-content-type-accept)
12. [Chapter 12: Persistent TCP Connections & HTTP Keep-Alive Mechanics](#chapter-12-persistent-tcp-connections-http-keep-alive-mechanics)
13. [Chapter 13: Chunked Transfer Encoding: Streaming Dynamic Payloads Without Content-Length](#chapter-13-chunked-transfer-encoding-streaming-dynamic-payloads-without-content-length)
14. [Chapter 14: Transport Layer Security (TLS/HTTPS): Asymmetric Handshakes & Symmetric Session Ciphers](#chapter-14-transport-layer-security-tlshttps-asymmetric-handshakes-symmetric-session-ciphers)
15. [Chapter 15: DNS Resolution Mechanics: From Domain Names to IP Addresses](#chapter-15-dns-resolution-mechanics-from-domain-names-to-ip-addresses)
16. [Chapter 16: HTTP/2 Multiplexing: Binary Framing, Streams, and Head-of-Line Blocking Mitigation](#chapter-16-http2-multiplexing-binary-framing-streams-and-head-of-line-blocking-mitigation)
17. [Chapter 17: HTTP/3 & QUIC: Moving from TCP to UDP-Based Transport](#chapter-17-http3-quic-moving-from-tcp-to-udp-based-transport)
18. [Chapter 18: Parsing HTTP Streams: Building a Minimal HTTP/1.1 Protocol Parser in Python](#chapter-18-parsing-http-streams-building-a-minimal-http11-protocol-parser-in-python)
19. [Chapter 19: Simulating Raw HTTP Requests with Python `socket` & Telnet/Netcat](#chapter-19-simulating-raw-http-requests-with-python-socket-telnetnetcat)
20. [Chapter 20: Automated Protocol Verification: Unit Testing HTTP Headers and Framing](#chapter-20-automated-protocol-verification-unit-testing-http-headers-and-framing)
21. [Chapter 21: Network Packet Inspection with Wireshark and Tcpdump Diagnostics](#chapter-21-network-packet-inspection-with-wireshark-and-tcpdump-diagnostics)
22. [Chapter 22: HTTP Protocol Systems Engineering Checklist & RFC Compliance Matrix](#chapter-22-http-protocol-systems-engineering-checklist-rfc-compliance-matrix)

---

## Chapter 1: The Computer Networking Hierarchy: Physical Links to Application Protocols

Computer networking is structured as a layered abstraction model. Each layer provides specific guarantees to the layer above it while concealing the implementation details of the layer below it.

```
+------------------------------------+---------------------------------------------------+
| TCP/IP Layer Model                 | Real-World Protocols & Operating Systems Units    |
+------------------------------------+---------------------------------------------------+
| 4. Application Layer               | HTTP/1.1, HTTP/2, WebSockets, DNS, TLS            |
| 3. Transport Layer                 | TCP (Reliable Streams), UDP (Unreliable Datagrams)|
| 2. Internet / Network Layer        | IPv4, IPv6, ICMP (Packet Routing across Routers)  |
| 1. Link / Physical Layer           | Ethernet, Wi-Fi 802.11, Fiber Optics, NIC Hardware|
+------------------------------------+---------------------------------------------------+
```

### Data Encapsulation and Packet Traversal
When a citizen submits a complaint from their browser:
1. The browser creates an **HTTP payload** string (Application layer).
2. The operating system kernel segments the payload into a **TCP segment** with sequence numbers and port addresses (Transport layer).
3. The kernel encloses the TCP segment inside an **IP packet** with source and destination IP addresses (Internet layer).
4. The Network Interface Card (NIC) serializes the packet into an **Ethernet frame** containing MAC addresses and transmits electromagnetic pulses across the physical medium (Link layer).
5. At the municipal datacenter, Uvicorn's server NIC reverses this sequence—decapsulating frames into packets, reassembling TCP segments into an ordered stream, and delivering the raw bytes to the ASGI worker ([Guide 02: FastAPI ASGI Web Architecture](02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)).

---

## Chapter 2: The Transport Layer: TCP Reliability, Ports, and Socket Bindings

The Internet Protocol (IP) provides only **unreliable, best-effort packet delivery**: individual packets may be dropped by congested routers, arrive out of order, or be duplicated. 

The **Transmission Control Protocol (TCP)** ([RFC 793](https://datatracker.ietf.org/doc/html/rfc793)) transforms this chaotic packet environment into an **ordered, reliable, error-checked byte stream**.

### Core TCP Guarantees
* **In-Order Delivery**: Every byte transmitted is assigned a 32-bit Sequence Number (`SEQ`). The receiving kernel buffers out-of-order packets and reassembles them sequentially before presenting them to Python's `read()` syscall.
* **Retransmission on Packet Loss**: Every received packet must be acknowledged with an Acknowledgment Number (`ACK`). If the sender does not receive an `ACK` within a calculated Round-Trip Time (RTT) timeout, it retransmits the missing segment.
* **Flow Control (Sliding Window)**: The receiver advertises a `Window Size` indicating how many bytes of buffer space remain in kernel memory, preventing a fast sender from overwhelming a slow receiver.
* **Congestion Control**: Algorithms (such as Cubic or BBR) dynamically detect network bottlenecks and throttle transmission speeds to prevent network collapse.

### Addressing with IP Addresses and Ports
While an IP address identifies a specific host machine on a network, a **Port (16-bit integer: 0 to 65535)** identifies a specific process or socket listener on that host:
* `0 - 1023`: Well-Known System Ports (e.g., `80` for HTTP, `443` for HTTPS, `22` for SSH).
* `1024 - 49151`: Registered Ports (e.g., `8000` for Uvicorn, `5173` for Vite, `5432` for PostgreSQL).
* `49152 - 65535`: Dynamic / Ephemeral Ports allocated temporarily by the OS client kernel when making outbound requests.

---

## Chapter 3: The TCP Three-Way Handshake and Connection Teardown

Before a single byte of HTTP data can traverse the wire, the client and server must establish a synchronized connection state through the **Three-Way Handshake**:

```
Citizen Client                                       FastAPI Server (Uvicorn)
      |                                                        |
      |--- 1. SYN (Seq=1000) --------------------------------->| (Client requests sync)
      |                                                        |
      |<-- 2. SYN-ACK (Seq=5000, Ack=1001) -------------------| (Server acks & syncs)
      |                                                        |
      |--- 3. ACK (Seq=1001, Ack=5001) ----------------------->| (Client acks server)
      |                                                        |
[ TCP Connection ESTABLISHED: Sockets ready for HTTP payload exchange ]
```

### Handshake Phases
1. **SYN (Synchronize)**: The client chooses an Initial Sequence Number ($ISN_c = 1000$) and sends a TCP segment with the `SYN` flag enabled.
2. **SYN-ACK**: The server receives the request, allocates kernel socket buffers, chooses its own $ISN_s = 5000$, sets $ACK = ISN_c + 1 = 1001$, and responds with `SYN` and `ACK` flags enabled.
3. **ACK**: The client receives the `SYN-ACK`, sets $ACK = ISN_s + 1 = 5001$, and responds with `ACK`. At this point, the connection state is `ESTABLISHED`.

### Connection Teardown (Four-Way Wave)
When closing a connection cleanly, both directions of the full-duplex stream terminate independently using `FIN` (Finish) and `ACK` control packets:

```
Client --- FIN ---> Server
Client <-- ACK --- Server
Client <-- FIN --- Server
Client --- ACK ---> Server (Client enters TIME_WAIT for 2*MSL to absorb delayed packets)
```

---

## Chapter 4: Sockets in Python: Low-Level `socket` Programming and Byte Transmission

A **socket** is an operating system abstraction representing a communications endpoint. In Python, the standard library `socket` module provides direct bindings to POSIX C socket system calls (`socket()`, `bind()`, `listen()`, `accept()`, `send()`, `recv()`):

```python
import socket  # Import standard socket library for low-level network communication

def create_raw_tcp_echo_server(host: str = "127.0.0.1", port: int = 9000) -> None:  # Run synchronous TCP server
    # 1. Create a streaming TCP socket using IPv4 addressing (AF_INET) and stream protocol (SOCK_STREAM)
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)  # Allocate socket file descriptor
    
    # 2. Allow immediate socket reuse to prevent "Address already in use" errors during server restarts
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)  # Enable address reuse flag
    
    # 3. Bind the socket file descriptor to the designated local IP address and port number
    server_socket.bind((host, port))  # Bind socket address tuple
    
    # 4. Put socket in passive listening mode with a backlog queue capacity of 5 pending connections
    server_socket.listen(5)  # Begin listening for incoming client connections
    print(f"TCP Server listening on {host}:{port}...")  # Output operational readiness status
    
    try:  # Enclose connection accept loop in teardown shield
        while True:  # Run continuous connection processing loop
            # Block until an incoming client completes the TCP 3-way handshake, returning client socket and address
            client_conn, client_addr = server_socket.accept()  # Accept client connection
            print(f"Accepted TCP connection from {client_addr[0]}:{client_addr[1]}")  # Log connection
            
            with client_conn:  # Automatically close client socket file descriptor upon context exit
                raw_bytes = client_conn.recv(1024)  # Read up to 1024 bytes from kernel receive buffer
                if raw_bytes:  # Verify non-empty byte buffer was received
                    # Echo raw byte payload directly back across established TCP connection
                    client_conn.sendall(raw_bytes)  # Transmit echoed byte stream to client
    finally:  # Ensure primary server socket is closed on shutdown
        server_socket.close()  # Close listening socket file descriptor
```

---

## Chapter 5: The Uniform Resource Identifier (URI) Anatomy: Scheme, Host, Port, Path, and Query

Every HTTP interaction targets a specific resource identified by a **Uniform Resource Identifier (URI)** or **Uniform Resource Locator (URL)** ([RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986)):

```
  https :// api.smartcity.gov : 8000 / api/v1/complaints / 42 ? status=open & sort=desc # history
  \___/     \________________/   \__/   \____________________/   \____________________/   \_____/
    |               |              |               |                        |                |
 Scheme          Hostname         Port            Path                 Query String       Fragment
```

### URI Segment Definitions
1. **Scheme**: Identifies the application-layer protocol (`http`, `https`, `ws`, `wss`).
2. **Authority (`Hostname:Port`)**: Identifies the network host domain name or IP address and optional port. If omitted, default port `80` (HTTP) or `443` (HTTPS) is assumed.
3. **Path**: Hierarchical string identifying the target resource in the server's routing tree (`/api/v1/complaints/42`).
4. **Query String (`?key=val&k2=v2`)**: Non-hierarchical string of key-value pairs separated by ampersands (`&`), utilized for filtering, pagination, and sorting.
5. **Fragment (`#anchor`)**: Client-side DOM identifier used exclusively by the browser to scroll to a specific header; **fragments are never transmitted to the server in HTTP request lines**.

```python
from urllib.parse import urlparse, parse_qs  # Import standard URL parsing utilities
from typing import Dict, List, Any  # Import typing primitives

def decompose_complaint_url(raw_url: str) -> Dict[str, Any]:  # Parse and decompose raw URI string
    parsed_components = urlparse(raw_url)  # Decompose URI into structured NamedTuple components
    query_parameters: Dict[str, List[str]] = parse_qs(parsed_components.query)  # Parse query string into dictionary
    
    return {  # Construct structured decomposition dictionary
        "scheme": parsed_components.scheme,  # Protocol scheme (e.g., http or https)
        "hostname": parsed_components.hostname,  # Hostname or IP address
        "port": parsed_components.port or (443 if parsed_components.scheme == "https" else 80),  # Port resolution
        "path": parsed_components.path,  # Hierarchical routing path
        "query_params": query_parameters,  # Parsed query parameter dictionary
        "fragment": parsed_components.fragment  # Client-side fragment anchor identifier
    }  # Return completed decomposition
```

---

## Chapter 6: The HTTP/1.1 Wire Protocol: Request Line, Headers, and Delimiters

Unlike binary protocols (such as WebSockets or HTTP/2), HTTP/1.1 is an **ASCII text-based wire protocol** ([RFC 7230](https://datatracker.ietf.org/doc/html/rfc7230)). Every request is serialized across the TCP stream as plain human-readable characters terminated by explicit byte delimiters.

### The Wire Layout of an HTTP Request
```http
POST /api/v1/complaints HTTP/1.1\r\n
Host: api.smartcity.gov:8000\r\n
User-Agent: Mozilla/5.0\r\n
Content-Type: application/json\r\n
Content-Length: 43\r\n
Connection: keep-alive\r\n
\r\n
{"title":"Water leak","department":"WATER"}
```

### Protocol Delimiter Axioms
1. **CRLF (`\r\n` / Bytes `0x0D 0x0A`)**: Every single line in an HTTP header stream MUST be terminated by a Carriage Return (`\r`) followed by a Line Feed (`\n`). Bare `\n` characters violate RFC 7230 and cause parsing errors in strict proxies.
2. **The Request Line**: The very first line of every request contains exactly three space-delimited tokens:
   $$\text{Request-Line} = \text{METHOD} + \text{" "} + \text{REQUEST-URI} + \text{" "} + \text{HTTP-VERSION} + \text{"\textbackslash r\textbackslash n"}$$
3. **The Header Boundary (`\r\n\r\n`)**: An empty line consisting solely of `\r\n` (creating a double CRLF: `\r\n\r\n`) marks the absolute end of the header block. Any bytes received immediately following `\r\n\r\n` are interpreted as the **Request Body Payload**.

```python
from typing import Dict, Tuple  # Import typing primitives for protocol dictionary and tuple

def serialize_raw_http_request(method: str, path: str, host: str, body_payload: str) -> bytes:  # Construct raw wire bytes
    body_bytes = body_payload.encode("utf-8")  # Encode text payload to raw UTF-8 bytes
    content_length = len(body_bytes)  # Compute exact body byte length for framing header
    
    # Construct request lines joining with standardized RFC CRLF line endings
    header_lines = [  # Define list of header strings
        f"{method} {path} HTTP/1.1",  # Formatted RFC request-line
        f"Host: {host}",  # Mandatory Host header in HTTP/1.1
        "User-Agent: SmartComplaintClient/1.0",  # Client identifier header
        "Content-Type: application/json",  # MIME type header
        f"Content-Length: {content_length}",  # Payload byte count header
        "Connection: close"  # Request socket termination after response
    ]  # Conclude header lines list
    
    # Assemble header block terminated by double CRLF delimiter
    raw_header_block = "\r\n".join(header_lines) + "\r\n\r\n"  # Join lines and append empty line delimiter
    return raw_header_block.encode("latin-1") + body_bytes  # Concatenate ASCII headers and binary body
```

---

## Chapter 7: HTTP Verbs & Semantic Contracts

HTTP defines standardized request methods ("verbs") that establish the semantic intention of the interaction:

```
+----------+---------------------------------------------+-------------------+--------------------+
| Method   | Primary Architectural Purpose               | Typical Req Body? | Typical Resp Body? |
+----------+---------------------------------------------+-------------------+--------------------+
| GET      | Retrieve representation of a resource       | No                | Yes                |
| POST     | Create subordinate resource / trigger action| Yes               | Yes                |
| PUT      | Replace entire target resource idempotently | Yes               | Yes                |
| PATCH    | Apply partial modification to resource      | Yes               | Yes                |
| DELETE   | Destroy target resource identifier          | Rare              | Optional           |
| HEAD     | Retrieve identical headers as GET (no body) | No                | No                 |
| OPTIONS  | Query server capabilities & CORS preflight  | No                | Optional           |
+----------+---------------------------------------------+-------------------+--------------------+
```

### Domain Application in SmartComplaintHandler
* `GET /api/v1/complaints/42`: Retrieves the current state of complaint #42.
* `POST /api/v1/complaints`: Submits a new citizen grievance and allocates a fresh ticket identifier (`CMP-2026-0914`).
* `PUT /api/v1/complaints/42`: Overwrites the entire complaint record with a full JSON document.
* `PATCH /api/v1/complaints/42`: Mutates only specified fields (e.g., updating `status: "IN_PROGRESS"`).
* `DELETE /api/v1/complaints/42`: Purges or marks complaint #42 as deleted.
* `OPTIONS /api/v1/complaints`: Used by browsers during CORS preflight checks ([Guide 19: Defensive HTTP: ASGI Middlewares, Security Headers, and Perimeter Protections](19_API_MIDDLEWARE_AND_SECURITY_HEADERS.md)).

---

## Chapter 8: Safe vs Idempotent HTTP Methods: Architectural Axioms in REST

In systems architecture, network requests frequently fail or timeout due to transient connectivity drops ([Guide 09: Axios, Fetch and REST Protocols](09_AXIOS_FETCH_AND_REST_PROTOCOLS.md)). Knowing whether a client can safely retry a failed request depends on two mathematical properties:

```
+----------+---------------+--------------------+---------------------------------------------+
| Method   | Safe?         | Idempotent?        | Safe for Automated Client Retry?            |
+----------+---------------+--------------------+---------------------------------------------+
| GET      | YES           | YES                | YES (Read-only; causes zero side effects)   |
| HEAD     | YES           | YES                | YES (Read-only metadata)                    |
| OPTIONS  | YES           | YES                | YES (Read-only capabilities)                |
| PUT      | NO            | YES                | YES (Overwriting with identical state is OK)|
| DELETE   | NO            | YES                | YES (Deleting already deleted item is OK)   |
| POST     | NO            | NO                 | NO! (Retrying creates duplicate tickets!)   |
| PATCH    | NO            | NO (Conditionally) | NO (e.g., {"priority_points": "+5"} mutates)|
+----------+---------------+--------------------+---------------------------------------------+
```

### Mathematical Definitions
1. **Safe Methods ($f(S) = S$)**: An HTTP method is *safe* if executing it causes **zero state mutations** on the server. Read-only methods (`GET`, `HEAD`, `OPTIONS`) must never mutate database tables. Web crawlers (e.g., Googlebot) assume `GET` is safe and will freely pre-fetch links.
2. **Idempotent Methods ($f(f(S)) = f(S)$)**: An HTTP method is *idempotent* if the side effects of executing it $N$ times ($N \ge 1$) are identical to executing it once. 
   - `PUT /users/42 {"name": "Bob"}` is idempotent: executing it 10 times leaves Bob's name as "Bob".
   - `POST /complaints` is **NOT** idempotent: executing it 10 times creates 10 distinct complaint tickets in the database!

---

## Chapter 9: The Anatomy of an HTTP Response: Status Line, Headers, and Payload

When the FastAPI backend processes an incoming request, Uvicorn serializes the result into a standardized HTTP response stream:

```http
HTTP/1.1 200 OK\r\n
Date: Sat, 12 Sep 2026 09:30:00 GMT\r\n
Server: uvicorn\r\n
Content-Type: application/json\r\n
Content-Length: 35\r\n
Connection: keep-alive\r\n
\r\n
{"status":"ACTIVE","ticket_id":42}
```

### Structure Elements
1. **The Status Line**: The very first line containing the protocol version, the 3-digit numeric status code, and the human-readable reason phrase:
   $$\text{Status-Line} = \text{HTTP-VERSION} + \text{" "} + \text{STATUS-CODE} + \text{" "} + \text{REASON-PHRASE} + \text{"\textbackslash r\textbackslash n"}$$
2. **Response Headers**: Metadata instructing the client how to interpret the payload (`Content-Type`), how large it is (`Content-Length`), how to cache it (`Cache-Control`), and how to correlate logs (`X-Request-ID`).
3. **The Response Body**: The binary or text payload bytes delivered to the client application.

---

## Chapter 10: The HTTP Status Code Taxonomy: 1xx, 2xx, 3xx, 4xx, and 5xx Semantics

The HTTP specification partitions status codes into five distinct categories based on their initial digit:

```
+----------------+--------------------------+-------------------------------------------------+
| Range          | Category Description     | Primary Examples                                |
+----------------+--------------------------+-------------------------------------------------+
| 100 - 199      | Informational            | 101 Switching Protocols (WebSockets upgrade)    |
| 200 - 299      | Success                  | 200 OK, 201 Created, 204 No Content             |
| 300 - 399      | Redirection              | 301 Moved Permanently, 304 Not Modified         |
| 400 - 499      | Client Error             | 400 Bad Request, 401 Unauthorized, 404 Not Found|
| 500 - 599      | Server Error             | 500 Internal Error, 502 Bad Gateway, 504 Timeout|
+----------------+--------------------------+-------------------------------------------------+
```

```python
from enum import IntEnum  # Import IntEnum for strongly typed status code mappings

class HttpStatus(IntEnum):  # Standardized HTTP status codes utilized across SmartComplaintHandler
    SWITCHING_PROTOCOLS = 101  # Used when upgrading HTTP socket to full-duplex WebSocket stream
    OK = 200  # Standard response for successful GET, PUT, or PATCH operations
    CREATED = 201  # Returned when a POST creates a new database complaint entity
    NO_CONTENT = 204  # Returned on successful DELETE when no response body is returned
    MOVED_PERMANENTLY = 301  # Permanent redirect instructing client to update stored bookmarks
    NOT_MODIFIED = 304  # Returned when client's cached ETag is verified fresh (zero body bytes!)
    BAD_REQUEST = 400  # Malformed request syntax or unparseable JSON payload
    UNAUTHORIZED = 401  # Missing or invalid Bearer JWT authentication token
    FORBIDDEN = 403  # Authenticated user lacks required municipal role permissions
    NOT_FOUND = 404  # Target complaint ID does not exist in SQLite database
    CONFLICT = 409  # Request collides with existing state (e.g., duplicate complaint submission)
    UNPROCESSABLE_ENTITY = 422  # Pydantic schema validation failure (syntactically valid but bad types)
    TOO_MANY_REQUESTS = 429  # Client exceeded rate limit bucket capacity
    INTERNAL_SERVER_ERROR = 500  # Unhandled exception inside Python route handler
    BAD_GATEWAY = 502  # NGINX reverse proxy failed to reach backend Uvicorn worker socket
    SERVICE_UNAVAILABLE = 503  # Server temporarily overloaded or undergoing maintenance
    GATEWAY_TIMEOUT = 504  # Upstream database query or reverse proxy exceeded maximum wait timeout
```

---

## Chapter 11: Content Negotiation and MIME Media Types (`Content-Type`, `Accept`)

HTTP is a multi-format protocol capable of transmitting JSON, HTML, PDF reports, PNG images, and raw binary streams across the identical TCP socket. The client and server negotiate representations using **MIME (Multipurpose Internet Mail Extensions) Types**:

```
Client sends:  Accept: application/json, text/plain;q=0.9, */*;q=0.8
Server sends:  Content-Type: application/json; charset=utf-8
```

### Key Content Negotiation Headers
1. **`Content-Type`**: Informs the receiver how to decode the attached payload bytes (e.g., `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`).
2. **`Accept`**: Informs the server which media types the client understands, ordered by relative quality factor weights (`q=0.0` to `q=1.0`).
3. **`Content-Encoding`**: Informs the receiver if the body bytes are compressed (e.g., `gzip`, `br` for Brotli, `deflate`).

```python
from typing import List, Tuple  # Import typing primitives

def parse_accept_header(accept_header: str) -> List[Tuple[str, float]]:  # Parse Accept header and sort by weight
    parsed_preferences: List[Tuple[str, float]] = []  # Initialize storage list for type-weight tuples
    for media_range in accept_header.split(","):  # Split comma-delimited media type tokens
        parts = media_range.strip().split(";")  # Separate MIME type from parameters
        mime_type = parts[0].strip()  # Extract primary MIME type string
        quality_factor = 1.0  # Default quality factor weight is 1.0 per RFC 7231
        
        for parameter in parts[1:]:  # Iterate across parameters looking for q-value
            param_key_val = parameter.strip().split("=")  # Split parameter by equals sign
            if len(param_key_val) == 2 and param_key_val[0].strip() == "q":  # Match q identifier
                try:  # Enclose float parsing
                    quality_factor = float(param_key_val[1].strip())  # Parse quality weight float
                except ValueError:  # Handle malformed float
                    quality_factor = 1.0  # Fallback to default weight
                    
        parsed_preferences.append((mime_type, quality_factor))  # Append parsed preference tuple
        
    # Sort preferences descending by quality factor weight
    parsed_preferences.sort(key=lambda item: item[1], reverse=True)  # Sort list in-place
    return parsed_preferences  # Return ordered preferences
```

---

## Chapter 12: Persistent TCP Connections & HTTP Keep-Alive Mechanics

In early HTTP/1.0, every single request required establishing a new TCP connection:

```
[ HTTP/1.0: Connection Churn ]
SYN -> SYN-ACK -> ACK -> GET /index.html -> 200 OK -> FIN -> ACK
SYN -> SYN-ACK -> ACK -> GET /styles.css  -> 200 OK -> FIN -> ACK
SYN -> SYN-ACK -> ACK -> GET /bundle.js   -> 200 OK -> FIN -> ACK
(Incurred 3 separate 3-way handshakes and 3 slow-start phases!)
```

### The HTTP/1.1 Keep-Alive Revolution
HTTP/1.1 established **Persistent Connections by default**:
* The TCP connection remains open across sequential request-response cycles.
* Governed by the `Connection: keep-alive` header and `Keep-Alive: timeout=5, max=1000`.
* Dramatically reduces TCP handshake latency and amortizes the TLS cryptographic handshake across hundreds of subsequent API requests!

---

## Chapter 13: Chunked Transfer Encoding: Streaming Dynamic Payloads Without Content-Length

When an endpoint exports a municipal report containing 200,000 complaints, computing `Content-Length` upfront requires buffering the entire 50-megabyte CSV in server memory before transmitting the first byte!

**Chunked Transfer Encoding** ([RFC 7230 §4.1](https://datatracker.ietf.org/doc/html/rfc7230#section-4.1)) allows the server to stream data dynamically as it is generated:
1. The server omits `Content-Length` and sends `Transfer-Encoding: chunked`.
2. Each data chunk is prefixed by its byte length in **hexadecimal ASCII**, followed by `\r\n`, the raw chunk bytes, and another `\r\n`.
3. The stream terminates with a zero-length chunk (`0\r\n\r\n`).

```http
HTTP/1.1 200 OK\r\n
Transfer-Encoding: chunked\r\n
Content-Type: text/plain\r\n
\r\n
17\r\n
SmartComplaintHandler\r\n
B\r\n
Data Stream\r\n
0\r\n
\r\n
```

```python
from typing import Generator  # Import generator typing

def format_chunked_frame(raw_chunk_bytes: bytes) -> bytes:  # Format chunk per RFC 7230 specifications
    chunk_length_hex = f"{len(raw_chunk_bytes):X}"  # Convert integer byte length to hexadecimal string
    # Construct chunk frame: <HEX_LENGTH>\r\n<DATA>\r\n
    return chunk_length_hex.encode("ascii") + b"\r\n" + raw_chunk_bytes + b"\r\n"  # Return formatted chunk

def format_final_chunk() -> bytes:  # Construct terminal zero-length chunk
    # Zero length chunk signals end of stream: 0\r\n\r\n
    return b"0\r\n\r\n"  # Return stream termination token
```

---

## Chapter 14: Transport Layer Security (TLS/HTTPS): Asymmetric Handshakes & Symmetric Session Ciphers

Unencrypted HTTP (`http://`) transmits plaintext across the internet, exposing passwords, citizen identities, and complaints to network eavesdropping and packet injection.

**Transport Layer Security (TLS 1.3)** establishes an encrypted tunnel between the TCP layer and the HTTP application layer:

```
[ Citizen Browser ]                                              [ Municipal Edge Proxy ]
         |                                                                   |
         |==================== 1. TCP 3-Way Handshake =======================|
         |                                                                   |
         |--- 2. Client Hello (Supported Ciphers + Client Ephemeral Key) --->|
         |                                                                   |
         |<-- 3. Server Hello (Chosen Cipher + Server Ephemeral Key) --------|
         |<-- 4. Server Certificate (X.509 Certificate Chain + Signature) ---|
         |                                                                   |
         | [ Both derive symmetric Master Secret via Diffie-Hellman ]        |
         |                                                                   |
         |<== 5. Encrypted HTTP Traffic (AES-256-GCM / ChaCha20-Poly1305) ==>|
```

### The Dual Cryptographic Engine
1. **Asymmetric Cryptography (Handshake)**: Uses public-key algorithms (RSA or Elliptic Curves ECDHE) to authenticate the server's identity and securely negotiate a shared secret without transmitting the key over the wire.
2. **Symmetric Cryptography (Session Data)**: Once negotiated, bulk HTTP traffic is encrypted using high-speed symmetric ciphers (AES-GCM), achieving gigabit-per-second encryption throughput with zero noticeable CPU overhead on modern hardware.

---

## Chapter 15: DNS Resolution Mechanics: From Domain Names to IP Addresses

Before a browser can issue a TCP connection to `https://complaints.smartcity.gov`, it must resolve the human-readable domain name into a 32-bit IPv4 or 128-bit IPv6 address through the **Domain Name System (DNS)**:

```
Citizen Browser ---> Local DNS Resolver (8.8.8.8)
                          |
                          |---> Root Nameserver (.)
                          |<--- Referral to .gov TLD Nameserver
                          |
                          |---> .gov TLD Nameserver
                          |<--- Referral to smartcity.gov Authoritative Nameserver
                          |
                          |---> smartcity.gov Authoritative Nameserver
                          |<--- A Record: 198.51.100.24 (TTL = 300s)
                          |
Citizen Browser <-------- Resolves to 198.51.100.24 (Cached in browser DNS cache for 300s)
```

```python
import socket  # Import socket library for host resolution system calls

def resolve_municipal_domain_ip(hostname: str) -> str:  # Resolve domain name using OS resolver
    try:  # Enclose resolution query in network error handler
        # Queries local OS DNS resolver (getaddrinfo system call under the hood)
        ip_address = socket.gethostbyname(hostname)  # Resolve hostname to IPv4 address string
        return ip_address  # Return resolved IP string
    except socket.gaierror as dns_error:  # Catch getaddrinfo resolution failure
        raise ValueError(f"DNS Resolution failed for domain {hostname}: {dns_error}")  # Raise descriptive error
```

---

## Chapter 16: HTTP/2 Multiplexing: Binary Framing, Streams, and Head-of-Line Blocking Mitigation

In HTTP/1.1, even with persistent keep-alive connections, requests must be processed **sequentially**: Request B cannot be sent until Request A's response has completely finished transferring. This architectural constraint is known as **Head-of-Line (HoL) Blocking**.

### The HTTP/2 Binary Framing Layer
HTTP/2 ([RFC 7540](https://datatracker.ietf.org/doc/html/rfc7540)) eliminates application-level HoL blocking by replacing text parsing with **Binary Framing**:
* A single TCP connection is divided into multiple independent, bidirectional **Streams**.
* Messages are fragmented into discrete binary frames: `HEADERS` frames carrying compressed metadata (HPACK) and `DATA` frames carrying payloads.
* Frames from multiple concurrent requests are **multiplexed and interleaved** across the single TCP pipe simultaneously, eliminating the need to wait for previous requests to complete!

---

## Chapter 17: HTTP/3 & QUIC: Moving from TCP to UDP-Based Transport

While HTTP/2 eliminated Head-of-Line blocking at the *application* layer, it introduced a new bottleneck at the *transport* layer: **TCP-Level Head-of-Line Blocking**.

Because TCP enforces a strictly linear byte stream, if an intermediate router drops a single IP packet belonging to Stream 1, the operating system kernel holds back **all other multiplexed streams** (Streams 3, 5, 7) until the missing packet is retransmitted!

### The QUIC Protocol Solution
HTTP/3 ([RFC 9114](https://datatracker.ietf.org/doc/html/rfc9114)) abandons TCP entirely, migrating to **QUIC (Quick UDP Internet Connections)** running over **UDP**:
* Streams are natively independent at the transport layer: a dropped packet on Stream 1 does not delay Streams 3 or 5.
* **0-RTT Connection Establishment**: Integrates TLS 1.3 handshaking directly into transport negotiation, allowing clients to send encrypted HTTP payloads in the very first network packet!
* **Connection Migration**: Sockets are identified by a 64-bit Connection ID rather than the 4-tuple (IP:Port); switching from Wi-Fi to cellular does not drop active downloads!

---

## Chapter 18: Parsing HTTP Streams: Building a Minimal HTTP/1.1 Protocol Parser in Python

Understanding how ASGI servers like Uvicorn ([Guide 02: FastAPI ASGI Web Architecture](02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)) parse network traffic requires writing a raw byte-level HTTP/1.1 stream parser:

```python
from typing import Dict, Tuple, Optional  # Import typing primitives

class RawHttpStreamParser:  # Parse raw byte streams into structured HTTP request representations
    def __init__(self):  # Initialize parser state
        self.buffer = bytearray()  # Internal byte buffer accumulating incoming socket chunks

    def feed_bytes(self, chunk: bytes) -> Optional[Tuple[str, str, Dict[str, str], bytes]]:  # Ingest chunk
        self.buffer.extend(chunk)  # Append chunk bytes to accumulation buffer
        
        # 1. Search for mandatory double-CRLF delimiter separating headers from body
        header_end_index = self.buffer.find(b"\r\n\r\n")  # Locate header boundary
        if header_end_index == -1:  # Incomplete header block
            return None  # Await subsequent socket chunks
            
        # 2. Extract and decode ASCII header section
        raw_header_bytes = self.buffer[:header_end_index]  # Slice header bytes
        header_text = raw_header_bytes.decode("latin-1")  # Decode RFC 7230 headers using latin-1 encoding
        header_lines = header_text.split("\r\n")  # Split lines on CRLF
        
        # 3. Parse Request-Line: METHOD PATH VERSION
        request_line = header_lines[0]  # First line represents RFC request-line
        parts = request_line.split(" ")  # Split into space-delimited tokens
        method, path, _ = parts[0], parts[1], parts[2]  # Unpack method, path, and version
        
        # 4. Parse headers into dictionary
        headers: Dict[str, str] = {}  # Initialize header dictionary
        for line in header_lines[1:]:  # Iterate across remaining header lines
            if ":" in line:  # Verify key-value delimiter
                header_name, header_value = line.split(":", 1)  # Split on first colon
                headers[header_name.strip().lower()] = header_value.strip()  # Normalize lowercase key
                
        # 5. Extract Body based on Content-Length header
        content_length = int(headers.get("content-length", "0"))  # Parse declared content length
        body_start_index = header_end_index + 4  # Body begins immediately following double-CRLF
        total_required_bytes = body_start_index + content_length  # Calculate total expected bytes
        
        if len(self.buffer) < total_required_bytes:  # Check if body payload is still incomplete
            return None  # Await remaining payload bytes
            
        body_bytes = bytes(self.buffer[body_start_index:total_required_bytes])  # Extract body slice
        return method, path, headers, body_bytes  # Deliver parsed HTTP request components
```

---

## Chapter 19: Simulating Raw HTTP Requests with Python `socket` & Telnet/Netcat

To debug low-level proxy behavior and bypass browser abstractions, engineers can speak raw HTTP directly over a TCP socket:

```python
import socket  # Import socket module for low-level connection

def execute_raw_http_get(host: str = "127.0.0.1", port: int = 8000, path: str = "/api/v1/health") -> str:  # Query
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client_socket:  # Instantiate TCP socket
        client_socket.connect((host, port))  # Complete 3-way handshake to target server
        
        # Construct raw RFC-compliant HTTP/1.1 GET request string
        raw_request_string = (  # Build raw HTTP message
            f"GET {path} HTTP/1.1\r\n"  # Request line
            f"Host: {host}:{port}\r\n"  # Mandatory host header
            "User-Agent: RawSocketClient/1.0\r\n"  # User-Agent header
            "Accept: application/json\r\n"  # Accept header
            "Connection: close\r\n"  # Request server close socket after sending response
            "\r\n"  # Double CRLF marking end of headers
        )  # Conclude request assembly
        
        client_socket.sendall(raw_request_string.encode("ascii"))  # Transmit encoded ASCII bytes over TCP
        
        response_bytes = bytearray()  # Initialize buffer to accumulate response bytes
        while True:  # Read response until server closes socket
            chunk = client_socket.recv(4096)  # Read up to 4 KB chunk
            if not chunk:  # Socket closed by server
                break  # Exit read loop
            response_bytes.extend(chunk)  # Append chunk to buffer
            
        return response_bytes.decode("utf-8", errors="replace")  # Decode and return response string
```

---

## Chapter 20: Automated Protocol Verification: Unit Testing HTTP Headers and Framing

Testing wire protocols requires verifying that header parsing handles malformed inputs, casing inconsistencies, and boundary splits cleanly ([Guide 12: Pytest and Automated Test Systems](12_PYTEST_AND_AUTOMATED_TEST_SYSTEMS.md)):

```python
import pytest  # Import pytest framework for assertions

def test_raw_http_stream_parser_split_chunks():  # Verify parser handles fragmented packets over TCP
    from scratch.guide01b_part4 import RawHttpStreamParser  # Import stream parser class
    parser = RawHttpStreamParser()  # Instantiate parser instance
    
    # Simulate fragmented TCP packets arriving in multiple chunks
    chunk_1 = b"POST /api/v1/complaints HTTP/1.1\r\nHost: localhost\r\nContent-Length"  # Fragment 1
    chunk_2 = b": 15\r\nContent-Type: application/json\r\n\r\n"  # Fragment 2 (completes headers)
    chunk_3 = b'{"status":"OK"}'  # Fragment 3 (body payload)
    
    assert parser.feed_bytes(chunk_1) is None  # Parser awaits more data
    assert parser.feed_bytes(chunk_2) is None  # Headers complete, but body still awaiting
    
    result = parser.feed_bytes(chunk_3)  # Feed final body chunk
    assert result is not None  # Verify request parsed successfully
    method, path, headers, body = result  # Unpack parsed result components
    assert method == "POST"  # Assert correct HTTP verb
    assert path == "/api/v1/complaints"  # Assert target path
    assert headers["content-length"] == "15"  # Assert header extraction
    assert body == b'{"status":"OK"}'  # Assert exact body byte reproduction
```

---

## Chapter 21: Network Packet Inspection with Wireshark and Tcpdump Diagnostics

When diagnosing dropped connections or corrupt payloads between reverse proxies and FastAPI, command-line packet analyzers provide byte-level visibility:

### Tcpdump Commands
* Capture all HTTP traffic on port 8000:
  ```bash
  tcpdump -i any -nn -s0 -A 'tcp port 8000'
  ```
  - `-i any`: Listen on all network interfaces.
  - `-nn`: Do not resolve hostnames or port names to minimize CPU load.
  - `-s0`: Capture full packet payload without truncation.
  - `-A`: Print packet payload in readable ASCII text format.

### Wireshark Display Filters
* Filter for POST requests to complaint endpoints:
  ```wireshark
  http.request.method == "POST" && http.request.uri contains "/api/v1/complaints"
  ```
* Filter for HTTP 5xx server error responses:
  ```wireshark
  http.response.code >= 500 && http.response.code <= 599
  ```

---

## Chapter 22: HTTP Protocol Systems Engineering Checklist & RFC Compliance Matrix

Before building or deploying web services across the platform, verify adherence to this 15-point protocol systems checklist:

| Check # | Architectural Area | Technical Specification & Requirement |
|:---|:---|:---|
| 1 | **RFC 7230 Framing** | Headers terminated with explicit `\r\n` (CRLF) and separated from body by `\r\n\r\n`. |
| 2 | **Host Header** | All HTTP/1.1 requests include mandatory `Host` header to enable virtual host routing. |
| 3 | **Method Semantics** | `GET`, `HEAD`, and `OPTIONS` strictly safe and read-only (zero database state mutations). |
| 4 | **Idempotency Rules** | `PUT` and `DELETE` idempotent; automated retries prohibited on non-idempotent `POST`. |
| 5 | **Status Code Accuracy**| Returns `201 Created` for new entities, `204 No Content` for empty responses, `422` for schema errors. |
| 6 | **Content-Length** | Declared `Content-Length` matches exact body byte count when chunked encoding is not used. |
| 7 | **Keep-Alive Reuse** | Persistent connections configured with appropriate idle timeout (e.g., 5–15s) to avoid socket churn. |
| 8 | **Chunked Streaming** | Large reports streamed with `Transfer-Encoding: chunked` and terminated with `0\r\n\r\n`. |
| 9 | **Content Negotiation**| Responses declare explicit `Content-Type` with character set (e.g., `application/json; charset=utf-8`). |
| 10 | **TLS 1.3 Encryption**| Production traffic strictly enforced over TLS 1.3 using secure cipher suites. |
| 11 | **DNS Caching** | Local DNS resolver honors record TTLs without performing lookups on every request. |
| 12 | **Multiplexing** | HTTP/2 enabled on reverse proxies to interleave concurrent requests across single TCP connections. |
| 13 | **Low-Level Testing** | Parser unit tests verify resilience against packet fragmentation and partial chunk arrivals. |
| 14 | **Packet Diagnostics** | Tcpdump and Wireshark diagnostic filters verified for production triage. |
| 15 | **Graceful Teardown**| Sockets closed cleanly using TCP `FIN` exchanges without unannounced connection drops. |
