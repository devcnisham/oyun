# ADR-0004: Clerk is optional; a device identity is the fallback

Status: Accepted, to be tightened

## Context
Launch must work with no keys, and demos should not need accounts.

## Decision
With the Clerk key, sign-in is required before paying; without it, a name and phone kept on the device.

## Trade-off
Easy local development. The fallback is not authentication: it weakens wallet and ticket security.

## Reopen when
Make Clerk mandatory in production (task P9-03).
