# Security

Source: https://soheil.fi/developers/docs/security/

What the contract can and cannot do, and how changes are announced.

## Design

-   The contract holds no funds between trades, has no upgrade path and no `delegatecall`.
-   It approves only the trade's own tokens, for the exact amount of each call, and resets the approval right after.
-   It refuses any call that would use or hand out its own token rights (`transferFrom`, `approve` and similar), whatever contract it calls.
-   The owner can never move users' funds or charge more than a quote showed.

## Changes

A new contract to call, or a new fee wallet, takes effect only **2 days** after the owner announces it on-chain, so a stolen owner key cannot use one at once. The owner can pause trading, or remove a contract, at once.

## Reporting

> Reviewed internally, with tests for every finding; no third-party audit yet. Report a vulnerability to security \[at\] soheil.fi.
