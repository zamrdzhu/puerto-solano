// Puerto Solano - save.js: localStorage progress (missions, cash, position).
PS.Save = (function () {
  var KEY = 'puerto_solano_save_v1';
  function load() {
    try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; }
    catch (e) { return null; }
  }
  function store(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
  }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
  return { load: load, store: store, clear: clear };
})();
