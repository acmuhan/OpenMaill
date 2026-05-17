# Project Notes

## Shape
- Small Flask app for Hotmail/Outlook account purchase/history lookup and OAuth2 mail reading.
- Entry point: `app.py`.
- Main modules:
  - `account_api.py`: wraps account API endpoints under `/store/ga/*`.
  - `mail_reader.py`: gets Microsoft OAuth2 access tokens and reads messages through Microsoft Graph.
  - `templates/index.html`: single-page UI with inline CSS and JavaScript.
  - `hotmail_oauth2_demo.py`: standalone IMAP/OAuth2 demo code.

## Commands
- Install dependencies:
  ```powershell
  pip install -r requirements.txt
  ```
- Run the app:
  ```powershell
  python app.py
  ```
- Default local URL: `http://127.0.0.1:5000`.

## Important Context
- This directory is not currently a git repository.
- `requirements.txt` pins only `flask==3.0.3` and `requests==2.32.3`.
- The app talks to external APIs:
  - A user-supplied account API server.
  - Microsoft OAuth2 token endpoint.
  - Microsoft Graph mail endpoint.
- Network-dependent paths should be tested with real credentials or mocked requests.

## Security Notes
- Do not commit or expose real API keys, refresh tokens, access tokens, passwords, or sample account strings.
- Existing files contain hardcoded credential-like values and demo account material. Treat them as sensitive and avoid copying them into logs, docs, or responses.
- Prefer moving secrets into environment variables or user-entered form fields when making changes.

## Coding Conventions
- Keep the app simple: plain Flask routes, small helper functions, and no new framework unless requested.
- Keep UI changes inside `templates/index.html` unless adding a real static asset pipeline is explicitly requested.
- When parsing API responses, preserve support for both `----` and colon-delimited account/history formats.
- Return JSON responses with the existing `{ok: true/false, ...}` shape unless changing the API contract is requested.
