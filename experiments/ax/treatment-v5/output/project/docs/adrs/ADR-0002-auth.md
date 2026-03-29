---
nav_exclude: true
---


# ADR-0002: Authentication and Password Hashing Strategy

**Date:** 2026-03-14  
**Status:** Accepted  
**Deciders:** Experiment team  
**Tags:** security, authentication, dependencies

## Context

The RealWorld specification mandates stateless authentication with the header format `Authorization: Token <jwt>`. Users register with email/username/password, receive a JWT on successful authentication, and present that token for subsequent requests requiring authorization.

Password storage and token management are security-critical components. Incorrect choices expose the application to credential theft, session hijacking, and dependency vulnerabilities. The decision must balance security best practices, implementation simplicity, and dependency audit compliance (per CLAUDE.md § Dependency Registry, zero HIGH/CRITICAL CVEs are permitted).

## Decision

1. **Authentication mechanism**: Stateless JWT using the `jsonwebtoken` library
2. **Password hashing**: argon2 via the `argon2` npm package (v0.41+)
3. **Token signing**: HS256 algorithm with a 256-bit secret from `process.env.JWT_SECRET`
4. **Token expiry**: Configurable via `process.env.JWT_EXPIRY` (default: 7 days), cast as `SignOptions['expiresIn']` per CLAUDE.md § Known Type Pitfalls
5. **No refresh tokens**: Out of scope for RealWorld specification; tokens are long-lived

**JWT payload structure:**
