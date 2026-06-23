/* ============================================================
   VSSC LaTeX Analytics — Dashboard Application Logic
   ============================================================ */

(function () {
    'use strict';

    // ---------- Configuration ----------
    const API_BASE = window.location.origin;
    const DATA_BASE = '/static/data';

    const ENDPOINTS = {
        overview:               '/usage-stats/analytics/overview',
        userSummary:            '/usage-stats/users/summary',
        userActivity:           '/usage-stats/users/activity',
        userGrowth:             '/usage-stats/users/growth',
        loginStats:             '/usage-stats/users/login-stats',
        userList:               '/usage-stats/users/list',
        projectSummary:         '/usage-stats/projects/summary',
        projectActivity:        '/usage-stats/projects/activity',
        projectGrowth:          '/usage-stats/projects/growth',
        contentSummary:         '/usage-stats/content/summary',
        fileTypes:              '/usage-stats/content/fileTypes',
        collaborationDist:      '/usage-stats/collaboration/distribution',
    };

    // Maps API endpoint → static JSON fallback file
    const FALLBACK_MAP = {
        '/usage-stats/analytics/overview':      '/overview.json',
        '/usage-stats/users/summary':           '/user_summary.json',
        '/usage-stats/users/activity':          '/user_activity.json',
        '/usage-stats/users/login-stats':       '/login_stats.json',
        '/usage-stats/users/list':              '/user_list.json',
        '/usage-stats/projects/summary':        '/project_summary.json',
        '/usage-stats/projects/activity':       '/project_activity.json',
        '/usage-stats/content/summary':         '/content_summary.json',
        '/usage-stats/content/fileTypes':       '/file_types.json',
        '/usage-stats/collaboration/distribution': '/collaboration_distribution.json',
    };

    // Growth endpoints need frequency-specific fallback files
    const GROWTH_FALLBACK = {
        '/usage-stats/users/growth':    '/user_growth',
        '/usage-stats/projects/growth': '/project_growth',
    };

    // ---------- Chart defaults ----------
    const CHART_COLORS = {
        blue:       '#3b6cf5',
        blueFade:   'rgba(59,108,245,0.08)',
        green:      '#2d9f6f',
        greenFade:  'rgba(45,159,111,0.08)',
        amber:      '#d4930d',
        amberFade:  'rgba(212,147,13,0.08)',
        red:        '#d1453b',
        redFade:    'rgba(209,69,59,0.08)',
        purple:     '#7c5cbf',
        purpleFade: 'rgba(124,92,191,0.08)',
        teal:       '#1a9b9e',
        tealFade:   'rgba(26,155,158,0.08)',
        slate:      '#64748b',
        slateFade:  'rgba(100,116,139,0.08)',
    };

    Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#8892a4';
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = '#1a1d21';
    Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: '600' };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 6;
    Chart.defaults.plugins.tooltip.displayColors = false;
    Chart.defaults.elements.bar.borderRadius = 4;
    Chart.defaults.elements.line.tension = 0.3;
    if (Chart.defaults.scale && Chart.defaults.scale.grid) {
        Chart.defaults.scale.grid.color = 'rgba(0,0,0,0.04)';
    }

    // ---------- State ----------
    const charts = {};
    let userGrowthFreq = 'day';
    let projectGrowthFreq = 'day';
    let hasFallbackOccurred = false;
    let badgeEl = null;

    function updateDataSourceBadge(isLive) {
        if (!badgeEl) badgeEl = document.getElementById('data-source-badge');
        if (!badgeEl) return;

        if (!isLive) {
            hasFallbackOccurred = true;
        }

        if (hasFallbackOccurred) {
            badgeEl.textContent = 'Static JSON fallback';
            badgeEl.className = 'data-source-badge data-source-badge--json';
            badgeEl.title = 'The live backend is unreachable. Displaying static data from JSON files.';
        } else {
            badgeEl.textContent = 'Live Production Database';
            badgeEl.className = 'data-source-badge data-source-badge--live';
            badgeEl.title = 'Connected to the active Flask server serving real MongoDB, Redis, and MySQL data.';
        }
    }

    // ---------- API Helper ----------
    // Tries the backend API first. If that fails, falls back to local JSON.
    async function fetchData(endpoint, params) {
        // 1. Try backend API
        let url = API_BASE + endpoint;
        if (params) {
            url += '?' + new URLSearchParams(params).toString();
        }
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            updateDataSourceBadge(true);
            return data;
        } catch (_) {
            // API not available — fall through to static JSON
        }

        // 2. Fallback to static JSON
        let fallbackPath = FALLBACK_MAP[endpoint];
        if (!fallbackPath) {
            // Growth endpoints: append frequency
            const growthBase = GROWTH_FALLBACK[endpoint];
            if (growthBase) {
                const freq = (params && params.frequency) || 'month';
                fallbackPath = growthBase + '_' + freq + '.json';
            }
        }

        if (fallbackPath) {
            try {
                const fbRes = await fetch(DATA_BASE + fallbackPath + '?_t=' + Date.now());
                if (fbRes.ok) {
                    const data = await fbRes.json();
                    updateDataSourceBadge(false);
                    return data;
                }
            } catch (_) {}
        }

        console.warn('Data unavailable:', endpoint);
        return null;
    }

    // ---------- DOM Helpers ----------
    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return document.querySelectorAll(sel); }

    function setText(sel, val) {
        const el = $(sel);
        if (el) el.textContent = val !== null && val !== undefined ? val : '—';
    }

    function formatNumber(n) {
        if (n === null || n === undefined) return '—';
        return n.toLocaleString();
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    }

    // ---------- Section: Overview ----------
    async function loadOverview() {
        const data = await fetchData(ENDPOINTS.overview);
        if (!data) return;

        setText('#ov-total-users', formatNumber(data.total_users));
        setText('#ov-total-projects', formatNumber(data.total_projects));
        setText('#ov-active-users', formatNumber(data.active_users_30d));
        setText('#ov-active-projects', formatNumber(data.active_projects_30d));
        setText('#ov-logged-in', formatNumber(data.logged_in_users));
        setText('#ov-sessions', formatNumber(data.active_sessions));
        setText('#ov-users-with-projects', formatNumber(data.user_with_projects));
        setText('#ov-users-with-edits', formatNumber(data.user_with_edits));

        $$('#section-overview .loading-skeleton').forEach(el => el.classList.remove('loading-skeleton', 'skeleton-card'));
    }

    // ---------- Section: Usage Analytics ----------
    async function loadUserSummary() {
        const data = await fetchData(ENDPOINTS.userSummary);
        if (!data) return;
        setText('#us-total', formatNumber(data.total_users));
        setText('#us-admin', formatNumber(data.admin_users));
        setText('#us-never', formatNumber(data.never_logged_in));
    }

    async function loadUserActivity() {
        const data = await fetchData(ENDPOINTS.userActivity);
        if (!data) return;
        setText('#ua-7d', formatNumber(data.active_7d));
        setText('#ua-30d', formatNumber(data.active_30d));
        setText('#ua-90d', formatNumber(data.active_90d));

        const ctx = document.getElementById('chart-user-activity');
        if (!ctx) return;

        if (charts.userActivity) charts.userActivity.destroy();
        charts.userActivity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['7 Days', '30 Days', '90 Days'],
                datasets: [{
                    data: [data.active_7d, data.active_30d, data.active_90d],
                    backgroundColor: [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.teal],
                    borderWidth: 0,
                    barPercentage: 0.5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(ctx) { return ctx.parsed.y + ' active users'; }
                        }
                    }
                }
            }
        });
    }

    async function loadUserGrowth(frequency) {
        userGrowthFreq = frequency || userGrowthFreq;
        const data = await fetchData(ENDPOINTS.userGrowth, { frequency: userGrowthFreq });
        if (!data || !data.length) return;

        const ctx = document.getElementById('chart-user-growth');
        if (!ctx) return;

        if (charts.userGrowth) charts.userGrowth.destroy();
        charts.userGrowth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(function(d) { return d.period; }),
                datasets: [{
                    data: data.map(function(d) { return d.count; }),
                    borderColor: CHART_COLORS.blue,
                    backgroundColor: CHART_COLORS.blueFade,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: CHART_COLORS.blue,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(items) { return 'Period: ' + items[0].label; },
                            label: function(ctx) { return 'New registrations: ' + ctx.parsed.y; }
                        }
                    }
                }
            }
        });
    }

    async function loadLoginStats() {
        const data = await fetchData(ENDPOINTS.loginStats);
        if (!data) return;
        setText('#ls-avg', data.average_login_count);
        setText('#ls-max', formatNumber(data.max_login_count));
    }

    // ---------- Section: Projects ----------
    async function loadProjectSummary() {
        const data = await fetchData(ENDPOINTS.projectSummary);
        if (!data) return;
        setText('#ps-total', formatNumber(data.total_projects));
        setText('#ps-public', formatNumber(data.public_projects));
        setText('#ps-private', formatNumber(data.private_projects));

        const ctx = document.getElementById('chart-project-visibility');
        if (!ctx) return;
        if (charts.projectVisibility) charts.projectVisibility.destroy();
        charts.projectVisibility = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Public', 'Private'],
                datasets: [{
                    data: [data.public_projects, data.private_projects],
                    backgroundColor: [CHART_COLORS.blue, CHART_COLORS.slate],
                    borderWidth: 0,
                    hoverOffset: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: true, position: 'bottom', labels: { boxWidth: 10, padding: 16 } },
                }
            }
        });
    }

    async function loadProjectActivity() {
        const data = await fetchData(ENDPOINTS.projectActivity);
        if (!data) return;
        setText('#pa-updated-7d', formatNumber(data.updated_7d));
        setText('#pa-updated-30d', formatNumber(data.updated_30d));
        setText('#pa-opened-30d', formatNumber(data.opened_30d));
    }

    async function loadProjectGrowth(frequency) {
        projectGrowthFreq = frequency || projectGrowthFreq;
        const data = await fetchData(ENDPOINTS.projectGrowth, { frequency: projectGrowthFreq });
        if (!data || !data.length) return;

        const ctx = document.getElementById('chart-project-growth');
        if (!ctx) return;

        if (charts.projectGrowth) charts.projectGrowth.destroy();
        charts.projectGrowth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(function(d) { return d.period; }),
                datasets: [{
                    data: data.map(function(d) { return d.count; }),
                    backgroundColor: CHART_COLORS.green,
                    borderWidth: 0,
                    barPercentage: 0.6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(items) { return 'Period: ' + items[0].label; },
                            label: function(ctx) { return 'New projects: ' + ctx.parsed.y; }
                        }
                    }
                }
            }
        });
    }

    // ---------- Section: Content / Storage ----------
    async function loadContentSummary() {
        const data = await fetchData(ENDPOINTS.contentSummary);
        if (!data) return;
        setText('#cs-total-docs', formatNumber(data.total_documents));
        setText('#cs-total-files', formatNumber(data.total_uploaded_files));
        setText('#cs-avg-docs', data.avg_documents_per_project);
        setText('#cs-avg-files', data.avg_uploaded_files_per_project);
    }

    async function loadFileTypes() {
        const data = await fetchData(ENDPOINTS.fileTypes);
        if (!data) return;

        const ctx = document.getElementById('chart-file-types');
        if (!ctx) return;

        var entries = [];
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                entries.push([key, data[key]]);
            }
        }
        entries.sort(function(a, b) { return b[1] - a[1]; });

        var palette = [
            CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.amber,
            CHART_COLORS.purple, CHART_COLORS.teal, CHART_COLORS.red, CHART_COLORS.slate
        ];

        if (charts.fileTypes) charts.fileTypes.destroy();
        charts.fileTypes = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: entries.map(function(e) { return '.' + e[0]; }),
                datasets: [{
                    data: entries.map(function(e) { return e[1]; }),
                    backgroundColor: palette.slice(0, entries.length),
                    borderWidth: 0,
                    hoverOffset: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { display: true, position: 'right', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } },
                }
            }
        });
    }

    async function loadCollaboration() {
        const data = await fetchData(ENDPOINTS.collaborationDist);
        if (!data) return;

        const ctx = document.getElementById('chart-collaboration');
        if (!ctx) return;

        var keys = Object.keys(data);
        var labels = keys.map(function(k) {
            return k === '4+' ? '4+ collaborators' : k + ' collaborator' + (k !== '1' ? 's' : '');
        });

        if (charts.collaboration) charts.collaboration.destroy();
        charts.collaboration = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: keys.map(function(k) { return data[k]; }),
                    backgroundColor: CHART_COLORS.purple,
                    borderWidth: 0,
                    barPercentage: 0.5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: { beginAtZero: true, ticks: { stepSize: 1 } },
                    y: { grid: { display: false } }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(ctx) { return ctx.parsed.x + ' projects'; }
                        }
                    }
                }
            }
        });
    }

    // ---------- Section: User List ----------
    async function loadUserList() {
        const data = await fetchData(ENDPOINTS.userList);
        if (!data || !data.length) return;

        const tbody = $('#user-table-body');
        const count = $('#user-count');
        if (!tbody) return;
        if (count) count.textContent = data.length + ' records';

        tbody.innerHTML = data.map(function(user) {
            var name = user.name || '—';
            var email = user.email || '—';
            var roleBadge = user.is_admin
                ? '<span class="badge badge--admin">Admin</span>'
                : '<span class="badge badge--inactive">User</span>';

            var statusBadge;
            if (user.login_count === 0 || user.login_count === null) {
                statusBadge = '<span class="badge badge--never">Never logged in</span>';
            } else if (user.last_active) {
                statusBadge = '<span class="badge badge--active">Active</span>';
            } else {
                statusBadge = '<span class="badge badge--inactive">Inactive</span>';
            }

            var section = [user.section, user.division, user.groupname].filter(Boolean).join(' / ') || '—';

            return '<tr>' +
                '<td>' + name + '</td>' +
                '<td>' + email + '</td>' +
                '<td>' + roleBadge + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td>' + (user.designation || '—') + '</td>' +
                '<td>' + section + '</td>' +
                '<td style="text-align:right">' + formatNumber(user.login_count) + '</td>' +
                '<td>' + formatDate(user.signup_date) + '</td>' +
                '<td>' + formatDate(user.last_active) + '</td>' +
                '</tr>';
        }).join('');
    }

    // ---------- Section: Systems (hardcoded display only) ----------
    // NOTE: These are purely display values read from backend/config.py.
    // There is NO live connectivity check. These cards show what the
    // backend is configured to connect to when running in production.
    function renderSystems() {
        setText('#sys-mongo-host', 'mongo (sharelatex)');
        setText('#sys-redis-host', 'redis:6379');
        setText('#sys-mysql-host', '10.41.26.33');
        setText('#sys-mysql-db', 'emp_details');
    }

    // ---------- Navbar Scroll Spy ----------
    function initScrollSpy() {
        const links = $$('.navbar__link[data-section]');
        const sections = [];

        links.forEach(function(link) {
            var id = link.getAttribute('data-section');
            var section = document.getElementById(id);
            if (section) sections.push({ id: id, el: section, link: link });
        });

        function updateActive() {
            var scrollY = window.scrollY + 100;
            var current = sections[0];
            for (var i = 0; i < sections.length; i++) {
                if (scrollY >= sections[i].el.offsetTop) current = sections[i];
            }
            links.forEach(function(l) { l.classList.remove('active'); });
            if (current) current.link.classList.add('active');
        }

        window.addEventListener('scroll', updateActive, { passive: true });
        updateActive();
    }

    // ---------- Filter Buttons ----------
    function initFilters() {
        $$('[data-user-growth-freq]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                $$('[data-user-growth-freq]').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                loadUserGrowth(btn.dataset.userGrowthFreq);
            });
        });

        $$('[data-project-growth-freq]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                $$('[data-project-growth-freq]').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                loadProjectGrowth(btn.dataset.projectGrowthFreq);
            });
        });
    }

    // ---------- Timestamp ----------
    function updateTimestamp() {
        var el = $('#last-updated');
        if (el) {
            var now = new Date();
            el.textContent = now.toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }
    }

    // ---------- Init ----------
    async function init() {
        updateTimestamp();
        initScrollSpy();
        initFilters();
        renderSystems();

        await Promise.allSettled([
            loadOverview(),
            loadUserSummary(),
            loadUserActivity(),
            loadUserGrowth('day'),
            loadLoginStats(),
            loadProjectSummary(),
            loadProjectActivity(),
            loadProjectGrowth('day'),
            loadContentSummary(),
            loadFileTypes(),
            loadCollaboration(),
            loadUserList(),
        ]);

        updateTimestamp();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
