# Parent reconciliation QA

The normal application is the root Vite entry. `parent-fixture.html` is a
development-only entry rendering the actual Journey and navigation components
with synthetic in-memory data, including a long name, learning artwork, journal
semantics, 29 events, updates, retraction, empty and unavailable states.
It makes no API requests and saves no records. It is not included in the normal
production build. Open `/qa/parent-fixture.html` on the Vite development server.

For isolated local QA alongside the usual servers, run the backend on port 3002
and run the client with:

```sh
VITE_API_BASE_URL=http://localhost:3102 npm run dev -- --config qa/vite.config.mjs
```

The QA-only relay targets local port 3002 and uses the backend's existing
development origin policy. It does not change production API configuration.
The root application on port 3102 still uses real demo data and normal sessions.

The existing journal endpoint returns at most 50 entries and offers no paging.
Journey discloses this window when reached instead of presenting it as complete.
All returned events remain accessible through progressive reveal. Feedback uses
the existing full-history endpoint, with own-child authorization for parents.
