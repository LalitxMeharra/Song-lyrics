# Lyrify - Serverless Lyrics Finder & Downloader

Modern full-stack web app designed for 1-click deployment to **Vercel**.

### Features:
- **API Masking / Proxying:** Requests to the external API are handled exclusively by Serverless functions (`/api/search` and `/api/lyrics`). Users inspecting network requests only see your custom endpoints.
- **One-Click TXT Download:** Formats track metadata and lyrics into a clean `.txt` file.
- **Modern UI:** Responsive, dark-themed interface built with vanilla JS and CSS (zero bloated dependencies).

### How to Deploy on Vercel:
1. Extract the ZIP file or push it to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Keep default settings and click **Deploy**.
