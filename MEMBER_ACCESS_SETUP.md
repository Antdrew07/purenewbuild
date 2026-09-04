# Member Access and Turnstile Deployment

## Purpose

The storefront now requires adult member access before visitors can browse products or place an order. Registration records an explicit age confirmation, creates a bcrypt password hash, and returns a 12-hour member session. Checkout also requires that session, and the order email must match the account email.

Cloudflare Turnstile protects both registration and sign-in. The browser sends a short-lived token to the API. The API validates that token with Cloudflare before it creates a session or account. The application fails closed when the required Turnstile configuration is absent, so an incomplete setup does not look protected.

## Required deployment settings

Create a Turnstile widget in the Cloudflare dashboard for every hostname that will host the storefront. Add the following variables to the web and API services.

| Service | Variable | Value | Visibility |
|---|---|---|---|
| Web | `NEXT_PUBLIC_API_URL` | Public URL of the deployed API | Public browser configuration |
| Web | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile widget site key | Public browser configuration |
| API | `DATABASE_URL` | Production PostgreSQL connection string | Secret |
| API | `JWT_SECRET` | Random secret generated with `openssl rand -base64 48` | Secret |
| API | `TURNSTILE_SECRET_KEY` | Turnstile widget secret key | Secret |
| API | `TURNSTILE_EXPECTED_HOSTNAME` | Exact public storefront hostname, for example `www.purepeptide.us` | Non-secret configuration |
| API | `CORS_ORIGIN` | Exact public storefront origin, for example `https://www.purepeptide.us` | Non-secret configuration |

The site key may be exposed to the browser. The Turnstile secret key must be stored only in the API environment and must never be committed, placed in a browser variable, or supplied to a client request. Cloudflare requires a server-side Siteverify call because browser tokens can be forged, expire after five minutes, and are valid only once.[1]

## Release sequence

First, deploy the API with the environment variables above. Next, run `npm run db:push --workspace=api` once against the production database to create the `member_users` table. Then deploy the web application with both public variables. Confirm that a user can create an account after the Turnstile challenge succeeds, refresh the page and remain signed in, and place an order using the same email address as the account.

Use the final storefront hostname as the expected hostname and include that hostname in the Turnstile widget configuration. Do not use a placeholder hostname in production. After any unsuccessful challenge, the user must receive a fresh token before retrying because Turnstile tokens are single-use.[1]

## Current behavior

| Area | Behavior |
|---|---|
| Initial entry | Full-screen adult research-use disclaimer and member sign-in/registration gate |
| Registration | Requires email, a password with at least 12 characters, adult confirmation, and a valid Turnstile token |
| Sign-in | Requires email, password, and a valid Turnstile token |
| Session | Stored locally in the browser and expires after 12 hours according to the API token |
| Checkout | Requires the member session and verifies that the checkout email matches the account email |
| Bot defense | Rate limits registration and login, then validates each Turnstile token server-side |

## References

[1]: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ "Validate the token · Cloudflare Turnstile docs"
