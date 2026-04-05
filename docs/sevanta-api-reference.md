# Sevanta Dealflow CRM API Reference

> **Last updated**: 2026-03-18
>
> This document captures not just endpoint specs, but all the hard-won tribal knowledge from months of production integration. It serves both human developers and AI agents working with the API.

---

## Table of Contents

- [1. Quick Start](#1-quick-start)
- [2. The Field Name Duality Problem](#2-the-field-name-duality-problem)
- [3. Response Format Reference](#3-response-format-reference)
- [4. Schema Endpoints](#4-schema-endpoints)
- [5. Deal Endpoints](#5-deal-endpoints)
- [6. Contact Endpoints](#6-contact-endpoints)
- [7. Task Endpoints](#7-task-endpoints)
- [8. Other Endpoints](#8-other-endpoints)
- [9. Search Strategy Guide](#9-search-strategy-guide)
- [10. Default Values Reference](#10-default-values-reference)
- [11. Validation Rules](#11-validation-rules)
- [12. CRM URL Formats](#12-crm-url-formats)
- [13. Rate Limiting Details](#13-rate-limiting-details)
- [14. Error Reference](#14-error-reference)
- [15. Date Format](#15-date-format)
- [16. Gotchas & Tribal Knowledge](#16-gotchas--tribal-knowledge)
- [17. Appendix: Complete Endpoint Summary](#17-appendix-complete-endpoint-summary)

---

## 1. Quick Start

**Base URL**: `https://run.mydealflow.com/inv/api`

### Authentication (3 methods)

| Method | Header / Mechanism | Expiry | Notes |
|---|---|---|---|
| Session cookies | `credentials: 'include'` (no header) | Browser session | Used by this Chrome Extension |
| OAuth2 Bearer | `Authorization: Bearer ACCESS_TOKEN` | 3 months | For server-to-server |
| API Key | `Authorization: API-Key API_KEY` | 1 year | For long-lived integrations |

### Critical Warnings

> **POST requests use `application/x-www-form-urlencoded`, NOT JSON.**
>
> The API will silently ignore JSON request bodies. Always use `URLSearchParams` / form encoding for POST.

```typescript
// CORRECT
const formData = new URLSearchParams();
formData.append('CompanyName', 'Acme Corp');
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: formData.toString(),
});

// WRONG — will silently fail or create empty records
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ CompanyName: 'Acme Corp' }),
});
```

### Rate Limits

- **Hard limit**: 100 requests per minute
- **Recommended throttle**: 600ms between requests
- **Request timeout**: 30 seconds
- Returns HTTP 429 on violation; consistent exceeding may lead to IP block

---

## 2. The Field Name Duality Problem

**This is the single most confusing aspect of the API.** The schema defines two names for every field, and different operations use different names.

### The Rule

| Operation | Uses | Example |
|---|---|---|
| Schema definition | Both `dbname` and `label` | `{ dbname: "CompanyName", label: "Deal Name" }` |
| **GET responses** (list/detail) | **Labels** as keys | `{ "Deal Name": "Acme Corp" }` |
| **POST requests** (create/update) | **dbnames** as params | `CompanyName=Acme+Corp` |
| **Filters** on list endpoints | **dbnames** | `filter[CompanyName]=Acme` |

### Concrete Example

**Schema says:**
```json
{ "dbname": "CompanyName", "label": "Deal Name", "type": "text" }
```

**GET /deal/123 returns:**
```json
{ "data": { "Deal Name": "Acme Corp", "Website": "https://acme.com" } }
```

**POST /deal/add expects:**
```
CompanyName=Acme+Corp&Website=https%3A%2F%2Facme.com
```

### Common Fields Reference

| dbname | Label | Type | Notes |
|---|---|---|---|
| `CompanyName` | Deal Name | string | **Required** for deal creation |
| `Description` | Description | textarea | |
| `Website` | Website | url | |
| `SourceTypeID` | Source Type | dropdown | Default: `RES` (Research) |
| `Source` | Source Notes | textarea | Auto-set: `"Uploaded via Sevanta Uploader"` |
| `PastInvestments` | Past Investments | textarea | |
| `StageID` | Stage | dropdown | Default: `0` (Screening) |
| `StatusID` | Status | dropdown | Default: `1` (Active) |
| `SectorID` | Sector | dropdown | |
| `FundID` | Fund | multi-check | Default: `INV` — use `FundID[]=INV` syntax |
| `Name` | Contact Name | string | **Required** for contact creation |
| `Email` | Email | email | Contact field |
| `MobilePhone` | Mobile Phone | tel | Also: `HomePhone`, `WorkPhone` |
| `Title` | Title | string | Contact field |
| `CompanyID` | Company | int | Links contact to deal |
| `ContactTypeID` | Contact Type | dropdown | Default: `MGT` (Management) |

---

## 3. Response Format Reference

### Success Response

```json
{ "status": "ok", "data": ... }
```

### Error Response

```json
{ "error": "Error message" }
```

### Schema Response

`data` is an **OBJECT** keyed by field name, not an array:

```json
{
  "status": "ok",
  "data": {
    "CompanyName": {
      "dbname": "CompanyName",
      "label": "Deal Name",
      "type": "text",
      "optionlist": null
    },
    "StageID": {
      "dbname": "StageID",
      "label": "Stage",
      "type": "select",
      "optionlist": { "0": "Screening", "1": "Passed", "PF": "Portfolio" }
    }
  }
}
```

### List Response (with `_x[]` fields)

```json
{
  "status": "ok",
  "data": [ { "CompanyID": 123, "Deal Name": "Acme", "Website": "https://acme.com" } ],
  "count_returned": 1,
  "count_total": 1
}
```

### List Response (WITHOUT `_x[]` fields)

Returns **array of IDs only**:

```json
[123, 456, 789]
```

### Create Response

The `CompanyID` / `ContactID` / `TaskID` can appear at multiple locations:

```typescript
// Deal creation — check all of these:
result.CompanyID           // number, at top level
result.data?.CompanyID     // string | number, inside data
result.id                  // string, alternative
result.deal?.id            // string, nested alternative

// Contact creation:
result.ContactID           // number
result.id                  // string

// Task creation:
result.TaskID              // number
result.id                  // string
```

---

## 4. Schema Endpoints

### `GET /schema/deals`

Returns all deal field definitions.

### `GET /schema/contacts`

Returns all contact field definitions.

### Response Shape

```json
{
  "status": "ok",
  "data": {
    "<FieldName>": {
      "dbname": "FieldName",
      "label": "Display Label",
      "type": "text|select|int|float|date|url|email|boolean|textarea|tel|multi-check|multi-tag|radio",
      "optiongroup": "group_name",
      "helptext": "Help text",
      "optionlist": { "KEY": "Display Label" }
    }
  }
}
```

### Field Type Mapping

| API Type | Normalized Type | Notes |
|---|---|---|
| `select`, `multi-check`, `multi-tag`, `radio` | dropdown | All treated as selection fields |
| `int`, `float`, `number`, `integer` | number | |
| `date`, `datetime` | date | Format: `dd-mm-yyyy` (see [Section 15](#15-date-format)) |
| `url` | url | Auto-prepend `https://` if missing |
| `email` | email | |
| `boolean`, `bool` | boolean | |
| `text`, `textarea`, `tel`, *(default)* | string | |

### Optionlist Format

Options are an **object** `{ KEY: "Label" }`, NOT an array:

```json
"optionlist": {
  "RES": "Research",
  "REF": "Referral",
  "CON": "Conference"
}
```

**When POSTing, send the KEY (e.g., `RES`), not the label (e.g., `Research`).**

### Cache TTL

Schema data is cached for **1 hour** (3,600,000ms). Use connection check (`GET /schema/deals`) to verify authentication.

---

## 5. Deal Endpoints

### 5.1 `GET /deal/{id}`

Get a single deal by ID.

**Optional query params:**
- `_x[]=FieldName` — include specific fields in response
- `_x[]=contacts` — include linked contacts
- `_x[]=tasks` — include associated tasks
- `_x[]=emails` — include associated emails (without body)
- `_x[]=files` — include associated files (without content)

**Response note:** Keys are LABELS, not dbnames.

```json
{
  "status": "ok",
  "data": {
    "CompanyID": 123,
    "Deal Name": "Acme Corp",
    "Website": "https://acme.com"
  }
}
```

### 5.2 `GET /deal/list`

List/search deals.

**Query params:**

| Param | Description | Notes |
|---|---|---|
| `FieldName[]=rawKey` | Filter by dropdown field | Uses raw option key, array notation (see below) |
| `_text=string` | Full-text search | Searches all text fields — **most reliable** |
| `_ss=string` | Semantic search | Returns top 20 with `semantic_score` |
| `_x[]=FieldName` | Include field in response | Without this, returns IDs only |
| `_offset=N` | Pagination offset | 100 records per page when using `_x[]` |

> **CRITICAL: Server-side filtering uses `FieldName[]=rawKey` (PHP array notation), NOT `filter[FieldName]=value`.**
> The `filter[]` syntax is silently ignored by the API. Use the raw option key from the schema's `optionlist`,
> not the display label. Example: `StageID[]=0&StatusID[]=1` (not `filter[StageID]=A1&filter[StatusID]=Active`).
> Stage mapping: `0`=A1, `1`=A2, `2`=A3, `3`=B1, `4`=B2, `5`=B3, `6`=C1, `7`=C2, `8`=C3, `9`=D1.
> Status: `0`=Inactive, `1`=Active.

> **WARNING**: Calling `/deal/list` with **no filter** returns only deals edited today. Always include a search parameter.

**Example — search by text:**
```
GET /deal/list?_text=Acme&_x[]=CompanyName&_x[]=Website
```

**Example — semantic search:**
```
GET /deal/list?_ss=artificial+intelligence+healthcare&_x[]=CompanyName&_x[]=Website
```

Response includes `semantic_score` per result (0.0–1.0). Use threshold ≥ 0.8 for high-confidence matches.

### 5.3 `POST /deal/add`

Create a new deal.

**Content-Type**: `application/x-www-form-urlencoded`

**Required**: `CompanyName`

**Multi-value fields**: Use array notation — `FundID[]=INV`

```
CompanyName=Acme+Corp&Website=https%3A%2F%2Facme.com&SourceTypeID=RES&FundID[]=INV&StageID=0&StatusID=1
```

**Success response:**
```json
{ "status": "ok", "CompanyID": 456 }
```

### 5.4 `POST /deal/{id}/addComment`

Add a comment to an existing deal.

**Content-Type**: `application/x-www-form-urlencoded`

**Parameter**: `comment` (the comment text)

```
comment=Uploaded+via+Sevanta+Uploader+on+2026-03-18
```

---

## 6. Contact Endpoints

### 6.1 `GET /contact/{id}`

Get a single contact.

**Response note:** The name field key is `"Contact Name"` (with space!), not `"Name"`.

```json
{
  "status": "ok",
  "data": {
    "ContactID": 789,
    "Contact Name": "Jane Smith",
    "Email": "jane@acme.com",
    "Company": "Acme Corp",
    "CompanyID": 123
  }
}
```

### 6.2 `GET /contact/list`

Search/list contacts.

**Recommended approach**: Use `_text=` for search. **`filter[Email]` is unreliable** — it doesn't always find exact matches.

```
GET /contact/list?_text=jane@acme.com&_x[]=Name&_x[]=Email&_x[]=Company&_x[]=CompanyID
```

Then filter results client-side for exact email match.

**Filter by company** (reliable):
```
GET /contact/list?filter[CompanyID]=123&_x[]=Name&_x[]=Email&_x[]=Company&_x[]=CompanyID
```

### 6.3 `POST /contact/add`

Create a new contact.

**Content-Type**: `application/x-www-form-urlencoded`

**Required**: `Name`

**Link to deal**: Include `CompanyID` parameter (the deal's ID).

**Contact type codes** (`ContactTypeID`):
- `MGT` — Management (default)
- `SRC` — Source

```
Name=Jane+Smith&Email=jane%40acme.com&CompanyID=123&ContactTypeID=MGT&MobilePhone=555-1234&Title=CEO
```

### 6.4 `POST /contact/{id}/addNote`

Add a note to an existing contact.

**Content-Type**: `application/x-www-form-urlencoded`

**Parameter**: `note` (the note text)

---

## 7. Task Endpoints

### 7.1 `GET /task/{id}` / `GET /task/list`

**Default behavior**: `/task/list` returns **pending tasks only**.

**Query params:**
- `_x[]=*` — include all fields
- `TaskStatusID[]=0` — filter by status (multi-value)
- `AssignedUserID[]=<id>` — filter by assignee (multi-value)

**Status IDs**: `0` = Pending, `1` = Completed, `2` = Cancelled

**Type IDs**: `0` = Normal, `1` = Urgent, `2` = Meeting

**Example — all pending and completed tasks:**
```
GET /task/list?_x[]=*&TaskStatusID[]=0&TaskStatusID[]=1
```

**Task response fields** (label-based keys):

| Key | Type | Description |
|---|---|---|
| `TaskID` | number | Unique task ID |
| `Task` | string | Task description |
| `Status` | string | `"Pending"`, `"Completed"`, `"Cancelled"` |
| `Type` | string | `"Normal"`, `"Urgent"`, `"Meeting"` |
| `For` | string | Assignee display name |
| `Assignees` | string | Assignee(s) |
| `Created By` | string | Creator display name |
| `ObjectID` | number | Linked deal/contact ID |
| `Deadline` | string | `dd-mm-yyyy` format |
| `Reminder` | string | Reminder date |
| `Date Created` | string | `dd-mm-yyyy` format |
| `Date Last Modified` | string | Last modification date |
| `Last Modified By` | string | Last modifier |
| `record_link` | string | CRM link to record |

### 7.2 `POST /task/add`

Create a new task.

**Content-Type**: `application/x-www-form-urlencoded`

**Required**: `TaskDescription`

**Optional params:**

| Param | Type | Notes |
|---|---|---|
| `TaskDescription` | string | **Required** |
| `TaskStatusID` | string | `"0"` = Pending (default) |
| `TaskTypeID` | string | `"0"` = Normal, `"1"` = Urgent, `"2"` = Meeting |
| `AssignedUserID` | string | User ID |
| `DateDeadline` | string | `dd-mm-yyyy` format |
| `DateReminder` | string | `dd-mm-yyyy` format |
| `CompanyID` | string | Link to deal |
| `ContactID` | string | Link to contact |

**Success response:**
```json
{ "status": "ok", "TaskID": 42 }
```

### 7.3 `POST /task/{id}`

Update an existing task. Same params as create.

**Content-Type**: `application/x-www-form-urlencoded`

---

## 8. Other Endpoints

### `GET /user/list` / `GET /user/{id}`

List or get users.

> **Inconsistent casing warning**: The response uses **both** `UserID`/`id` and `Name`/`name` — check both.

```typescript
// Handle both casings:
const userId = (user.UserID || user.id || '').toString();
const userName = user.Name || user.name || '';
```

### `GET /activity/`

Activity log. Returns 25 entries per page, newest first.

**Filters:**

| Param | Description |
|---|---|
| `s` | Search text |
| `sDate0` | Start date |
| `eDate0` | End date |
| `UserID` | Filter by user |
| `CompanyID` | Filter by deal |
| `ContactID` | Filter by contact |
| `minID` | Pagination (get records after this ID) |

### `GET /email/{id}`

Get a single email with full body content. (List endpoints via `_x[]=emails` omit the body.)

---

## 9. Search Strategy Guide

Battle-tested from production. In order of reliability:

### Text Search (`_text=`)

**Most reliable.** Searches across all text fields.

```
GET /deal/list?_text=Acme&_x[]=CompanyName&_x[]=Website
```

- Returns all records where any text field contains the search term
- **Requires client-side post-filtering** for exact matches
- Preferred over `filter[]` for most use cases

### Semantic Search (`_ss=`)

Returns top 20 results ranked by meaning similarity.

```
GET /deal/list?_ss=artificial+intelligence&_x[]=CompanyName&_x[]=Website
```

- Each result includes `semantic_score` (0.0–1.0)
- **Threshold**: ≥ 0.8 for high-confidence matches
- Useful as a fallback when text search returns no results

### Server-Side Field Filtering (`FieldName[]=rawKey`)

Filter dropdown/select fields server-side using **PHP array notation with raw option keys**:

```
GET /deal/list?StageID[]=0&StatusID[]=1&_x[]=CompanyName
```

- Uses the raw key from `optionlist` (e.g., `0` for A1), NOT the label
- **IMPORTANT**: `filter[FieldName]=value` does NOT work — it is silently ignored
- Reliable for dropdown fields (`StageID`, `StatusID`, `UserID`, etc.)
- For text fields like `Email`, prefer `_text=` and client-side filtering

### Duplicate Detection Algorithm (4-phase, production-tested)

Our production code uses this strategy to detect duplicate companies:

**Phase 1 — Text search with original name:**
```
GET /deal/list?_text=NovaLink+Space+Ltd.&_x[]=CompanyName&_x[]=Website
```
Client-side fuzzy match results against input name.

**Phase 2 — Text search with suffix-stripped name** (if Phase 1 found no fuzzy matches):
```
GET /deal/list?_text=novalink+space&_x[]=CompanyName&_x[]=Website
```

**Phase 3 — Semantic search** (if Phase 2 found no fuzzy matches):
```
GET /deal/list?_ss=NovaLink+Space+Ltd.&_x[]=CompanyName&_x[]=Website
```
Filter results where `semantic_score > 0.8` AND fuzzy name match.

**Phase 4 — Website search** (if no name matches found):
```
GET /deal/list?_text=novalink.com&_x[]=CompanyName&_x[]=Website
```
Client-side normalized website comparison.

### Company Name Fuzzy Matching (3-level)

Used in client-side post-filtering after API search:

| Level | Strategy | Example Match |
|---|---|---|
| 1. Exact (normalized) | Lowercase, strip punctuation → slug | `"Acme Inc."` = `"acme-inc"` |
| 2. Partial containment | One contains the other | `"Acme"` ⊂ `"Acme Technologies"` |
| 3. Suffix-stripped | Remove Ltd/Inc/LLC/Corp/etc | `"Acme Ltd."` = `"Acme Inc."` (both → `"acme"`) |

**Normalization:**
```typescript
// "Marquee AI Ltd." → "marquee-ai-ltd"
name.toLowerCase()
  .replace(/['']/g, '')           // Remove apostrophes
  .replace(/[^a-z0-9]+/g, '-')   // Non-alphanumeric → dashes
  .replace(/^-+|-+$/g, '');      // Trim dashes
```

**Suffix stripping** (end-of-name only):
`ltd`, `inc`, `llc`, `corp`, `co`, `technologies`, `tech`, `medical`, `limited`, `incorporated`, `corporation`

### Website Normalization

```typescript
url.toLowerCase()
  .replace(/^https?:\/\//, '')  // Strip protocol
  .replace(/^www\./, '')        // Strip www
  .replace(/\/$/, '');          // Strip trailing slash
```

---

## 10. Default Values Reference

These defaults are automatically applied during upload if the field is empty:

| Field (dbname) | Default Value | Meaning |
|---|---|---|
| `SourceTypeID` | `RES` | Research |
| `FundID[]` | `INV` | Investment fund (multi-check, requires `[]` suffix) |
| `StageID` | `0` | Screening |
| `StatusID` | `1` | Active |
| `Source` | `Uploaded via Sevanta Uploader` | Auto-generated (varies by source: `Dealigence`, `IVC`, `Timeless`) |
| `ContactTypeID` | `MGT` | Management (contact default) |

Defaults only fill **missing** fields — they never overwrite existing CSV values.

---

## 11. Validation Rules

| Type | Rule | Details |
|---|---|---|
| **Required** | Non-empty after trim | `CompanyName` for deals, `Name` for contacts |
| **Dropdown** | Case-insensitive match against `optionlist` keys | Auto-corrects casing to match the canonical key |
| **URL** | Valid URL format | Auto-prepends `https://` if no protocol present |
| **Email** | Regex: `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` | Requires TLD of 2+ characters |
| **Number** | `isNaN(Number(value))` check | Must parse as number |
| **Date** | `new Date(value)` must be valid | See [Date Format](#15-date-format) for CRM-specific format |
| **Unknown fields** | Warning (not error) | Flagged but allowed through |

---

## 12. CRM URL Formats

The CRM uses **hash routing** (`#/`), NOT REST-style paths.

| Entity | URL Pattern |
|---|---|
| **Deal/Company** | `https://run.mydealflow.com/inv/#/Company.php?CompanyID={id}` |
| **Contact** | `https://run.mydealflow.com/inv/#/Contact.php?ContactID={id}` |
| **Task** | `https://run.mydealflow.com/inv/#/Task.php?TaskID={id}` |

> **Wrong**: `https://run.mydealflow.com/inv/contact/123`
>
> **Right**: `https://run.mydealflow.com/inv/#/Contact.php?ContactID=123`

---

## 13. Rate Limiting Details

| Setting | Value | Source |
|---|---|---|
| Throttle delay between requests | 600ms | `RATE_LIMIT_DELAY_MS` |
| Max queued requests | 100 | `RATE_LIMIT_MAX_QUEUE_SIZE` |
| Request timeout | 30,000ms (30s) | `REQUEST_TIMEOUT_MS` |
| Duplicate check batch size | 10 | `DUPLICATE_CHECK_BATCH_SIZE` |
| Schema cache TTL | 3,600,000ms (1 hour) | `SCHEMA_CACHE_TTL_MS` |
| User list cache TTL | 3,600,000ms (1 hour) | `USER_LIST_CACHE_TTL_MS` |
| Typeahead debounce | 300ms | `TASK_TYPEAHEAD_DEBOUNCE_MS` |

### Queue Behavior

Requests are queued and processed sequentially with a 600ms delay between each. If the queue exceeds 100 requests, new requests are rejected with `QUEUE_OVERFLOW` error immediately (no waiting).

---

## 14. Error Reference

| Error Code | HTTP Status | Meaning | Handling |
|---|---|---|---|
| `NOT_AUTHENTICATED` | 401 / 403 | Session expired or not logged in | Redirect to login / re-authenticate |
| `RATE_LIMITED` | 429 | Exceeded 100 req/min | Back off; reduce request frequency |
| `REQUEST_TIMEOUT` | — (client) | No response within 30s | Retry with backoff; check network |
| `QUEUE_OVERFLOW` | — (client) | 100+ requests queued | Wait for queue to drain before sending more |
| `API Error: {status}` | Any other HTTP error | Server error | Check status code, retry if 5xx |
| `{ "error": "..." }` | 200 | Business logic error in response body | Read error message for details |
| `Unknown response format` | 200 | Success response doesn't match expected shape | Check for API changes |

---

## 15. Date Format

> **The CRM uses European date format: `dd-mm-yyyy`**
>
> This is NOT ISO 8601 (`yyyy-mm-dd`) and NOT US format (`mm-dd-yyyy`).

**Parsing:**
```typescript
// "18-03-2026" → March 18, 2026
const parts = str.split(/[-/ ]/);
const day = parseInt(parts[0], 10);
const month = parseInt(parts[1], 10) - 1; // 0-indexed
const year = parseInt(parts[2], 10);
new Date(year, month, day);
```

**Formatting:**
```typescript
const dd = String(date.getDate()).padStart(2, '0');
const mm = String(date.getMonth() + 1).padStart(2, '0');
const yyyy = date.getFullYear();
return `${dd}-${mm}-${yyyy}`; // "18-03-2026"
```

Some responses include time: `"18-03-2026 14:30"`. The parser handles both formats.

---

## 16. Gotchas & Tribal Knowledge

Severity-rated checklist of non-obvious behaviors.

### CRITICAL

- [ ] **POST = form-urlencoded, not JSON.** The API silently ignores JSON bodies. Always use `URLSearchParams`.
- [ ] **GET responses use LABELS as keys, POST uses DBNAMES.** `"Deal Name"` in responses, `CompanyName` in requests. Mix them up and nothing works.
- [ ] **No filter on `/deal/list` = today's deals only.** Always include `_text=`, `_ss=`, or `FieldName[]=value`.
- [ ] **`filter[FieldName]=value` does NOT work.** Use `FieldName[]=rawKey` (PHP array notation with raw option keys) for server-side filtering. The `filter[]` syntax is silently ignored.
- [ ] **For text field search (e.g., Email), use `_text=`** then filter client-side for exact match.
- [ ] **Date format is `dd-mm-yyyy`, not ISO.** Sending `2026-03-18` will be misinterpreted or rejected.
- [ ] **CRM URLs use hash routing** (`#/Company.php?CompanyID=`), not REST paths.

### HIGH

- [ ] **Schema `data` is an object, not an array.** `Object.values(response.data)` to get field list.
- [ ] **`optionlist` is `{ KEY: Label }`, not an array.** POST the KEY, display the Label.
- [ ] **Multi-value fields need `[]` suffix.** `FundID[]=INV`, not `FundID=INV`. Same for `TaskStatusID[]`, `AssignedUserID[]`.
- [ ] **List without `_x[]` returns IDs only.** You'll get `[123, 456]` instead of objects.
- [ ] **Contact name key has a space.** Response key is `"Contact Name"`, not `"ContactName"` or `"Name"`.
- [ ] **User endpoint has inconsistent casing.** Check both `UserID`/`id` and `Name`/`name`.
- [ ] **Create response: check multiple locations for ID.** `result.CompanyID`, `result.data?.CompanyID`, `result.id`, `result.deal?.id`.

### MEDIUM

- [ ] **Semantic search returns max 20 results.** Don't rely on it for exhaustive searches.
- [ ] **100 records per page** when using `_x[]` fields. Use `_offset=N` for pagination.
- [ ] **Activity endpoint returns 25 per page.** Use `minID` for pagination.
- [ ] **Email list (`_x[]=emails`) omits body.** Use `GET /email/{id}` for full content.
- [ ] **Empty values should be excluded from POST.** Don't send `CompanyName=` (empty string) — skip the field entirely.

### LOW

- [ ] **Dropdown validation is case-insensitive** but the API may expect exact casing for option keys. Normalize before sending.
- [ ] **URL validation auto-prepends `https://`** if no protocol is present. Don't double-prepend.
- [ ] **Schema cache is 1 hour.** Changes to field definitions won't appear until cache expires.

---

## 17. Appendix: Complete Endpoint Summary

| Endpoint | Method | Required Params | Content-Type | Notes |
|---|---|---|---|---|
| `/schema/deals` | GET | — | — | Schema for deal fields |
| `/schema/contacts` | GET | — | — | Schema for contact fields |
| `/deal/{id}` | GET | — | — | Optional `_x[]` for fields |
| `/deal/list` | GET | — | — | `_text=`, `_ss=`, `filter[]`, `_x[]`, `_offset=` |
| `/deal/add` | POST | `CompanyName` | `x-www-form-urlencoded` | Returns `CompanyID` |
| `/deal/{id}/addComment` | POST | `comment` | `x-www-form-urlencoded` | |
| `/contact/{id}` | GET | — | — | Response key: `"Contact Name"` |
| `/contact/list` | GET | — | — | `_text=`, `filter[]`, `_x[]` |
| `/contact/add` | POST | `Name` | `x-www-form-urlencoded` | Optional: `CompanyID`, `ContactTypeID` |
| `/contact/{id}/addNote` | POST | `note` | `x-www-form-urlencoded` | |
| `/task/{id}` | GET | — | — | |
| `/task/list` | GET | — | — | Default: pending only. `_x[]=*`, `TaskStatusID[]` |
| `/task/add` | POST | `TaskDescription` | `x-www-form-urlencoded` | Returns `TaskID` |
| `/task/{id}` | POST | — | `x-www-form-urlencoded` | Update existing task |
| `/user/list` | GET | — | — | Inconsistent casing in response |
| `/user/{id}` | GET | — | — | |
| `/activity/` | GET | — | — | 25/page. Filters: `s`, `sDate0`, `eDate0`, `UserID`, `CompanyID`, `minID` |
| `/email/{id}` | GET | — | — | Full body (list `_x[]=emails` omits body) |
