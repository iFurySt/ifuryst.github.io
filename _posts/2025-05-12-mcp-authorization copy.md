---
layout: post
title: "MCP Authorization"
date: 2025-05-12T13:30:00+08:00
tags: AI
categories: AI
giscus_comments: true
tabs: true
toc:
  sidebar: left
pretty_table: true
---

The official new [revised version](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization#2-3-1-server-metadata-discovery-headers) supports OAuth2 authentication method, let's take a look together.

First, the protocol requirements:

- STDIO not supported, STDIO only supports passing through env
- SSE/Streamable HTTP should support it (non-mandatory)

MCP follows the OAuth2 standard, mainly involving:

- [**OAuth 2.1 IETF DRAFT**](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12)
- OAuth 2.0 Authorization Server Metadata ([**RFC8414**](https://datatracker.ietf.org/doc/html/rfc8414))
- OAuth 2.0 Dynamic Client Registration Protocol ([**RFC7591**](https://datatracker.ietf.org/doc/html/rfc7591))

Among them, OAuth2.1 is still in the draft stage and has not yet become an official RFC standard. Here's a simple summary of OAuth-related RFCs:

| Standard/Draft        | Type                          | Status       | Core?            | Introduction                                                                                                                                                                           |
| --------------------- | ----------------------------- | ------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RFC 6749              | OAuth 2.0 Framework           | ✅ Published | ✅ Yes           | Defines authorization flows (authorization code, implicit, password, client credentials) and four major roles (client, resource owner, authorization server, resource server)          |
| RFC 6750              | Bearer Token Usage            | ✅ Published | ✅ Yes           | Describes how to securely use access tokens (Bearer Token) in HTTP                                                                                                                     |
| RFC 7591              | Dynamic Client Registration   | ✅ Published | ❌ Extension     | Allows clients to dynamically register to the authorization server via API                                                                                                             |
| RFC 8414              | Authorization Server Metadata | ✅ Published | ❌ Extension     | Provides a .well-known endpoint for exposing server configuration information, supporting auto-discovery                                                                               |
| draft-ietf-oauth-v2-1 | OAuth 2.1 Draft               | ⏳ In Draft  | ✅ Proposed Core | Summarizes and updates OAuth 2.0 core content, merges and replaces RFC 6749 and RFC 6750, eliminates insecure authorization methods (such as implicit authorization) and enforces PKCE |

## OAuth 2.0 & 2.1

### OAuth 2.0 - RFC 6749 & RFC 6750

Let's briefly go through the OAuth content in RFC 6749, which covers the definition of OAuth2.0, focusing on the important parts:

1. Register Client, obtain ClientID and ClientSecret
2. Configure on the Client, when authorization is required, the Client (usually the browser) redirects to /authorize to request user authorization

   ```bash
   GET /authorize?
     response_type=code&
     client_id=abc123&
     redirect_uri=https://client.com/callback&
     scope=read write&
     state=xyz123
   ```

3. The authorization server redirects back with the code

   ```bash
   HTTP/1.1 302 Found
   Location: https://client.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz123
   ```

4. Client or Server uses the authorization code to exchange for AccessToken and RefreshToken

   ```bash
   POST /token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&
   code=SplxlOBeZQQYbYS6WxSbIA&
   redirect_uri=https%3A%2F%2Fclient.com%2Fcallback&
   client_id=abc123&
   client_secret=secret456
   ```

5. Using the token, you can request the corresponding resources (resource scope determined by the scope)

   ```bash
   {
     "access_token": "2YotnFZFEjr1zCsicMWpAA",
     "token_type": "Bearer",
     "expires_in": 3600,
     "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA"
   }
   ```

RFC 6750 basically supplements OAuth 2.0, mainly specifying that AccessToken is represented as a Bearer Token (Authorization: Bearer <token>). Note that it is not necessarily a JWT. Many places use JWT, but Bearer Token is not equivalent to JWT; it can be a JWT or a random string.

### OAuth 2.0 Authorization Server Metadata - RFC 8414

The /authorize and /token endpoints mentioned earlier are fixed or pre-agreed configurations, which may not be convenient in some scenarios. Therefore, this RFC provides an automatic discovery mechanism, somewhat similar to openid-configuration in OIDC.

```bash
GET https://auth.example.com/.well-known/oauth-authorization-server

# Multi-tenant
GET https://auth.example.com/.well-known/oauth-authorization-server?issuer=https://issuer.example.com
```

This adds an endpoint (the Discovery Endpoint, .well-known/oauth-authorization-server) for discovering related configurations. The configuration (Metadata Document, authorization server metadata in JSON format) might look like:

```bash
{
  "issuer": "https://mcp-github-oauth.ifuryst.workers.dev",
  "authorization_endpoint": "https://mcp-github-oauth.ifuryst.workers.dev/authorize",
  "token_endpoint": "https://mcp-github-oauth.ifuryst.workers.dev/token",
  "registration_endpoint": "https://mcp-github-oauth.ifuryst.workers.dev/register",
  "response_types_supported": [
    "code"
  ],
  "response_modes_supported": [
    "query"
  ],
  "grant_types_supported": [
    "authorization_code",
    "refresh_token"
  ],
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "none"
  ],
  "revocation_endpoint": "https://mcp-github-oauth.ifuryst.workers.dev/token",
  "code_challenge_methods_supported": [
    "plain",
    "S256"
  ]
}
```

| Field Name                                               | Required                                      | Type   | Description                                                                                    |
| -------------------------------------------------------- | --------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| issuer                                                   | ✅ Yes                                        | string | Unique identifier of the authorization server (URL), must be https, no parameters or fragments |
| authorization_endpoint                                   | ✅ Yes (unless not supporting auth code flow) | string | OAuth authorization endpoint address for obtaining user authorization                          |
| token_endpoint                                           | ✅ Yes (unless only supporting implicit)      | string | Token endpoint where clients obtain access tokens                                              |
| jwks_uri                                                 | ⛔ Optional                                   | string | JWK Set address containing public keys for clients to verify JWT signatures                    |
| registration_endpoint                                    | ⛔ Optional                                   | string | Endpoint for registering clients when dynamic client registration is supported                 |
| scopes_supported                                         | ⛔ Recommended                                | array  | List of supported scopes                                                                       |
| response_types_supported                                 | ✅ Yes                                        | array  | Supported response types, such as code, token                                                  |
| response_modes_supported                                 | ⛔ Optional                                   | array  | Supported response modes, such as query, fragment, form_post                                   |
| grant_types_supported                                    | ⛔ Optional                                   | array  | Supported grant types, such as authorization_code, client_credentials                          |
| token_endpoint_auth_methods_supported                    | ⛔ Optional                                   | array  | Client authentication methods supported by the token endpoint, such as client_secret_basic     |
| token_endpoint_auth_signing_alg_values_supported         | ⛔ Optional                                   | array  | Signature algorithms supported when using JWT authentication at token endpoint, such as RS256  |
| service_documentation                                    | ⛔ Optional                                   | string | Developer documentation address                                                                |
| ui_locales_supported                                     | ⛔ Optional                                   | array  | List of languages supported by UI (e.g., zh-CN)                                                |
| op_policy_uri                                            | ⛔ Optional                                   | string | URL for the authorization server's policy on client data usage                                 |
| op_tos_uri                                               | ⛔ Optional                                   | string | Terms of service URL                                                                           |
| revocation_endpoint                                      | ⛔ Optional                                   | string | Token revocation endpoint (see RFC 7009)                                                       |
| revocation_endpoint_auth_methods_supported               | ⛔ Optional                                   | array  | Authentication methods supported by the revocation endpoint                                    |
| revocation_endpoint_auth_signing_alg_values_supported    | ⛔ Optional                                   | array  | JWT signature algorithms supported by the revocation endpoint                                  |
| introspection_endpoint                                   | ⛔ Optional                                   | string | Token status check endpoint (see RFC 7662)                                                     |
| introspection_endpoint_auth_methods_supported            | ⛔ Optional                                   | array  | Authentication methods supported by the introspection endpoint                                 |
| introspection_endpoint_auth_signing_alg_values_supported | ⛔ Optional                                   | array  | JWT signature algorithms supported by the introspection endpoint                               |
| code_challenge_methods_supported                         | ⛔ Optional                                   | array  | Supported PKCE code_challenge_method (e.g., S256)                                              |

Additionally, service providers can add custom fields.

### OAuth 2.0 Dynamic Client Registration Protocol - RFC 7591

The previous steps for registering to obtain ClientID were manual. This RFC essentially allows clients to automatically register themselves to get a ClientID and ClientSecret without requiring pre-registration by humans.

Registration example:

```bash
POST /register HTTP/1.1
Host: server.example.com
Content-Type: application/json

{
  "client_name": "AwesomeApp",
  "redirect_uris": [
    "https://awesome.example.com/oauth/callback"
  ],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "scope": "read write",
  "token_endpoint_auth_method": "client_secret_basic"
}
```

Possible response:

```bash
{
  "client_id": "s6BhdRkqt3",
  "client_secret": "7Fjfp0ZBr1KtDRbnfVdmIw",
  "registration_access_token": "access-token-123",
  "registration_client_uri": "https://server.example.com/register/s6BhdRkqt3",
  "client_id_issued_at": 1599389946,
  "client_secret_expires_at": 0
}
```

### OAuth 2.1

This revises OAuth 2.0 rather than completely rewriting it. The main differences are:

- Implicit and Resource Owner Password Credentials methods were removed due to security concerns
- All clients are required to use PKCE
- Refresh token rotation is recommended (the old one is discarded when refreshed)

I think the most important obvious difference is the mandatory use of PKCE (Proof Key for Code Exchange), a mechanism designed to prevent authorization code interception and replay, which basically works as follows:

1. The client randomly generates a string, which is the code_verifier
2. After SHA256 hashing and Base64 encoding the code_verifier, another random string is obtained, which is the code_challenge
3. The client can send the code_challenge and the corresponding hash algorithm code_challenge_method=S256 when making a request
4. After the user agrees to authorize, the server records the code_challenge
5. When the client exchanges the authorization_code for a token, it must include the original code_verifier
6. The authorization service will hash the code_verifier and compare it to confirm whether to accept the request

Let's look at the code:

```python
import secrets
import hashlib
import base64

def generate_code_verifier(length=64):
    # PKCE specification recommends length between 43-128 characters
    return base64.urlsafe_b64encode(secrets.token_bytes(length)).rstrip(b'=').decode('utf-8')

def generate_code_challenge(code_verifier):
    code_verifier_bytes = code_verifier.encode('utf-8')
    sha256_digest = hashlib.sha256(code_verifier_bytes).digest()
    code_challenge = base64.urlsafe_b64encode(sha256_digest).rstrip(b'=').decode('utf-8')
    return code_challenge

# Example
code_verifier = generate_code_verifier()
code_challenge = generate_code_challenge(code_verifier)

print("code_verifier:", code_verifier)
print("code_challenge:", code_challenge)
# code_verifier: 92Foogx4d9Q5cbDbmLrz7eCHfAxX06q-6FHhmyKQ0OMcGpRbu6CWzknxCUSuvJ6b5-D_dIaJB5mHfAIfk_Qu1A
# code_challenge: GFc8vy-W93jTehp7I3Fvzma2DH5JNjnRAoktZuHtywA
```

So the similar request is:

```bash
# Initiate authorization request
GET /authorize?
  response_type=code&
  client_id=abc123&
  redirect_uri=https://client.example.com/cb&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256&
  state=xyz

# Exchange for token
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=SplxlOBeZQQYbYS6WxSbIA&
redirect_uri=https://client.example.com/cb&
client_id=abc123&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

## Practical Examples

### GitHub OAuth APP Configuration

<div class="row mt-3">
  <div class="col-sm mt-3">
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/GitHubOAuth1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
  </div>
  <div class="col-sm mt-3">
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/GitHubOAuth2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/GitHubOAuth3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/GitHubOAuth4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
  </div>
</div>

Configure according to the screenshots above, and finally obtain the corresponding Client ID and Client Secret.

### CF Worker Deployment

Refer to https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-github-oauth

```bash
# 1. Initialize the project, yes for the first two steps, no for the last one because we haven't configured and can't deploy yet
npm create cloudflare@latest -- mcp-github-oauth --template=cloudflare/ai/demos/remote-mcp-github-oauth
# 2. Install wrangler
npm install -g wrangler
# 3. Configure client id and client secret
cd mcp-github-oauth
wrangler secret put GITHUB_CLIENT_ID
# Enter GitHub Client ID, then y
wrangler secret put GITHUB_CLIENT_SECRET
# Enter GitHub Client Secret
wrangler secret put COOKIE_ENCRYPTION_KEY
# Enter a random string, you can use openssl rand -hex 32
# 4. Set up KV namespace
wrangler kv:namespace create "OAUTH_KV"
# This will generate a corresponding id, copy and write to the wrangler.jsonrc file
	"kv_namespaces": [
		{
			"binding": "OAUTH_KV",
			"id": "abc123"
		}
	],
# 5. Deploy to Worker, this will jump to browser login and similar operations, finally select the user to upload
npm run deploy
```

Screenshots of the related operations are as follows:

<div class="row mt-3">
  <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/MCPGitHubOAuth1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/MCPGitHubOAuth2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
  </div>
  <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/MCPGitHubOAuth3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/MCPGitHubOAuth4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
  </div>
</div>

### Testing

Currently, there are few clients that support MCP authentication, and cursor has no plans to support it at the moment. We'll use the official inspector for testing:

```bash
npx @modelcontextprotocol/inspector@latest
```

Connect via SSE, such as https://mcp-github-oauth.ifuryst.workers.dev/sse

The general flow is: after connecting, a 401 is returned because there is no authentication authorization. At this point, the MCP Client will discover authentication information based on the Server Metadata Discovery exposed by MCP Servers (at https://mcp-github-oauth.ifuryst.workers.dev/.well-known/oauth-authorization-server) and redirect to the corresponding address for authentication. Here, it will first go to the service page deployed on CF Worker, and after clicking confirm, it will jump to GitHub for actual authentication, and finally jump back to the MCP Client's callback interface, usually /oauth/callback, such as http://127.0.0.1:6274/oauth/callback for Inspector.

<div class="row mt-3">
  <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/MCPGitHubOAuth5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/MCPGitHubOAuth6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
  </div>
  <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/MCPGitHubOAuth7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/MCPGitHubOAuth8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
  </div>
  <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
      {% include figure.liquid loading="eager" path="/assets/img/2025-05-12-mcp-authorization/MCPGitHubOAuth9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
  </div>
</div>

The entire flow in the browser is relatively smooth. If it's a client-side MCP Client, it typically redirects to the browser for login or opens an external webpage within the application for login. This involves the application itself also needing to listen, as it needs to handle the callback.

## Conclusion

MCP is a young protocol, proposed just half a year ago, and the authentication scheme was only included in the March revision. There is actually some controversy here, with some people believing this is not best practice. We can see [the discussion here](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/205). That is, now the MCP Server is more often treated as an OAuth authorization server, which is a burden for MCP Server providers. Most MCP Servers tend to be lightweight or microservice-oriented, and requiring them to integrate the corresponding authentication is undoubtedly a huge effort.

Based on this, MCP Gateway is currently developing a client-side authentication system, allowing MCP Gateway to adapt to more scenarios, and various services can also connect to MCP Gateway to quickly adapt to authentication scenarios.

If you're interested in my open-source project, feel free to use, provide feedback, and participate in any contributions:

https://github.com/mcp-ecosystem/mcp-gateway
