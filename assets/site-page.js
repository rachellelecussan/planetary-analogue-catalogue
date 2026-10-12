(function () {
  const { esc, groupColor, HAZARD, ACCESS, meter, loadSites, fmtCoord, makeMap, pin, citation, copy } = PAC;
  const main = document.getElementById('main');
  const id = new URLSearchParams(location.search).get('id');

  const has = (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length);
  const range = (a, b, unit = '') => has(a) && has(b) ? (a === b ? `${a}${unit}` : `${a} to ${b}${unit}`) : has(a) ? `${a}${unit}` : has(b) ? `${b}${unit}` : null;
  const fact = (label, v) => has(v) ? `<div><dt>${esc(label)}</dt><dd>${Array.isArray(v) ? esc(v.join(', ')) : esc(v)}</dd></div>` : '';
  const linkify = (t) => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');

  loadSites().then((sites) => {
    const s = sites.find((x) => x.id === id);
    if (!s) {
      main.innerHTML = `<div class="card pad stack"><h1 style="font-size:26px">Site not found</h1><p>No site has the id “${esc(id || '')}”. <a href="index.html">Back to the map</a>.</p></div>`;
      return;
    }
    document.title = `${s.name} · Planetary Analogue Catalogue`;
    const color = groupColor(s.group);
    const statusChip = s.review_status === 'Verified' ? '<span class="chip ok">Verified entry</span>' : `<span class="chip warn">${esc(s.review_status || 'Draft')} entry</span>`;
    const env = [
      ['pH', range(s.ph_min, s.ph_max)],
      ['Temperature', range(s.temp_min_c, s.temp_max_c, ' °C')],
      ['Altitude', range(s.altitude_min_m, s.altitude_max_m, ' m')],
      ['Life present', s.biology_present]
    ].filter(([, v]) => has(v));
    const refs = s.references || [];
    const reviewed = s.rating_last_reviewed ? `Ratings last reviewed ${esc(s.rating_last_reviewed)}.` : 'These ratings are proposals and have not yet been reviewed.';

    main.innerHTML = `
      <nav aria-label="Breadcrumb" class="crumbs"><a href="index.html">Map</a><span aria-hidden="true">/</span><a href="index.html?site=${encodeURIComponent(s.id)}">${esc(s.analogue_for_primary)} analogues</a><span aria-hidden="true">/</span><span aria-current="page">${esc(s.name)}</span></nav>

      <section class="card hero">
        <div class="bar" style="background:${color}"></div>
        <div class="inner">
          <div class="stack" style="gap:10px;flex:1 1 480px">
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${s.targets.map((t, i) => `<span class="chip${i === 0 ? ' accent' : ''}">Analogue for ${esc(t)}</span>`).join('')}
              ${s.types.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}
              ${statusChip}
            </div>
            <h1>${esc(s.name)}</h1>
            <p style="font-size:17px;color:var(--ink-2)">${esc([s.region, s.country].filter(Boolean).join(', '))}${has(s.alt_names) ? ` · also known as ${esc(s.alt_names.join(', '))}` : ''}</p>
            <p class="mono muted" style="font-size:14px">${esc(fmtCoord(s.lat, s.lon))} · location shown ${esc((s.coordinate_precision || '').toLowerCase())}${has(s.extent_km2) ? ` · ${esc(Number(s.extent_km2).toLocaleString('en-GB'))} km²` : ''}</p>
          </div>
          <div class="actions">
            <button type="button" class="btn primary" id="citeBtn">Cite this entry</button>
            <button type="button" class="btn" id="dlBtn">Download data (JSON)</button>
            <a class="btn" href="index.html?site=${encodeURIComponent(s.id)}">View on map</a>
            <a class="btn" href="submit.html?edit=${encodeURIComponent(s.id)}">Suggest an edit</a>
          </div>
        </div>
      </section>

      ${(s.photos && s.photos.length) ? `
      <section class="card photos" aria-label="Photos">
        <figure class="hero-photo">
          <img id="mainPhoto" src="assets/photos/${esc(s.photos[0].file)}" alt="${esc(s.photos[0].caption || s.name)}" loading="eager">
          <figcaption id="photoCap"></figcaption>
        </figure>
        ${s.photos.length > 1 ? `<div class="thumbs">${s.photos.map((p, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}" aria-label="Show photo: ${esc(p.caption || '')}"><img src="assets/photos/${esc(p.file.replace('.jpg', '-sm.jpg'))}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
      </section>` : ''}

      <section class="card compare" id="compare" aria-label="Side-by-side comparison"></section>

      <div class="row">
        <div class="maincol">
          <section class="card pad stack section">
            <h2>Why it is ${s.analogue_for_primary === 'Early Earth' ? 'an early Earth' : (/^[AEIOU]/.test(s.analogue_for_primary) ? 'an ' : 'a ') + esc(s.analogue_for_primary)} analogue</h2>
            <p>${esc(s.science_relevance || s.summary)}</p>
            ${has(s.target_feature) ? `<p><strong>Compared with:</strong> ${esc(s.target_feature)}</p>` : ''}
            ${has(s.analogue_limitations) ? `<h3>Limitations as an analogue</h3><p style="color:var(--ink-2)">${esc(s.analogue_limitations)}</p>` : ''}
          </section>

          ${(has(s.geological_setting) || has(s.rock_types) || has(s.key_minerals) || has(s.age)) ? `
          <section class="card pad stack section">
            <h2>Geology and mineralogy</h2>
            <dl class="facts">${fact('Geological setting', s.geological_setting)}${fact('Rock types', s.rock_types)}${fact('Age', s.age)}</dl>
            ${has(s.key_minerals) ? `<div class="stack" style="gap:8px"><span class="label">Key minerals</span><div style="display:flex;flex-wrap:wrap;gap:8px">${s.key_minerals.map((m) => `<a class="tag" style="color:var(--ink);text-decoration:none" href="https://www.mindat.org/search.php?search=${encodeURIComponent(m)}">${esc(m)}</a>`).join('')}</div><p class="muted" style="font-size:13px">Mineral names link to mindat.org.</p></div>` : ''}
          </section>` : ''}

          <section class="card pad stack section">
            <h2>Environment</h2>
            ${env.length ? `<div class="tiles">${env.map(([k, v]) => `<div class="tile"><div class="label">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('')}</div>` : ''}
            <dl class="facts one">${fact('Environment type', s.envs)}${fact('Salinity', s.salinity)}${fact('Notable organisms', s.notable_organisms)}</dl>
          </section>

          <section class="card pad stack section" id="refs">
            <h2>References</h2>
            ${refs.length ? `<ol class="refs">${refs.map((r) => `<li>${esc(r.citation)}${r.url ? ` <a href="${esc(r.url)}">${esc(r.doi ? 'doi:' + r.doi : 'link')}</a>` : ''}<div class="meta">${r.peer_reviewed ? 'Peer-reviewed' : 'Supporting source'}${r.unverified ? ' · DOI not yet verified' : ''}</div></li>`).join('')}</ol>` : '<p class="muted">No references yet.</p>'}
            <dl class="facts" style="padding-top:10px;border-top:1px solid var(--line)">
              ${fact('Contributors', s.contributors || 'Not yet recorded')}
              ${fact('Added', s.date_added)}${fact('Last verified', s.last_verified)}
              <div style="grid-column:1/-1"><dt>Cite as</dt><dd class="mono" style="font-size:13px">${esc(citation(s))}</dd></div>
            </dl>
          </section>
        </div>

        <aside class="sidecol">

          <section class="card pad stack" aria-label="Access">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap"><h2 style="font-size:19px">Access</h2><span class="mono" style="font-size:14px">${s.access_level ? `Level ${s.access_level} of 5 · ${ACCESS[s.access_level]}` : 'Not rated'}</span></div>
            <dl class="facts one">
              ${fact('Permits required', s.permits_required)}
              ${has(s.permit_authority) ? `<div><dt>Permit authority</dt><dd>${linkify(s.permit_authority)}</dd></div>` : ''}
              ${fact('Land status', s.land_status)}${fact('Nearest town', s.nearest_town)}${fact('Best season', s.best_season)}
              ${fact('Getting there', s.transport_notes)}${fact('Sampling rules', s.sampling_rules)}
            </dl>
          </section>

          <section class="card pad stack" aria-label="Safety">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap"><h2 style="font-size:19px">Safety</h2><span class="mono" style="font-size:14px">${s.hazard_rating ? `Hazard ${s.hazard_rating} of 5 · ${HAZARD[s.hazard_rating]}` : 'Not rated'}</span></div>
            ${meter(s.hazard_rating, true)}
            ${has(s.hazards) ? `<div style="display:flex;flex-wrap:wrap;gap:8px">${s.hazards.map((h) => `<span class="chip warn">${esc(h)}</span>`).join('')}</div>` : ''}
            ${has(s.safety_notes) ? `<p style="font-size:15px;line-height:1.55">${esc(s.safety_notes)}</p>` : ''}
            <p class="muted" style="font-size:13px">${reviewed} Ratings are guidance, not a risk assessment. <a href="about.html#ratings">How ratings work</a>.</p>
          </section>

          <section class="note">
            <h2>Visiting responsibly</h2>
            <p style="font-size:14px;line-height:1.55">${s.sensitive_site === 'Yes' ? 'This is a sensitive site, so its location is shown approximately. ' : ''}Follow local rules, get the permits you need, take only permitted samples and avoid disturbing living communities. Plan your own risk assessment before any visit.</p>
          </section>
        </aside>
      </div>`;

    // Photos: click a thumbnail to show it large
    const cap = (p) => `${esc(p.caption || '')}<span class="credit">Photo: ${esc(p.author || 'unknown')} · ${p.licence_url ? `<a href="${esc(p.licence_url)}">${esc(p.licence)}</a>` : esc(p.licence || '')} · <a href="${esc(p.source)}">Wikimedia Commons</a></span>`;
    if (s.photos && s.photos.length) {
      document.getElementById('photoCap').innerHTML = cap(s.photos[0]);
      document.querySelectorAll('.thumbs button').forEach((b) => b.addEventListener('click', () => {
        const p = s.photos[+b.dataset.i];
        const img = document.getElementById('mainPhoto');
        img.src = 'assets/photos/' + p.file; img.alt = p.caption || s.name;
        document.getElementById('photoCap').innerHTML = cap(p);
        document.querySelectorAll('.thumbs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      }));
    }

    // Side-by-side Earth and planet maps
    if (window.PAC_COMPARE) PAC_COMPARE.render(document.getElementById('compare'), s);
    else document.getElementById('compare').hidden = true;

    document.getElementById('citeBtn').addEventListener('click', () => copy(citation(s), 'Citation copied'));
    document.getElementById('dlBtn').addEventListener('click', () => {
      const clean = Object.assign({}, s); ['lat', 'lon', 'targets', 'types', 'envs', 'group'].forEach((k) => delete clean[k]);
      const feature = { type: 'Feature', geometry: { type: 'Point', coordinates: [s.lon, s.lat] }, properties: clean };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(feature, null, 2)], { type: 'application/json' }));
      a.download = `${s.id}.geojson`; document.body.appendChild(a); a.click(); a.remove();
    });
  }).catch((e) => { main.innerHTML = `<div class="card pad">The site data could not be loaded (${esc(e.message)}).</div>`; });
})();
