// Puerto Solano - main.js: boot, state machine, game loop, screenshot staging.
(function () {
  var params = new URLSearchParams(location.search);
  var shot = params.get('shot');
  var seed = parseInt(params.get('seed') || '7', 10) || 7;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 1200);
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  document.getElementById('game').appendChild(renderer.domElement);

  var cityData = PS.City.build(scene, seed);
  PS.Effects.init(scene);
  PS.Weather.init(scene);
  var traffic = new PS.Vehicles.Traffic(scene, seed, 14);
  var parkedCars = PS.Vehicles.parked(scene, seed);
  var player = new PS.Player.Player(scene);
  player.mesh.position.copy(player.pos);

  var G = {
    scene: scene, camera: camera, player: player, traffic: traffic,
    cash: 120, state: shot ? 'playing' : 'title', marker: null,
    missionTimer: 0, extraCars: [], paused: false,
    allCars: function () { return parkedCars.concat(traffic.cars, this.extraCars); },
    saveGame: function () {
      PS.Save.store({ missions: PS.Missions.index(), cash: this.cash, x: player.pos.x, z: player.pos.z });
    },
    wasted: function () { setOverlay('wasted'); this.state = 'over'; PS.Save.store({ missions: PS.Missions.index(), cash: Math.floor(this.cash / 2), x: 20, z: 230 }); },
    busted: function () { setOverlay('busted'); this.state = 'over'; PS.Police.clear(); this.cash = Math.max(0, this.cash - 100); }
  };
  PS.Game = G;
  PS.Police.init(scene, player);
  PS.Combat.init(scene, player);
  var saved = PS.Save.load();
  PS.Missions.init(G, 0);
  PS.HUD.grab();

  function setOverlay(id) {
    ['title', 'busted', 'wasted', 'pause'].forEach(function (o) {
      var e = document.getElementById(o); if (e) e.style.display = 'none';
    });
    if (id) { var t = document.getElementById(id); if (t) t.style.display = 'flex'; }
  }
  function startGame(fresh) {
    PS.Audio.ensure(); PS.Audio.click();
    if (!fresh && saved) {
      G.cash = saved.cash || 120;
      PS.Missions.init(G, saved.missions || 0);
      if (saved.x !== undefined) { player.pos.set(saved.x, 0, saved.z); player.mesh.position.copy(player.pos); }
    }
    setOverlay(null); G.state = 'playing';
    PS.Missions.start();
    PS.HUD.banner('Welcome to PUERTO SOLANO - WASD move, E enter car, R radio, mouse shoot', 6000);
  }
  document.getElementById('btnNew').addEventListener('click', function () { PS.Save.clear(); startGame(true); });
  document.getElementById('btnContinue').addEventListener('click', function () { startGame(false); });
  document.getElementById('btnAgain').addEventListener('click', function () { location.reload(); });
  document.getElementById('btnAgain2').addEventListener('click', function () { location.reload(); });
  if (!saved) document.getElementById('btnContinue').style.opacity = '0.4';
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (G.state === 'playing') { G.paused = !G.paused; setOverlay(G.paused ? 'pause' : null); }
    }
    if (e.code === 'KeyE' && G.state === 'playing') {
      if (player.car) player.exitCar();
      else { var c = player.nearestCar(G.allCars()); if (c) player.enterCar(c); }
    }
    if (e.code === 'KeyR' && G.state === 'playing') PS.HUD.banner('Radio: ' + PS.Audio.cycleRadio(), 1800);
  });
  window.addEventListener('resize', function () {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // ---- Screenshot staging: deterministic scenes for the contact sheet ----
  function stageShot(name) {
    G.state = 'playing'; setOverlay(null);
    PS.Missions.init(G, 0); PS.Missions.start();
    if (name === 'cover') {
      PS.Weather.setHour(17.6); PS.Weather.setState('clear');
      var car = parkedCars[0];
      player.enterCar(car); PS.Police.clear();
      car.mesh.position.set(40, 0, 120); car.angle = Math.PI; player.speed = 22;
      camera.position.set(40, 6, 142); camera.lookAt(40, 1.5, 100);
    } else if (name === 'chase') {
      PS.Weather.setHour(16.8); PS.Weather.setState('clear');
      var car2 = parkedCars[1];
      player.enterCar(car2); car2.mesh.position.set(40, 0, -60); car2.angle = 0; player.speed = 30;
      PS.Police.setStars(4);
      // Frame the pursuit: cruisers flank the player, roadblock waits ahead.
      var cr = PS.Police.cruisers();
      if (cr[0]) { cr[0].mesh.position.set(34, 0, -74); cr[0].angle = 0; }
      if (cr[1]) { cr[1].mesh.position.set(48, 0, -38); cr[1].angle = 0; }
      if (cr[2]) { cr[2].mesh.position.set(40, 0, -88); cr[2].angle = 0; }
      if (cr[3]) { cr[3].mesh.position.set(33, 0, -44); cr[3].angle = 0.15; }
      PS.HUD.setObjective('Escape the SPPD - lose your wanted level!');
      PS.HUD.setMission('MISSION 4: HEAT CHECK');
    } else if (name === 'onfoot') {
      PS.Weather.setHour(15.5); PS.Weather.setState('clear');
      player.pos.set(28, 0, 246); player.mesh.position.copy(player.pos); player.angle = 2.6;
      PS.Effects.setMarker(40, 250, 0xffd23e); G.marker = { x: 40, z: 250 };
      PS.HUD.setObjective('Meet Marisol at the marina');
      PS.HUD.setMission('MISSION 1: FIRST WHEELS');
      camera.position.set(20, 4.5, 258); camera.lookAt(30, 1.5, 244);
    } else if (name === 'mission') {
      PS.Weather.setHour(17.2); PS.Weather.setState('rain');
      player.pos.set(150, 0, 238); player.mesh.position.copy(player.pos); player.angle = 0.7;
      for (var i = 0; i < 4; i++) PS.Combat.spawnEnemy(162 + i * 4, 250 - i * 3);
      PS.HUD.setObjective('Clear the Coral gang at the docks');
      PS.HUD.setMission('MISSION 5: DOCKSIDE LEAD');
      PS.Effects.setMarker(160, 250, 0xff5544); G.marker = { x: 160, z: 250 };
      camera.position.set(140, 5, 226); camera.lookAt(158, 1.5, 248);
    }
  }
  if (shot) stageShot(shot);

  var last = performance.now(), steps = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (G.state === 'playing' && !G.paused) {
      player.update(dt, camera);
      traffic.update(dt);
      PS.Police.update(dt);
      PS.Combat.update(dt);
      PS.Missions.update(dt);
      PS.Weather.update(dt, player.pos);
      PS.Effects.update(dt);
      if (cityData.water) cityData.water.position.y = 0.25 + Math.sin(now * 0.0012) * 0.08;
      // interaction prompt
      if (!player.car) {
        var near = player.nearestCar(G.allCars());
        PS.HUD.setPrompt(near ? 'Press E to steal the ' + 'car' : '');
        if (near) PS.Effects.setMarker(near.mesh.position.x, near.mesh.position.z, 0x3ecf5a);
        else if (!PS.Missions.current()) PS.Effects.setMarker(null);
      } else PS.HUD.setPrompt('');
      PS.Audio.update(dt, player.speed, PS.Police.getStars(), !!player.car);
      PS.HUD.update(G);
      steps++;
      if (shot && steps > (shot === 'chase' ? 45 : 110) && !window.__shotReady) window.__shotReady = true;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
  window.__psGame = G;
})();
