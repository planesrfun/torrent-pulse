# Torrent Pulse — GitHub Pages progress

Public site: https://planesrfun.github.io/torrent-pulse/

Like the ATPL Progress monitor, this is a public **read-only, strictly anonymised** summary. No torrent filenames, IDs, trackers, media names, file paths, peer IPs, credentials, cookies or private account details appear in this repository.

The private publisher lives in the private Homelab repository planesrfun/homelab-infra at services/ap04-torrent-dashboard/publish_public_status.py. It fetches Tower's existing local-only read-only API using host-key-pinned SSH, sanitises the response in memory, and periodically commits only status.json.

Published data may lag because updates require Git commits and GitHub Pages builds. The page displays its last observed timestamp and flags outdated data. The full private five-second-refresh named-torrent dashboard continues to run at Tower 127.0.0.1:8765 behind SSH.

Only anonymous aggregate counts/rates, timestamp and a bounded set of unnamed transfer progress/rates/ETAs are permitted. No management actions, credentials or direct qBittorrent endpoints are present on this public website.
