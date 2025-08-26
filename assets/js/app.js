// Dark/Light mode + animations + GitHub repos
(function(){
  const root = document.documentElement;
  const themeToggleButton = document.getElementById('themeBtn');
  const savedTheme = localStorage.getItem('theme');
  if(savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)){
    root.classList.add('dark');
    document.body.classList.add('bg-ink','text-white');
  } else {
    root.classList.remove('dark');
  }
  themeToggleButton && (themeToggleButton.onclick = () => {
    const isDark = root.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
  // Year
  const yearEl = document.getElementById('year'); if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Reveal on scroll (respect reduced motion)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');
  if(prefersReducedMotion){
    revealEls.forEach(el=> el.classList.add('show'));
  } else {
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{ if(entry.isIntersecting){ entry.target.classList.add('show'); observer.unobserve(entry.target); } });
    },{threshold:.15});
    revealEls.forEach(el=>observer.observe(el));
  }

  // GitHub repos with simple localStorage caching
  const username = (window.PORTFOLIO_CONFIG && window.PORTFOLIO_CONFIG.githubUser) || 'Ammarrrrrrr';
  const grid = document.getElementById('projectsGrid');
  const fallback = document.getElementById('projectsFallback');
  const search = document.getElementById('search');
  const sortSel = document.getElementById('sort');
  let repos = [];

  if(grid){ grid.setAttribute('role','list'); }

  function createProjectCard(repo){
    const article = document.createElement('article');
    article.className = 'rounded-2xl p-5 border border-white/10 bg-white/5 hover:bg-white/10 transition';
    article.setAttribute('role','listitem');
    article.innerHTML = `
      <h3 class="font-semibold text-lg mb-1">${repo.name}</h3>
      <p class="text-white/70 text-sm mb-2">${repo.description ? repo.description : 'No description provided.'}</p>
      <p class="text-white/50 text-xs mb-3">★ ${repo.stargazers_count} • Updated ${new Date(repo.updated_at).toLocaleDateString()}</p>
      <div class="flex gap-2 flex-wrap">
        <a class="px-3 py-1 rounded-lg bg-accent text-black text-sm" href="${repo.html_url}" target="_blank" rel="noopener">Repository</a>
        ${repo.homepage ? `<a class=\"px-3 py-1 rounded-lg border border-white/10 text-sm\" href=\"${repo.homepage}\" target=\"_blank\" rel=\"noopener\">Live</a>` : ''}
      </div>
    `;
    return article;
  }

  function renderProjects(list){
    if(!grid) return;
    grid.innerHTML = '';
    list.forEach(repo=> grid.appendChild(createProjectCard(repo)));
    grid.setAttribute('aria-busy','false');
  }

  function applyFilters(){
    const query = (search && search.value || '').toLowerCase().trim();
    let list = repos.filter(r=> r.name.toLowerCase().includes(query) || (r.description||'').toLowerCase().includes(query));
    const sortBy = (sortSel && sortSel.value) || 'updated';
    if(sortBy==='stars'){ list.sort((a,b)=>b.stargazers_count-a.stargazers_count); }
    else { list.sort((a,b)=> new Date(b[sortBy]||b.updated_at) - new Date(a[sortBy]||a.updated_at)); }
    renderProjects(list);
  }

  search && search.addEventListener('input', applyFilters);
  sortSel && sortSel.addEventListener('change', applyFilters);

  const CACHE_KEY = `gh_repos_${username}`;
  const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

  function loadFromCache(){
    try{
      const raw = localStorage.getItem(CACHE_KEY);
      if(!raw) return null;
      const parsed = JSON.parse(raw);
      if(!parsed || typeof parsed !== 'object') return null;
      const { timestamp, data } = parsed;
      if(!timestamp || !Array.isArray(data)) return null;
      if(Date.now() - timestamp > CACHE_TTL_MS) return null;
      return data;
    } catch(_){ return null; }
  }

  function saveToCache(data){
    try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data })); } catch(_){ /* ignore quota */ }
  }

  // Try cache first for instant UI
  const cached = loadFromCache();
  if(cached && cached.length){
    repos = cached.filter(r=>!r.fork && !r.archived);
    applyFilters();
  }

  // Then refresh from network
  fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers: { 'Accept': 'application/vnd.github+json' } })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(data => {
      const cleaned = (data||[]).filter(r=>!r.fork && !r.archived);
      if(cleaned.length===0){ throw new Error('No repos'); }
      repos = cleaned;
      saveToCache(cleaned);
      applyFilters();
    })
    .catch(_ => {
      if(!cached){ fallback && (fallback.classList.remove('hidden')); }
      grid && grid.setAttribute('aria-busy','false');
    });

  // Active section highlighting in header nav
  const sectionIds = ['about','skills','projects','contact'];
  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const navLinks = Array.from(document.querySelectorAll('header nav a[href^="#"]'));
  function setActive(id){
    navLinks.forEach(a => {
      const isActive = a.getAttribute('href') === `#${id}`;
      if(isActive){
        a.classList.add('text-white');
        a.setAttribute('aria-current','page');
      } else {
        a.classList.remove('text-white');
        a.removeAttribute('aria-current');
      }
    });
  }
  if(sections.length && navLinks.length){
    const secObserver = new IntersectionObserver((entries)=>{
      const visible = entries
        .filter(e=> e.isIntersecting)
        .sort((a,b)=> b.intersectionRatio - a.intersectionRatio);
      if(visible[0]){
        setActive(visible[0].target.id);
      }
    },{ rootMargin: '0px 0px -60% 0px', threshold: [0.25,0.5,0.75,1]});
    sections.forEach(sec=> secObserver.observe(sec));
  }
})();