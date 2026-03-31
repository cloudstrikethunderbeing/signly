# Signly — Feedback System

## Current State

Signly is a live PDF signing app. Backend has only a `health()` function. Frontend has:
- `UploadScreen.tsx` — landing page with upload form and a footer copyright line
- `SigningWorkspace.tsx` — PDF signing area; renders `TipDeveloper` when `numPages > 0`
- `TipDeveloper.tsx` — collapsible tip section with crypto addresses
- `App.tsx` — routes between UploadScreen and SigningWorkspace
- `index.html` — static meta tags, no structured data

## Requested Changes (Diff)

### Add
- **Backend**: `submitRating(Nat)`, `getAverageRating()` → Float, `getRatingCount()` → Nat
- **Backend**: `submitBugReport(Text, ?Text, Text)` → stores description, optional email, device info
- **StarRating component** (`src/frontend/src/components/StarRating.tsx`): 5 clickable stars, "Rate Signly" label, "Takes 2 seconds — helps keep this free" subtext, submit button appears after selection, thank-you state. One rating per session via `localStorage` flag. Calls `backend.submitRating()`.
- **BugReportModal component** (`src/frontend/src/components/BugReportModal.tsx`): Modal/sheet with textarea ("What went wrong?"), optional email input, auto-captured device/browser string. "Submit bug report" button calls `backend.submitBugReport()`. Success message: "Bug received — thank you 🙏". Also includes an "Report on X" link pre-filled to `https://twitter.com/intent/tweet?text=@jackbearai%20bug%20report:%20` opening in new tab.
- **JSON-LD injection** in `App.tsx` or a `useEffect` hook: fetch `getAverageRating()` and `getRatingCount()` on mount; if count >= 5, inject a `<script type="application/ld+json">` tag into `<head>` with SoftwareApplication schema.
- **"Report a bug" link** in `UploadScreen.tsx` footer — small text link that opens `BugReportModal`.
- **StarRating placement** in `SigningWorkspace.tsx` — rendered below `TipDeveloper` when `numPages > 0`. Does not affect any signing logic.

### Modify
- `src/backend/main.mo` — add rating storage (Array/Buffer of Nat), bug report storage, and the four new public functions
- `src/frontend/src/declarations/backend.did.d.ts` and `backend.did.js` — add new method signatures
- `src/frontend/src/backend.d.ts` and `backend.ts` — expose new typed methods
- `src/frontend/src/components/SigningWorkspace.tsx` — import and render `StarRating` below `TipDeveloper`
- `src/frontend/src/components/UploadScreen.tsx` — add "Report a bug" link in footer
- `src/frontend/src/App.tsx` — add JSON-LD structured data injection via `useEffect`

### Remove
- Nothing removed

## Implementation Plan

1. Update `main.mo` with rating and bug report storage and functions
2. Update `backend.did.d.ts`, `backend.did.js`, `backend.d.ts`, `backend.ts` with new method signatures
3. Create `StarRating.tsx` component
4. Create `BugReportModal.tsx` component
5. Modify `SigningWorkspace.tsx` to include `StarRating` below `TipDeveloper`
6. Modify `UploadScreen.tsx` to add "Report a bug" footer link that triggers `BugReportModal`
7. Modify `App.tsx` to inject JSON-LD on mount using backend aggregate data
8. Ensure PDF dependencies (`pdf-lib`, `react-pdf`, `pdfjs-dist@5.4.296`, `signature_pad`) are present in package.json
