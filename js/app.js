/**
 * Todo List Dashboard — app.js
 *
 * Architecture: Revealing Module Pattern under the `App` namespace.
 * Modules are defined in dependency order:
 *   StorageService → ThemeService → NameService → DateUtils →
 *   GreetingWidget → FocusTimerWidget → TodoListWidget → QuickLinksWidget
 *
 * Entry point: DOMContentLoaded at the bottom of this file.
 */

'use strict';

const App = {};

/* =============================================================
   StorageService
   Centralises all localStorage access with error handling.
   ============================================================= */
App.StorageService = (function () {

  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.error('[StorageService] Failed to parse data for key "' + key + '":', err);
      remove(key);
      return null;
    }
  }

  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error('[StorageService] Failed to save data for key "' + key + '":', err);
      document.dispatchEvent(
        new CustomEvent('storage:quota-exceeded', { detail: { key } })
      );
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error('[StorageService] Failed to remove key "' + key + '":', err);
    }
  }

  return { load, save, remove };
}());

/* =============================================================
   ThemeService
   Manages light / dark theme via [data-theme] on <html>.
   Persists selection to localStorage.
   ============================================================= */
App.ThemeService = (function () {

  const STORAGE_KEY = 'todo-list-dashboard:theme';
  const THEMES = ['dark', 'light'];
  let _current = 'dark';

  function _apply(theme) {
    _current = THEMES.includes(theme) ? theme : 'dark';
    document.documentElement.setAttribute('data-theme', _current);
    // Update toggle button label and icon
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      if (_current === 'dark') {
        btn.setAttribute('aria-label', 'Switch to light mode');
        btn.querySelector('.theme-icon').textContent = '☀️';
      } else {
        btn.setAttribute('aria-label', 'Switch to dark mode');
        btn.querySelector('.theme-icon').textContent = '🌙';
      }
    }
  }

  function toggle() {
    const next = _current === 'dark' ? 'light' : 'dark';
    _apply(next);
    App.StorageService.save(STORAGE_KEY, next);
  }

  function init() {
    const saved = App.StorageService.load(STORAGE_KEY);
    _apply(typeof saved === 'string' ? saved : 'dark');

    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);
  }

  function getCurrent() { return _current; }

  return { init, toggle, getCurrent };
}());

/* =============================================================
   DateUtils
   Pure date/time formatting helpers — no DOM access.
   ============================================================= */
App.DateUtils = (function () {

  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  function formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }

  function formatDate(date) {
    const day   = DAYS[date.getDay()];
    const d     = date.getDate();
    const month = MONTHS[date.getMonth()];
    const year  = date.getFullYear();
    return day + ', ' + d + ' ' + month + ' ' + year;
  }

  function getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour >= 5  && hour <= 11) return 'Morning';
    if (hour >= 12 && hour <= 17) return 'Afternoon';
    return 'Evening';
  }

  function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
  }

  return { formatTime, formatDate, getTimeOfDay, isValidDate };
}());

/* =============================================================
   GreetingWidget
   Displays time, date, contextual greeting, and optional name.
   Updates every 60 seconds.
   ============================================================= */
