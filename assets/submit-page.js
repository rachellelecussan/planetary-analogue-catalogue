(function () {
  const { CFG, esc, loadJSON, loadSites, makeMap, toast, copy } = PAC;
  const form = document.getElementById('form');
  const errorsEl = document.getElementById('errors');
  const result = document.getElementById('result');
  const editId = new URLSearchParams(location.search).get('edit');
  const useEmail = !!CFG.formEndpoint;
  const LEVELS = {
    access_level: [['Open', 'roadside or public path, no permit'], ['Easy', 'road access; permit simple or not needed'], ['Planned', '4x4, hike or boat, or a permit that takes weeks'], ['Expedition', 'remote, multi-day, guide or authority escort'], ['Restricted', 'research station, military or invitation only']],
    hazard_rating: [['Minimal', 'like a normal day out; standard fieldwork kit'], ['Low', 'some exposure such as heat or uneven ground'], ['Moderate', 'real hazards; needs a group, a plan and suitable kit'], ['High', 'serious hazards; experienced leaders or a guide required'], ['Extreme', 'life-threatening without specialist training']]
  };
  const levels = { access_level: null, hazard_rating: null };

  if (!useEmail) {
    document.getElementById('emailHint').textContent = 'Optional: not shared publicly';
    document.getElementById('emailStar').hidden = true;
  }

  // Level pickers
  document.querySelectorAll('[data-levels]').forEach((box) => {
    const key = box.dataset.levels;
    box.innerHTML = LEVELS[key].map(([n, t], i) => `<button type="button" class="level" aria-pressed="false" data-v="${i + 1}"><span class="n">${i + 1}</span><span><strong>${n}</strong>: ${t}</span></button>`).join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      levels[key] = +b.dataset.v;
      box.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
  });

  // Map picker
  const map = makeMap('pickmap');
  map.showWorld();
  PAC.addLabels(map);
  let marker = null;
  const latIn = form.elements.latitude, lonIn = form.elements.longitude;
  function placePin(lat, lon) {
    if (marker) marker.setLatLng([lat, lon]);
    else marker = L.circleMarker([lat, lon], { radius: 9, color: '#FFFFFF', weight: 3, fillColor: '#B4471F', fillOpacity: 1 }).addTo(map);
  }
  map.on('click', (e) => {
    const lat = Math.round(e.latlng.lat * 1000) / 1000, lon = Math.round(e.latlng.lng * 1000) / 1000;
    latIn.value = lat; lonIn.value = lon; placePin(lat, lon);
  });
  [latIn, lonIn].forEach((i) => i.addEventListener('change', () => {
    const lat = parseFloat(latIn.value), lon = parseFloat(lonIn.value);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) placePin(lat, lon);
  }));

  // Vocabulary-driven controls
  loadJSON('data/vocab.json').then((v) => {
    document.querySelectorAll('select[data-vocab]').forEach((s) => {
      const blank = s.dataset.blank ? `<option value="">${esc(s.dataset.blank)}</option>` : '';
      s.innerHTML = blank + v[s.dataset.vocab].map((x) => `<option>${esc(x)}</option>`).join('');
    });
    form.elements.coordinate_precision.value = 'Approximately 1 km';
    document.querySelectorAll('[data-checks]').forEach((box) => {
      const key = box.dataset.checks;
      box.innerHTML = v[key].map((x) => `<label class="check"><input type="checkbox" name="${key}" value="${esc(x)}"> ${esc(x)}</label>`).join('');
    });
    if (editId) prefill();
  });

  function prefill() {
    loadSites().then((sites) => {
      const s = sites.find((x) => x.id === editId);
      if (!s) return;
      document.getElementById('title').textContent = `Suggest a correction: ${s.name}`;
      document.getElementById('intro').textContent = 'Describe what should change and give your source. The current entry is filled in below; edit any field that is wrong.';
      document.getElementById('s0').hidden = false;
      ['name', 'country', 'region', 'summary', 'target_feature', 'science_relevance', 'analogue_limitations', 'nearest_town', 'permit_authority', 'safety_notes', 'ph_min', 'ph_max', 'temp_min_c', 'temp_max_c'].forEach((k) => { if (s[k] != null && form.elements[k]) form.elements[k].value = s[k]; });
      ['geological_setting', 'environment_type_primary', 'permits_required', 'coordinate_precision'].forEach((k) => { if (s[k]) form.elements[k].value = s[k]; });
      form.elements.key_minerals.value = (s.key_minerals || []).join('; ');
      form.elements.rock_types.value = (s.rock_types || []).join('; ');
      latIn.value = s.lat; lonIn.value = s.lon; placePin(s.lat, s.lon); map.setView([s.lat, s.lon], 3);
      form.elements.sensitive_site.checked = s.sensitive_site === 'Yes';
      const tick = (name, vals) => form.querySelectorAll(`input[name="${name}"]`).forEach((i) => { i.checked = vals.includes(i.value); });
      tick('analogue_for', s.targets); tick('analogue_type', s.types); tick('hazards', s.hazards || []);
      ['access_level', 'hazard_rating'].forEach((k) => { if (s[k]) document.querySelector(`[data-levels="${k}"] [data-v="${s[k]}"]`).click(); });
      form.elements.references.value = (s.references || []).map((r) => r.doi || r.url).filter(Boolean).join('\n');
    });
  }

  function collect() {
    const el = form.elements;
    const checked = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
    const num = (k) => (el[k].value === '' ? null : Number(el[k].value));
    const fors = checked('analogue_for'), types = checked('analogue_type');
    return {
      kind: editId ? 'correction' : 'new site',
      site_id: editId || null,
      correction: el.correction.value.trim() || null,
      name: el.name.value.trim(), country: el.country.value.trim(), region: el.region.value.trim() || null,
      latitude: num('latitude'), longitude: num('longitude'), coordinate_precision: el.coordinate_precision.value,
      sensitive_site: el.sensitive_site.checked ? 'Yes' : 'No', summary: el.summary.value.trim(),
      analogue_for_primary: fors[0] || null, analogue_for_other: fors.slice(1),
      analogue_type_primary: types[0] || null, analogue_type_other: types.slice(1),
      target_feature: el.target_feature.value.trim() || null, science_relevance: el.science_relevance.value.trim(),
      analogue_limitations: el.analogue_limitations.value.trim() || null,
      geological_setting: el.geological_setting.value || null, environment_type_primary: el.environment_type_primary.value || null,
      key_minerals: el.key_minerals.value.split(';').map((x) => x.trim()).filter(Boolean),
      rock_types: el.rock_types.value.split(';').map((x) => x.trim()).filter(Boolean),
      ph_min: num('ph_min'), ph_max: num('ph_max'), temp_min_c: num('temp_min_c'), temp_max_c: num('temp_max_c'),
      access_level: levels.access_level, permits_required: el.permits_required.value || null,
      nearest_town: el.nearest_town.value.trim() || null, permit_authority: el.permit_authority.value.trim() || null,
      hazard_rating: levels.hazard_rating, hazards: checked('hazards'), safety_notes: el.safety_notes.value.trim() || null,
      references: el.references.value.split('\n').map((x) => x.trim()).filter(Boolean),
      contributor: el.contributor.value.trim(), orcid: el.orcid.value.trim() || null, email: el.email.value.trim() || null
    };
  }

  function validate(d) {
    const e = [];
    const need = (ok, msg) => { if (!ok) e.push(msg); };
    if (editId) {
      need(d.correction, 'Describe the correction and its source.');
    } else {
      need(d.name, 'Enter the site name.'); need(d.country, 'Enter the country.');
      need(d.latitude !== null && Math.abs(d.latitude) <= 90, 'Enter a latitude between -90 and 90, or click the map.');
      need(d.longitude !== null && Math.abs(d.longitude) <= 180, 'Enter a longitude between -180 and 180, or click the map.');
      need(d.summary, 'Write a one-line summary.');
      need(d.analogue_for_primary, 'Tick at least one body it is an analogue for.');
      need(d.analogue_type_primary, 'Tick at least one analogue type.');
      need(d.science_relevance, 'Explain why it is a good analogue.');
      need(d.environment_type_primary, 'Choose the main environment type.');
      need(d.access_level, 'Choose an access level.'); need(d.permits_required, 'Say whether permits are required.');
      need(d.hazard_rating, 'Choose a hazard rating.'); need(d.hazards.length, 'Tick at least one hazard.');
      need(d.references.length, 'Add at least one reference.');
    }
    need(d.contributor, 'Enter your name.');
    if (useEmail) need(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || ''), 'Enter a valid email address.');
    need(form.elements.licence.checked, 'Agree to release the entry under CC BY 4.0.');
    return e;
  }

  function issueBody(d) {
    const pub = Object.assign({}, d); delete pub.email;
    const lines = [`**${d.kind === 'correction' ? 'Correction' : 'New site'}** submitted through the website form.`, ''];
    if (d.correction) lines.push(`**Correction:** ${d.correction}`, '');
    lines.push('```json', JSON.stringify(pub, null, 2), '```');
    return lines.join('\n');
  }

  form.addEventListener('input', () => { if (errorsEl.textContent) errorsEl.textContent = ''; });
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const d = collect();
    const errs = validate(d);
    if (errs.length) { errorsEl.innerHTML = errs.map(esc).join('<br>'); return; }
    errorsEl.textContent = '';
    if (useEmail) {
      fetch(CFG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ _subject: `Catalogue ${d.kind}: ${d.name}` }, d)) })
        .then((r) => { if (!r.ok) throw new Error(r.status); done(); })
        .catch(() => { result.innerHTML = '<div class="banner warn">The submission could not be sent. Check your connection and try again.</div>'; scrollTo(0, 0); });
    } else {
      const title = `${d.kind === 'correction' ? 'Correction' : 'New site'}: ${d.name}`;
      const url = `https://github.com/${CFG.githubRepo}/issues/new?title=${encodeURIComponent(title)}&labels=submission&body=${encodeURIComponent(issueBody(d))}`;
      window.open(url, '_blank', 'noopener');
      result.innerHTML = `<div class="banner ok"><strong>Almost done.</strong> A GitHub page has opened with your submission filled in; press "Submit new issue" there to send it. No GitHub account? <button type="button" class="btn" id="copySub" style="min-height:32px;margin-left:6px">Copy your submission</button> and email it to the maintainer instead.</div>`;
      document.getElementById('copySub').addEventListener('click', () => copy(JSON.stringify(d, null, 2), 'Submission copied'));
      scrollTo(0, 0);
    }
    function done() {
      result.innerHTML = '<div class="banner ok"><strong>Submitted for review.</strong> Thank you. The maintainer will check it and contact you if anything needs changing.</div>';
      form.reset(); scrollTo(0, 0);
    }
  });
})();
