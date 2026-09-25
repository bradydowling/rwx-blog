"use strict";

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = 1280, H = 720, FLOOR = 620, LEFT = 64, RIGHT = 1216;
  const STEP = 1 / 60;
  // Bundled Twemoji PNGs keep celebrations identical in the offline browser build.
  const celebrationEmoji = {};
  for (const code of ["1f4aa", "270c", "261d", "1f448", "1f449", "1f918"]) {
    if (typeof Image !== "undefined") {
      const icon = new Image();
      icon.src = `assets/emoji/${code}.png`;
      celebrationEmoji[code] = icon;
    }
  }

  // Arcade tuning values. The ball uses a simple fixed-step physics model.
  const TUNE = {
    playerSpeed: 350,
    jumpForce: 680,
    gravity: 1600,
    playerMass: 1,
    ballMass: 0.5,
    ballBounce: 0.78,
    playerBallBounce: 0.55, // Rebound strength when the ball hits a player.
    shoveRange: 76,
    shoveForce: 620,
    shoveCooldown: 0.55,
    shoveKnockdownSeconds: 0.72, // No actions while tipping over and getting up.
    backboardStunSeconds: 0.75, // Longer stumble after hitting the board from below.
    recoveryImmunitySeconds: 0.38, // Prevent repeat hits immediately after recovery.
    backboardRecoil: 390,
    landingSquashSeconds: 1.35, // Hold the stomp squash, then recover near the end.
    landingSpeedScale: 0.6,
    stackedJumpCarry: 0.8, // A jump from a rising player's head inherits their lift.
    scoreShakePixels: 2.5,
    stompShakePixels: 3.5,
    backboardShakePixels: 2.5,
    shoveBallHorizontalImpulse: 120,
    shoveBallUpwardImpulse: 380,
    pickupRange: 72,
    shotFlightTime: 0.95,
    shotBaseHorizontalSpeed: 620,
    shotChargeBoost: 450,
    shotChargeSeconds: 0.9,
    pickupLockout: 0.25,
    carryLimitSeconds: 3.5, // Holding through this countdown is a travel.
    travelPickupPenaltySeconds: 1.2, // Only the offender is barred from the next pickup.
    travelMessageSeconds: 1.2,
    tipoffSpawnY: 565,
    tipoffLaunchSpeed: 760, // Upward opening toss, repeated after each basket.
    // After a score, run 10 physics updates, one every 6 display frames.
    // The held frames give the old Slime Basketball slowdown its choppy feel.
    scoreSlowmoUpdates: 10,
    scoreSlowmoStride: 6,
    scorePauseSeconds: 0.45,
    shoeTurnWindow: 0.35, // A quick left/right reversal squeaks; starting from rest stays quiet.
    ballBounceMinSpeed: 110,
    rimHitMinSpeed: 140,
    backboardHitMinSpeed: 140, // Ignore soft rolls along a backboard.
  };

  const controls = [
    { left: ["KeyA"], right: ["KeyD"], jump: ["KeyW", "Space"], shove: ["KeyF"], ball: ["KeyS"] },
    { left: ["ArrowLeft"], right: ["ArrowRight"], jump: ["ArrowUp"], shove: ["Period"], ball: ["ArrowDown"] },
  ];
  // Original selection order; recognizable team palettes, including the older names.
  const teams = [
    ["Atlanta", "#c8102e", "#fdb927", "#1d1d1d"],
    ["Boston", "#007a33", "#ba9653", "#ffffff"],
    ["Charlotte", "#1d8c91", "#512888", "#d8dde0"],
    ["Chicago", "#ce1141", "#111111"],
    ["Cleveland", "#6f263d", "#ffb81c", "#041e42"],
    ["Dallas", "#00538c", "#002b5e", "#b8c4ca"],
    ["Denver", "#0e2240", "#fec524", "#8b2131"],
    ["Detroit", "#c8102e", "#1d42ba", "#ffffff"],
    ["Houston", "#ce1141", "#111111", "#ffffff"],
    ["Indiana", "#002d62", "#fdbb30"],
    ["Los Angeles", "#552583", "#fdb927"],
    ["Miami", "#98002e", "#f9a01b", "#111111"],
    ["Milwaukee", "#00471b", "#eee1c6", "#0077c0"],
    ["Minnesota", "#0c2340", "#78be20", "#9eaab1"],
    ["New Jersey", "#002a60", "#d71920", "#ffffff"],
    ["New York", "#006bb6", "#f58426"],
    ["Orlando", "#0077c0", "#111111", "#c4ced4"],
    ["Philadelphia", "#006bb6", "#ed174c", "#ffffff"],
    ["Phoenix", "#5f259f", "#e56020", "#b1aeb3"],
    ["Portland", "#e03a3e", "#111111"],
    ["Sacramento", "#5a2d81", "#111111", "#c4ced4"],
    ["San Antonio", "#1b1b1b", "#b8b8b8"],
    ["San Francisco", "#1d428a", "#ffc72c", "#ffffff"],
    ["Seattle", "#00653a", "#fbbf13"],
    ["Toronto", "#ce1141", "#111111", "#753bbd"],
    ["Utah", "#4a2c75", "#00a79d", "#f9a01b"],
    ["Vancouver", "#00a6a6", "#b87333", "#d71920"],
    ["Washington", "#002b5c", "#e31837", "#c4ced4"],
  ].map(([name, ...colors]) => ({ name, color: colors[0], colors }));
  // Guest picks follow the original 28-team list without changing its order.
  const playerChoices = teams.concat([
    { name: "Conan O'Brien", color: "#007a33", colors: ["#007a33", "#ffffff", "#ba9653"], character: "conan" },
    { name: "Dr. J", color: "#006bb6", colors: ["#006bb6", "#ed174c", "#ffffff"], character: "drj" },
  ]);
  // Two familiar courts plus two simple rule changes to playtest.
  const arenas = [
    { name: "MSG", detail: "Indoor hardwood · classic movement", gravity: 1, acceleration: 100000, brake: 100000, floorGrip: 0.97 },
    { name: "Rucker Park", detail: "Outdoor street court · classic movement", gravity: 1, acceleration: 100000, brake: 100000, floorGrip: 0.97 },
    { name: "Ice Arena", detail: "Slippery feet and a sliding ball", gravity: 1, acceleration: 900, brake: 450, floorGrip: 0.995 },
    { name: "The Moon", detail: "Low gravity · higher, longer jumps", gravity: 0.45, acceleration: 100000, brake: 100000, floorGrip: 0.97 },
  ];
  // The first three change the look only. Beach and medicine balls change contact and flight.
  const ballTypes = [
    { name: "Classic", mass: TUNE.ballMass, bounce: TUNE.ballBounce, gravity: 1, drag: 0.10, floorGrip: 1 },
    { name: "USA Ball", mass: TUNE.ballMass, bounce: TUNE.ballBounce, gravity: 1, drag: 0.10, floorGrip: 1 },
    { name: "FIBA Ball", mass: TUNE.ballMass, bounce: TUNE.ballBounce, gravity: 1, drag: 0.10, floorGrip: 1 },
    { name: "Beach Ball", mass: 0.22, bounce: 0.91, gravity: 0.72, drag: 0.28, floorGrip: 1.005 },
    { name: "Medicine Ball", mass: 1.8, bounce: 0.32, gravity: 1.1, drag: 0.12, floorGrip: 0.89 },
  ];
  const teamChoices = [0, 1];
  const cpuChoices = [false, false]; // At most one CPU; either side can be automated.
  const cpuTimers = [0, 0];
  const touchMode = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  if (touchMode) {
    cpuChoices[1] = true; // A phone has one set of touch controls, so start with a CPU opponent.
    document.body.classList.add("touch-mode");
  }
  let arenaChoice = 0;
  let ballChoice = 0, selectedOption = 0;
  const usedKeys = new Set(["KeyA", "KeyD", "KeyW", "KeyS", "Space", "KeyF", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Period", "KeyR", "Enter"]);
  const down = new Set();
  const pressed = new Set();
  const released = new Set();
  const hoops = [{ x: 200, y: 485, boardX: 149, scorer: 2, armed: false }, { x: 1080, y: 485, boardX: 1131, scorer: 1, armed: false }];
  const starts = [{ x: 370, y: 591 }, { x: 910, y: 591 }];
  // The rounded cap and sloped sides are also the ball-contact outline.
  const playerBody = [[-20, 29], [-24, 24], [-20, -10], [-18, -18], [-14, -25], [-8, -29], [0, -30], [8, -29], [14, -25], [18, -18], [20, -10], [24, 24], [20, 29]];
  const players = starts.map((start, i) => ({ x: start.x, y: start.y, prevX: start.x, prevY: start.y, vx: 0, vy: 0, moveVx: 0, knockback: 0, facing: i === 0 ? 1 : -1, grounded: true, standingOn: -1, jumped: false, flattenTime: 0, stompBurstTime: 0, cooldown: 0, flash: 0, face: "neutral", faceTime: 0, reaction: "none", reactionTime: 0, reactionDuration: 0, reactionDirection: 1, immunityTime: 0, blinkClock: 0, celebration: -1, lastCelebration: -1, celebrationTime: 0, celebrationDuration: 0, color: playerChoices[i].color, colors: playerChoices[i].colors, character: null }));
  const ball = { x: 640, y: TUNE.tipoffSpawnY, vx: 0, vy: -TUNE.tipoffLaunchSpeed, angle: 0, spin: 0, radius: 16 };
  const duckSound = typeof Audio !== "undefined" ? new Audio("assets/duck_quack.wav") : null;
  if (duckSound) { duckSound.preload = "auto"; duckSound.volume = 0.55; }
  const sfx = {};
  for (const [name, file] of Object.entries({ bounce: "ball_bounce.wav", rim: "rim_hit.wav", shoe1: "shoe_squeak_1.wav", shoe2: "shoe_squeak_2.wav", swish1: "swish_1.wav", swish2: "swish_2.wav", swish3: "swish_3.wav", board1: "backboard_1.wav", board2: "backboard_2.wav", board3: "backboard_3.wav", grunt1: "throw_grunt_1.wav", grunt2: "throw_grunt_2.wav", grunt3: "throw_grunt_3.wav", bonk1: "bonk_voice_1.wav", bonk2: "bonk_voice_2.wav", bonk3: "bonk_voice_3.wav", bonk4: "bonk_voice_4.wav" })) {
    if (typeof Audio !== "undefined") {
      sfx[name] = new Audio(`assets/sfx/${file}`);
      sfx[name].preload = "auto";
    }
  }
  let sfxClock = 0, shoeVariant = 0;
  const lastSfx = { bounce: -1, rim: -1, shoe: -1, swish: -1, board: -1, grunt: -1, bonk: -1 };
  const lastVariant = { swish: -1, board: -1, grunt: -1, bonk: -1 };
  const variantCounts = { swish: 3, board: 3, grunt: 3, bonk: 4 };
  function playSfx(kind, strength = 1) {
    const gate = kind.replace(/\d$/, "");
    const interval = gate === "shoe" ? 0.11 : gate === "swish" ? 0.25 : gate === "grunt" ? 0.18 : gate === "bonk" ? 0.28 : gate === "rim" || gate === "board" ? 0.12 : 0.08;
    if (sfxClock - lastSfx[gate] < interval) return;
    lastSfx[gate] = sfxClock;
    const sound = sfx[kind];
    if (!sound) return;
    sound.currentTime = 0;
    sound.volume = clamp(strength, 0.12, gate === "shoe" ? 0.38 : gate === "grunt" ? 0.3 : 0.62);
    if (gate === "bounce") sound.playbackRate = 0.95 + Math.random() * 0.10;
    const started = sound.play();
    if (started && started.catch) started.catch(() => {});
  }
  function playRandomSfx(group, strength) {
    const previous = lastVariant[group];
    const count = variantCounts[group];
    const variant = previous < 0 ? Math.floor(Math.random() * count) : (previous + 1 + Math.floor(Math.random() * (count - 1))) % count;
    const before = lastSfx[group];
    playSfx(`${group}${variant + 1}`, strength);
    if (lastSfx[group] !== before) lastVariant[group] = variant;
  }
  const score = [0, 0];
  let screen = "select", winner = 0, scorePhase = "live", scoreSlowmoFrames = 0, scorePauseFrames = 0;
  let message = "", messageTime = 0, carrier = -1, carryTime = 0, pickupLockout = 0, charging = -1, chargeTime = 0, shotOwner = -1;
  let shakeTime = 0, shakeDuration = 0, shakeElapsed = 0, shakeStrength = 0;
  let spaceTime = 0;
  const travelPickupLockout = [0, 0];

  function held(codes) { return codes.some(code => down.has(code)); }
  function justPressed(codes) { return codes.some(code => pressed.has(code)); }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function approach(value, target, distance) { return value < target ? Math.min(value + distance, target) : Math.max(value - distance, target); }
  function arena() { return arenas[arenaChoice]; }
  function ballType() { return ballTypes[ballChoice]; }
  function contrastInk(hex) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 < 145 ? "#f8f2da" : "#142130";
  }
  function faceInk(p) { return p.character === "conan" ? "#4b3028" : p.character === "drj" ? "#f8f2da" : contrastInk(p.color); }
  function setFace(p, face, seconds) { p.face = face; p.faceTime = seconds; }
  function startCelebration(p, seconds) {
    // Three common poses share 90%; the three meme poses share the rare 10%.
    const rare = Math.random() < 0.10;
    const base = rare ? 3 : 0, count = 3;
    let choice = base + Math.floor(Math.random() * count);
    if (choice === p.lastCelebration) choice = base + (choice - base + 1 + Math.floor(Math.random() * (count - 1))) % count;
    p.celebration = choice;
    p.lastCelebration = choice;
    p.celebrationTime = seconds;
    p.celebrationDuration = seconds;
    setFace(p, "happy", seconds);
  }
  function startShake(pixels, seconds) {
    shakeStrength = Math.max(shakeStrength, pixels);
    shakeDuration = Math.max(shakeTime, seconds);
    shakeTime = shakeDuration;
    shakeElapsed = 0;
  }
  function playDuckQuack() {
    if (!duckSound) return;
    duckSound.currentTime = 0;
    const started = duckSound.play();
    if (started && started.catch) started.catch(() => {});
  }
  function currentFace(p) { return p.faceTime > 0 ? p.face : "neutral"; }
  function startReaction(p, kind, direction) {
    if (p.immunityTime > 0) return false;
    const duration = kind === "shoved" ? TUNE.shoveKnockdownSeconds : TUNE.backboardStunSeconds;
    p.reaction = kind;
    p.standingOn = -1;
    p.reactionTime = duration;
    p.reactionDuration = duration;
    p.reactionDirection = direction;
    p.immunityTime = duration + TUNE.recoveryImmunitySeconds;
    p.blinkClock = 0;
    setFace(p, kind === "shoved" ? "hurt" : "dizzy", duration);
    return true;
  }
  function playerPose(p) {
    const elapsed = p.reactionDuration - p.reactionTime;
    let tilt = 0, scaleX = 1, scaleY = 1;
    if (p.reaction === "shoved") {
      const falling = clamp(elapsed / 0.16, 0, 1);
      const gettingUp = clamp(p.reactionTime / 0.22, 0, 1);
      tilt = p.reactionDirection * 1.32 * Math.min(falling, gettingUp);
    } else if (p.reaction === "bonked") {
      // Held impact frames read like a cartoon sprite instead of a soft wobble.
      if (elapsed < 0.12) { tilt = p.facing * 0.12; scaleX = 1.28; scaleY = 0.67; }
      else if (elapsed < 0.30) { tilt = -p.facing * 0.24; scaleX = 1.12; scaleY = 0.85; }
      else if (elapsed < 0.52) { tilt = p.facing * 0.20; scaleX = 1.08; scaleY = 0.88; }
      else { tilt = -p.facing * 0.12; scaleX = 1.05; scaleY = 0.92; }
    }
    if (p.flattenTime > 0 && p.reaction === "none") {
      scaleX *= 1.22;
      scaleY *= 0.66;
    }
    if (p.celebrationTime > 0 && p.reaction === "none") {
      if (p.celebration === 0) scaleX *= 1.07; // Flex.
      if (p.celebration === 2) tilt += p.facing * 0.10; // Number one.
      if (p.celebration === 3) tilt -= p.facing * 0.10; // Rare pointing fingers.
      if (p.celebration === 4) scaleX *= 1.04; // Rare horns.
    }
    const blinking = p.reactionTime <= 0 && p.immunityTime > 0 && Math.floor(p.blinkClock / 0.12) % 2 === 0;
    return { tilt, scaleX, scaleY, alpha: blinking ? 0.38 : 1 };
  }

  function resetPositions() {
    carrier = -1;
    carryTime = 0;
    charging = -1;
    chargeTime = 0;
    shotOwner = -1;
    pickupLockout = 0;
    travelPickupLockout[0] = 0;
    travelPickupLockout[1] = 0;
    players.forEach((p, i) => Object.assign(p, { x: starts[i].x, y: starts[i].y, prevX: starts[i].x, prevY: starts[i].y, vx: 0, vy: 0, moveVx: 0, knockback: 0, facing: i === 0 ? 1 : -1, grounded: true, standingOn: -1, jumped: false, flattenTime: 0, stompBurstTime: 0, cooldown: 0, lastMoveDirection: 0, turnMemoryTime: 0, flash: 0, face: "neutral", faceTime: 0, reaction: "none", reactionTime: 0, reactionDuration: 0, reactionDirection: 1, immunityTime: 0, blinkClock: 0, celebration: -1, celebrationTime: 0, celebrationDuration: 0 }));
    shakeTime = 0;
    shakeStrength = 0;
    Object.assign(ball, { x: 640, y: TUNE.tipoffSpawnY, vx: 0, vy: -TUNE.tipoffLaunchSpeed * (arenaChoice === 3 ? 0.7 : 1) * Math.sqrt(ballType().gravity), angle: 0, spin: 0 });
    hoops.forEach(hoop => { hoop.armed = false; });
  }

  function cycleTeam(index, direction) {
    teamChoices[index] = (teamChoices[index] + direction + playerChoices.length) % playerChoices.length;
    const choice = playerChoices[teamChoices[index]];
    players[index].color = choice.color;
    players[index].colors = choice.colors;
    players[index].character = choice.character || null;
  }
  function cycleArena(direction) { arenaChoice = (arenaChoice + direction + arenas.length) % arenas.length; }
  function cycleBall(direction) { ballChoice = (ballChoice + direction + ballTypes.length) % ballTypes.length; }
  function changeSelectedOption(direction) {
    if (selectedOption < 2) cycleTeam(selectedOption, direction);
    else if (selectedOption === 2) cycleArena(direction);
    else cycleBall(direction);
  }
  function toggleCpu(index) {
    if (index > 1) return;
    cpuChoices[index] = !cpuChoices[index];
    if (cpuChoices[index]) cpuChoices[1 - index] = false;
  }
  function syncTouchUI() {
    if (!touchMode) return;
    document.body.classList.toggle("in-game", screen === "play");
    document.body.classList.toggle("match-won", winner > 0);
    const matchButton = document.getElementById("match-button");
    if (matchButton) matchButton.textContent = winner ? "NEW MATCH" : "TIP OFF";
  }

  function startMatch() {
    score[0] = 0;
    score[1] = 0;
    winner = 0;
    scorePhase = "live";
    scoreSlowmoFrames = 0;
    scorePauseFrames = 0;
    message = "";
    messageTime = 0;
    resetPositions();
    down.clear(); pressed.clear(); released.clear();
    screen = "play";
    syncTouchUI();
  }

  function restart() {
    score[0] = 0;
    score[1] = 0;
    winner = 0;
    scorePhase = "live";
    scoreSlowmoFrames = 0;
    scorePauseFrames = 0;
    message = "";
    messageTime = 0;
    resetPositions();
    selectedOption = 0;
    down.clear(); pressed.clear(); released.clear();
    screen = "select";
    syncTouchUI();
  }

  window.addEventListener("keydown", event => {
    if (!usedKeys.has(event.code)) return;
    event.preventDefault();
    if (screen === "select") {
      if (!down.has(event.code)) {
        if (event.code === "KeyW" || event.code === "ArrowUp") selectedOption = (selectedOption + 3) % 4;
        if (event.code === "KeyS" || event.code === "ArrowDown") selectedOption = (selectedOption + 1) % 4;
        if (event.code === "KeyA" || event.code === "ArrowLeft") changeSelectedOption(-1);
        if (event.code === "KeyD" || event.code === "ArrowRight") changeSelectedOption(1);
        if (event.code === "KeyF" || event.code === "Period" || event.code === "Space") toggleCpu(selectedOption);
        if (event.code === "Enter") { startMatch(); return; }
      }
      down.add(event.code);
      return;
    }
    if (!down.has(event.code)) pressed.add(event.code);
    down.add(event.code);
    if (event.code === "KeyR" && winner) restart();
  });
  canvas.addEventListener("pointerdown", event => {
    if (screen !== "select") return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * W / rect.width;
    const y = (event.clientY - rect.top) * H / rect.height;
    for (let i = 0; i < 4; i++) {
      const rowY = 219 + i * 66;
      if (y >= rowY && y <= rowY + 54 && x >= 313 && x <= 967) {
        selectedOption = i;
        if (i < 2 && x >= 450 && x <= 570) toggleCpu(i);
        else if (x >= 570 && x <= 615) changeSelectedOption(-1);
        else if (x >= 905 && x <= 958) changeSelectedOption(1);
        return;
      }
    }
  });
  window.slimebaInput = {
    control(action, isDown) {
      const human = cpuChoices[0] ? 1 : 0;
      const code = controls[human][action]?.[0];
      if (!code) return;
      if (isDown) {
        if (screen !== "play" || winner) return;
        if (!down.has(code)) pressed.add(code);
        down.add(code);
      } else {
        down.delete(code);
        released.add(code);
      }
    },
    start() { if (screen === "select") startMatch(); else if (winner) restart(); },
    menuChange(index, direction) {
      if (screen !== "select" || index < 0 || index > 3) return;
      selectedOption = index;
      changeSelectedOption(direction);
    },
    menuCpu(index) {
      if (screen !== "select" || index < 0 || index > 1) return;
      selectedOption = index;
      toggleCpu(index);
    },
  };
  window.addEventListener("keyup", event => {
    if (!usedKeys.has(event.code)) return;
    event.preventDefault();
    down.delete(event.code);
    released.add(event.code);
  });
  window.addEventListener("blur", () => { down.clear(); pressed.clear(); released.clear(); charging = -1; chargeTime = 0; });

  function shove(attacker, defender) {
    attacker.cooldown = TUNE.shoveCooldown;
    attacker.flash = 0.14;
    const dx = defender.x - attacker.x, dy = defender.y - attacker.y;
    let knockedBallLoose = false;
    if (dx * attacker.facing > 0 && Math.hypot(dx, dy) < TUNE.shoveRange && startReaction(defender, "shoved", attacker.facing)) {
      defender.knockback = attacker.facing * TUNE.shoveForce;
      defender.vy = Math.min(defender.vy, -240);
      if (carrier === players.indexOf(defender)) {
        releaseBall(defender, attacker.facing * 470, -330);
        knockedBallLoose = true;
      }
    }
    const bx = ball.x - attacker.x, by = ball.y - attacker.y;
    if (!knockedBallLoose && carrier === -1 && bx * attacker.facing > 0 && Math.hypot(bx, by) < TUNE.shoveRange) {
      if (isGoaltend(players.indexOf(attacker))) { scoreBasket(shotOwner + 1, true); return; }
      shotOwner = -1;
      ball.vx += attacker.facing * TUNE.shoveBallHorizontalImpulse / ballType().mass;
      ball.vy -= TUNE.shoveBallUpwardImpulse / ballType().mass;
      ball.spin += attacker.facing * 8;
    }
  }

  function positionHeldBall() {
    if (carrier === -1) return;
    const p = players[carrier];
    ball.x = p.x + p.facing * 39;
    ball.y = p.y - 12;
    ball.vx = 0;
    ball.vy = 0;
  }

  function releaseBall(p, vx, vy) {
    positionHeldBall();
    carrier = -1;
    carryTime = 0;
    charging = -1;
    chargeTime = 0;
    shotOwner = -1;
    pickupLockout = TUNE.pickupLockout;
    ball.vx = vx;
    ball.vy = vy;
    ball.spin = p.facing * 7;
    hoops.forEach(hoop => { hoop.armed = false; });
  }

  function pickUpBall(index) {
    if (carrier === -1 && pickupLockout <= 0 && travelPickupLockout[index] <= 0) {
      const p = players[index];
      if (Math.hypot(ball.x - p.x, ball.y - p.y) <= TUNE.pickupRange) {
        if (isGoaltend(index)) { scoreBasket(shotOwner + 1, true); return; }
        shotOwner = -1;
        carrier = index;
        carryTime = 0;
        positionHeldBall();
      }
    }
  }

  function callTravel(index) {
    if (carrier !== index) return;
    const p = players[index];
    const opponent = players[1 - index];
    const direction = Math.sign(opponent.x - p.x) || p.facing;
    releaseBall(p, direction * 220, -300);
    travelPickupLockout[index] = TUNE.travelPickupPenaltySeconds;
    message = `TRAVEL! PLAYER ${index + 1}`;
    messageTime = TUNE.travelMessageSeconds;
  }

  function startShot(index) {
    if (carrier === index) {
      charging = index;
      chargeTime = 0;
    }
  }

  function shotChargeNeeded(index) {
    const p = players[index];
    const hoop = hoops[index === 0 ? 1 : 0];
    const startX = p.x + p.facing * 39;
    const travelX = Math.abs(hoop.x + p.facing * 38 - startX);
    const requiredSpeed = travelX / TUNE.shotFlightTime;
    return clamp((requiredSpeed - TUNE.shotBaseHorizontalSpeed) / TUNE.shotChargeBoost, 0, 1);
  }

  function throwChargedBall(index) {
    const p = players[index];
    const hoop = hoops[index === 0 ? 1 : 0];
    positionHeldBall();
    const charge = clamp(chargeTime / TUNE.shotChargeSeconds, 0, 1);
    // A quick throw reaches midcourt; charging adds range. The small lead
    // clears the near rim tip when a shot has enough power to reach the hoop.
    const travelX = Math.abs(hoop.x + p.facing * 38 - ball.x);
    const requiredSpeed = travelX / TUNE.shotFlightTime;
    const speedX = Math.min(requiredSpeed, TUNE.shotBaseHorizontalSpeed) + charge * TUNE.shotChargeBoost;
    const speedY = (hoop.y - ball.y - TUNE.gravity * arena().gravity * ballType().gravity * TUNE.shotFlightTime ** 2 / 2) / TUNE.shotFlightTime;
    releaseBall(p, p.facing * speedX, speedY);
    shotOwner = index;
    playRandomSfx("grunt", 0.23);
  }

  function isGoaltend(defenderIndex) {
    if (shotOwner === -1 || defenderIndex === shotOwner || ball.vy <= 0) return false;
    const hoop = hoops[shotOwner === 0 ? 1 : 0];
    return Math.abs(ball.x - hoop.x) < 50 && ball.y + ball.radius <= hoop.y + 6;
  }

  function resolvePlayerBoard(p, boardX, boardY) {
    const dx = p.x - boardX, dy = p.y - boardY;
    const overlapX = 25 - Math.abs(dx), overlapY = 74 - Math.abs(dy);
    if (overlapX <= 0 || overlapY <= 0) return;
    const bonked = overlapX >= overlapY && dy > 0 && p.vy < -140 && startReaction(p, "bonked", p.facing);
    if (bonked) {
      if (carrier === players.indexOf(p)) releaseBall(p, p.vx * 0.3, -120);
      startShake(TUNE.backboardShakePixels, 0.18);
      playRandomSfx("bonk", 0.42);
    }
    if (overlapX < overlapY) { p.x += Math.sign(dx || 1) * overlapX; p.vx = 0; }
    else { p.y += Math.sign(dy || 1) * overlapY; p.vy = 0; }
    if (bonked) p.vy = TUNE.backboardRecoil;
  }

  function cpuInput(index, dt) {
    const p = players[index], opponent = players[1 - index];
    const direction = index === 0 ? 1 : -1;
    const command = { axis: 0, jump: false, shove: false, ballPress: false, ballRelease: false };
    cpuTimers[index] = Math.max(0, cpuTimers[index] - dt);
    if (scorePhase !== "live" || p.reactionTime > 0) return command;
    let targetX;
    if (carrier === index) targetX = hoops[index === 0 ? 1 : 0].x - direction * 280;
    else if (carrier === 1 - index) targetX = opponent.x;
    else targetX = clamp(ball.x + ball.vx * 0.18, LEFT + 30, RIGHT - 30);
    if (Math.abs(targetX - p.x) > 17) command.axis = Math.sign(targetX - p.x);
    if (carrier === index) {
      // Face the basket while holding, then charge only as much as the arc needs.
      if (Math.abs(targetX - p.x) < 40 || carryTime > 1.6) {
        command.axis = 0;
        p.facing = direction;
        if (charging === index) command.ballRelease = chargeTime >= Math.max(0.04, shotChargeNeeded(index) * TUNE.shotChargeSeconds);
        else command.ballPress = true;
      }
    } else if (carrier === -1 && pickupLockout <= 0 && travelPickupLockout[index] <= 0 &&
      Math.hypot(ball.x - p.x, ball.y - p.y) < TUNE.pickupRange * 0.85) {
      command.ballPress = true;
    }
    if (carrier !== index && p.grounded && cpuTimers[index] <= 0 &&
      Math.abs(ball.x - p.x) < 95 && ball.y < p.y - 58 && ball.y > p.y - 250) {
      command.jump = true;
      cpuTimers[index] = 0.42;
    }
    if (carrier === 1 - index && p.cooldown <= 0 && Math.abs(opponent.x - p.x) < TUNE.shoveRange &&
      Math.abs(opponent.y - p.y) < 45 && (opponent.x - p.x) * p.facing > 0) command.shove = true;
    return command;
  }

  function updatePlayer(p, index, dt, command) {
    p.prevX = p.x;
    p.prevY = p.y;
    p.jumped = false;
    const keys = controls[index];
    const axis = command ? command.axis : Number(held(keys.right)) - Number(held(keys.left));
    p.turnMemoryTime = Math.max(0, (p.turnMemoryTime || 0) - dt);
    if (!p.grounded || p.standingOn !== -1 || p.reactionTime > 0) {
      p.lastMoveDirection = 0;
      p.turnMemoryTime = 0;
    } else if (axis) {
      if (scorePhase === "live" && arenaChoice === 0 && p.turnMemoryTime > 0 && p.lastMoveDirection === -axis) {
        playSfx(shoeVariant++ % 2 ? "shoe2" : "shoe1", 0.28);
      }
      p.lastMoveDirection = axis;
      p.turnMemoryTime = TUNE.shoeTurnWindow;
    }
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.flash = Math.max(0, p.flash - dt);
    p.faceTime = Math.max(0, p.faceTime - dt);
    p.reactionTime = Math.max(0, p.reactionTime - dt);
    p.immunityTime = Math.max(0, p.immunityTime - dt);
    p.flattenTime = Math.max(0, p.flattenTime - dt);
    p.blinkClock += dt;
    if (p.reactionTime === 0) p.reaction = "none";
    const stunned = p.reactionTime > 0;
    if (axis && !stunned) p.facing = axis;
    p.knockback = Math.sign(p.knockback) * Math.max(0, Math.abs(p.knockback) - 1100 * dt);
    const targetVx = stunned ? 0 : axis * TUNE.playerSpeed * (p.flattenTime > 0 ? TUNE.landingSpeedScale : 1);
    const changeRate = axis && !stunned ? arena().acceleration : arena().brake;
    p.moveVx = approach(p.moveVx, targetVx, changeRate * dt);
    p.vx = p.moveVx + p.knockback;
    if (!stunned && (p.grounded || p.standingOn !== -1) && (command ? command.jump : justPressed(keys.jump))) {
      const carrierVy = p.standingOn !== -1 ? Math.min(players[p.standingOn].vy, 0) : 0;
      p.vy = -TUNE.jumpForce + carrierVy * TUNE.stackedJumpCarry;
      p.grounded = false;
      p.standingOn = -1;
      p.jumped = true;
    }
    p.vy += TUNE.gravity * arena().gravity * dt;
    p.x = clamp(p.x + p.vx * dt, LEFT + 24, RIGHT - 24);
    p.y += p.vy * dt;
    p.grounded = false;
    if (p.y + 29 >= FLOOR) { p.y = FLOOR - 29; p.vy = 0; p.grounded = true; p.standingOn = -1; }
    for (const hoop of hoops) resolvePlayerBoard(p, hoop.boardX, hoop.y - 37);
  }

  function collidePlayers() {
    const a = players[0], b = players[1];
    const keepStack = (upper, lower, lowerIndex) => {
      if (upper.standingOn !== lowerIndex || upper.jumped) return false;
      upper.x = clamp(upper.x + lower.x - lower.prevX, LEFT + 24, RIGHT - 24);
      if (Math.abs(upper.x - lower.x) > 32) { upper.standingOn = -1; return false; }
      upper.y = lower.y - 59 * playerPose(lower).scaleY;
      upper.vy = lower.vy;
      upper.grounded = true;
      return true;
    };
    if (keepStack(a, b, 1) || keepStack(b, a, 0)) return;
    const overlapX = 48 - Math.abs(a.x - b.x), overlapY = 58 - Math.abs(a.y - b.y);
    if (overlapX <= 0 || overlapY <= 0) return;
    const upper = a.y < b.y ? a : b;
    const lower = upper === a ? b : a;
    if (upper.jumped && lower.y - upper.y > 25) return;
    if (Math.abs(upper.x - lower.x) < 32 && lower.y - upper.y > 25 && upper.vy >= lower.vy - 20 && !upper.jumped) {
      const landingSpeed = upper.vy - lower.vy;
      if (upper.vy > 0 && landingSpeed > 120) {
        lower.flattenTime = TUNE.landingSquashSeconds;
        lower.stompBurstTime = 0.34;
        setFace(lower, "squashed", TUNE.landingSquashSeconds);
        startShake(TUNE.stompShakePixels, 0.2);
        playDuckQuack();
      }
      upper.y = lower.y - 59 * playerPose(lower).scaleY;
      upper.vy = lower.vy;
      upper.grounded = true;
      upper.standingOn = players.indexOf(lower);
      return;
    }
    if (overlapX < overlapY) {
      const direction = Math.sign(b.x - a.x) || 1;
      a.x -= direction * overlapX / 2;
      b.x += direction * overlapX / 2;
    } else {
      const direction = Math.sign(b.x - a.x) || 1;
      a.x -= direction * overlapX / 2;
      b.x += direction * overlapX / 2;
    }
  }

  function bounceBall(normalX, normalY, bounce = ballType().bounce) {
    const speedIntoSurface = ball.vx * normalX + ball.vy * normalY;
    if (speedIntoSurface < 0) {
      ball.vx -= (1 + bounce) * speedIntoSurface * normalX;
      ball.vy -= (1 + bounce) * speedIntoSurface * normalY;
      ball.spin += ball.vx * 0.003;
    }
  }

  function collideBallCircle(cx, cy, radius) {
    const dx = ball.x - cx, dy = ball.y - cy;
    const distance = Math.hypot(dx, dy);
    const minimum = ball.radius + radius;
    if (distance >= minimum) return false;
    const nx = distance ? dx / distance : 0, ny = distance ? dy / distance : -1;
    ball.x += nx * (minimum - distance);
    ball.y += ny * (minimum - distance);
    const impactSpeed = -(ball.vx * nx + ball.vy * ny);
    bounceBall(nx, ny);
    if (impactSpeed > TUNE.rimHitMinSpeed) playSfx("rim", impactSpeed / 950);
    return true;
  }

  function collideBallRect(cx, cy, halfW, halfH) {
    const closestX = clamp(ball.x, cx - halfW, cx + halfW);
    const closestY = clamp(ball.y, cy - halfH, cy + halfH);
    let dx = ball.x - closestX, dy = ball.y - closestY;
    const distance = Math.hypot(dx, dy);
    if (distance >= ball.radius) return;
    if (distance === 0) { dx = ball.x < cx ? -1 : 1; dy = 0; }
    const length = Math.hypot(dx, dy), nx = dx / length, ny = dy / length;
    ball.x += nx * (ball.radius - distance);
    ball.y += ny * (ball.radius - distance);
    const impactSpeed = -(ball.vx * nx + ball.vy * ny);
    bounceBall(nx, ny);
    if (impactSpeed > TUNE.backboardHitMinSpeed) playRandomSfx("board", impactSpeed / 900);
  }

  function collideBallPlayer(p, index) {
    // The sides still lift the ball a little; the rounded cap removes sharp corners.
    const points = playerBody.map(([x, y]) => [p.x + x, p.y + y]);
    let nearestDistanceSquared = Infinity, nearestX = 0, nearestY = 0;
    let edgeX = 0, edgeY = 0, inside = true;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const fromX = ball.x - a[0], fromY = ball.y - a[1];
      if (ex * fromY - ey * fromX < 0) inside = false;
      const projection = clamp((fromX * ex + fromY * ey) / (ex * ex + ey * ey), 0, 1);
      const cx = a[0] + ex * projection, cy = a[1] + ey * projection;
      const dx = ball.x - cx, dy = ball.y - cy;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < nearestDistanceSquared) {
        nearestDistanceSquared = distanceSquared;
        nearestX = cx; nearestY = cy; edgeX = ex; edgeY = ey;
      }
    }
    const distance = Math.sqrt(nearestDistanceSquared);
    if (!inside && distance >= ball.radius) return false;
    if (isGoaltend(index)) { scoreBasket(shotOwner + 1, true); return true; }
    shotOwner = -1;
    const edgeLength = Math.hypot(edgeX, edgeY);
    const nx = inside || distance === 0 ? edgeY / edgeLength : (ball.x - nearestX) / distance;
    const ny = inside || distance === 0 ? -edgeX / edgeLength : (ball.y - nearestY) / distance;
    const separation = inside ? ball.radius + distance : ball.radius - distance;
    ball.x += nx * separation;
    ball.y += ny * separation;
    const relativeNormalSpeed = (ball.vx - p.vx) * nx + (ball.vy - p.vy) * ny;
    if (relativeNormalSpeed < -10) {
      // Reflect incoming balls as well as balls hit by a moving player.
      const massScale = 1.5 * TUNE.playerMass / (TUNE.playerMass + ballType().mass);
      const impulse = -(1 + TUNE.playerBallBounce) * relativeNormalSpeed * massScale;
      ball.vx += nx * impulse;
      ball.vy += ny * impulse;
      ball.spin += nx * impulse * 0.012;
    }
    return false;
  }

  function updateBall(dt) {
    const oldY = ball.y;
    ball.vy += TUNE.gravity * arena().gravity * ballType().gravity * dt;
    ball.vx *= 1 - ballType().drag * dt;
    ball.vy *= 1 - ballType().drag * dt;
    ball.vx = clamp(ball.vx, -1600, 1600);
    ball.vy = clamp(ball.vy, -1600, 1600);
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.angle += ball.spin * dt;
    ball.spin *= 1 - 1.2 * dt;
    if (ball.x - ball.radius < LEFT) { ball.x = LEFT + ball.radius; if (ball.vx < -TUNE.ballBounceMinSpeed) playSfx("bounce", -ball.vx / 850); bounceBall(1, 0); shotOwner = -1; }
    if (ball.x + ball.radius > RIGHT) { ball.x = RIGHT - ball.radius; if (ball.vx > TUNE.ballBounceMinSpeed) playSfx("bounce", ball.vx / 850); bounceBall(-1, 0); shotOwner = -1; }
    if (ball.y - ball.radius < 0) { ball.y = ball.radius; bounceBall(0, 1); shotOwner = -1; }
    if (ball.y + ball.radius > FLOOR) {
      shotOwner = -1;
      ball.y = FLOOR - ball.radius;
      if (ball.vy < 45) ball.vy = 0;
      else {
        if (ball.vy > TUNE.ballBounceMinSpeed) playSfx("bounce", ball.vy / 850);
        bounceBall(0, -1);
      }
      ball.vx *= arena().floorGrip * ballType().floorGrip;
    }
    for (const hoop of hoops) {
      if (collideBallCircle(hoop.x - 44, hoop.y, 6)) shotOwner = -1;
      if (collideBallCircle(hoop.x + 44, hoop.y, 6)) shotOwner = -1;
      collideBallRect(hoop.boardX, hoop.y - 37, 5, 45);
    }
    for (let i = 0; i < players.length; i++) if (collideBallPlayer(players[i], i)) return;
    for (const hoop of hoops) {
      const inside = Math.abs(ball.x - hoop.x) < 35;
      if (oldY < hoop.y - 18 && ball.y >= hoop.y - 18 && ball.vy > 0 && inside) hoop.armed = true;
      if (hoop.armed && oldY < hoop.y + 23 && ball.y >= hoop.y + 23 && ball.vy > 0) {
        if (inside) { scoreBasket(hoop.scorer); return; }
        hoop.armed = false;
      }
      if (ball.y > hoop.y + 65 || ball.y < hoop.y - 120 || Math.abs(ball.x - hoop.x) > 90) hoop.armed = false;
    }
  }

  function scoreBasket(playerNumber, goaltended = false) {
    if (scorePhase !== "live") return;
    if (!goaltended) playRandomSfx("swish", 0.48);
    shotOwner = -1;
    messageTime = 0;
    score[playerNumber - 1]++;
    startCelebration(players[playerNumber - 1], score[playerNumber - 1] >= 5 ? 3 : 1.55);
    setFace(players[2 - playerNumber], "neutral", 0);
    startShake(TUNE.scoreShakePixels, 0.28);
    if (score[playerNumber - 1] >= 5) {
      winner = playerNumber;
      message = `PLAYER ${playerNumber} WINS  ·  PRESS R TO RESTART`;
      syncTouchUI();
    } else {
      message = goaltended ? `GOALTENDING! PLAYER ${playerNumber} SCORES!` : `PLAYER ${playerNumber} SCORES!`;
    }
    scorePhase = "slowmo";
    scoreSlowmoFrames = 0;
    scorePauseFrames = Math.round(TUNE.scorePauseSeconds / STEP);
  }

  function update(dt) {
    sfxClock += dt;
    if (screen === "select") { pressed.clear(); released.clear(); return; }
    if (scorePhase === "slowmo") {
      // Deliberately hold five frames, then advance one ordinary physics step.
      // Drawing still runs every frame, so the scene visibly stutters forward.
      scoreSlowmoFrames++;
      if (scoreSlowmoFrames % TUNE.scoreSlowmoStride === 0) stepWorld(dt, false);
      if (scoreSlowmoFrames >= TUNE.scoreSlowmoUpdates * TUNE.scoreSlowmoStride) scorePhase = "pause";
    } else if (scorePhase === "pause") {
      scorePauseFrames--;
      if (scorePauseFrames <= 0) {
        if (winner) scorePhase = "won";
        else { resetPositions(); message = ""; messageTime = 0; scorePhase = "live"; }
      }
    } else if (scorePhase === "live") {
      stepWorld(dt, true);
    }
    pressed.clear();
    released.clear();
  }

  function updatePresentation(dt) {
    spaceTime += dt;
    for (const p of players) {
      if (p.celebrationTime > 0) {
        p.celebrationTime = Math.max(0, p.celebrationTime - dt);
        if (p.celebrationTime === 0) { p.celebration = -1; p.faceTime = 0; }
      }
      p.stompBurstTime = Math.max(0, p.stompBurstTime - dt);
    }
    if (shakeTime > 0) {
      shakeTime = Math.max(0, shakeTime - dt);
      shakeElapsed += dt;
      if (shakeTime === 0) shakeStrength = 0;
    }
  }

  function stepWorld(dt, allowActions) {
    if (messageTime > 0) {
      messageTime = Math.max(0, messageTime - dt);
      if (messageTime === 0) message = "";
    }
    const commands = players.map((_, i) => cpuChoices[i] ? cpuInput(i, dt) : null);
    players.forEach((p, i) => updatePlayer(p, i, dt, commands[i]));
    collidePlayers();
    pickupLockout = Math.max(0, pickupLockout - dt);
    travelPickupLockout.forEach((time, i) => { travelPickupLockout[i] = Math.max(0, time - dt); });
    positionHeldBall();
    if (allowActions) players.forEach((p, i) => { if (scorePhase === "live" && p.reactionTime <= 0 && p.cooldown <= 0 && (commands[i] ? commands[i].shove : justPressed(controls[i].shove))) shove(p, players[1 - i]); });
    if (allowActions) players.forEach((p, i) => {
      if (scorePhase === "live" && p.reactionTime <= 0 && (commands[i] ? commands[i].ballPress : justPressed(controls[i].ball))) {
        if (carrier === i) startShot(i);
        else pickUpBall(i);
      }
    });
    if (allowActions && scorePhase === "live" && charging !== -1) {
      chargeTime = Math.min(TUNE.shotChargeSeconds, chargeTime + dt);
      if (commands[charging] ? commands[charging].ballRelease : controls[charging].ball.some(code => released.has(code))) throwChargedBall(charging);
    }
    if (carrier !== -1 && scorePhase === "live") {
      carryTime += dt;
      if (carryTime >= TUNE.carryLimitSeconds) callTravel(carrier);
    }
    if (carrier === -1) updateBall(dt);
    else positionHeldBall();
  }

  function drawHoop(hoop) {
    ctx.fillStyle = "#e9e9dc";
    ctx.fillRect(hoop.boardX - 5, hoop.y - 82, 10, 90);
    ctx.strokeStyle = "#aebdc1";
    ctx.lineWidth = 2;
    ctx.strokeRect(hoop.boardX - 5, hoop.y - 82, 10, 90);
    const boardOnRight = hoop.boardX > hoop.x;
    const insideX = hoop.boardX + (boardOnRight ? -6 : 6);
    ctx.strokeStyle = "#f16b52";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(insideX, hoop.y - 51); ctx.lineTo(insideX, hoop.y - 27); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(insideX, hoop.y - 3); ctx.lineTo(hoop.x + (boardOnRight ? 37 : -37), hoop.y); ctx.stroke();
    // Woven visual net; only the orange rim tips collide with the ball.
    ctx.strokeStyle = "rgba(221, 218, 207, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hoop.x - 37, hoop.y + 5); ctx.lineTo(hoop.x - 25, hoop.y + 43);
    ctx.moveTo(hoop.x + 37, hoop.y + 5); ctx.lineTo(hoop.x + 25, hoop.y + 43);
    ctx.stroke();
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i++) {
      const topLeft = -37 + i * 18.5, topRight = topLeft + 18.5;
      const bottomLeft = -25 + i * 12.5, bottomRight = bottomLeft + 12.5;
      ctx.beginPath();
      ctx.moveTo(hoop.x + topLeft, hoop.y + 6); ctx.lineTo(hoop.x + bottomRight, hoop.y + 42);
      ctx.moveTo(hoop.x + topRight, hoop.y + 6); ctx.lineTo(hoop.x + bottomLeft, hoop.y + 42);
      ctx.stroke();
    }
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(hoop.x - 25, hoop.y + 43); ctx.lineTo(hoop.x + 25, hoop.y + 43); ctx.stroke();
    ctx.strokeStyle = "rgba(241, 107, 82, 0.45)";
    ctx.beginPath(); ctx.moveTo(hoop.x - 37, hoop.y); ctx.lineTo(hoop.x + 37, hoop.y); ctx.stroke();
    ctx.strokeStyle = "#f16b52";
    ctx.lineWidth = 5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(hoop.x + side * 49, hoop.y);
      ctx.lineTo(hoop.x + side * 37, hoop.y);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffae73";
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.arc(hoop.x + side * 44, hoop.y, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawFace(p) {
    const face = currentFace(p);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.strokeStyle = faceInk(p);
    ctx.fillStyle = faceInk(p);
    ctx.lineWidth = 2;
    const dot = (x, y, r = 2.4) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
    const line = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    const mouth = (y, start, end, radius = 6) => { ctx.beginPath(); ctx.arc(0, y, radius, start, end); ctx.stroke(); };
    if (face === "dizzy") {
      for (const x of [-6, 6]) { line(x - 2, -16, x + 2, -10); line(x + 2, -16, x - 2, -10); }
      ctx.beginPath(); ctx.arc(0, 5, 3.4, 0, Math.PI * 2); ctx.stroke();
    } else if (face === "hurt") {
      line(-9, -17, -4, -12); line(-4, -17, -9, -12);
      line(4, -17, 9, -12); line(9, -17, 4, -12);
      line(-5, 6, -2, 3); line(-2, 3, 2, 7); line(2, 7, 5, 4);
    } else if (face === "squashed") {
      for (const x of [-7, 7]) {
        ctx.fillStyle = "#f8f2da";
        ctx.beginPath(); ctx.arc(x, -13, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = faceInk(p);
        ctx.stroke();
        ctx.fillStyle = "#142130";
        dot(x + (x < 0 ? 1.6 : -1.6), -13, 1.6);
      }
      ctx.fillStyle = "#ffcb57";
      ctx.strokeStyle = faceInk(p);
      ctx.beginPath(); ctx.moveTo(-8, 3); ctx.lineTo(8, 3); ctx.lineTo(6, 9); ctx.lineTo(-6, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (face === "happy") {
      line(-9, -13, -3, -13); line(3, -13, 9, -13);
      mouth(2, 0, Math.PI, 6);
    } else {
      const dx = ball.x - p.x, dy = ball.y - (p.y - 13);
      const distance = Math.hypot(dx, dy);
      const gazeX = distance ? dx / distance * 2 : 0;
      const gazeY = distance ? dy / distance * 2 : 0;
      const ink = faceInk(p);
      for (const x of [-6, 6]) {
        ctx.fillStyle = "#f8f2da";
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, -13, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#142130";
        dot(x + gazeX, -13 + gazeY, 1.8);
      }
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      line(-4, 5, 4, 5);
    }
    ctx.restore();
  }

  function drawEmojiHand(p, side, code, yOffset = -5, size = 30) {
    const icon = celebrationEmoji[code];
    if (icon && icon.complete && icon.naturalWidth) {
      ctx.drawImage(icon, p.x + side * 28 - size / 2, p.y + yOffset - size / 2, size, size);
    }
  }

  function drawCelebration(p) {
    if (p.celebrationTime <= 0 || p.reaction !== "none") return;
    const side = p.facing;
    if (p.celebration === 0) drawEmojiHand(p, side, "1f4aa", -13); // Flex.
    else if (p.celebration === 1) { drawEmojiHand(p, -1, "270c"); drawEmojiHand(p, 1, "270c"); }
    else if (p.celebration === 2) drawEmojiHand(p, side, "261d", -7);
    else if (p.celebration === 3) { drawEmojiHand(p, -1, "1f448"); drawEmojiHand(p, 1, "1f449"); }
    else if (p.celebration === 4) { drawEmojiHand(p, -1, "1f918"); drawEmojiHand(p, 1, "1f918"); }
  }

  function drawCelebrationFront(p) {
    if (p.celebrationTime <= 0 || p.reaction !== "none" || p.celebration !== 5) return;
    // Three held pixel frames: above the head, at the forehead, then over the eyes.
    const elapsed = p.celebrationDuration - p.celebrationTime;
    const top = elapsed < 0.09 ? -52 : elapsed < 0.18 ? -34 : -19;
    ctx.fillStyle = "#10151b";
    ctx.strokeStyle = "#f8f2da";
    ctx.lineWidth = 1;
    for (const x of [-13, 2]) {
      ctx.fillRect(p.x + x, p.y + top, 11, 8);
      ctx.strokeRect(p.x + x, p.y + top, 11, 8);
      ctx.fillStyle = "#f8f2da";
      ctx.fillRect(p.x + x + 2, p.y + top + 1, 2, 2);
      ctx.fillRect(p.x + x + 6, p.y + top + 3, 2, 2);
      ctx.fillStyle = "#10151b";
    }
    ctx.fillRect(p.x - 2, p.y + top + 2, 4, 2);
  }

  function drawStompBurst(p) {
    if (p.stompBurstTime <= 0) return;
    const elapsed = 0.34 - p.stompBurstTime;
    const fade = p.stompBurstTime / 0.34;
    ctx.save();
    ctx.globalAlpha = 0.65 * fade;
    ctx.fillStyle = "#f8f2da";
    for (const speedX of [-65, -30, 0, 30, 65]) {
      const speedY = -145 + Math.abs(speedX) * 0.6;
      const x = p.x + speedX * elapsed;
      const y = p.y - 29 + speedY * elapsed + 150 * elapsed * elapsed;
      ctx.beginPath(); ctx.arc(x, y, (speedX === 0 ? 3 : 2.2) * fade, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawGuestHair(p) {
    if (p.character === "conan") {
      ctx.fillStyle = "#bc542b";
      ctx.strokeStyle = "#71321f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - 17, p.y - 25);
      ctx.bezierCurveTo(p.x - 19, p.y - 40, p.x - 7, p.y - 44, p.x + 2, p.y - 42);
      ctx.bezierCurveTo(p.x + 12, p.y - 45, p.x + 19, p.y - 39, p.x + 25, p.y - 34);
      ctx.lineTo(p.x + 16, p.y - 32);
      ctx.bezierCurveTo(p.x + 7, p.y - 36, p.x - 1, p.y - 33, p.x - 12, p.y - 27);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#e58446";
      ctx.beginPath(); ctx.moveTo(p.x - 8, p.y - 38); ctx.quadraticCurveTo(p.x + 8, p.y - 45, p.x + 19, p.y - 36); ctx.stroke();
    } else if (p.character === "drj") {
      ctx.fillStyle = "#242025";
      ctx.strokeStyle = "#41323a";
      ctx.lineWidth = 1.5;
      for (const [dx, dy, radius] of [[-16, -34, 10], [-9, -41, 11], [1, -43, 12], [11, -40, 11], [18, -32, 9], [0, -34, 13]]) {
        ctx.beginPath(); ctx.arc(p.x + dx, p.y + dy, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
  }

  function drawArena() {
    const kind = arenaChoice;
    ctx.fillStyle = ["#182a38", "#304d57", "#8ab9ce", "#10162e"][kind];
    ctx.fillRect(0, 0, W, H);
    if (kind === 0) {
      ctx.fillStyle = "#21323b";
      for (const tier of [245, 325, 405]) ctx.fillRect(64, tier, 1152, 36);
      ctx.fillStyle = "#66818a";
      for (let x = 88; x < 1200; x += 26) for (const y of [264, 344, 424]) ctx.fillRect(x, y, 5, 5);
      ctx.fillStyle = "#d8c48b";
      for (const x of [300, 640, 980]) { ctx.fillRect(x - 34, 145, 68, 5); ctx.fillRect(x - 4, 150, 8, 20); }
    } else if (kind === 1) {
      ctx.fillStyle = "#273b45";
      for (let x = 75; x < 1200; x += 92) ctx.fillRect(x, 270 + (x % 4) * 19, 73, 350);
      ctx.strokeStyle = "#6e8991";
      ctx.lineWidth = 1;
      for (let x = 72; x < 1220; x += 32) { ctx.beginPath(); ctx.moveTo(x, 230); ctx.lineTo(x, 590); ctx.stroke(); }
      for (let y = 230; y < 600; y += 32) { ctx.beginPath(); ctx.moveTo(64, y); ctx.lineTo(1216, y); ctx.stroke(); }
      ctx.fillStyle = "#d3a567";
      ctx.font = "bold 18px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("RUCKER PARK", 640, 305);
    } else if (kind === 2) {
      ctx.fillStyle = "#bde5f0";
      for (let x = 105; x < 1200; x += 170) {
        ctx.beginPath(); ctx.moveTo(x - 90, 590); ctx.lineTo(x, 395); ctx.lineTo(x + 105, 590); ctx.fill();
      }
      ctx.strokeStyle = "#dff8fa";
      ctx.lineWidth = 3;
      for (let y = 270; y < 600; y += 95) { ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(1200, y); ctx.stroke(); }
    } else {
      ctx.fillStyle = "#dae3f0";
      for (let i = 0; i < 44; i++) {
        const x = 90 + (i * 227) % 1100, y = 125 + (i * 101) % 440;
        ctx.fillRect(x, y, i % 7 === 0 ? 3 : 2, i % 7 === 0 ? 3 : 2);
      }
      ctx.save();
      for (let i = 0; i < 13; i++) {
        ctx.globalAlpha = 0.18 + (i % 3) * 0.06;
        const x = 80 + (i * 197 + spaceTime * (5 + i % 3 * 3)) % 1120;
        const y = 145 + (i * 73) % 420 + Math.sin(spaceTime * 0.7 + i) * 4;
        ctx.fillRect(x, y, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2);
      }
      const streak = spaceTime % 5.8;
      if (streak < 0.72) {
        const pass = Math.floor(spaceTime / 5.8);
        const x = 120 + (pass * 173) % 520 + streak * 580;
        const y = 160 + (pass * 97) % 180 + streak * 150;
        ctx.globalAlpha = Math.min(1, streak / 0.1, (0.72 - streak) / 0.18) * 0.85;
        ctx.strokeStyle = "#dff4ff";
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 54, y - 14); ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = "#567b9d";
      ctx.beginPath(); ctx.arc(1005, 235, 45, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#80a992";
      ctx.beginPath(); ctx.ellipse(989, 232, 17, 9, 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = ["#916440", "#4b5a5d", "#b5e7f0", "#777783"][kind];
    ctx.fillRect(LEFT, FLOOR, RIGHT - LEFT, H - FLOOR);
    if (kind === 0) {
      ctx.strokeStyle = "#aa7a50";
      ctx.lineWidth = 2;
      for (let x = 120; x < RIGHT; x += 115) { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x, H); ctx.stroke(); }
    } else if (kind === 3) {
      ctx.fillStyle = "#666675";
      for (const x of [240, 540, 900, 1110]) { ctx.beginPath(); ctx.ellipse(x, 666, 30, 9, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.fillStyle = ["#324250", "#31434a", "#6999ac", "#353748"][kind];
    ctx.fillRect(0, 0, LEFT, H);
    ctx.fillRect(RIGHT, 0, W - RIGHT, H);
    ctx.strokeStyle = kind === 2 ? "#f3ffff" : "#dce5d8";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(LEFT, FLOOR); ctx.lineTo(RIGHT, FLOOR); ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(W / 2 - 4, FLOOR, 8, 13);
  }

  function drawScoreboard() {
    const x = 340, y = 10;
    ctx.fillStyle = "#080d13";
    ctx.fillRect(x + 4, y + 5, 600, 92);
    ctx.fillStyle = "#987c4d";
    ctx.fillRect(x, y, 600, 92);
    ctx.fillStyle = "#15212a";
    ctx.fillRect(x + 4, y + 4, 592, 84);
    ctx.fillStyle = "#263743";
    ctx.fillRect(x + 9, y + 8, 582, 19);
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8c77e";
    ctx.font = "bold 12px system-ui";
    ctx.fillText("SLIMEBA JAM", W / 2, y + 23);
    for (let i = 0; i < 2; i++) {
      const team = playerChoices[teamChoices[i]];
      const panelX = i === 0 ? x + 13 : x + 413;
      const scoreX = i === 0 ? x + 199 : x + 337;
      ctx.fillStyle = "#0a1219";
      ctx.fillRect(panelX, y + 33, 174, 48);
      ctx.fillStyle = "#aebdc0";
      ctx.fillRect(panelX, y + 77, 174, 5);
      team.colors.forEach((color, stripe) => {
        ctx.fillStyle = color;
        ctx.fillRect(panelX + 1 + stripe * 172 / team.colors.length, y + 78, 172 / team.colors.length, 3);
      });
      ctx.fillStyle = "#aec1c8";
      ctx.font = "bold 10px system-ui";
      ctx.fillText(`PLAYER ${i + 1}${cpuChoices[i] ? " · CPU" : ""}`, panelX + 87, y + 47);
      ctx.fillStyle = "#f8f2da";
      ctx.font = "bold 18px system-ui";
      ctx.fillText(team.name.toUpperCase(), panelX + 87, y + 69, 164);
      ctx.fillStyle = "#070e14";
      ctx.fillRect(scoreX, y + 33, 64, 48);
      ctx.fillStyle = "#263743";
      ctx.fillRect(scoreX + 3, y + 36, 58, 42);
      ctx.fillStyle = "#ffb45b";
      ctx.font = "bold 42px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(String(score[i]), scoreX + 32, y + 74);
    }
    ctx.fillStyle = "#e8c77e";
    ctx.font = "bold 13px system-ui";
    ctx.fillText("VS", W / 2, y + 59);
    ctx.fillStyle = "#aec1c8";
    ctx.font = "bold 9px system-ui";
    ctx.fillText("FIRST TO 5", W / 2, y + 75);
    ctx.fillStyle = "#e8c77e";
    for (const rivetX of [x + 7, x + 593]) {
      ctx.beginPath(); ctx.arc(rivetX, y + 46, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawBallIcon(x, y, style, angle = 0, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    const colors = style === 1 ? ["#d9433d", "#f7f4e9", "#2b5aa2", "#f7f4e9", "#d9433d", "#2b5aa2"]
      : style === 2 ? ["#dc782f", "#f1bb60", "#dc782f", "#f1bb60", "#dc782f", "#f1bb60"]
      : style === 3 ? ["#fbd453", "#e56d59", "#58c8bc", "#558fe0", "#f5a75c", "#f5efdd"] : null;
    if (colors) {
      colors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 16, i * Math.PI / 3, (i + 1) * Math.PI / 3); ctx.closePath(); ctx.fill();
      });
    } else {
      ctx.fillStyle = style === 4 ? "#687078" : "#e99432";
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = style === 3 ? "#f8f2da" : style === 4 ? "#24282c" : "#60301b";
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.stroke();
    if (style === 0 || style === 2 || style === 4) {
      ctx.strokeStyle = style === 4 ? "#a9b0b5" : "#713619";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.moveTo(0, -15); ctx.lineTo(0, 15); ctx.stroke();
      if (style !== 4) {
        ctx.beginPath(); ctx.moveTo(-6, -14); ctx.bezierCurveTo(-15, -7, -15, 7, -6, 14);
        ctx.moveTo(6, -14); ctx.bezierCurveTo(15, -7, 15, 7, 6, 14); ctx.stroke();
      }
    }
    ctx.fillStyle = style === 3 ? "#f8f2da" : style === 4 ? "#b8bec2" : "#f5b764";
    ctx.beginPath(); ctx.arc(-5, -5, style === 3 ? 3 : 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawGuestPreview(x, y, choice) {
    if (!choice.character) return;
    ctx.fillStyle = choice.color;
    ctx.fillRect(x - 11, y + 5, 22, 11);
    ctx.fillStyle = choice.character === "conan" ? "#f2d1bb" : "#87513a";
    ctx.beginPath(); ctx.arc(x, y - 4, 11, 0, Math.PI * 2); ctx.fill();
    if (choice.character === "conan") {
      ctx.fillStyle = "#bc542b";
      ctx.beginPath();
      ctx.moveTo(x - 11, y - 9); ctx.quadraticCurveTo(x - 8, y - 23, x + 4, y - 17);
      ctx.quadraticCurveTo(x + 13, y - 23, x + 17, y - 13);
      ctx.lineTo(x + 5, y - 14); ctx.lineTo(x - 8, y - 8); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = "#242025";
      for (const [dx, dy] of [[-10, -15], [-4, -20], [4, -20], [11, -15]]) {
        ctx.beginPath(); ctx.arc(x + dx, y + dy, 6, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function draw() {
    ctx.fillStyle = ["#182a38", "#304d57", "#8ab9ce", "#10162e"][arenaChoice];
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (shakeTime > 0) {
      const fade = shakeTime / shakeDuration;
      ctx.translate(Math.sin(shakeElapsed * 81) * shakeStrength * fade, Math.cos(shakeElapsed * 67) * shakeStrength * fade * 0.65);
    }
    drawArena();
    hoops.forEach(drawHoop);
    if (carrier !== -1) {
      const p = players[carrier];
      ctx.strokeStyle = "#f8f2da";
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(p.x + p.facing * 17, p.y - 9); ctx.lineTo(ball.x, ball.y); ctx.stroke();
    }
    players.forEach((p, i) => {
      const pose = playerPose(p);
      ctx.save();
      ctx.globalAlpha = pose.alpha;
      const pivotX = p.x + (p.reaction === "shoved" ? p.reactionDirection * 24 : 0);
      ctx.translate(pivotX, p.y + 29);
      ctx.rotate(pose.tilt);
      ctx.scale(pose.scaleX, pose.scaleY);
      ctx.translate(-pivotX, -p.y - 29);
      drawCelebration(p);
      ctx.fillStyle = p.character === "conan" ? "#f2d1bb" : p.character === "drj" ? "#87513a" : p.color;
      ctx.strokeStyle = p.flash ? "#f8f2da" : contrastInk(p.color);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x + playerBody[0][0], p.y + playerBody[0][1]);
      for (let j = 1; j < playerBody.length; j++) ctx.lineTo(p.x + playerBody[j][0], p.y + playerBody[j][1]);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.clip();
      if (p.character) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 30, p.y + 9, 60, 24);
        ctx.fillStyle = p.colors[1];
        ctx.fillRect(p.x - 30, p.y + 22, 60, 4);
        if (p.colors[2]) { ctx.fillStyle = p.colors[2]; ctx.fillRect(p.x - 30, p.y + 27, 60, 2); }
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = p.character === "conan" ? "bold 8px system-ui" : "bold 12px system-ui";
        ctx.fillText(p.character === "conan" ? "BOS" : "6", p.x, p.y + 20);
      } else {
        if (p.colors[1]) { ctx.fillStyle = p.colors[1]; ctx.fillRect(p.x - 30, p.y + 10, 60, 8); }
        if (p.colors[2]) { ctx.fillStyle = p.colors[2]; ctx.fillRect(p.x - 30, p.y + 22, 60, 5); }
      }
      ctx.restore();
      drawGuestHair(p);
      drawFace(p);
      drawCelebrationFront(p);
      ctx.restore();
      drawStompBurst(p);
      ctx.fillStyle = "#f8f2da";
      ctx.font = "bold 20px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), p.x, p.y - (p.character ? 64 : 43));
      if (p.flash) {
        ctx.strokeStyle = "#f8f2da";
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(p.x + p.facing * 20, p.y); ctx.lineTo(p.x + p.facing * TUNE.shoveRange, p.y); ctx.stroke();
      }
      if (carrier === i) {
        ctx.font = "bold 16px system-ui";
        ctx.fillStyle = "#f8f2da";
        ctx.fillText(charging === i ? "RELEASE TO THROW" : (i === 0 ? "HOLD S: THROW" : "HOLD ↓: THROW"), p.x, p.y - 83);
        if (charging === i) {
          const width = 90, left = p.x - width / 2, top = p.y - 72;
          const charge = clamp(chargeTime / TUNE.shotChargeSeconds, 0, 1);
          ctx.fillStyle = "#142130";
          ctx.fillRect(left, top, width, 10);
          ctx.fillStyle = "#f4c95d";
          ctx.fillRect(left, top, width * charge, 10);
          ctx.strokeStyle = "#f8f2da";
          ctx.lineWidth = 2;
          ctx.strokeRect(left, top, width, 10);
          const targetX = left + width * shotChargeNeeded(i);
          ctx.beginPath(); ctx.moveTo(targetX, top - 3); ctx.lineTo(targetX, top + 13); ctx.stroke();
        }
      }
    });
    drawBallIcon(ball.x, ball.y, ballChoice, ball.angle);
    drawScoreboard();
    ctx.fillStyle = "#f8f2da";
    ctx.textAlign = "center";
    if (message) {
      ctx.font = "bold 30px system-ui";
      ctx.fillText(message, W / 2, 125);
    }
    if (carrier !== -1) {
      const remaining = Math.max(0, TUNE.carryLimitSeconds - carryTime);
      const warning = remaining <= 1.0 ? "#f56159" : remaining <= 2.0 ? "#f4c95d" : "#f8f2da";
      ctx.fillStyle = warning;
      ctx.font = "bold 21px system-ui";
      ctx.fillText(`P${carrier + 1} · TRAVEL IN ${remaining.toFixed(1)}s`, W / 2, 168);
      ctx.fillStyle = "#142130";
      ctx.fillRect(W / 2 - 90, 178, 180, 8);
      ctx.fillStyle = warning;
      ctx.fillRect(W / 2 - 90, 178, 180 * remaining / TUNE.carryLimitSeconds, 8);
    }
    if (screen === "select") {
      ctx.fillStyle = "rgba(12, 24, 35, 0.94)";
      ctx.fillRect(290, 145, 700, 440);
      ctx.strokeStyle = "#f8f2da";
      ctx.lineWidth = 3;
      ctx.strokeRect(290, 145, 700, 440);
      ctx.fillStyle = "#f8f2da";
      ctx.font = "bold 32px system-ui";
      ctx.fillText("MATCH OPTIONS", W / 2, 196);
      const labels = ["PLAYER 1", "PLAYER 2", "COURT", "BALL"];
      const values = [playerChoices[teamChoices[0]].name, playerChoices[teamChoices[1]].name, arena().name, ballType().name];
      for (let i = 0; i < 4; i++) {
        const y = 219 + i * 66;
        const active = selectedOption === i;
        ctx.fillStyle = active ? "#344650" : "#21313c";
        ctx.fillRect(313, y, 654, 54);
        ctx.strokeStyle = active ? "#e8c77e" : "#61747c";
        ctx.lineWidth = active ? 3 : 1;
        ctx.strokeRect(313, y, 654, 54);
        if (i < 2) {
          const choice = playerChoices[teamChoices[i]];
          choice.colors.forEach((color, stripe) => {
            ctx.fillStyle = color;
            ctx.fillRect(319, y + 6 + stripe * 42 / choice.colors.length, 8, 42 / choice.colors.length);
          });
          drawGuestPreview(888, y + 27, choice);
          ctx.fillStyle = cpuChoices[i] ? "#bd7149" : "#497c75";
          ctx.fillRect(458, y + 10, 108, 34);
          ctx.strokeStyle = active ? "#f8f2da" : "#8da9aa";
          ctx.lineWidth = 1;
          ctx.strokeRect(458, y + 10, 108, 34);
          ctx.textAlign = "center";
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 16px system-ui";
          ctx.fillText(cpuChoices[i] ? "CPU" : "HUMAN", 512, y + 33);
        }
        ctx.textAlign = "left";
        ctx.fillStyle = active ? "#e8c77e" : "#aec1c8";
        ctx.font = "bold 18px system-ui";
        ctx.fillText(labels[i], 345, y + 34);
        ctx.textAlign = "center";
        ctx.fillStyle = "#f8f2da";
        ctx.font = "bold 22px system-ui";
        ctx.fillText(values[i].toUpperCase(), 756, y + 35, 258);
        if (active) {
          ctx.fillStyle = "#e8c77e";
          ctx.font = "bold 27px system-ui";
          ctx.fillText("◀", 587, y + 36);
          ctx.fillText("▶", 930, y + 36);
        }
        if (i === 3) drawBallIcon(887, y + 27, ballChoice, 0, 0.75);
      }
      ctx.textAlign = "center";
      ctx.fillStyle = "#d7e4e2";
      ctx.font = "15px system-ui";
      ctx.fillText(selectedOption === 2 ? arena().detail : selectedOption === 3 ?
        (ballChoice === 3 ? "Light and bouncy" : ballChoice === 4 ? "Heavy with a low bounce" : "Standard basketball physics") :
        "F / . / SPACE or click the badge: HUMAN / CPU (one CPU max)", W / 2, 510);
      ctx.fillStyle = "#f8f2da";
      ctx.font = "bold 17px system-ui";
      ctx.fillText(touchMode ? "TAP ROW + ARROWS TO CHANGE OPTIONS" : "WASD OR ARROWS: MOVE CURSOR + CHANGE VALUE", W / 2, 546);
      ctx.font = "bold 18px system-ui";
      ctx.fillText(touchMode ? "TAP TIP OFF TO START" : "ENTER: TIP OFF", W / 2, 571);
    }
    ctx.restore();
  }

  let previousTime = 0, accumulator = 0;
  function frame(time) {
    if (!previousTime) previousTime = time;
    const dt = Math.min((time - previousTime) / 1000, 0.1);
    accumulator += dt;
    previousTime = time;
    while (accumulator >= STEP) { update(STEP); accumulator -= STEP; }
    updatePresentation(dt);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Read-only state for browser smoke checks; gameplay does not depend on it.
  window.trashBasketballState = () => ({ screen, teams: teamChoices.map(i => playerChoices[i].name), cpuChoices: [...cpuChoices], arena: arena().name, ballType: ballType().name, selectedOption, players: players.map(p => ({ x: p.x, y: p.y, vx: p.vx, character: p.character, celebration: p.celebration, flattenTime: p.flattenTime })), ball: { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy }, score: [...score], winner, message, scorePhase, carrier, carryTime, travelPickupLockout: [...travelPickupLockout], charging, charge: clamp(chargeTime / TUNE.shotChargeSeconds, 0, 1), shotOwner, shakeTime });
})();