App.GreetingWidget = (function () {

  const NAME_KEY = 'todo-list-dashboard:name';
  let _name = '';

  // ── Rendering ───────────────────────────────────────────────

  function render() {
    const now = new Date();
    const timeEl     = document.getElementById('greeting-time');
    const dateEl     = document.getElementById('greeting-date');
    const greetingEl = document.getElementById('greeting-text');

    if (!App.DateUtils.isValidDate(now)) {
      if (timeEl)     timeEl.textContent     = '--:--';
      if (dateEl)     dateEl.textContent     = 'Date unavailable';
      if (greetingEl) greetingEl.textContent = '';
      return;
    }

    if (timeEl)     timeEl.textContent = App.DateUtils.formatTime(now);
    if (dateEl)     dateEl.textContent = App.DateUtils.formatDate(now);

    const period = App.DateUtils.getTimeOfDay(now);
    if (greetingEl) {
      greetingEl.textContent = _name
        ? 'Good ' + period + ', ' + _name + '!'
        : 'Good ' + period;
    }

    // Refresh the name label below the greeting
    _renderNameLabel();
  }

  function _renderNameLabel() {
    const labelEl = document.getElementById('greeting-name-label');
    if (labelEl) {
      labelEl.textContent = _name ? 'Hello, ' + _name + '!' : '';
    }
  }

  // ── Name edit UI ─────────────────────────────────────────────

  function _initNameEdit() {
    const editBtn    = document.getElementById('name-edit-btn');
    const cancelBtn  = document.getElementById('name-cancel-btn');
    const saveBtn    = document.getElementById('name-save-btn');
    const nameInput  = document.getElementById('name-input');
    const nameError  = document.getElementById('name-error');
    const displayRow = document.getElementById('name-display-row');
    const editForm   = document.getElementById('name-edit-form');

    function showForm() {
      if (displayRow) displayRow.hidden = true;
      if (editForm)   { editForm.hidden = false; }
      if (nameInput)  { nameInput.value = _name; nameInput.focus(); }
      if (nameError)  nameError.textContent = '';
    }

    function hideForm() {
      if (displayRow) displayRow.hidden = false;
      if (editForm)   editForm.hidden = true;
    }

    function saveName() {
      const trimmed = nameInput ? nameInput.value.trim() : '';
      _name = trimmed;
      App.StorageService.save(NAME_KEY, trimmed);
      render();
      hideForm();
    }

    if (editBtn)   editBtn.addEventListener('click', showForm);
    if (cancelBtn) cancelBtn.addEventListener('click', hideForm);
    if (saveBtn)   saveBtn.addEventListener('click', saveName);
    if (nameInput) {
      nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter')  saveName();
        if (e.key === 'Escape') hideForm();
      });
      nameInput.addEventListener('input', function () {
        if (nameError) nameError.textContent = '';
      });
    }
  }

  // ── init ────────────────────────────────────────────────────

  function init() {
    const saved = App.StorageService.load(NAME_KEY);
    _name = (typeof saved === 'string') ? saved : '';
    render();
    _initNameEdit();
    setInterval(render, 60000);
  }

  return { init, render };
}());

/* =============================================================
   FocusTimerWidget
   25-minute countdown timer with Start / Stop / Reset controls.
   ============================================================= */
