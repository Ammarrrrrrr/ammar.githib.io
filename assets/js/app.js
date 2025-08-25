// Theme toggle, typewriter, and GitHub projects loader
(function(){
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  function applyTheme(mode){
    if(mode==='light'){root.classList.add('light');}
    else{root.classList.remove('light');}
    localStorage.setItem('theme', mode);
  }
  if(saved){ applyTheme(saved); }
  else{ applyTheme(prefersLight ? 'light' : 'dark'); }
  document.getElementById('themeToggle').onclick=function(){
    const isLight = root.classList.contains('light');
    applyTheme(isLight ? 'dark' : 'light');
  };
  document.getElementById('year').textContent = new Date().getFullYear();

  // Typewriter
  const roles = ['full‑stack learner','Python + SQL','VLSI curious','Flutter tinkerer','GitHub-first developer'];
  const el = document.getElementById('typewriter');
  let i=0, j=0, del=false;
  function tick(){
    const word = roles[i%roles.length];
    if(!del){ el.textContent = word.slice(0, ++j); if(j===word.length){ del=true; setTimeout(tick,1200); return; } }
    else { el.textContent = word.slice(0, --j); if(j===0){ del=false; i++; } }
    setTimeout(tick, del?45:70);
  }
  tick();

  // GitHub projects
  const username = (window.PORTFOLIO_CONFIG && window.PORTFOLIO_CONFIG.githubUser) || 'Ammarrrrrrr';
  const grid = document.getElementById('projectsGrid');
  const fallback = document.getElementById('projectsFallback');
  const search = document.getElementById('search');
  const sortSel = document.getElementById('sort');

  let repos = [];
  function render(list){
    grid.innerHTML = '';
    list.forEach(r=>{
      const el = document.createElement('article');
      el.className = 'card project';
      el.innerHTML = `
        <h3>${r.name}</h3>
        <p>${r.description ? r.description : 'No description provided.'}</p>
        <p class="muted small">★ ${r.stargazers_count} • Updated ${new Date(r.updated_at).toLocaleDateString()}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn small" href="${r.html_url}" target="_blank" rel="noopener">Repository</a>
          ${r.homepage ? `<a class="btn small" href="${r.homepage}" target="_blank" rel="noopener">Live</a>` : ''}
        </div>
      `;
      grid.appendChild(el);
    });
  }

  function applyFilters(){
    const q = (search.value||'').toLowerCase().trim();
    let list = repos.filter(r=> r.name.toLowerCase().includes(q) || (r.description||'').toLowerCase().includes(q));
    const s = sortSel.value;
    if(s==='stars'){ list.sort((a,b)=>b.stargazers_count-a.stargazers_count); }
    else { list.sort((a,b)=> new Date(b[s]||b.updated_at) - new Date(a[s]||a.updated_at)); }
    render(list);
  }

  search.addEventListener('input', applyFilters);
  sortSel.addEventListener('change', applyFilters);

  fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(data => {
      // Filter out forks by default; keep public only
      repos = (data||[]).filter(r=>!r.fork && !r.archived);
      if(repos.length===0){ throw new Error('No repos'); }
      applyFilters();
    })
    .catch(_ => {
      fallback.classList.remove('hidden');
    });
})();