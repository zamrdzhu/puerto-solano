// Puerto Solano - player.js: on-foot character, car entry, arcade driving, cameras.
PS.Player = (function () {
  function buildFigure() {
    var g = new THREE.Group();
    function part(c, w, h, d, x, y, z) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c }));
      m.position.set(x, y, z); g.add(m); return m;
    }
    part(0xf2c230, 0.62, 0.75, 0.34, 0, 1.25, 0);            // torso - yellow jacket
    part(0xe8b08a, 0.42, 0.42, 0.42, 0, 1.85, 0);            // head
    part(0x22303c, 0.44, 0.12, 0.44, 0, 2.1, 0);             // cap
    g.userData.armL = part(0xf2c230, 0.18, 0.7, 0.18, -0.42, 1.25, 0);
    g.userData.armR = part(0xf2c230, 0.18, 0.7, 0.18, 0.42, 1.25, 0);
    g.userData.legL = part(0x2b3a4a, 0.22, 0.8, 0.22, -0.16, 0.45, 0);
    g.userData.legR = part(0x2b3a4a, 0.22, 0.8, 0.22, 0.16, 0.45, 0);
    g.userData.gun = part(0x14161a, 0.1, 0.12, 0.55, 0.42, 1.3, 0.3);
    g.userData.gun.visible = false;
    return g;
  }
  function Player(scene) {
    this.mesh = buildFigure(); scene.add(this.mesh);
    this.pos = new THREE.Vector3(20, 0, 230);
    this.angle = Math.PI; this.health = 100; this.walkT = 0;
    this.car = null;            // vehicle record being driven
    this.speed = 0; this.steer = 0; this.hasGun = true; this.ammo = 999;
    this.dead = false;
  }
  Player.prototype.nearestCar = function (all) {
    var best = null, bd = 36;
    for (var i = 0; i < all.length; i++) {
      var d = PS.dist2(this.pos, all[i].mesh.position);
      if (d < bd) { bd = d; best = all[i]; }
    }
    return best;
  };
  Player.prototype.enterCar = function (car) {
    this.car = car; car.parked = false; car.driver = 'player';
    this.mesh.visible = false;
    if (PS.Police) PS.Police.crime('theft');
  };
  Player.prototype.exitCar = function () {
    if (!this.car) return;
    var c = this.car; this.car = null; c.driver = null; c.parked = true; c.speed = 0;
    this.pos.set(c.mesh.position.x + 2.6, 0, c.mesh.position.z);
    this.mesh.visible = true;
  };
  Player.prototype.damage = function (n) {
    this.health -= n;
    if (this.health <= 0 && !this.dead) { this.dead = true; PS.Game && PS.Game.wasted(); }
  };
  Player.prototype.update = function (dt, camera) {
    var K = PS.key;
    if (this.car) {
      var car = this.car, C = PS.CFG;
      var tireFactor = car.tires <= 2 ? 0.45 : 1; // spike-strip damage
      var accel = K('KeyW') || K('ArrowUp') ? C.carAccel : 0;
      var brake = K('KeyS') || K('ArrowDown') ? 1 : 0;
      if (brake) this.speed = this.speed > 0.5 ? this.speed - 34 * dt : Math.max(-C.carReverse, this.speed - 16 * dt);
      else this.speed += accel * dt;
      if (!accel) this.speed -= this.speed * 0.55 * dt; // drag
      if (K('Space')) { this.speed -= this.speed * 2.2 * dt; if (Math.abs(this.speed) > 12 && PS.Effects) PS.Effects.skid(car.mesh.position, car.angle || 0); }
      var maxF = C.carMax * tireFactor;
      this.speed = PS.clamp(this.speed, -C.carReverse, maxF);
      var steerIn = (K('KeyA') || K('ArrowLeft') ? 1 : 0) - (K('KeyD') || K('ArrowRight') ? 1 : 0);
      this.steer = PS.lerp(this.steer, steerIn, dt * 7);
      car.angle = (car.angle || 0) + this.steer * C.carTurn * dt * PS.clamp(this.speed / 14, -1, 1) * tireFactor;
      var nx = car.mesh.position.x + Math.sin(car.angle) * this.speed * dt;
      var nz = car.mesh.position.z + Math.cos(car.angle) * this.speed * dt;
      var before = { x: car.mesh.position.x, z: car.mesh.position.z };
      car.mesh.position.x = nx; car.mesh.position.z = nz;
      if (PS.City.collide(car.mesh.position, 1.7)) {
        if (Math.abs(this.speed) > 9) { PS.Audio.thud(); this.damage(2); car.health -= 8; }
        this.speed *= -0.25; car.mesh.position.x = PS.lerp(car.mesh.position.x, before.x, 0.5); car.mesh.position.z = PS.lerp(car.mesh.position.z, before.z, 0.5);
      }
      car.mesh.rotation.y = car.angle;
      car.speed = this.speed;
      if (car.health < 45) car.smoke = 1; if (car.smoke) PS.Effects.smoke(car.mesh.position, dt);
      if (Math.abs(this.speed) > 4) PS.Effects.exhaust(new THREE.Vector3(car.mesh.position.x - Math.sin(car.angle) * 2.4, 0.5, car.mesh.position.z - Math.cos(car.angle) * 2.4));
      this.pos.copy(car.mesh.position);
      // chase camera
      var back = 11 + Math.abs(this.speed) * 0.12;
      var cx = car.mesh.position.x - Math.sin(car.angle) * back;
      var cz = car.mesh.position.z - Math.cos(car.angle) * back;
      camera.position.lerp(new THREE.Vector3(cx, 5.2, cz), 0.12);
      camera.lookAt(car.mesh.position.x, 1.6, car.mesh.position.z);
    } else {
      var run = K('ShiftLeft') || K('ShiftRight');
      var sp = run ? PS.CFG.runSpeed : PS.CFG.playerSpeed;
      var mx = 0, mz = 0;
      if (K('KeyW') || K('ArrowUp')) mz -= 1; if (K('KeyS') || K('ArrowDown')) mz += 1;
      if (K('KeyA') || K('ArrowLeft')) mx -= 1; if (K('KeyD') || K('ArrowRight')) mx += 1;
      // movement is camera-relative-ish: forward = away from camera is complex; use world axes + facing
      if (mx || mz) {
        var len = Math.sqrt(mx * mx + mz * mz); mx /= len; mz /= len;
        this.angle = Math.atan2(mx, mz);
        this.pos.x += mx * sp * dt; this.pos.z += mz * sp * dt;
        this.walkT += dt * (run ? 13 : 9);
        PS.City.collide(this.pos, 0.7);
      }
      this.mesh.position.copy(this.pos);
      this.mesh.rotation.y = this.angle;
      var s = Math.sin(this.walkT) * 0.55;
      this.mesh.userData.legL.rotation.x = s; this.mesh.userData.legR.rotation.x = -s;
      this.mesh.userData.armL.rotation.x = -s * 0.8; this.mesh.userData.armR.rotation.x = s * 0.8;
      var tx = this.pos.x - Math.sin(this.angle) * 8, tz = this.pos.z - Math.cos(this.angle) * 8;
      camera.position.lerp(new THREE.Vector3(tx, 4.4, tz), 0.1);
      camera.lookAt(this.pos.x, 1.5, this.pos.z);
    }
  };
  return { Player: Player };
})();
