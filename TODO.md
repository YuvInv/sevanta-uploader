# Sevanta Uploader - TODO

> All tasks are tracked in [GitHub Issues](https://github.com/YuvInv/sevanta-uploader/issues)

## Completed

- [x] **Duplicate Check** - Fixed using `_text=` and `_ss=` search parameters instead of broken `filter[]`
- [x] **Contacts/Founders Upload** - CSV can include founder columns, contacts created and linked to deals
- [x] **CSV Template Download** - Download button with field descriptions and optional contact fields
- [x] **Side Panel UI** - Modern side panel interface instead of popup
- [x] **Remove 'View Schema' Option** ([#7](https://github.com/YuvInv/sevanta-uploader/issues/7)) - Removed debug feature from UI
- [x] **Simplified CSV Template** ([#1](https://github.com/YuvInv/sevanta-uploader/issues/1)) - Template with commonly used fields only
- [x] **Fix Contacts Upload** ([#10](https://github.com/YuvInv/sevanta-uploader/issues/10)) - Fixed contact creation and linking to deals
- [x] **Set Automatic Default Fields** ([#8](https://github.com/YuvInv/sevanta-uploader/issues/8)) - Auto-populate Source Notes, DealTypes, and SourceType

---

---

## Next Up

### 2. Allow Optional Contacts ([#11](https://github.com/YuvInv/sevanta-uploader/issues/11)) - Priority: High
- Currently, if contact columns are mapped, we might be enforcing valid contact data.
- **Requirement:** If contact fields are empty in the CSV for a row, simpler allow the company upload without creating a contact.
- Don't fail validation just because contact name is missing if the user didn't intend to add one.

### 3. Support Multiple Contacts per Company ([#12](https://github.com/YuvInv/sevanta-uploader/issues/12)) - Priority: High
- **Problem:** Current row-based CSV structure implies 1 contact per row/company.
- **Requirement:** Allow uploading multiple contacts for the same company.
- **Proposed Solution:** 
  - Allow multiple rows with the same `CompanyName`. 
  - The first row creates/updates the company.
  - Subsequent rows with the same `CompanyName` add additional contacts to that existing deal.

---

### 2. Dealigence Integration ([#2](https://github.com/YuvInv/sevanta-uploader/issues/2)) - Priority: Medium
Import companies directly from Dealigence platform.

**Approach:**
- Content script for `https://app.dealigence.com/*`
- "Send to Sevanta" button on company pages
- Extract: company name, description, website, founders
- Send to side panel for review before upload

**Files to create:**
- `src/content/dealigence.ts` - Content script
- `src/lib/extractors/dealigence.ts` - Data extraction
- Update `manifest.json` - Add content script config

**Notes:**
- User must be logged into Dealigence
- Need to analyze DOM structure of target pages
- Handle gracefully if page structure changes

---

### 3. IVC Integration ([#3](https://github.com/YuvInv/sevanta-uploader/issues/3)) - Priority: Medium
Import companies directly from IVC (Israel Venture Capital) database.

**Approach:**
- Content script for `https://www.ivc-online.com/*`
- "Send to Sevanta" button on company profiles
- Map IVC fields to Sevanta CRM fields

**Files to create:**
- `src/content/ivc.ts` - Content script
- `src/lib/extractors/ivc.ts` - Data extraction
- Update `manifest.json` - Add content script config

**Notes:**
- User must be logged into IVC
- Need to analyze DOM structure of target pages
- Handle gracefully if page structure changes

---

### 4. GitHub CI/CD for Build & Publish ([#4](https://github.com/YuvInv/sevanta-uploader/issues/4)) - Priority: Low
Set up GitHub Actions to automatically build and publish the extension.

---

### 5. Additional Enhancements ([#13](https://github.com/YuvInv/sevanta-uploader/issues/13)) - Priority: Low
- Progress bar during CSV upload
- Error handling improvements
- Changing extension icon to VC logo

---

### 6. New capabilities: Bulk info on contacts lists ([#14](https://github.com/YuvInv/sevanta-uploader/issues/14))
- New feature will exist in a new tab in the side panel
- user can paste a list of contact names (from stealth founders list)
- for each name, we query Sevanta to get email/phone/company
- show results in a table, allow export to CSV

### 7. Discard Rows ([#9](https://github.com/YuvInv/sevanta-uploader/issues/9))
- Allow users to "discard" individual rows when uploading multiple rows
- Visual distinction for discarded rows
- Summary count of discarded vs uploaded




### 6. AI Features: Company Enrichment ([#6](https://github.com/YuvInv/sevanta-uploader/issues/6)) - Priority: Low
Integrate with Perplexity (or similar) for:
- Auto-enrichment of company profiles (funding, founders, history)
- AI-driven CRM updates for outdated/missing data
- User-controlled review and acceptance of changes

---

## AI Features (Future)
### 7. Auto-Updates from News ([#5](https://github.com/YuvInv/sevanta-uploader/issues/5)) - Priority: Low
Automatically crawl news sites (Ctech, Geektime) to:
- Update existing companies with new funding rounds
- Add new companies with AI-generated summaries
- Match screening meeting summary format




