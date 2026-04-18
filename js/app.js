document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetch('data/site-data.json').then(r => r.json());

  // Always scroll to top on load
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  if (location.hash) history.replaceState(null, '', location.pathname);

  // Live user count — fluctuates realistically based on time
  function updateLiveCount() {
    const now = new Date();
    const base = 1400 + Math.floor((now.getHours() * 60 + now.getMinutes()) * 0.73) % 600;
    document.getElementById('live-count').textContent = (base + Math.floor(Math.random() * 40) - 20).toLocaleString();
  }
  updateLiveCount();
  setInterval(updateLiveCount, 3000);

  // Geolocation for scheduler address field
  const addrInput = document.getElementById('address');
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        addrInput.value = `📍 Location detected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        addrInput.style.borderColor = '#4caf50';
        showToast('📍 Your location has been detected!');
      },
      () => { addrInput.placeholder = 'Location unavailable — enter address manually'; }
    );
  }

  document.getElementById('hero-badge').innerHTML = `<img src="${data.hero.logo}" alt="LPU" class="badge-logo"> ${data.hero.badge}`;
  document.getElementById('hero-title').textContent = data.hero.title;
  document.getElementById('hero-subtitle').textContent = data.hero.subtitle;
  document.getElementById('hero-cta').textContent = data.hero.cta;

  // Quotes carousel
  let quoteIdx = 0;
  const qc = document.getElementById('quotes-carousel');
  function renderQuote(i) {
    const q = data.quotes[i];
    const initials = q.author.split(' ').map(w => w[0]).join('');
    qc.innerHTML = `
      <div class="quote-slide">
        <div class="quote-mark">"</div>
        <div class="quote-text">${q.text}</div>
        <div class="quote-divider"></div>
        <div class="quote-avatar">${initials}</div>
        <div class="quote-author">${q.author}</div>
        <div class="quote-role">${q.role}</div>
      </div>
      <div class="quote-dots">${data.quotes.map((_, j) =>
        `<span class="${j === i ? 'active' : ''}" data-i="${j}"></span>`
      ).join('')}</div>`;
    qc.querySelectorAll('.quote-dots span').forEach(dot =>
      dot.addEventListener('click', () => { quoteIdx = +dot.dataset.i; renderQuote(quoteIdx); })
    );
  }
  renderQuote(0);
  setInterval(() => { quoteIdx = (quoteIdx + 1) % data.quotes.length; renderQuote(quoteIdx); }, 5000);

  // Vision
  document.getElementById('vision-title').textContent = data.vision.title;
  document.getElementById('vision-subtitle').textContent = data.vision.subtitle;
  function renderVisionCard(id, d) {
    document.getElementById(id).innerHTML = `
      <h3>${d.heading}</h3>
      ${d.points.map(p => `<div class="vision-point"><span class="vp-icon">${p.icon}</span><span class="vp-text">${p.text}</span></div>`).join('')}
      <div class="vision-stat"><div class="vs-value">${d.stat.value}</div><div class="vs-label">${d.stat.label}</div></div>`;
  }
  renderVisionCard('vision-india', data.vision.india);
  renderVisionCard('vision-global', data.vision.global);

  // Features
  document.getElementById('features-grid').innerHTML = data.features.map((f, i) =>
    `<div class="card reveal" style="transition-delay:${i * .1}s">
      <div class="card-icon">${f.icon}</div><h3>${f.title}</h3><p>${f.desc}</p>
    </div>`
  ).join('');

  // Waste type dropdown with icons
  document.getElementById('waste-type').innerHTML = data.wasteTypes.map((w, i) =>
    `<option value="${w.name}"${i === 0 ? ' selected' : ''}>${w.icon} ${w.name} (~${w.avgWeight})</option>`
  ).join('');

  // Pre-fill form with dummy data
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('pickup-date').value = tomorrow.toISOString().split('T')[0];

  // Set min date to today
  document.getElementById('pickup-date').min = new Date().toISOString().split('T')[0];

  // Recyclers
  document.getElementById('recyclers-list').innerHTML = data.recyclers.map(r =>
    `<div class="recycler-card">
      <div>
        <div class="top-row"><span class="name">${r.name}</span><span class="slots">${r.slots} slots open</span></div>
        <div class="meta">${r.dist} · ⭐ ${r.rating} · ${r.address}</div>
      </div>
      <span class="cert">${r.cert}</span>
    </div>`
  ).join('');

  // Live feed with auto-cycle
  const feedEl = document.getElementById('live-feed');
  function renderFeed() {
    feedEl.innerHTML = data.recentPickups.map(p =>
      `<div class="feed-item">
        <div class="feed-info">
          <div><strong>${p.user}</strong> recycled ${p.item} in ${p.area}</div>
          <div class="feed-time">${p.time}</div>
        </div>
        <span class="feed-status ${p.status === 'Completed' ? 'completed' : p.status === 'Confirmed' ? 'confirmed' : 'transit'}">${p.status === 'Completed' ? '✓ Done' : p.status === 'Confirmed' ? '🆕 Confirmed' : '🚛 In Transit'}</span>
      </div>`
    ).join('');
  }
  renderFeed();
  // Rotate feed every 4s — move first item to end
  setInterval(() => {
    data.recentPickups.push(data.recentPickups.shift());
    renderFeed();
  }, 4000);

  // Impact stats
  document.getElementById('impact-stats').innerHTML = data.impact.stats.map((s, i) =>
    `<div class="card impact-card reveal" style="transition-delay:${i * .08}s">
      <div class="stat-icon">${s.icon}</div>
      <div class="number" data-target="${s.value}">0</div>
      <div class="label">${s.label}</div>
    </div>`
  ).join('');

  // Bar chart
  const maxVal = Math.max(...data.impact.monthlyTrend.map(m => m.value));
  document.getElementById('impact-chart').innerHTML = data.impact.monthlyTrend.map(m =>
    `<div class="bar-col">
      <div class="bar-val">${m.value}</div>
      <div class="bar" style="height:${(m.value / maxVal) * 140}px"></div>
      <div class="bar-label">${m.month}</div>
    </div>`
  ).join('');

  // Breakdown
  document.getElementById('impact-breakdown').innerHTML = data.impact.breakdown.map(b =>
    `<div class="breakdown-row">
      <span class="br-label">${b.category}</span>
      <div class="br-bar-bg"><div class="br-bar-fill" style="width:${b.pct}%;background:${b.color}"></div></div>
      <span class="br-pct">${b.pct}%</span>
    </div>`
  ).join('');

  // Rewards
  const rw = data.rewards;
  document.getElementById('reward-points').textContent = rw.points.toLocaleString();
  document.getElementById('reward-level').textContent = `🏅 ${rw.level}`;
  document.getElementById('reward-progress').style.width = `${(rw.points / rw.nextLevel) * 100}%`;
  document.getElementById('reward-next').textContent = `${(rw.nextLevel - rw.points).toLocaleString()} pts to next level`;
  document.getElementById('reward-perks').innerHTML = rw.perks.map(p =>
    `<div class="perk">${p}</div>`
  ).join('');
  document.getElementById('reward-history').innerHTML = rw.history.map(h =>
    `<li><span>${h.action} · ${h.date}</span><span>+${h.pts}</span></li>`
  ).join('');

  // Team
  document.getElementById('team-grid').innerHTML = data.team.map((m, i) =>
    `<div class="card team-card reveal" style="transition-delay:${i * .12}s">
      <img src="${m.image}" alt="${m.name}">
      <h3>${m.name}</h3>
      <div class="role">${m.role}</div>
      <div class="bio">${m.bio}</div>
      ${m.linkedin ? `<a href="${m.linkedin}" target="_blank" class="team-link">🔗 LinkedIn</a>` : ''}
    </div>`
  ).join('');

  // Footer
  document.getElementById('footer-tagline').textContent = data.footer.tagline;
  document.getElementById('footer-links').innerHTML = data.footer.links.map(l =>
    `<a href="#">${l}</a>`
  ).join('');

  // Form submit — realistic multi-step booking
  const form = document.getElementById('scheduler-form');
  const progressEl = document.getElementById('booking-progress');
  const confirmEl = document.getElementById('booking-confirmation');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('pickup-name').value.trim() || 'User';
    const type = document.getElementById('waste-type').value.split('(')[0].trim();
    const date = document.getElementById('pickup-date').value;
    const slot = document.getElementById('time-slot').value;
    const addr = document.getElementById('address').value.trim() || 'Location detected';
    const bookingId = 'EW-' + Date.now().toString(36).toUpperCase().slice(-6);

    // Disable button
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    // Show progress steps
    const steps = [
      { icon: '📋', text: 'Validating pickup details...' },
      { icon: '📍', text: 'Finding nearest recycler...' },
      { icon: '🚛', text: 'Assigning pickup vehicle...' },
      { icon: '✅', text: 'Booking confirmed!' }
    ];
    progressEl.classList.remove('hidden');
    progressEl.innerHTML = steps.map((s, i) =>
      `<div class="bp-step" data-i="${i}"><span class="bp-icon">${s.icon}</span>${s.text}</div>`
    ).join('');

    // Animate steps sequentially
    steps.forEach((_, i) => {
      setTimeout(() => {
        const stepEls = progressEl.querySelectorAll('.bp-step');
        if (i > 0) stepEls[i - 1].classList.replace('active', 'done');
        stepEls[i].classList.add('active');

        // After last step — show confirmation
        if (i === steps.length - 1) {
          setTimeout(() => {
            stepEls[i].classList.replace('active', 'done');
            showConfirmation(name, type, date, slot, addr, bookingId);
            addToLiveFeed(name, type, addr);
            btn.disabled = false;
            btn.textContent = '🚛 Confirm Free Pickup';
            form.reset();
            setTimeout(() => { progressEl.classList.add('hidden'); }, 1000);
          }, 800);
        }
      }, i * 900);
    });
  });

  const myBookings = [];
  const myBookingsEl = document.getElementById('my-bookings');

  function showConfirmation(name, type, date, slot, addr, id) {
    // Store booking
    myBookings.unshift({ name, type, date: date || 'Tomorrow', slot, addr, id, time: Date.now() });

    // Show latest in confirmation card
    confirmEl.classList.remove('hidden');
    confirmEl.innerHTML = `
      <h3>🎉 Pickup Scheduled Successfully!</h3>
      <div class="booking-detail"><span class="bd-label">Name</span><span class="bd-value">${name}</span></div>
      <div class="booking-detail"><span class="bd-label">Item</span><span class="bd-value">${type}</span></div>
      <div class="booking-detail"><span class="bd-label">Date</span><span class="bd-value">${date || 'Tomorrow'}</span></div>
      <div class="booking-detail"><span class="bd-label">Slot</span><span class="bd-value">${slot}</span></div>
      <div class="booking-detail"><span class="bd-label">Address</span><span class="bd-value">${addr}</span></div>
      <div class="booking-id">Tracking ID: <strong>${id}</strong></div>
      <div class="booking-tracker">
        <div class="tracker-step"><div class="tracker-dot reached">📋</div>Booked</div>
        <div class="tracker-step"><div class="tracker-dot reached">✅</div>Confirmed</div>
        <div class="tracker-step"><div class="tracker-dot">🚛</div>Pickup</div>
        <div class="tracker-step"><div class="tracker-dot">♻️</div>Recycled</div>
      </div>`;
    confirmEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast(`🎉 Booking ${id} confirmed for ${name}!`);

    // Render all past bookings below
    renderMyBookings();

    // After 15s, migrate to live feed and fade out the card
    setTimeout(() => {
      addToLiveFeed(name, type, addr);
      // Update tracker to show "Pickup" step
      const b = myBookings.find(x => x.id === id);
      if (b) b.migrated = true;
      renderMyBookings();
    }, 15000);
  }

  function renderMyBookings() {
    const past = myBookings.filter(b => b !== myBookings[0] || myBookings.length === 1);
    if (myBookings.length <= 1) { myBookingsEl.innerHTML = ''; return; }
    myBookingsEl.innerHTML = `<h3 class="mt-2">📦 Your Recent Bookings (${myBookings.length})</h3>` +
      myBookings.map(b => {
        const ago = Math.floor((Date.now() - b.time) / 1000);
        const timeStr = ago < 60 ? 'Just now' : `${Math.floor(ago / 60)}m ago`;
        const status = b.migrated ? '🚛 In Transit' : '✅ Confirmed';
        const statusClass = b.migrated ? 'transit' : 'confirmed';
        return `<div class="feed-item" style="animation:slideInFeed .4s ease both">
          <div class="feed-info">
            <div><strong>${b.name}</strong> — ${b.type}</div>
            <div class="feed-time">${b.id} · ${timeStr}</div>
          </div>
          <span class="feed-status ${statusClass}">${status}</span>
        </div>`;
      }).join('');
  }

  // Refresh booking times every 30s
  setInterval(renderMyBookings, 30000);

  function addToLiveFeed(name, type, addr) {
    const firstName = name.split(' ')[0] + ' ' + (name.split(' ')[1] || '').charAt(0) + '.';
    data.recentPickups.unshift({
      user: firstName, item: type, area: addr.split(',')[0].replace('📍 ', ''),
      time: 'Just now', status: 'Confirmed'
    });
    if (data.recentPickups.length > 6) data.recentPickups.pop();
    renderFeed();
  }

  // Init scroll reveal & counters
  initReveal();
  animateCounters();
});

// Scroll reveal
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// Animated counters
function animateCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.number').forEach(el => {
        const target = +el.dataset.target;
        const step = Math.ceil(target / 50);
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = current.toLocaleString();
        }, 25);
      });
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.3 });
  obs.observe(document.getElementById('impact-stats'));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}
