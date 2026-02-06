# Chrome Web Store Publishing — Manual Setup Guide

Follow these steps in order. The automated pipeline won't work until all steps are complete.

---

## Step 1: Register Chrome Web Store Developer Account

1. Go to https://chrome.google.com/webstore/devconsole/
2. Sign in with your Google account
3. Pay the **$5 one-time** registration fee
4. Complete the developer profile (name, email, etc.)

---

## Step 2: Create Google Cloud OAuth Credentials

These credentials let the GitHub Action upload to CWS on your behalf.

1. Go to https://console.developers.google.com
2. Create a new project — name it **"Sevanta CWS Publishing"**
3. Enable the **Chrome Web Store API**:
   - Go to **APIs & Services > Library**
   - Search for "Chrome Web Store API"
   - Click **Enable**
4. Set up the OAuth consent screen:
   - Go to **APIs & Services > OAuth consent screen**
   - Choose **External**
   - Fill in required fields (app name, support email)
   - Add your email as a **test user**
   - Save
5. Create OAuth credentials:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: add `https://developers.google.com/oauthplayground`
   - Click **Create**
   - **Save the Client ID and Client Secret** — you'll need them in Steps 3 and 5

---

## Step 3: Get a Refresh Token

1. Go to https://developers.google.com/oauthplayground
2. Click the **gear icon** (top right) and check **"Use your own OAuth credentials"**
3. Enter your **Client ID** and **Client Secret** from Step 2
4. In the left panel, find and select the scope:
   ```
   https://www.googleapis.com/auth/chromewebstore
   ```
5. Click **Authorize APIs** — sign in and grant access
6. Click **Exchange authorization code for tokens**
7. **Save the Refresh Token** — you'll need it in Step 5

---

## Step 4: First Manual Upload to CWS

The API can only **update** existing items. The first upload must be done manually.

1. Build the extension locally:
   ```bash
   npm run build
   cd dist && zip -r ../sevanta-uploader.zip . && cd ..
   ```
2. Go to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Click **New Item** → upload `sevanta-uploader.zip`
4. Fill in the listing:
   - **Description**: Copy from `store/description.txt`
   - **Screenshots**: Upload from `store/screenshots/` (min 1, size 1280x800 or 640x400)
   - **Category**: Developer Tools (or Productivity)
   - **Language**: English
5. **Privacy tab**:
   - Single purpose: "Bulk upload companies to Sevanta Dealflow CRM"
   - Permission justifications: Copy from `PRIVACY_POLICY.md` (the permissions table)
   - Privacy policy URL (must be publicly accessible):
     `https://gist.github.com/YuvInv/ade2c99707b512820ae5e69926631702`
6. **Distribution tab**:
   - Visibility: **Unlisted** (only people with the direct link can find it)
7. Click **Submit for review**
   - Review typically takes a few hours to a few days
8. **Note the Extension ID** from the dashboard URL — e.g., `gimmlkgbfoffeeddcllcjijeojhnlgib`

---

## Step 5: Add GitHub Secrets

1. Go to your repo: https://github.com/YuvInv/sevanta-uploader/settings/secrets/actions
2. Add these 4 repository secrets:

| Secret Name | Value |
|---|---|
| `CWS_CLIENT_ID` | OAuth Client ID from Step 2 |
| `CWS_CLIENT_SECRET` | OAuth Client Secret from Step 2 |
| `CWS_REFRESH_TOKEN` | Refresh Token from Step 3 |
| `CWS_EXTENSION_ID` | Extension ID from Step 4 |

---

## Step 6: Verify the Pipeline

After all secrets are configured, merge a PR to main and check:

1. **GitHub Actions** tab — the "Release & Publish" workflow should run
2. Verify: git tag created, GitHub Release created with ZIP asset
3. Verify: CWS upload step succeeds (check the workflow logs)
4. **CWS Dashboard** — extension should show "Pending review" for the new version

If the CWS step fails but the GitHub Release succeeded:
- Go to **Actions > Publish to Chrome Web Store (Manual)**
- Click **Run workflow** and enter the version (e.g., `v1.2.0`)

---

## Troubleshooting

| Problem | Solution |
|---|---|
| CWS upload fails with 401 | Refresh token expired — repeat Step 3 and update the `CWS_REFRESH_TOKEN` secret |
| CWS upload fails with 403 | Chrome Web Store API not enabled — check Step 2.3 |
| "Item not found" error | Wrong extension ID — check Step 4.8 and update `CWS_EXTENSION_ID` secret |
| Review rejected | Check CWS dashboard for rejection reason — usually permission justifications need more detail |
