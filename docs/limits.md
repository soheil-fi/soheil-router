# Rate limits

Source: https://soheil.fi/developers/docs/limits/

What a new key starts with, and what happens over the limit.

## Limits

| Limit | New key |
| --- | --- |
| Requests a minute | 60 |
| Requests a month | 50,000 |

Every call your key makes counts, except the ones refused for the key or its limits.

| Header | On every answer |
| --- | --- |
| `X-RateLimit-Limit` | requests a minute for your key |
| `X-RateLimit-Remaining` | what is left this minute |
| `X-RateLimit-Reset` | seconds until the minute starts again |

Over the minute limit the answer is `429 RATE_LIMITED`; over the month, `429 QUOTA_EXCEEDED` (it starts again on the 1st, UTC). Both say in `Retry-After` how many seconds to wait.

> Need more? Write to developers \[at\] soheil.fi with your expected volume.
