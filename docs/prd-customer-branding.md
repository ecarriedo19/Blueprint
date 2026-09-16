**Feature Name:** Customer Branding on Reports (White-Labeling)

**Goal:** To allow Admin users to upload their own company logo, which will then automatically be used on all generated PDF reports, providing a professional, white-labeled experience.

**User Story:**
As an Admin of a construction company, I want to upload my own logo in the settings, so that the PDF quotes I generate and send to my clients are branded with my company's identity, not Blueprint's.

**Acceptance Criteria:**
1.  **Backend - Database:** The `company_profile` table in the database must be updated with a new `logo_url` column to store the path to the user's logo.
2.  **Backend - API:** A new, Admin-only `POST /api/company-profile/logo` endpoint must be created to handle image file uploads. It should save the logo to a stable storage location on the server and update the `logo_url` in the database.
3.  **Backend - PDF Generation:** The existing `GET /api/quotes/:id/pdf` endpoint must be modified. It needs to check if a `logo_url` exists for the user. If it does, it must use that logo in the generated PDF. If not, it should fall back to the default Blueprint logo.
4.  **Frontend - UI:** The "Company Profile" section of the Settings page must be updated to include a new UI for uploading a logo and displaying the current one.