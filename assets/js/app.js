
/* Pages that must NEVER force a redirect to login (public + the login page itself). */
const PUBLIC_PAGES = ['login','index','about','contact','apply','register','signup','cbt-exam','offline',''];

function currentPage() {
  return (location.pathname.split('/').pop() || 'index.html').replace('.html','');
}

const App = {

  init() {
    App.bindUI();
    App.applyStoredTheme();
    const page = currentPage();
    // On login/public pages we DO NOT run auth-gating or redirect — this was
    // the v7 bug that broke the login page bootstrap and caused redirect loops.
    if (PUBLIC_PAGES.includes(page)) {
      App.initAuthTabs();
      return;
    }
    App.applyRoleVisibility();
    App.loadPageData();
  },

  /* Re-apply saved dark/light preference */
  applyStoredTheme() {
    const saved = localStorage.getItem('sc-theme');
    if (saved) document.body.dataset.theme = saved;
  },

  /* Ensure the login page shows the Sign-in tab by default (replaces the old
     T.switchAuthTab call that failed because templates.js is not shipped). */
  initAuthTabs() {
    if (document.getElementById('signin-form')) App.switchAuthTab('signin');
  },

  applyRoleVisibility() {
    if (!sb) { App.applyRoleDashboard('demo', { full_name:'Demo User', role:'admin' }); App.applyRoleNav('admin'); return; }
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { location.href = 'login.html'; return; }
      sb.from('profiles').select('full_name,email,role,status').eq('id', user.id).maybeSingle().then(({ data, error }) => {
        if (error) console.warn('Profile lookup failed:', error.message || error);
        const role = (data && data.role) || user.user_metadata?.role || 'student';
        const status = (data && data.status) || 'active';
        const name = (data && data.full_name) || user.user_metadata?.full_name || user.email || 'User';
        if (status === 'pending') {
          document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px"><div style="max-width:440px;text-align:center;background:white;padding:40px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.1)"><h2 style="margin-bottom:12px">⏳ Account pending approval</h2><p style="color:var(--gray-600)">Your account is awaiting admin approval. You will receive an email once it is activated.</p></div></div>';
          return;
        }
        if (status === 'suspended') {
          document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px"><div style="max-width:440px;text-align:center;background:white;padding:40px;border-radius:16px"><h2>🚫 Account suspended</h2><p>Please contact the school administrator.</p></div></div>';
          return;
        }
        const isStaff = ['super_admin','admin','principal','proprietor','head_teacher','staff','teacher','bursar'].includes(role);
        const isAdmin = ['super_admin','admin','principal','proprietor','head_teacher','bursar'].includes(role);
        App.currentRole = role; App.currentUserName = name; App.currentProfile = data || {};
        window.SC_PROFILE = Object.assign({ id: user.id, email: user.email }, data || {}, { role, status, full_name: name });
        document.querySelectorAll('[data-admin-only]').forEach(el => el.style.display = isAdmin ? '' : 'none');
        document.querySelectorAll('[data-staff-only]').forEach(el => el.style.display = isStaff ? '' : 'none');
        document.querySelectorAll('[data-signout]').forEach(el => el.style.display = '');
        App.applyRoleDashboard(role, { full_name:name, email:user.email, role });
        App.applyRoleNav(role);
      }).catch((err) => {
        console.warn('Profile load failed:', err && err.message ? err.message : err);
        const fallbackRole = user.user_metadata?.role || 'student';
        const fallbackName = user.user_metadata?.full_name || user.email || 'User';
        App.currentRole = fallbackRole; App.currentUserName = fallbackName;
        window.SC_PROFILE = { id:user.id, email:user.email, role:fallbackRole, status:'active', full_name:fallbackName };
        document.querySelectorAll('[data-signout]').forEach(el => el.style.display = '');
        App.applyRoleDashboard(fallbackRole, { full_name:fallbackName, email:user.email, role:fallbackRole });
        App.applyRoleNav(fallbackRole);
      });
    });
  },

  applyRoleDashboard(role, profile) {
    const name = (profile && (profile.full_name || profile.email)) || 'User';
    const prettyRole = String(role || 'user').replace(/_/g,' ').replace(/w/g, c => c.toUpperCase());
    const roleMap = {
      super_admin:['super_admin','admin'],
      admin:['admin'],
      principal:['admin'],
      proprietor:['admin'],
      head_teacher:['admin'],
      bursar:['admin'],
      staff:['staff'],
      teacher:['staff'],
      parent:['parent'],
      student:['student']
    };
    const effectiveRoles = new Set(roleMap[role] || [role]);
    ['user-display-name','dash-user-name'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=name; });
    ['user-display-role','dash-user-role'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=prettyRole; });
    const groups = document.querySelectorAll('[data-dash-role]');
    if (groups.length) {
      groups.forEach(el => {
        const roles = (el.getAttribute('data-dash-role')||'').split(/s+/).filter(Boolean);
        const show = roles.some(r => effectiveRoles.has(r));
        el.style.display = show ? '' : 'none';
      });
      if (![...groups].some(el => el.style.display !== 'none')) {
        const first = document.querySelector('[data-dash-role="student"]'); if(first) first.style.display='';
      }
    }
    const q=document.getElementById('dash-quick-links');
    if(q){
      const adminRoles = ['super_admin','admin','principal','proprietor','head_teacher','bursar'];
      const links = role==='parent' ? [['Child Dashboard','student-profile.html'],['Fees','fees.html'],['Results','results.html'],['Assignments','assignments.html'],['Messages','inbox.html'],['Complaint','complaints.html']] :
        (role==='student' ? [['Take CBT','cbt-exam.html'],['Assignments','assignments.html'],['Timetable','timetable.html'],['Digital Library','digital_library.html'],['E-Resources','eresources.html'],['My Results','results.html'],['My Profile','student-profile.html']] :
        (['staff','teacher'].includes(role) ? [['Attendance','attendance.html'],['Results','results.html'],['CBT Manager','cbt.html'],['Report Cards','report-cards.html'],['Broadsheets','academic_records.html'],['Lesson Plans','lesson_plans.html'],['Scheme of Work','sow.html']] :
        [['Academic Setup','academic_setup.html'],['Approvals','approvals.html'],['Students','students.html'],['Staff','staff.html'],['Parents','parents.html'],['Finance','finance.html'],['Payroll','payroll.html'],['Analytics','analytics.html'],['Admin Data','admin-data.html'],['Storage','storage.html'],['Compliance','compliance.html'],['Activity Log','activity_log.html']]));
      q.innerHTML = links.map(x=>'<a class="btn btn-outline btn-sm" href="'+x[1]+'">'+x[0]+'</a>').join('');
    }
  },


  applyRoleNav(role) {
    const normalise = (r) => String(r || '').trim().toLowerCase();
    const current = normalise(role);
    const expanded = new Set([current]);

    if (current === 'teacher') expanded.add('staff');
    if (current === 'super_admin') ['admin','principal','proprietor','head_teacher','bursar','staff','teacher','parent','student'].forEach(r => expanded.add(r));
    else if (['admin','principal','proprietor','head_teacher','bursar'].includes(current)) ['staff','teacher','parent','student'].forEach(r => expanded.add(r));

    const links = [...document.querySelectorAll('[data-role-allow]')];
    links.forEach(el => {
      const moduleId = normalise(el.getAttribute('data-module-id'));
      const allow = (el.getAttribute('data-role-allow') || '').split(/s+/).map(normalise).filter(Boolean);
      let ok = allow.some(a => expanded.has(a));

      // IMPORTANT UI repair: never remove sidebar entries after the page loads.
      // The old role filter used display:none; on real generated sites this made
      // menus flash while loading and then disappear when a student/parent or an
      // incomplete profile was detected. Keep every selected module visible,
      // mark restricted entries, and let Supabase RLS + page logic protect data.
      el.style.display = '';
      el.classList.toggle('nav-locked', !ok);
      if (!ok) {
        el.setAttribute('aria-disabled', 'true');
        el.title = 'Visible for navigation; some actions on this page may require a higher role.';
      } else {
        el.removeAttribute('aria-disabled');
        el.removeAttribute('title');
      }
    });

    if (App.ensureActiveNavVisible) App.ensureActiveNavVisible();
    App.ensureNavNotBlank(role);
  },

  ensureNavNotBlank(role) {
    const nav = document.querySelector('.app-nav');
    if (!nav) return;
    const links = [...nav.querySelectorAll('a')];
    links.forEach(a => { a.style.display = ''; });
  },

  ensureActiveNavVisible() {
    const nav = document.getElementById('app-sidebar');
    if (!nav) return;
    const active = nav.querySelector('.app-nav a.active');
    if (active) active.style.display = '';
  },

  /* ----- Auth (now METHODS of App so login forms calling
     App.handleSignIn / App.handleSignUp actually resolve — v7 bug fix) ----- */
  async handleSignIn(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = (fd.get('email') || '').trim();
    const password = fd.get('password') || '';
    if (!sb) { toast('Database not configured. Edit assets/js/config.js with your Supabase URL and anon key.', 'warning', 7000); return; }
    const btn = e.target.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Signing in…'; }
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Sign in'; }
      toast(error.message || 'Sign-in failed. Check your email and password.', 'danger', 6000);
      return;
    }
    App.logActivity('login', 'auth', email);
    location.href = 'dashboard.html';
  },

  async handleSignUp(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!sb) { toast('Database not configured. Edit assets/js/config.js with your Supabase keys.', 'warning', 7000); return; }
    const btn = e.target.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Submitting…'; }
    const { data, error } = await sb.auth.signUp({
      email: (fd.get('email') || '').trim(),
      password: fd.get('password') || '',
      options: { data: { full_name: fd.get('full_name'), phone: fd.get('phone'), role: fd.get('role') } }
    });
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Request access'; }
    if (error) { toast(error.message || 'Could not create the request.', 'danger', 6000); return; }
    toast('✅ Request sent. Check your email to confirm, then wait for admin approval.', 'success', 7000);
    if (e.target.reset) e.target.reset();
    App.switchAuthTab('signin');
  },

  /* Tab switcher — moved into App so the login page no longer depends on the
     builder-only templates.js (which is never shipped to the school site). */
  switchAuthTab(tab) {
    const s = document.getElementById('signin-form');
    const u = document.getElementById('signup-form');
    const ts = document.getElementById('tab-signin');
    const tu = document.getElementById('tab-signup');
    if (!s || !u) return;
    if (tab === 'signup') {
      s.style.display = 'none'; u.style.display = 'block';
      if (tu) tu.className = 'btn btn-primary'; if (ts) ts.className = 'btn btn-outline';
    } else {
      s.style.display = 'block'; u.style.display = 'none';
      if (ts) ts.className = 'btn btn-primary'; if (tu) tu.className = 'btn btn-outline';
    }
  },

  /* Lightweight, free audit log (no AI, no paid service) */
  logActivity(action, entity, entityId, details) {
    if (!sb) return;
    try {
      sb.auth.getUser().then(({ data }) => {
        const u = data && data.user;
        sb.from('activity_log').insert({
          actor_id: u ? u.id : null,
          actor_email: u ? u.email : entityId,
          action, entity, entity_id: String(entityId || ''),
          details: details || null
        }).then(() => {}, () => {});
      });
    } catch (_) {}
  },

  bindUI() {
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-app-action]');
      if (a) {
        const fn = a.dataset.appAction;
        if (App[fn]) App[fn](a);
      }
    });
  },

  toggleDarkMode() {
    const cur = document.body.dataset.theme || 'light';
    document.body.dataset.theme = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sc-theme', document.body.dataset.theme);
  },

  signOut() {
    if (!sb) { location.href = 'login.html'; return; }
    sb.auth.signOut().then(() => location.href = 'login.html');
  },

  toggleSidebar() {
    const el = document.getElementById('app-sidebar');
    if (el) el.classList.toggle('open');
  },

  switchCampus(name) {
    localStorage.setItem('sc-campus', name);
    location.reload();
  },

  /* Page-aware data loaders */
  async loadPageData() {
    const path = location.pathname.split('/').pop().replace('.html','') || 'dashboard';
    if (path === 'dashboard' && App.loadDashboard) App.loadDashboard();
    if (path === 'voting' && typeof VotingUI !== 'undefined') VotingUI.renderPollList();
    if (path === 'notifications' && typeof Notifications !== 'undefined') Notifications.loadDropdownItems();
    // Generic CRUD list for any module page that has a schema definition.
    if (typeof CRUD !== 'undefined' && CRUD.def && CRUD.def(path)) { try { CRUD.renderList(path); } catch (e) {} }
    if (App['load_' + path]) App['load_' + path]();
  },

  async loadDashboard() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const safeCount = async (table, filterFn) => {
      if (!sb) return 0;
      try {
        let q = sb.from(table).select('id', { count: 'exact', head: true });
        if (filterFn) q = filterFn(q);
        const r = await q;
        return r && !r.error ? (r.count || 0) : 0;
      } catch (_) { return 0; }
    };
    const safeRows = async (table, select='*', limit=5, order='created_at') => {
      if (!sb) return [];
      try {
        let q = sb.from(table).select(select);
        if (order) q = q.order(order, { ascending:false });
        if (limit) q = q.limit(limit);
        const r = await q;
        return r && !r.error ? (r.data || []) : [];
      } catch (_) { return []; }
    };
    try {
      const [studentCount, staffCount, feeRows, announcements, openPolls,
             attendanceCount, cbtCount, resultCount, parentCount, complaintCount,
             applicationCount, messageCount, assignmentCount, behaviourCount,
             supportCount, libraryCount, payrollCount, inventoryCount] = await Promise.all([
        safeCount('students'),
        safeCount('staff'),
        safeRows('fee_payments', 'amount_paid', 500, null),
        safeRows('announcements', '*', 5, 'created_at'),
        safeRows('polls', '*', 3, 'created_at'),
        safeCount('attendance'),
        safeCount('cbt_exams'),
        safeCount('results'),
        safeCount('parent_student'),
        safeCount('complaints'),
        safeCount('admission_applications'),
        safeCount('messages'),
        safeCount('assignments'),
        safeCount('behaviour'),
        safeCount('support_plans'),
        safeCount('library'),
        safeCount('payroll'),
        safeCount('inventory')
      ]);
      const feesPaid = (feeRows || []).reduce((a,b) => a + (Number(b.amount_paid) || 0), 0);
      set('stat-students', studentCount);
      set('stat-staff', staffCount);
      set('stat-fees', feesPaid.toLocaleString());
      set('stat-announcements', announcements.length);
      // Admin/Super Admin oversight KPIs. These IDs exist only on the admin dashboard.
      set('ov-staff-count', staffCount);
      set('ov-attendance', attendanceCount);
      set('ov-cbt-open', cbtCount);
      set('ov-results', resultCount);
      set('ov-parent-fees', feeRows.length);
      set('ov-payroll', payrollCount);
      set('ov-inventory', inventoryCount);
      set('ov-parents', parentCount);
      set('ov-complaints', complaintCount);
      set('ov-applications', applicationCount);
      set('ov-messages', messageCount);
      set('ov-assignments', assignmentCount);
      set('ov-behaviour', behaviourCount);
      set('ov-support', supportCount);
      set('ov-library', libraryCount);
      const annEl = document.getElementById('dash-announcements');
      if (annEl) annEl.innerHTML = announcements.length
        ? announcements.map(a => '<div style="padding:10px 0;border-bottom:1px solid var(--gray-200)"><strong>'+esc(a.title)+'</strong><div style="font-size:0.82rem;color:var(--gray-500)">'+(a.created_at ? new Date(a.created_at).toLocaleString() : '')+'</div></div>').join('')
        : '<p style="color:var(--gray-500)">No announcements yet.</p>';
      const pollEl = document.getElementById('dash-polls');
      if (pollEl) pollEl.innerHTML = openPolls.length
        ? openPolls.map(p => '<div style="padding:10px 0;border-bottom:1px solid var(--gray-200)"><a href="voting.html?poll='+p.id+'"><strong>'+esc(p.title)+'</strong></a><span class="badge badge-success" style="margin-left:8px">open</span></div>').join('')
        : '<p style="color:var(--gray-500)">No active polls.</p>';
      const ctx = document.getElementById('dash-chart');
      if (ctx && window.Chart) {
        var _sc = Number(studentCount || 0), _fp = Number(feeRows.length || 0);
        new Chart(ctx, { type: 'doughnut', data: { labels:['Payment rows','Students without payment row'], datasets:[{ data:[_fp, Math.max(0, _sc - _fp)], backgroundColor:['#10b981','#e2e8f0'] }] }, options: { responsive:true, plugins:{ legend:{ position:'bottom' } } } });
      }
    } catch (e) { console.warn('Dashboard load failed (demo mode):', e.message); }
  },

  /* Modal — now opens the REAL CRUD form for the module (fixes the old
     "Form will be generated for ..." placeholder). */
  openAddModal(type) {
    if (typeof CRUD !== 'undefined' && CRUD.def && CRUD.def(type)) { CRUD.openForm(type); return; }
    if (typeof openModal === 'function') openModal('Add ' + type, '<p>This module is view-only or has a dedicated page.</p>');
  }
};

/* ----- Modal helpers ----- */
function openModal(title, body, footer) {
  const b = document.getElementById('modal-backdrop');
  if (!b) return;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-footer').innerHTML = footer || '<button class="btn btn-outline" onclick="closeModal()">Close</button>';
  b.classList.add('show');
}
function closeModal() {
  const b = document.getElementById('modal-backdrop');
  if (b) b.classList.remove('show');
}
function toast(msg, type='info', ms=3500) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = '<div class="toast-msg">' + esc(msg) + '</div>';
  c.appendChild(t);
  setTimeout(() => { t.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, ms);
}
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* Backwards-compatible global aliases (in case any inline handler still
   references the bare function names instead of App.*). */
function handleSignIn(e){ return App.handleSignIn(e); }
function handleSignUp(e){ return App.handleSignUp(e); }

/* Boot */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', App.init);
else App.init();
