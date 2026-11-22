// Puerto Solano - effects.js: particles, skid marks, checkpoint pillar, flashes.
PS.Effects = (function () {
  var scene = null, parts = [], pillar = null, flash = null;
  var geo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
  function init(s) {
    scene = s;
    pillar = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 30, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd23e, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
    pillar.visible = false; scene.add(pillar);
    flash = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe27a }));
    flash.visible = false; scene.add(flash);
  }
  function burst(pos, color, n, spread, up) {
    if (!scene) return;
    for (var i = 0; i < n; i++) {
      var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: color, transparent: true }));
      m.position.copy(pos);
      parts.push({ m: m, vx: (Math.random() - 0.5) * spread, vy: Math.random() * up, vz: (Math.random() - 0.5) * spread, life: 0.7 });
      scene.add(m);
      if (parts.length > 220) { var old = parts.shift(); scene.remove(old.m); }
    }
  }
  function smoke(pos, dt) { if (Math.random() < dt * 14) burst(new THREE.Vector3(pos.x, pos.y + 1.6, pos.z), 0x555a60, 1, 0.6, 2.4); }
  function exhaust(pos) { if (Math.random() < 0.3) burst(pos, 0xcccccc, 1, 0.4, 1); }
  function muzzle(pos) { if (flash) { flash.position.copy(pos); flash.visible = true; setTimeout(function () { flash.visible = false; }, 45); } }
  function setMarker(x, z, color) {
    if (!pillar) return;
    if (x === null) { pillar.visible = false; return; }
    pillar.visible = true; pillar.position.set(x, 15, z);
    if (color) pillar.material.color.setHex(color);
  }
  function update(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life -= dt;
      p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
      p.m.material.opacity = Math.max(0, p.life);
      if (p.life <= 0) { scene.remove(p.m); parts.splice(i, 1); }
    }
    if (pillar && pillar.visible) pillar.rotation.y += dt * 0.8;
  }
  // Skid marks: short dark quads dropped by main when drifting.
  var skids = [];
  function skid(pos, angle) {
    if (!scene || skids.length > 300) return;
    var m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.6), new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.55 }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = -angle; m.position.set(pos.x, 0.05, pos.z);
    scene.add(m); skids.push(m);
  }
  return { init: init, burst: burst, smoke: smoke, exhaust: exhaust, muzzle: muzzle, setMarker: setMarker, update: update, skid: skid };
})();