App.FocusTimerWidget = (function () {

  const INITIAL_SECONDS = 25 * 60;

  const state = {
    remaining:  INITIAL_SECONDS,
    running:    false,
    intervalId: null,
  };

  let displayEl    = null;
  let startBtn     = null;
  let stopBtn      = null;
  let resetBtn     = null;
  let completionEl = null;

  function formatTime(totalSeconds) {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return mm + ':' + ss;
  }

  function render() {
    if (displayEl) displayEl.textContent = formatTime(state.remaining);
    if (startBtn)  startBtn.disabled  = state.running;
    if (stopBtn)   stopBtn.disabled   = !state.running;
  }

  function tick() {
    if (state.remaining > 0) state.remaining -= 1;
    render();
    if (state.remaining === 0) {
      _clearInterval();
      state.running = false;
      render();
      _showCompletion();
    }
  }

  function start() {
    if (state.running) return;
    _clearInterval();
    state.running    = true;
    state.intervalId = setInterval(tick, 1000);
    render();
  }

  function stop() {
    _clearInterval();
    state.running = false;
    render();
  }

  function reset() {
    _clearInterval();
    state.remaining  = INITIAL_SECONDS;
    state.running    = false;
    state.intervalId = null;
    if (completionEl) completionEl.hidden = true;
    render();
  }

  function _clearInterval() {
    if (state.intervalId !== null) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  function _showCompletion() {
    if (!completionEl) return;
    completionEl.hidden = false;
    setTimeout(function () { completionEl.hidden = true; }, 4000);
  }

  function init() {
    displayEl    = document.getElementById('timer-display');
    startBtn     = document.getElementById('timer-start');
    stopBtn      = document.getElementById('timer-stop');
    resetBtn     = document.getElementById('timer-reset');
    completionEl = document.getElementById('timer-completion');
    render();
    if (startBtn)  startBtn.addEventListener('click', start);
    if (stopBtn)   stopBtn.addEventListener('click', stop);
    if (resetBtn)  resetBtn.addEventListener('click', reset);
  }

  function _getState() { return state; }

  return { init, start, stop, reset, tick, render, _getState };
}());

/* =============================================================
   TodoListWidget
   Task CRUD with localStorage persistence and duplicate prevention.
   ============================================================= */
App.TodoListWidget = (function () {

  const STORAGE_KEY = 'todo-list-dashboard:tasks';
  let tasks = [];

  let inputEl      = null;
  let addBtn       = null;
  let listEl       = null;
  let inputErrorEl = null;
  let quotaErrorEl = null;

  function _generateId() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString();
  }

  function persist() {
    if (quotaErrorEl) { quotaErrorEl.hidden = true; quotaErrorEl.textContent = ''; }
    App.StorageService.save(STORAGE_KEY, tasks);
  }

  function renderList() {
    if (!listEl) return;
    listEl.innerHTML = '';

    if (tasks.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'todo-empty-state';
      empty.textContent = 'No tasks yet. Add one above!';
      listEl.appendChild(empty);
      return;
    }

    tasks.forEach(function (task) {
      const li = document.createElement('li');
      li.className = 'todo-item' + (task.completed ? ' completed' : '');
      li.dataset.id = task.id;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'todo-title';
      titleSpan.textContent = task.title;

      const actions = document.createElement('div');
      actions.className = 'todo-item-actions';

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'btn-icon';
      toggleBtn.setAttribute('aria-label', (task.completed ? 'Mark as incomplete: ' : 'Mark as complete: ') + task.title);
      toggleBtn.textContent = task.completed ? '↩' : '✓';
      toggleBtn.addEventListener('click', function () { toggleTask(task.id); });

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn-icon';
      editBtn.setAttribute('aria-label', 'Edit task: ' + task.title);
      editBtn.textContent = '✎';
      editBtn.addEventListener('click', function () { _showEditView(li, task); });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn-icon btn-danger';
      deleteBtn.setAttribute('aria-label', 'Delete task: ' + task.title);
      deleteBtn.textContent = '✕';
      deleteBtn.addEventListener('click', function () { deleteTask(task.id); });

      actions.appendChild(toggleBtn);
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      li.appendChild(titleSpan);
      li.appendChild(actions);
      listEl.appendChild(li);
    });
  }

  function _showEditView(li, task) {
    li.innerHTML = '';

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'todo-edit-field';
    editInput.value = task.title;
    editInput.setAttribute('aria-label', 'Edit task title');

    const editError = document.createElement('span');
    editError.className = 'error-message';
    editError.setAttribute('role', 'alert');

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.textContent = 'Save';
    confirmBtn.setAttribute('aria-label', 'Save edit');

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');

    const actions = document.createElement('div');
    actions.className = 'todo-item-actions';
    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);

    li.appendChild(editInput);
    li.appendChild(editError);
    li.appendChild(actions);
    editInput.focus();

    editInput.addEventListener('input', function () { editError.textContent = ''; });
    confirmBtn.addEventListener('click', function () { editTask(task.id, editInput.value, editError); });
    cancelBtn.addEventListener('click', function () { renderList(); });
    editInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter')  editTask(task.id, editInput.value, editError);
      if (e.key === 'Escape') renderList();
    });
  }

  // ── CRUD ────────────────────────────────────────────────────

  /** Check if a title already exists (case-insensitive, trimmed). */
  function _isDuplicate(trimmedTitle, excludeId) {
    const lower = trimmedTitle.toLowerCase();
    return tasks.some(function (t) {
      return t.id !== excludeId && t.title.trim().toLowerCase() === lower;
    });
  }

  function addTask(title) {
    const trimmed = typeof title === 'string' ? title.trim() : '';
    if (trimmed === '') {
      if (inputErrorEl) inputErrorEl.textContent = 'Please enter a task title.';
      return;
    }
    if (_isDuplicate(trimmed)) {
      if (inputErrorEl) inputErrorEl.textContent = '"' + trimmed + '" is already in your list.';
      return;
    }
    tasks.push({ id: _generateId(), title: trimmed, completed: false });
    persist();
    renderList();
    if (inputEl) inputEl.value = '';
    if (inputErrorEl) inputErrorEl.textContent = '';
  }

  function editTask(id, newTitle, errorEl) {
    const trimmed = typeof newTitle === 'string' ? newTitle.trim() : '';
    if (trimmed === '') {
      if (errorEl) errorEl.textContent = 'Task title cannot be empty.';
      return;
    }
    if (_isDuplicate(trimmed, id)) {
      if (errorEl) errorEl.textContent = '"' + trimmed + '" is already in your list.';
      return;
    }
    const task = tasks.find(function (t) { return t.id === id; });
    if (task) {
      task.title = trimmed;
      persist();
    }
    renderList();
  }

  function toggleTask(id) {
    const task = tasks.find(function (t) { return t.id === id; });
    if (task) {
      task.completed = !task.completed;
      persist();
    }
    renderList();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    persist();
    renderList();
  }

  // ── init ────────────────────────────────────────────────────

  function init() {
    inputEl      = document.getElementById('todo-input');
    addBtn       = document.getElementById('todo-add-btn');
    listEl       = document.getElementById('todo-list');
    inputErrorEl = document.getElementById('todo-input-error');
    quotaErrorEl = document.getElementById('todo-quota-error');

    const loaded = App.StorageService.load(STORAGE_KEY);
    tasks = Array.isArray(loaded) ? loaded : [];
    renderList();

    if (addBtn) {
      addBtn.addEventListener('click', function () { addTask(inputEl ? inputEl.value : ''); });
    }
    if (inputEl) {
      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') addTask(inputEl.value);
      });
      inputEl.addEventListener('input', function () {
        if (inputErrorEl) inputErrorEl.textContent = '';
      });
    }

    document.addEventListener('storage:quota-exceeded', function (e) {
      if (e.detail && e.detail.key === STORAGE_KEY && quotaErrorEl) {
        quotaErrorEl.hidden = false;
        quotaErrorEl.textContent = 'Could not save: storage is full.';
      }
    });
  }

  function _getTasks() { return tasks; }
  function _setTasks(t) { tasks = t; }

  return { init, addTask, editTask, toggleTask, deleteTask, renderList, persist, _getTasks, _setTasks };
}());

