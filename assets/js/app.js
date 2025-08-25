// Dark/Light mode + animations + GitHub repos
(function(){
  const root = document.documentElement;
  const btn = document.getElementById('themeBtn');
  const saved = localStorage.getItem('theme');
  if(saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)){
    root.classList.add('dark');
    document.body.classList.add('bg-ink','text-white');
  } else {
    root.classList.remove('dark');
  }
  btn && (btn.onclick = () => {
    const dark = root.classList.toggle('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  });
  // Year
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();

  // Reveal on scroll
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target); } });
  },{threshold:.15});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  // GitHub repos
  const username = (window.PORTFOLIO_CONFIG && window.PORTFOLIO_CONFIG.githubUser) || 'Ammarrrrrrr';
  const grid = document.getElementById('projectsGrid');
  const fallback = document.getElementById('projectsFallback');
  const search = document.getElementById('search');
  const sortSel = document.getElementById('sort');
  let repos = [];

  function card(r){
    const a = document.createElement('article');
    a.className = 'rounded-2xl p-5 border border-white/10 bg-white/5 hover:bg-white/10 transition';
    a.innerHTML = `
      <h3 class="font-semibold text-lg mb-1">${r.name}</h3>
      <p class="text-white/70 text-sm mb-2">${r.description ? r.description : 'No description provided.'}</p>
      <p class="text-white/50 text-xs mb-3">★ ${r.stargazers_count} • Updated ${new Date(r.updated_at).toLocaleDateString()}</p>
      <div class="flex gap-2 flex-wrap">
        <a class="px-3 py-1 rounded-lg bg-accent text-black text-sm" href="${r.html_url}" target="_blank" rel="noopener">Repository</a>
        ${r.homepage ? `<a class="px-3 py-1 rounded-lg border border-white/10 text-sm" href="${r.homepage}" target="_blank" rel="noopener">Live</a>` : ''}
      </div>
    `;
    return a;
  }

  function render(list){
    grid.innerHTML = '';
    list.forEach(r=> grid.appendChild(card(r)));
  }

  function applyFilters(){
    const q = (search && search.value || '').toLowerCase().trim();
    let list = repos.filter(r=> r.name.toLowerCase().includes(q) || (r.description||'').toLowerCase().includes(q));
    const s = sortSel && sortSel.value || 'updated';
    if(s==='stars'){ list.sort((a,b)=>b.stargazers_count-a.stargazers_count); }
    else { list.sort((a,b)=> new Date(b[s]||b.updated_at) - new Date(a[s]||a.updated_at)); }
    render(list);
  }

  search && search.addEventListener('input', applyFilters);
  sortSel && sortSel.addEventListener('change', applyFilters);

  fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers: { 'Accept': 'application/vnd.github+json' } })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(data => {
      repos = (data||[]).filter(r=>!r.fork && !r.archived);
      if(repos.length===0){ throw new Error('No repos'); }
      applyFilters();
    })
    .catch(_ => { fallback && (fallback.classList.remove('hidden')); });
})();