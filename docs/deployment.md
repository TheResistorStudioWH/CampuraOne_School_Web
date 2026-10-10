# School Web deployment

## Current server

- Site: `http://129.211.189.35/` (port 80, no domain yet).
- The built SPA is served from `/www/wwwroot/campura-school/releases/20261010-0225`; `/` falls back to `index.html` for client routing.
- `/api/` remains on the existing PHP site. `/uploads/` serves only existing public school assets; PHP execution is denied there. Config, includes, migrations, scripts, tests, vendor, docs, and Composer files return 404.
- School Web uses same-origin requests (`VITE_API_BASE=`) and `VITE_APP_MODE=live`. No API secret is shipped to the browser.
- PHP-FPM reads database credentials, `CAMPURA_BASE_URL`, and `CAMPURA_ADMIN_ORIGINS` from `/www/server/campura-private/school-fpm.conf` (mode 0600). The app DB account is restricted to the `campura_one` database and CRUD privileges. PHP-FPM config test and reload succeeded.
- Before the production migration, the full database and site/config/backup directories were saved under `/root/campura-deploy/backup-20261010` (root-only directory). The same migration first completed against a restored isolated copy. Ambiguous legacy ad ownership was left unchanged and reported by the migration.
- School 1 admin login name: `school1`. The random 32-character initial password is in `/root/campura-deploy/school1-initial-password.txt` (mode 0600). After retrieving it through the server's private terminal, the administrator should set a private password in Account Settings. Password changes revoke all sessions.

## Binding a domain later

1. Point the new DNS A record to this server and add the domain to the existing Baota site; keep port 80 during certificate issuance.
2. Add the domain to the Nginx `server_name`, issue and enable HTTPS, then make HTTP redirect to HTTPS after certificate validation.
3. Change `CAMPURA_BASE_URL` to the HTTPS domain and set `CAMPURA_ADMIN_ORIGINS` to that exact origin in the private PHP-FPM config. Add any temporary IP origin only if still needed.
4. Run the PHP-FPM configuration test, reload PHP-FPM and Nginx, and verify login, API, downloads, and the browser console over HTTPS.

The current IP-only site uses HTTP. Until a domain and trusted certificate are configured, the network does not encrypt logins or API traffic; use the panel-delivered initial password only for first setup, then switch to HTTPS before routine administration.

## Import behavior

Word conversion supports `.docx`, `.md`, `.markdown`, and `.txt` locally in the browser. Legacy binary `.doc` must first be saved as `.docx` in Word or LibreOffice. ICS and logo imports are validated before upload; imports preview first and do not write until the operator submits the relevant form. DOCX images are not embedded and are reported in the preview. Never upload private source documents unless they are intended for the school service.

The static release is versioned so it can be rolled back by restoring the previous Nginx release path. Keep `/api/` and `/uploads/` mapped to the PHP site during release changes.
