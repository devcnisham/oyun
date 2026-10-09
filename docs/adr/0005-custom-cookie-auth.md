# ADR-0005: Custom cookie sessions for admin and partner

Status: Accepted, to be tightened

## Context
A few operator accounts, provisioned from the environment.

## Decision
HMAC-signed httpOnly session cookie; scrypt password hashes in the store; a role and permission table for partners.

## Trade-off
Simple and dependency-free. No MFA, no revocation list, lockout held in memory.

## Reopen when
When more than a handful of operators exist (tasks P9-09, P9-06).
