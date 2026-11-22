// Puerto Solano - combat.js: on-foot shooting, gang enemies, pickups.
PS.Combat = (function () {
  var scene = null, player = null, enemies = [], pickups = [];
  var mouseDown = false, fireCd = 0;
  function init(s, p) {
    scene = s; player = p;
    window.addEventListener('mousedown', function () { mouseDown = true; PS.Audio.ensure(); });
    window.addEventListener('mouseup', function () { mouseDown = false; });
  }
  function spawnEnemy(x, z) {
    var g = new THREE.Group();
    function part(c, w, h, d, px, py, pz) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c }));
      m.position.set(px, py, pz); g.add(m); return m;
    }
    part(0xb03060, 0.62, 0.75, 0.34, 0, 1.25, 0); // Coral gang magenta
    part(0x8a5a3a, 0.42, 0.42, 0.42, 0, 1.85, 0);
    part(0x2b3a4a, 0.22, 0.8, 0.22, -0.16, 0.45, 0);
    part(0x2b3a4a, 0.22, 0.8, 0.22, 0.16, 0.45, 0);
    g.position.set(x, 0, z); scene.add(g);
    var e = { mesh: g, health: 40, fireT: 1 + Math.random() * 2, dead: false };
    enemies.push(e); return e;
  }
  function spawnPickup(x, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.9), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    m.position.set(x, 0.6, z); scene.add(m);
    pickups.push({ mesh: m, taken: false });
  }
  function alive() { return enemies.filter(function (e) { return !e.dead; }).length; }
  function update(dt) {
    fireCd -= dt;
    if (player) player.mesh.userData.gun.visible = !player.car;
    // Player shooting: hold mouse, hits nearest enemy in front within range.
    if (mouseDown && !player.car && fireCd <= 0) {
      fireCd = 0.16; PS.Audio.shot();
      PS.Effects.muzzle(new THREE.Vector3(player.pos.x + Math.sin(player.angle) * 0.7, 1.35, player.pos.z + Math.cos(player.angle) * 0.7));
      PS.Police.crime('shot');
      var best = null, bd = 1600;
      enemies.forEach(function (e) {
        if (e.dead) return;
        var d = PS.dist2(e.mesh.position, player.pos);
        if (d < bd) { bd = d; best = e; }
      });
      if (best) {
        best.health -= 20;
        PS.Effects.burst(best.mesh.position.clone().setY(1.4), 0xff5544, 3, 2, 2);
        if (best.health <= 0) { best.dead = true; best.mesh.rotation.x = Math.PI / 2; best.mesh.position.y = 0.3; PS.Effects.burst(best.mesh.position.clone().setY(1), 0xb03060, 8, 3, 3); }
      }
    }
    // Enemies advance and shoot back.
    enemies.forEach(function (e) {
      if (e.dead) return;
      var dx = player.pos.x - e.mesh.position.x, dz = player.pos.z - e.mesh.position.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      e.mesh.rotation.y = Math.atan2(dx, dz);
      if (d > 9) { e.mesh.position.x += (dx / d) * 3.4 * dt; e.mesh.position.z += (dz / d) * 3.4 * dt; }
      e.fireT -= dt;
      if (e.fireT <= 0 && d < 30) {
        e.fireT = 1.2 + Math.random() * 1.6;
        PS.Audio.shot();
        if (Math.random() < 0.45) { player.damage(6); PS.HUD && PS.HUD.flashDamage(); }
      }
    });
    pickups.forEach(function (pk) {
      if (!pk.taken && PS.dist2(pk.mesh.position, player.pos) < 5) {
        pk.taken = true; scene.remove(pk.mesh); player.ammo += 60; player.hasGun = true;
        PS.HUD && PS.HUD.banner('Weapon picked up: PISTOL +60 rounds');
      }
      pk.mesh.rotation.y += dt * 2;
    });
  }
  function clearEnemies() { enemies.forEach(function (e) { scene.remove(e.mesh); }); enemies = []; }
  return { init: init, spawnEnemy: spawnEnemy, spawnPickup: spawnPickup, alive: alive, update: update, clearEnemies: clearEnemies, list: function () { return enemies; } };
})();