/* =============================================================
   QuickLinksWidget
   Link management with localStorage persistence.
   ============================================================= */
App.QuickLinksWidget = (function () {

  const STORAGE_KEY  = 'todo-list-dashboard:links';
  const MAX_LINKS    = 50;
  const MAX_LABEL_LEN = 100;
  const MAX_URL_LEN   = 2048;

  let links = [];

  let labelInputEl  = null;
  let urlInputEl    = null;
  let addBtn        = null;
  let linksListEl   = null;
  let labelErrorEl  = null;
  let urlErrorEl    = null;
  let limitErrorEl  = null;
  let quotaErrorEl  = null;
  let loadErrorEl   = null;

  function _generateId() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString();
  }

  function _clearErrors() {
    [labelErrorEl, urlErrorEl, limitErrorEl].forEach(function (el) {
      if (el) el.textContent = '';
    });
  }

  function persist() {
    if (quotaErrorEl) { quotaErrorEl.hidden = true; quotaErrorEl.textContent = ''; }
    App.StorageService.save(STORAGE_KEY, links);
  }

  function renderLinks() {
    if (!linksListEl) return;
    linksListEl.innerHTML = '';

    if (links.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'todo-empty-state';
      empty.textContent = 'No links saved yet.';
      linksListEl.appendChild(empty);
      return;
    }

    links.forEach(function (link) {
      const wrapper = document.createElement('div');
      wrapper.className = 'link-item';
      wrapper.dataset.id = link.id;

      const anchor = document.createElement('a');
      anchor.className = 'link-btn';
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link.label;
      anchor.setAttribute('aria-label', link.label + ' (opens in new tab)');

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn-icon btn-danger';
      deleteBtn.setAttribute('aria-label', 'Delete link: ' + link.label);
      deleteBtn.textContent = '✕';
      deleteBtn.addEventListener('click', function () { deleteLink(link.id); });

      wrapper.appendChild(anchor);
      wrapper.appendChild(deleteBtn);
      linksListEl.appendChild(wrapper);
    });
  }

  function addLink(label, url) {
    _clearErrors();
    const trimLabel = typeof label === 'string' ? label.trim() : '';
    const trimUrl   = typeof url   === 'string' ? url.trim()   : '';

    if (trimLabel === '') {
      if (labelErrorEl) labelErrorEl.textContent = 'Please enter a label for this link.';
      return;
    }
    if (trimUrl === '') {
      if (urlErrorEl) urlErrorEl.textContent = 'Please enter a URL for this link.';
      return;
    }
    if (!trimUrl.startsWith('http://') && !trimUrl.startsWith('https://')) {
      if (urlErrorEl) urlErrorEl.textContent = 'URL must start with http:// or https://';
      return;
    }
    if (links.length >= MAX_LINKS) {
      if (limitErrorEl) limitErrorEl.textContent = 'Maximum of 50 links reached.';
      return;
    }

    links.push({ id: _generateId(), label: trimLabel, url: trimUrl });
    persist();
    renderLinks();
    if (labelInputEl) labelInputEl.value = '';
    if (urlInputEl)   urlInputEl.value   = '';
  }

  function deleteLink(id) {
    links = links.filter(function (l) { return l.id !== id; });
    persist();
    renderLinks();
  }

  function init() {
    labelInputEl = document.getElementById('link-label-input');
    urlInputEl   = document.getElementById('link-url-input');
    addBtn       = document.getElementById('link-add-btn');
    linksListEl  = document.getElementById('links-list');
    labelErrorEl = document.getElementById('link-label-error');
    urlErrorEl   = document.getElementById('link-url-error');
    limitErrorEl = document.getElementById('link-limit-error');
    quotaErrorEl = document.getElementById('links-quota-error');
    loadErrorEl  = document.getElementById('links-load-error');

    const loaded = App.StorageService.load(STORAGE_KEY);
    if (loaded === null) {
      links = [];
    } else if (!Array.isArray(loaded)) {
      links = [];
      if (loadErrorEl) {
        loadErrorEl.hidden = false;
        loadErrorEl.textContent = 'The saved links could not be loaded.';
      }
    } else {
      links = loaded;
    }

    renderLinks();

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addLink(
          labelInputEl ? labelInputEl.value : '',
          urlInputEl   ? urlInputEl.value   : ''
        );
      });
    }

    if (labelInputEl) {
      labelInputEl.addEventListener('input', function () {
        if (labelErrorEl) labelErrorEl.textContent = '';
      });
    }
    if (urlInputEl) {
      urlInputEl.addEventListener('input', function () {
        if (urlErrorEl) urlErrorEl.textContent = '';
      });
    }

    document.addEventListener('storage:quota-exceeded', function (e) {
      if (e.detail && e.detail.key === STORAGE_KEY && quotaErrorEl) {
        quotaErrorEl.hidden = false;
        quotaErrorEl.textContent = 'Could not save: storage is full.';
      }
    });
  }

  function _getLinks() { return links; }
  function _setLinks(l) { links = l; }

  return { init, addLink, deleteLink, renderLinks, persist, _getLinks, _setLinks };
}());

/* =============================================================
   Entry Point
   ============================================================= */
document.addEventListener('DOMContentLoaded', function () {
  App.ThemeService.init();
  App.GreetingWidget.init();
  App.FocusTimerWidget.init();
  App.TodoListWidget.init();
  App.QuickLinksWidget.init();
});
