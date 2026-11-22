// Puerto Solano - hud.js: DOM HUD updates + canvas minimap.
PS.HUD = (function () {
  var el = {};
  function grab() {
    ['healthFill', 'cash', 'stars', 'weapon', 'objective', 'banner', 'radio', 'prompt', 'minimap', 'bustedFill', 'missionName', 'vignette', 'timer'].forEach(function (id) { el[id] = document.getElementById(id); });
  }
  var bannerT = null;
  function banner(text, ms) {
    if (!el.banner) grab();
    el.banner.textContent = text; el.banner.style.opacity = '1';
    clearTimeout(bannerT);
    bannerT = setTimeout(function () { el.banner.style.opacity = '0'; }, ms || 4200);
  }
  function flashDamage() {
    if (!el.vignette) grab();
    el.vignette.style.opacity = '0.55';
    setTimeout(function () { el.vignette.style.opacity = '0'; }, 180);
  }
  function update(G) {
    if (!el.cash) grab();
    var p = G.player;
    el.healthFill.style.width = PS.clamp(p.health, 0, 100) + '%';
    el.healthFill.style.background = p.health < 30 ? '#e33' : '#3ecf5a';
    el.cash.textContent = '$' + G.cash.toLocaleString();
    var s = PS.Police.getStars(), starTxt = '';
    for (var i = 0; i < 5; i++) starTxt += i < s ? '\u2605' : '\u2606';
    el.stars.textContent = starTxt;
    el.stars.style.color = (s > 0 && Math.sin(performance.now() * 0.012) > 0) ? '#ffd23e' : '#fff';
    el.weapon.textContent = p.car ? 'DRIVING' : (p.hasGun ? 'PISTOL \u221E' : 'FISTS');
    el.radio.textContent = '\u266B ' + PS.Audio.stationName();
    el.bustedFill.style.width = (PS.Police.bustedAmount() * 100) + '%';
    el.timer.textContent = G.missionTimer > 0 ? Math.ceil(G.missionTimer) + 's' : '';
    drawMap(G);
  }
  function setObjective(t) { if (!el.objective) grab(); el.objective.textContent = t || ''; }
  function setMission(t) { if (!el.missionName) grab(); el.missionName.textContent = t || ''; }
  function setPrompt(t) { if (!el.prompt) grab(); el.prompt.textContent = t || ''; el.prompt.style.opacity = t ? '1' : '0'; }
  function drawMap(G) {
    var c = el.minimap; if (!c) return;
    var g = c.getContext('2d'), S = c.width, W = PS.CFG.world;
    g.fillStyle = '#1d2b26'; g.fillRect(0, 0, S, S);
    function mx(x) { return (x / W + 0.5) * S; } function mz(z) { return (z / W + 0.5) * S; }
    g.strokeStyle = '#5a6672'; g.lineWidth = 3;
    for (var i = -W / 2 + PS.CFG.roadEvery / 2; i < W / 2; i += PS.CFG.roadEvery) {
      g.beginPath(); g.moveTo(mx(i), 0); g.lineTo(mx(i), S); g.stroke();
      g.beginPath(); g.moveTo(0, mz(i)); g.lineTo(S, mz(i)); g.stroke();
    }
    g.fillStyle = '#1b7f9e'; g.fillRect(0, mz(PS.CFG.beachZ + 40), S, S - mz(PS.CFG.beachZ + 40));
    // traffic dots
    g.fillStyle = '#cfd6dd';
    G.traffic.cars.forEach(function (t) { g.fillRect(mx(t.mesh.position.x) - 1, mz(t.mesh.position.z) - 1, 2, 2); });
    // police blips
    g.fillStyle = '#3a7bd5';
    PS.Police.cruisers().forEach(function (t) { g.beginPath(); g.arc(mx(t.mesh.position.x), mz(t.mesh.position.z), 3, 0, 7); g.fill(); });
    // enemies
    g.fillStyle = '#ff4d6d';
    PS.Combat.list().forEach(function (e) { if (!e.dead) { g.beginPath(); g.arc(mx(e.mesh.position.x), mz(e.mesh.position.z), 3, 0, 7); g.fill(); } });
    // mission marker
    if (G.marker) { g.fillStyle = '#ffd23e'; g.beginPath(); g.arc(mx(G.marker.x), mz(G.marker.z), 5, 0, 7); g.fill(); }
    // player arrow
    var px = mx(G.player.pos.x), pz = mz(G.player.pos.z), a = G.player.car ? (G.player.car.angle || 0) : G.player.angle;
    g.save(); g.translate(px, pz); g.rotate(Math.atan2(Math.sin(a), -Math.cos(a)) + Math.PI);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -6); g.lineTo(4, 5); g.lineTo(-4, 5); g.closePath(); g.fill(); g.restore();
    g.fillStyle = '#fff'; g.font = 'bold 11px sans-serif'; g.fillText('N', S - 14, 14);
  }
  return { grab: grab, banner: banner, update: update, setObjective: setObjective, setMission: setMission, setPrompt: setPrompt, flashDamage: flashDamage };
})();
