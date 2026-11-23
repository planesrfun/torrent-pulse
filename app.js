"use strict";
(function () {
  const el = (id) => document.getElementById(id);
  const make = (tag, cls, value) => {
    const x = document.createElement(tag);
    if (cls) x.className = cls;
    if (value !== undefined) x.textContent = value;
    return x;
  };
  const rate = (kib) => kib < 1024 ? kib + " KiB/s" : (kib / 1024).toFixed(1) + " MiB/s";
  const eta = (sec) => sec === null ? "—" : sec < 60 ? sec + "s" : sec < 3600 ? Math.ceil(sec / 60) + "m" : Math.ceil(sec / 3600) + "h";
  let lastSnapshot = "";
  let busy = false;
  let lastData = null;
  const downPoints = [];
  const upPoints = [];
  function graph() {
    const max = Math.max(1024, ...downPoints, ...upPoints) * 1.15;
    function line(values) {
      return values.map((v, i) => {
        const x = values.length === 1 ? 450 : 900 * i / (values.length - 1);
        const y = 135 - (v / max) * 123;
        return (i ? " L " : "M ") + x.toFixed(1) + " " + y.toFixed(1);
      }).join("");
    }
    el("line-dl").setAttribute("d", line(downPoints));
    el("line-ul").setAttribute("d", line(upPoints));
  }
  function render(x) {
    lastData = x;
    const t = x.totals, s = x.speeds;
    el("downloadSpeed").textContent = rate(s.download_kib_s);
    el("uploadSpeed").textContent = rate(s.upload_kib_s);
    el("downloadRate").textContent = (s.download_kib_s * 8192 / 1000000).toFixed(1) + " Mbps";
    el("active").textContent = t.downloading;
    el("queued").textContent = t.queued;
    el("total").textContent = t.total;
    el("completed").textContent = t.completed + " complete";
    el("incomplete").textContent = t.incomplete + " incomplete";
    el("published").textContent = "Published " + new Date(x.published_utc).toLocaleString();
    const ageMin = Math.max(0, Math.round((Date.now() - Date.parse(x.snapshot_utc)) / 60000));
    const stale = ageMin > 45;
    el("connection-dot").className = "dot" + (stale ? " offline" : " waiting");
    el("connection-label").textContent = stale ? "Outdated snapshot" : "GitHub snapshot";
    el("updated").textContent = "Observed " + ageMin + "m ago";
    if (x.snapshot_utc !== lastSnapshot) {
      lastSnapshot = x.snapshot_utc;
      downPoints.push(s.download_kib_s);
      upPoints.push(s.upload_kib_s);
      if (downPoints.length > 30) downPoints.shift();
      if (upPoints.length > 30) upPoints.shift();
      graph();
    }
    const fragment = document.createDocumentFragment();
    if (!x.transfers.length) {
      fragment.append(make("div", "empty", "No incomplete downloads in this published snapshot."));
    }
    for (const v of x.transfers) {
      const node = make("article", "torrent-item");
      const label = make("div");
      label.append(make("div", "torrent-title", v.label));
      const meta = make("div", "torrent-meta");
      meta.append(make("span", "tag", v.state === "downloading" ? "Downloading" : "Waiting"));
      label.append(meta);
      const progress = make("div");
      const header = make("div", "progress-head");
      header.append(make("strong", "", v.progress_percent.toFixed(1) + "%"));
      const track = make("div", "progress-track");
      const fill = make("div", "progress-fill");
      fill.style.width = Math.max(0, Math.min(100, v.progress_percent)) + "%";
      track.append(fill);
      progress.append(header, track);
      node.append(label, progress, make("div", "speed", rate(v.download_kib_s)),
                  make("div", "speed muted", rate(v.upload_kib_s)), make("div", "eta", eta(v.eta_seconds)));
      fragment.append(node);
    }
    el("torrents").replaceChildren(fragment);
    el("visible").textContent = "Anonymous top " + x.transfers.length + " transfers · GitHub Pages may lag · no per-torrent identifiers";
  }
  async function update() {
    if (busy) return;
    busy = true;
    try {
      const response = await fetch("./status.json?cache=" + Date.now(), {cache: "no-store"});
      if (!response.ok) throw new Error("not ready");
      const x = await response.json();
      if (x.schema_version !== 1 || !x.totals || !x.speeds || !Array.isArray(x.transfers)) throw new Error("invalid");
      render(x);
    } catch (_) {
      el("connection-dot").className = "dot offline";
      el("connection-label").textContent = "Snapshot unavailable";
      if (!lastData) el("torrents").replaceChildren(make("div", "empty", "The public status feed is not yet available. Retrying…"));
    } finally { busy = false; }
  }
  el("refresh").addEventListener("click", update);
  update();
  setInterval(update, 60000);
})();
