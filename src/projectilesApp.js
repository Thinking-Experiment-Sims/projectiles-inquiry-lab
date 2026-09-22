/**
 * projectilesApp.js
 * 
 * Interactive controller and canvas renderer for The Thinking Experiment:
 * Projectiles & Target Intercept Inquiry Lab.
 */

(function () {
  "use strict";

  // DOM Elements
  const canvas = document.getElementById("simCanvas");
  const ctx = canvas.getContext("2d");
  const canvasViewport = document.getElementById("canvasViewport");

  // Buttons & Controls
  const btnFire = document.getElementById("btnFire");
  const btnFireText = document.getElementById("btnFireText");
  const btnPause = document.getElementById("btnPause");
  const btnStep = document.getElementById("btnStep");
  const btnReset = document.getElementById("btnReset");
  const speedSelect = document.getElementById("speedSelect");

  // Toggles
  const toggleTargetLine = document.getElementById("toggleTargetLine");
  const toggleStrobes = document.getElementById("toggleStrobes");
  const toggleVectors = document.getElementById("toggleVectors");
  const toggleGrid = document.getElementById("toggleGrid");
  const toggleZeroG = document.getElementById("toggleZeroG");
  const toggleAudio = document.getElementById("toggleAudio");

  // Status & Telemetry
  const statusPill = document.getElementById("statusPill");
  const statusMessage = document.getElementById("statusMessage");
  const teleTime = document.getElementById("teleTime");
  const telePos = document.getElementById("telePos");
  const teleVel = document.getElementById("teleVel");
  const teleSpeed = document.getElementById("teleSpeed");
  const teleTargetY = document.getElementById("teleTargetY");
  const teleDrop = document.getElementById("teleDrop");
  const modeBadge = document.getElementById("modeBadge");

  // Mode Tabs
  const modeTabs = document.querySelectorAll(".mode-tab");
  const modePanels = {
    monkey: document.getElementById("panelMonkey"),
    "mark-rober": document.getElementById("panelMarkRober"),
    classroom: document.getElementById("panelClassroom"),
    sandbox: document.getElementById("panelSandbox")
  };

  // Sound Engine using Web Audio API
  class SoundFX {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }
    playLaunch() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    }
    playHit() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    }
    playMiss() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    }
  }

  const sfx = new SoundFX();

  // App State
  const state = {
    mode: "monkey", // 'monkey', 'mark-rober', 'classroom', 'sandbox'
    isRunning: false,
    isPaused: false,
    hasEnded: false,
    simTime: 0,
    playbackSpeed: 1.0,

    // Visual options
    showTargetLine: true,
    showStrobes: true,
    showVectors: true,
    showGrid: false,
    showZeroG: false,

    // Feed the Monkey State
    monkey: {
      x0: 0,
      y0: 0,
      v0: 26.0,
      thetaDeg: 32.6,
      xm: 25.0,
      ym: 16.0,
      g: 9.80,
      monkeyY: 16.0,
      bananaPos: { x: 0, y: 0 },
      isCaught: false,
      hitResult: null
    },

    // Mark Rober State
    markRober: {
      x0: 0,
      y0: 1.8,
      v0: 15.0,
      alphaDeg: 40.0,
      xBoard: 5.0,
      boardY: 1.8, // dynamic position on vertical track
      ceilingY: 7.0,
      g: 10.0,
      dartPos: { x: 0, y: 1.8 },
      hitResult: null
    },

    // Classroom Notes State
    classroom: {
      x0: 0,
      y0: 320,
      v0: 42.0,
      thetaDeg: 30.0,
      g: 10.0,
      x1: 230,
      x2: 310,
      bldgHeight: 70,
      projPos: { x: 0, y: 320 },
      hitResult: null
    },

    // Sandbox State
    sandbox: {
      x0: 0,
      y0: 10.0,
      v0: 25.0,
      thetaDeg: 45.0,
      g: 9.80,
      targetX: 50.0,
      targetY: 0.0,
      projPos: { x: 0, y: 10.0 },
      hitResult: null
    },

    // Interaction Drag State
    drag: {
      isDragging: false,
      target: null // 'cannonAngle', 'cannonPos', 'monkeyTarget', 'dartboard'
    },

    // Trials Data Log
    trials: []
  };

  // Precomputed Trajectory & Strobes cache
  let currentTrajectory = [];
  let currentStrobes = [];
  let currentZeroGTrajectory = [];

  // ==========================================================================
  // Resize & Coordinate Mapping
  // ==========================================================================

  function resizeCanvas() {
    const rect = canvasViewport.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = rect.width;
    const displayHeight = Math.min(540, Math.max(380, displayWidth * 0.58));

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + "px";
    canvas.style.height = displayHeight + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    ctx.scale(dpr, dpr);
    render();
  }

  window.addEventListener("resize", resizeCanvas);

  function getViewportBounds() {
    const rect = canvasViewport.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    let worldXMin = -2;
    let worldXMax = 35;
    let worldYMin = -1;
    let worldYMax = 25;

    if (state.mode === "monkey") {
      worldXMin = -3;
      worldXMax = Math.max(state.monkey.xm + 8, 35);
      worldYMin = -2;
      worldYMax = Math.max(state.monkey.ym + 6, 24);
    } else if (state.mode === "mark-rober") {
      worldXMin = -1.5;
      worldXMax = Math.max(state.markRober.xBoard + 3, 9);
      worldYMin = -0.5;
      worldYMax = Math.max(state.markRober.ceilingY + 1.5, 9.5);
    } else if (state.mode === "classroom") {
      worldXMin = -20;
      worldXMax = 420;
      worldYMin = -20;
      worldYMax = 390;
    } else if (state.mode === "sandbox") {
      worldXMin = -5;
      worldXMax = 80;
      worldYMin = -5;
      worldYMax = 55;
    }

    const padding = 45;
    const availW = w - padding * 2;
    const availH = h - padding * 2;

    const scaleX = availW / (worldXMax - worldXMin);
    const scaleY = availH / (worldYMax - worldYMin);
    const scale = Math.min(scaleX, scaleY);

    return {
      w,
      h,
      worldXMin,
      worldXMax,
      worldYMin,
      worldYMax,
      scale,
      originX: padding - worldXMin * scale,
      originY: h - padding + worldYMin * scale
    };
  }

  function worldToScreen(wx, wy, bounds) {
    return {
      x: bounds.originX + wx * bounds.scale,
      y: bounds.originY - wy * bounds.scale
    };
  }

  function screenToWorld(sx, sy, bounds) {
    return {
      x: (sx - bounds.originX) / bounds.scale,
      y: (bounds.originY - sy) / bounds.scale
    };
  }

  // ==========================================================================
  // Physics Computations & Trajectory Refresh
  // ==========================================================================

  function refreshCurrentPhysics() {
    if (state.mode === "monkey") {
      const m = state.monkey;
      const directAim = Math.atan2(m.ym - m.y0, m.xm - m.x0) * (180 / Math.PI);
      const autoAimText = document.getElementById("autoAimAngleText");
      if (autoAimText) autoAimText.textContent = directAim.toFixed(1) + "°";

      const trajRes = ProjectilesPhysics.generateTrajectory({
        x0: m.x0,
        y0: m.y0,
        v0: m.v0,
        thetaDeg: m.thetaDeg,
        g: m.g,
        groundY: 0,
        dt: 0.01,
        maxT: 15
      });
      currentTrajectory = trajRes.points;
      currentStrobes = ProjectilesPhysics.generateStrobePoints(currentTrajectory, 0.10);

      if (state.showZeroG) {
        const zg = ProjectilesPhysics.generateTrajectory({
          x0: m.x0,
          y0: m.y0,
          v0: m.v0,
          thetaDeg: m.thetaDeg,
          g: 0,
          groundY: -100,
          dt: 0.02,
          maxT: 5
        });
        currentZeroGTrajectory = zg.points;
      }

      m.hitResult = ProjectilesPhysics.calculateMonkeyIntercept({
        x0: m.x0,
        y0: m.y0,
        xm: m.xm,
        ym: m.ym,
        v0: m.v0,
        thetaDeg: m.thetaDeg,
        g: m.g,
        catchRadius: 0.60
      });

    } else if (state.mode === "mark-rober") {
      const mr = state.markRober;
      const trajRes = ProjectilesPhysics.generateTrajectory({
        x0: mr.x0,
        y0: mr.y0,
        v0: mr.v0,
        thetaDeg: mr.alphaDeg,
        g: mr.g,
        ceilingY: mr.ceilingY,
        groundY: 0,
        dt: 0.005,
        maxT: 10
      });
      currentTrajectory = trajRes.points;
      currentStrobes = ProjectilesPhysics.generateStrobePoints(currentTrajectory, 0.05);

      mr.hitResult = ProjectilesPhysics.calculateMarkRoberDartboard({
        x0: mr.x0,
        y0: mr.y0,
        xBoard: mr.xBoard,
        v0: mr.v0,
        alphaDeg: mr.alphaDeg,
        g: mr.g,
        ceilingY: mr.ceilingY
      });

    } else if (state.mode === "classroom") {
      const cp = state.classroom;
      const trajRes = ProjectilesPhysics.generateTrajectory({
        x0: cp.x0,
        y0: cp.y0,
        v0: cp.v0,
        thetaDeg: cp.thetaDeg,
        g: cp.g,
        groundY: 0,
        obstacle: { x1: cp.x1, x2: cp.x2, height: cp.bldgHeight },
        dt: 0.02,
        maxT: 25
      });
      currentTrajectory = trajRes.points;
      currentStrobes = ProjectilesPhysics.generateStrobePoints(currentTrajectory, 0.50);

      cp.hitResult = ProjectilesPhysics.calculateBuildingObstacle({
        x0: cp.x0,
        y0: cp.y0,
        v0: cp.v0,
        thetaDeg: cp.thetaDeg,
        g: cp.g,
        x1: cp.x1,
        x2: cp.x2,
        bldgHeight: cp.bldgHeight
      });

    } else if (state.mode === "sandbox") {
      const sb = state.sandbox;
      const trajRes = ProjectilesPhysics.generateTrajectory({
        x0: sb.x0,
        y0: sb.y0,
        v0: sb.v0,
        thetaDeg: sb.thetaDeg,
        g: sb.g,
        groundY: 0,
        dt: 0.01,
        maxT: 20
      });
      currentTrajectory = trajRes.points;
      currentStrobes = ProjectilesPhysics.generateStrobePoints(currentTrajectory, 0.15);
    }

    updatePedagogyCards();
  }

  // ==========================================================================
  // Simulation Step & Animation Loop
  // ==========================================================================

  let lastTimestamp = null;

  function runSimulationLoop(timestamp) {
    if (!state.isRunning) return;

    if (!lastTimestamp) lastTimestamp = timestamp;
    const realDt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (!state.isPaused) {
      stepSimulation(realDt * state.playbackSpeed);
    }

    render();

    if (state.isRunning) {
      requestAnimationFrame(runSimulationLoop);
    }
  }

  function stepSimulation(dt) {
    state.simTime += dt;
    const t = state.simTime;

    if (state.mode === "monkey") {
      const m = state.monkey;
      const decomp = ProjectilesPhysics.decomposeVelocity(m.v0, m.thetaDeg);
      const pos = ProjectilesPhysics.getPositionAtTime({
        x0: m.x0,
        y0: m.y0,
        vx: decomp.vx,
        vy: decomp.vy,
        g: m.g,
        t: t
      });
      m.bananaPos = pos;

      // Monkey free-fall: drops with 0.5 * g * t^2
      m.monkeyY = Math.max(0, m.ym - 0.5 * m.g * t * t);

      // Check intercept or ground impact
      const tHit = m.hitResult.tIntercept;
      if (t >= tHit && !state.hasEnded) {
        if (m.hitResult.isHit) {
          state.hasEnded = true;
          m.isCaught = true;
          sfx.playHit();
          setStatus("hit", `🎉 Intercept! Monkey caught the banana at t = ${tHit.toFixed(2)}s, height = ${m.hitResult.yMonkeyAtTime.toFixed(2)}m!`);
          logTrial("Feed the Monkey", m.v0, m.thetaDeg, m.g, tHit, m.xm, m.hitResult.yMonkeyAtTime, "CAUGHT");
        } else {
          state.hasEnded = true;
          sfx.playMiss();
          const dev = m.hitResult.verticalDeviation.toFixed(2);
          const dir = m.bananaPos.y > m.monkeyY ? "above" : "below";
          setStatus("miss", `Missed! Banana passed ${dev}m ${dir} the monkey.`);
          logTrial("Feed the Monkey", m.v0, m.thetaDeg, m.g, tHit, m.bananaPos.x, m.bananaPos.y, `MISS (${dir})`);
        }
        pauseSimulation();
      } else if (pos.y <= 0 && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playMiss();
        setStatus("miss", `Banana hit ground at x = ${pos.x.toFixed(1)}m before reaching monkey.`);
        logTrial("Feed the Monkey", m.v0, m.thetaDeg, m.g, t, pos.x, 0, "GROUND HIT");
        pauseSimulation();
      }

    } else if (state.mode === "mark-rober") {
      const mr = state.markRober;
      const decomp = ProjectilesPhysics.decomposeVelocity(mr.v0, mr.alphaDeg);
      const pos = ProjectilesPhysics.getPositionAtTime({
        x0: mr.x0,
        y0: mr.y0,
        vx: decomp.vx,
        vy: decomp.vy,
        g: mr.g,
        t: t
      });
      mr.dartPos = pos;

      // Motorized dartboard slides dynamically along track towards target height H
      const targetH = mr.hitResult.targetHeightH;
      const tBoard = mr.hitResult.tBoard;
      const progress = Math.min(1, t / tBoard);
      // Smooth dynamic slide
      mr.boardY = mr.y0 + (targetH - mr.y0) * progress;

      // Check ceiling collision
      if (mr.hitResult.hitsCeiling && t >= mr.hitResult.tCeiling && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playMiss();
        setStatus("miss", `💥 Dart hit the workshop ceiling at x = ${mr.hitResult.xCeiling.toFixed(1)}m, t = ${mr.hitResult.tCeiling.toFixed(2)}s!`);
        logTrial("Mark Rober", mr.v0, mr.alphaDeg, mr.g, mr.hitResult.tCeiling, mr.hitResult.xCeiling, mr.ceilingY, "CEILING COLLISION");
        pauseSimulation();
      } else if (t >= tBoard && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playHit();
        setStatus("hit", `🎯 Bullseye! Dart struck dartboard bullseye at height H = ${targetH.toFixed(2)}m (t = ${tBoard.toFixed(2)}s)!`);
        logTrial("Mark Rober", mr.v0, mr.alphaDeg, mr.g, tBoard, mr.xBoard, targetH, "BULLSEYE HIT");
        pauseSimulation();
      }

    } else if (state.mode === "classroom") {
      const cp = state.classroom;
      const decomp = ProjectilesPhysics.decomposeVelocity(cp.v0, cp.thetaDeg);
      const pos = ProjectilesPhysics.getPositionAtTime({
        x0: cp.x0,
        y0: cp.y0,
        vx: decomp.vx,
        vy: decomp.vy,
        g: cp.g,
        t: t
      });
      cp.projPos = pos;

      const hit = cp.hitResult;
      if (hit.collisionType !== "none" && t >= hit.collisionT && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playMiss();
        setStatus("miss", `Building Collision: Hit ${hit.collisionType === "roof" ? "roof" : "front wall"} at x = ${hit.collisionX.toFixed(1)}m, y = ${hit.collisionY.toFixed(1)}m!`);
        logTrial("Classroom Obstacle", cp.v0, cp.thetaDeg, cp.g, hit.collisionT, hit.collisionX, hit.collisionY, "BUILDING HIT");
        pauseSimulation();
      } else if (pos.x >= cp.x2 && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playHit();
        setStatus("hit", `Cleared Building! Height at far edge was ${hit.y2.toFixed(1)}m (cleared ${cp.bldgHeight}m roof by ${(hit.y2 - cp.bldgHeight).toFixed(1)}m)!`);
        logTrial("Classroom Obstacle", cp.v0, cp.thetaDeg, cp.g, t, pos.x, pos.y, "CLEARED BUILDING");
        pauseSimulation();
      } else if (pos.y <= 0 && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playMiss();
        setStatus("miss", `Landed on ground at x = ${pos.x.toFixed(1)}m.`);
        logTrial("Classroom Obstacle", cp.v0, cp.thetaDeg, cp.g, t, pos.x, 0, "GROUND HIT");
        pauseSimulation();
      }

    } else if (state.mode === "sandbox") {
      const sb = state.sandbox;
      const decomp = ProjectilesPhysics.decomposeVelocity(sb.v0, sb.thetaDeg);
      const pos = ProjectilesPhysics.getPositionAtTime({
        x0: sb.x0,
        y0: sb.y0,
        vx: decomp.vx,
        vy: decomp.vy,
        g: sb.g,
        t: t
      });
      sb.projPos = pos;

      if (pos.y <= 0 && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playMiss();
        setStatus("ready", `Flight complete. Total flight time: ${t.toFixed(2)}s, Range: ${pos.x.toFixed(1)}m.`);
        logTrial("Sandbox", sb.v0, sb.thetaDeg, sb.g, t, pos.x, 0, "LANDED");
        pauseSimulation();
      }
    }

    updateTelemetryHUD();
  }

  function fireSimulation() {
    if (state.isRunning && state.isPaused) {
      resumeSimulation();
      return;
    }

    resetSimulation();
    state.isRunning = true;
    state.isPaused = false;
    state.hasEnded = false;
    lastTimestamp = null;

    btnFire.disabled = true;
    btnPause.disabled = false;
    setStatus("running", "Projectile in flight...");
    sfx.playLaunch();
    requestAnimationFrame(runSimulationLoop);
  }

  function pauseSimulation() {
    state.isPaused = true;
    btnPause.innerHTML = '<span class="btn-icon">▶</span> Resume';
    btnFire.disabled = false;
    btnFireText.textContent = "Restart Launch";
  }

  function resumeSimulation() {
    state.isPaused = false;
    btnPause.innerHTML = '<span class="btn-icon">❚❚</span> Pause';
    lastTimestamp = null;
    requestAnimationFrame(runSimulationLoop);
  }

  function stepForward() {
    if (!state.isRunning) {
      state.isRunning = true;
      state.isPaused = true;
      btnPause.disabled = false;
      btnPause.innerHTML = '<span class="btn-icon">▶</span> Resume';
    }
    stepSimulation(0.05);
    render();
  }

  function resetSimulation() {
    state.isRunning = false;
    state.isPaused = false;
    state.hasEnded = false;
    state.simTime = 0;
    lastTimestamp = null;

    btnFire.disabled = false;
    btnPause.disabled = true;
    btnPause.innerHTML = '<span class="btn-icon">❚❚</span> Pause';
    btnFireText.textContent = state.mode === "mark-rober" ? "Throw Dart" : "Fire Cannon";

    if (state.mode === "monkey") {
      state.monkey.bananaPos = { x: state.monkey.x0, y: state.monkey.y0 };
      state.monkey.monkeyY = state.monkey.ym;
      state.monkey.isCaught = false;
    } else if (state.mode === "mark-rober") {
      state.markRober.dartPos = { x: state.markRober.x0, y: state.markRober.y0 };
      state.markRober.boardY = state.markRober.y0;
    } else if (state.mode === "classroom") {
      state.classroom.projPos = { x: state.classroom.x0, y: state.classroom.y0 };
    } else if (state.mode === "sandbox") {
      state.sandbox.projPos = { x: state.sandbox.x0, y: state.sandbox.y0 };
    }

    setStatus("ready", "Ready to Launch");
    refreshCurrentPhysics();
    updateTelemetryHUD();
    render();
  }

  function setStatus(type, message) {
    statusPill.className = `status-pill status-${type}`;
    statusPill.textContent = type.toUpperCase();
    statusMessage.textContent = message;
  }

  // ==========================================================================
  // HUD Telemetry & Cornell T-Chart Reactive UI
  // ==========================================================================

  function updateTelemetryHUD() {
    const t = state.simTime;
    teleTime.textContent = t.toFixed(2) + " s";

    let pos = { x: 0, y: 0 };
    let v0 = 20, thetaDeg = 45, g = 9.80;

    if (state.mode === "monkey") {
      pos = state.monkey.bananaPos;
      v0 = state.monkey.v0;
      thetaDeg = state.monkey.thetaDeg;
      g = state.monkey.g;
      teleTargetY.textContent = state.monkey.monkeyY.toFixed(2) + " m";
      const drop = 0.5 * g * t * t;
      teleDrop.textContent = drop.toFixed(2) + " m";
    } else if (state.mode === "mark-rober") {
      pos = state.markRober.dartPos;
      v0 = state.markRober.v0;
      thetaDeg = state.markRober.alphaDeg;
      g = state.markRober.g;
      teleTargetY.textContent = state.markRober.boardY.toFixed(2) + " m";
      teleDrop.textContent = (0.5 * g * t * t).toFixed(2) + " m";
    } else if (state.mode === "classroom") {
      pos = state.classroom.projPos;
      v0 = state.classroom.v0;
      thetaDeg = state.classroom.thetaDeg;
      g = state.classroom.g;
      teleTargetY.textContent = state.classroom.bldgHeight.toFixed(1) + " m";
      teleDrop.textContent = (0.5 * g * t * t).toFixed(1) + " m";
    } else {
      pos = state.sandbox.projPos;
      v0 = state.sandbox.v0;
      thetaDeg = state.sandbox.thetaDeg;
      g = state.sandbox.g;
      teleTargetY.textContent = "0.0 m";
      teleDrop.textContent = (0.5 * g * t * t).toFixed(2) + " m";
    }

    telePos.textContent = `(${pos.x.toFixed(1)} m, ${pos.y.toFixed(1)} m)`;

    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const vel = ProjectilesPhysics.getVelocityAtTime({
      vx: decomp.vx,
      vy: decomp.vy,
      g: g,
      t: t
    });

    teleVel.textContent = `(${vel.vx.toFixed(1)}, ${vel.vy.toFixed(1)}) m/s`;
    teleSpeed.textContent = vel.speed.toFixed(1) + " m/s";

    // Update live values in Cornell T-Chart
    const tcSubX = document.getElementById("tcSubX");
    const tcSubVy = document.getElementById("tcSubVy");
    const tcSubY = document.getElementById("tcSubY");
    if (tcSubX) tcSubX.textContent = `${pos.x.toFixed(1)} m (t = ${t.toFixed(2)}s)`;
    if (tcSubVy) tcSubVy.textContent = `${vel.vy.toFixed(1)} m/s`;
    if (tcSubY) tcSubY.textContent = `${pos.y.toFixed(1)} m`;
  }

  function updatePedagogyCards() {
    let v0 = 26, thetaDeg = 32.6, g = 9.80, x0 = 0, y0 = 0;

    if (state.mode === "monkey") {
      v0 = state.monkey.v0;
      thetaDeg = state.monkey.thetaDeg;
      g = state.monkey.g;
      x0 = state.monkey.x0;
      y0 = state.monkey.y0;
    } else if (state.mode === "mark-rober") {
      v0 = state.markRober.v0;
      thetaDeg = state.markRober.alphaDeg;
      g = state.markRober.g;
      x0 = state.markRober.x0;
      y0 = state.markRober.y0;

      // Update Mark Rober Solution card
      const res = state.markRober.hitResult;
      if (res) {
        document.getElementById("rmX").textContent = res.xBoard.toFixed(1);
        document.getElementById("rmVox").textContent = res.vx.toFixed(2);
        document.getElementById("rmT").textContent = res.tBoard.toFixed(3);
        document.getElementById("rmH").textContent = res.targetHeightH.toFixed(2);
        document.getElementById("rmHmax").textContent = res.maxDartHeight.toFixed(2);

        const ceilStatus = document.getElementById("rmCeilingStatus");
        if (res.hitsCeiling) {
          ceilStatus.style.background = "var(--color-danger-bg)";
          ceilStatus.style.color = "var(--color-danger)";
          ceilStatus.textContent = `⚠️ Collision! Dart hits ceiling at x = ${res.xCeiling.toFixed(1)}m before board!`;
        } else {
          ceilStatus.style.background = "var(--color-teal-subtle)";
          ceilStatus.style.color = "var(--color-teal-dark)";
          ceilStatus.textContent = `Ceiling at ${res.ceilingY.toFixed(1)}m > ${res.maxDartHeight.toFixed(2)}m → ✅ Safe clearance!`;
        }
      }
    } else if (state.mode === "classroom") {
      v0 = state.classroom.v0;
      thetaDeg = state.classroom.thetaDeg;
      g = state.classroom.g;
      x0 = state.classroom.x0;
      y0 = state.classroom.y0;

      // Update Classroom math card
      const res = state.classroom.hitResult;
      if (res) {
        document.getElementById("cpHmax").textContent = res.maxH.toFixed(2);
        document.getElementById("cpTup").textContent = res.tApex.toFixed(2);
        document.getElementById("cpXfar").textContent = state.classroom.x2.toFixed(0);
        document.getElementById("cpTfar").textContent = res.t2.toFixed(2);
        document.getElementById("cpYfar").textContent = res.y2.toFixed(1);

        const clearStatus = document.getElementById("cpClearStatus");
        if (res.clearsBuilding) {
          clearStatus.style.background = "var(--color-success-bg)";
          clearStatus.style.color = "var(--color-success)";
          clearStatus.textContent = `✅ y = ${res.y2.toFixed(1)}m > ${state.classroom.bldgHeight}m: Projectile clears building!`;
        } else {
          clearStatus.style.background = "var(--color-danger-bg)";
          clearStatus.style.color = "var(--color-danger)";
          clearStatus.textContent = `❌ Building hit: Collides with ${res.collisionType === "roof" ? "roof" : "front wall"}!`;
        }
      }
    } else {
      v0 = state.sandbox.v0;
      thetaDeg = state.sandbox.thetaDeg;
      g = state.sandbox.g;
      x0 = state.sandbox.x0;
      y0 = state.sandbox.y0;
    }

    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const tcVx = document.getElementById("tcVx");
    const tcAy = document.getElementById("tcAy");
    const sohCalcVx = document.getElementById("sohCalcVx");
    const sohCalcVy = document.getElementById("sohCalcVy");

    if (tcVx) tcVx.textContent = decomp.vx.toFixed(1);
    if (tcAy) tcAy.textContent = (-g).toFixed(1);
    if (sohCalcVx) sohCalcVx.textContent = `${v0.toFixed(1)} · cos(${thetaDeg.toFixed(1)}°) = ${decomp.vx.toFixed(2)} m/s`;
    if (sohCalcVy) sohCalcVy.textContent = `${v0.toFixed(1)} · sin(${thetaDeg.toFixed(1)}°) = ${decomp.vy.toFixed(2)} m/s`;
  }

  // ==========================================================================
  // Canvas Rendering Pipeline
  // ==========================================================================

  function render() {
    const rect = canvasViewport.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const bounds = getViewportBounds();

    // 1. Metric Grid & Background
    drawBackground(bounds, w, h);

    // 2. Scene Scenery per Mode
    if (state.mode === "monkey") {
      drawMonkeyScene(bounds);
    } else if (state.mode === "mark-rober") {
      drawMarkRoberScene(bounds);
    } else if (state.mode === "classroom") {
      drawClassroomScene(bounds);
    } else if (state.mode === "sandbox") {
      drawSandboxScene(bounds);
    }

    // 3. Trajectory Trails & Strobe Dots
    drawTrajectories(bounds);

    // 4. Projectile & Vectors
    drawProjectileAndVectors(bounds);
  }

  function drawBackground(b, w, h) {
    // Soft sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#ffffff");
    sky.addColorStop(1, "#f4f9fb");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Grid if enabled
    if (state.showGrid) {
      ctx.strokeStyle = "#e1ebf0";
      ctx.lineWidth = 1;
      ctx.beginPath();

      const xStep = state.mode === "classroom" ? 50 : 5;
      const yStep = state.mode === "classroom" ? 50 : 5;

      for (let wx = 0; wx <= b.worldXMax; wx += xStep) {
        const p1 = worldToScreen(wx, b.worldYMin, b);
        const p2 = worldToScreen(wx, b.worldYMax, b);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      for (let wy = 0; wy <= b.worldYMax; wy += yStep) {
        const p1 = worldToScreen(b.worldXMin, wy, b);
        const p2 = worldToScreen(b.worldXMax, wy, b);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }

    // Ground line
    const gL = worldToScreen(b.worldXMin, 0, b);
    const gR = worldToScreen(b.worldXMax, 0, b);
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(gL.x, gL.y);
    ctx.lineTo(gR.x, gR.y);
    ctx.stroke();

    // Ground fill
    ctx.fillStyle = "#eaf2f5";
    ctx.fillRect(gL.x, gL.y, gR.x - gL.x, h - gL.y);
  }

  // Draw Mode 1: Feed the Monkey Scene
  function drawMonkeyScene(b) {
    const m = state.monkey;

    // 1. Tree trunk and branch
    const treeX = worldToScreen(m.xm, 0, b).x;
    const treeBase = worldToScreen(m.xm, 0, b).y;
    const branchTop = worldToScreen(m.xm, m.ym, b).y;

    // Tree Trunk
    ctx.fillStyle = "#8a5832";
    ctx.fillRect(treeX - 8, branchTop - 10, 16, treeBase - branchTop + 10);

    // Tree Branch
    ctx.fillStyle = "#6d4424";
    ctx.beginPath();
    ctx.roundRect(treeX - 35, branchTop - 12, 50, 12, 4);
    ctx.fill();

    // Foliage
    ctx.fillStyle = "#3d8b5c";
    ctx.beginPath();
    ctx.arc(treeX + 10, branchTop - 28, 32, 0, Math.PI * 2);
    ctx.arc(treeX - 15, branchTop - 34, 26, 0, Math.PI * 2);
    ctx.arc(treeX + 30, branchTop - 20, 22, 0, Math.PI * 2);
    ctx.fill();

    // 2. Monkey
    const monkPt = worldToScreen(m.xm, m.monkeyY, b);
    drawMonkeyGraphic(monkPt.x - 12, monkPt.y, m.isCaught);

    // Initial branch marker
    if (state.simTime > 0) {
      ctx.strokeStyle = "rgba(18, 49, 64, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(treeX - 30, branchTop);
      ctx.lineTo(treeX + 30, branchTop);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Cannon Muzzle & Mount
    const canPt = worldToScreen(m.x0, m.y0, b);
    drawCannonGraphic(canPt.x, canPt.y, m.thetaDeg);

    // 4. Line of Sight Ray
    if (state.showTargetLine) {
      const aimPt = worldToScreen(m.xm, m.ym, b);
      ctx.strokeStyle = "rgba(214, 123, 25, 0.75)";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(canPt.x, canPt.y);
      ctx.lineTo(aimPt.x, aimPt.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Target crosshair at monkey initial branch
      ctx.strokeStyle = "#d67b19";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(aimPt.x, aimPt.y, 8, 0, Math.PI * 2);
      ctx.moveTo(aimPt.x - 12, aimPt.y);
      ctx.lineTo(aimPt.x + 12, aimPt.y);
      ctx.moveTo(aimPt.x, aimPt.y - 12);
      ctx.lineTo(aimPt.x, aimPt.y + 12);
      ctx.stroke();
    }
  }

  function drawMonkeyGraphic(x, y, isCaught) {
    ctx.save();
    ctx.translate(x, y);

    // Body
    ctx.fillStyle = "#7a4e2d";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = "#b88a65";
    ctx.beginPath();
    ctx.ellipse(0, 3, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#7a4e2d";
    ctx.beginPath();
    ctx.arc(0, -16, 11, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.arc(-11, -17, 5, 0, Math.PI * 2);
    ctx.arc(11, -17, 5, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.fillStyle = "#b88a65";
    ctx.beginPath();
    ctx.ellipse(0, -14, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#123140";
    ctx.beginPath();
    ctx.arc(-3, -16, 1.8, 0, Math.PI * 2);
    ctx.arc(3, -16, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Smile / Catch mouth
    ctx.strokeStyle = "#123140";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (isCaught) {
      ctx.arc(0, -12, 4, 0, Math.PI); // Big smile
    } else {
      ctx.arc(0, -12, 3, 0, Math.PI);
    }
    ctx.stroke();

    // Arms
    ctx.strokeStyle = "#7a4e2d";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (isCaught) {
      // Arms hugging banana
      ctx.moveTo(-10, -5);
      ctx.lineTo(-2, 4);
      ctx.moveTo(10, -5);
      ctx.lineTo(2, 4);
    } else {
      // Reaching arms
      ctx.moveTo(-10, -5);
      ctx.lineTo(-14, -18);
      ctx.moveTo(10, -5);
      ctx.lineTo(14, -18);
    }
    ctx.stroke();

    if (isCaught) {
      // Banana in hands
      ctx.fillStyle = "#e09f19";
      ctx.beginPath();
      ctx.arc(0, 5, 8, 0.4, 2.7);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#e09f19";
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawCannonGraphic(x, y, angleDeg) {
    ctx.save();
    ctx.translate(x, y);

    // Base pedestal
    ctx.fillStyle = "#0f7e9b";
    ctx.beginPath();
    ctx.arc(0, 0, 14, Math.PI, 0);
    ctx.fill();

    // Barrel
    ctx.rotate(-angleDeg * (Math.PI / 180));
    ctx.fillStyle = "#095468";
    ctx.beginPath();
    ctx.roundRect(-6, -8, 38, 16, [0, 4, 4, 0]);
    ctx.fill();

    // Barrel ring
    ctx.strokeStyle = "#d67b19";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(30, -8);
    ctx.lineTo(30, 8);
    ctx.stroke();

    ctx.restore();

    // Pivot center dot
    ctx.fillStyle = "#d67b19";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Mode 2: Mark Rober Workshop Scene
  function drawMarkRoberScene(b) {
    const mr = state.markRober;

    // 1. Workshop Ceiling
    const cL = worldToScreen(b.worldXMin, mr.ceilingY, b);
    const cR = worldToScreen(b.worldXMax, mr.ceilingY, b);
    ctx.strokeStyle = "#426170";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cL.x, cL.y);
    ctx.lineTo(cR.x, cR.y);
    ctx.stroke();

    // Ceiling hatch pattern / rafters
    ctx.fillStyle = "#c8dbe3";
    ctx.fillRect(cL.x, 0, cR.x - cL.x, cL.y);
    ctx.fillStyle = "#123140";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`WORKSHOP CEILING (${mr.ceilingY.toFixed(1)}m)`, cL.x + 20, cL.y - 8);

    // 2. Mark Rober figure standing at (x0, 0) throwing from y0
    const markBase = worldToScreen(mr.x0, 0, b);
    const markHand = worldToScreen(mr.x0, mr.y0, b);
    drawMarkRoberGraphic(markBase.x, markBase.y, markHand.y);

    // 3. Vertical Linear Actuator Track
    const trackX = worldToScreen(mr.xBoard, 0, b).x;
    const trackBottom = worldToScreen(mr.xBoard, 0, b).y;
    const trackTop = worldToScreen(mr.xBoard, mr.ceilingY, b).y;

    // Dual vertical guide rails
    ctx.fillStyle = "#a2b9c4";
    ctx.fillRect(trackX - 6, trackTop, 3, trackBottom - trackTop);
    ctx.fillRect(trackX + 3, trackTop, 3, trackBottom - trackTop);

    // 4. Sliding Motorized Dartboard
    const boardPt = worldToScreen(mr.xBoard, mr.boardY, b);
    drawDartboardGraphic(boardPt.x, boardPt.y);
  }

  function drawMarkRoberGraphic(baseX, baseY, handY) {
    ctx.save();
    // Body & legs
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Torso
    ctx.moveTo(baseX, baseY - 10);
    ctx.lineTo(baseX, handY + 12);
    // Legs
    ctx.moveTo(baseX, baseY - 10);
    ctx.lineTo(baseX - 8, baseY);
    ctx.moveTo(baseX, baseY - 10);
    ctx.lineTo(baseX + 6, baseY);
    ctx.stroke();

    // Throwing Arm
    ctx.strokeStyle = "#d67b19";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(baseX, handY + 14);
    ctx.lineTo(baseX + 12, handY);
    ctx.stroke();

    // Head
    ctx.fillStyle = "#d67b19";
    ctx.beginPath();
    ctx.arc(baseX, handY - 6, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawDartboardGraphic(x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Motorized carriage backplate
    ctx.fillStyle = "#123140";
    ctx.fillRect(-12, -24, 8, 48);

    // Dartboard outer rim
    ctx.fillStyle = "#123140";
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // Segments
    ctx.fillStyle = "#e4f3f7";
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Double/triple rings
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Bullseye
    ctx.fillStyle = "#d67b19";
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Mode 3: Classroom Notes Scene (Cliff & Obstacle Building)
  function drawClassroomScene(b) {
    const cp = state.classroom;

    // 1. Cliff Platform (x0, y0)
    const cliffEdge = worldToScreen(cp.x0, cp.y0, b);
    const cliffBase = worldToScreen(cp.x0, 0, b);
    const screenLeft = worldToScreen(b.worldXMin, 0, b).x;

    ctx.fillStyle = "#c8dbe3";
    ctx.fillRect(screenLeft, cliffEdge.y, cliffEdge.x - screenLeft + 8, cliffBase.y - cliffEdge.y);
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenLeft, cliffEdge.y);
    ctx.lineTo(cliffEdge.x, cliffEdge.y);
    ctx.lineTo(cliffEdge.x, cliffBase.y);
    ctx.stroke();

    // Cliff height label
    ctx.fillStyle = "#0f7e9b";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText(`CLIFF h₀ = ${cp.y0}m`, cliffEdge.x - 95, cliffEdge.y - 12);

    // 2. Obstacle Building [x1, x2] of height bldgHeight
    const bldgL = worldToScreen(cp.x1, cp.bldgHeight, b);
    const bldgR = worldToScreen(cp.x2, 0, b);
    const bldgW = bldgR.x - bldgL.x;
    const bldgH = bldgR.y - bldgL.y;

    ctx.fillStyle = "#e4f3f7";
    ctx.fillRect(bldgL.x, bldgL.y, bldgW, bldgH);
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bldgL.x, bldgL.y, bldgW, bldgH);

    // Building windows
    ctx.fillStyle = "#0f7e9b";
    const winW = 6, winH = 8, gapX = 14, gapY = 16;
    for (let wx = bldgL.x + 10; wx < bldgL.x + bldgW - 8; wx += gapX) {
      for (let wy = bldgL.y + 12; wy < bldgR.y - 10; wy += gapY) {
        ctx.fillRect(wx, wy, winW, winH);
      }
    }

    // Building Roof Label
    ctx.fillStyle = "#123140";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`BUILDING (${cp.bldgHeight}m)`, bldgL.x + 4, bldgL.y - 8);

    // 3. Launcher atop cliff
    drawCannonGraphic(cliffEdge.x, cliffEdge.y, cp.thetaDeg);
  }

  // Draw Mode 4: Free Sandbox Scene
  function drawSandboxScene(b) {
    const sb = state.sandbox;
    const canPt = worldToScreen(sb.x0, sb.y0, b);

    // Platform
    if (sb.y0 > 0) {
      const gPt = worldToScreen(sb.x0, 0, b);
      ctx.fillStyle = "#e4f3f7";
      ctx.fillRect(canPt.x - 20, canPt.y, 40, gPt.y - canPt.y);
      ctx.strokeStyle = "#0f7e9b";
      ctx.lineWidth = 2;
      ctx.strokeRect(canPt.x - 20, canPt.y, 40, gPt.y - canPt.y);
    }

    drawCannonGraphic(canPt.x, canPt.y, sb.thetaDeg);
  }

  // Trajectories & Strobe Dots
  function drawTrajectories(b) {
    if (!currentTrajectory || currentTrajectory.length < 2) return;

    // 1. Zero-G Ghost Trajectory
    if (state.showZeroG && currentZeroGTrajectory.length > 1) {
      ctx.strokeStyle = "rgba(18, 49, 64, 0.25)";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      for (let i = 0; i < currentZeroGTrajectory.length; i++) {
        const pt = worldToScreen(currentZeroGTrajectory[i].x, currentZeroGTrajectory[i].y, b);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Real Gravity Trajectory
    ctx.strokeStyle = "rgba(15, 126, 155, 0.85)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < currentTrajectory.length; i++) {
      const pt = worldToScreen(currentTrajectory[i].x, currentTrajectory[i].y, b);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // 3. Strobe Dots (at Delta t = 0.1s)
    if (state.showStrobes && currentStrobes.length > 0) {
      for (let i = 0; i < currentStrobes.length; i++) {
        const st = currentStrobes[i];
        const sPt = worldToScreen(st.x, st.y, b);

        // Dot
        ctx.fillStyle = "#d67b19";
        ctx.beginPath();
        ctx.arc(sPt.x, sPt.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Feed the Monkey: show matching free-fall dot for monkey!
        if (state.mode === "monkey") {
          const m = state.monkey;
          const drop = 0.5 * m.g * st.t * st.t;
          const monkY = Math.max(0, m.ym - drop);
          const mPt = worldToScreen(m.xm, monkY, b);

          ctx.fillStyle = "#0f7e9b";
          ctx.beginPath();
          ctx.arc(mPt.x, mPt.y, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Connective equal-height horizontal drop indicator line
          if (i % 2 === 0 && st.t <= m.hitResult.tIntercept) {
            ctx.strokeStyle = "rgba(214, 123, 25, 0.18)";
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(sPt.x, sPt.y);
            ctx.lineTo(mPt.x, mPt.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }
  }

  // Active Projectile & Vectors Overlay
  function drawProjectileAndVectors(b) {
    let p = { x: 0, y: 0 };
    let v0 = 20, thetaDeg = 45, g = 9.80;

    if (state.mode === "monkey") {
      p = state.monkey.bananaPos;
      v0 = state.monkey.v0;
      thetaDeg = state.monkey.thetaDeg;
      g = state.monkey.g;
    } else if (state.mode === "mark-rober") {
      p = state.markRober.dartPos;
      v0 = state.markRober.v0;
      thetaDeg = state.markRober.alphaDeg;
      g = state.markRober.g;
    } else if (state.mode === "classroom") {
      p = state.classroom.projPos;
      v0 = state.classroom.v0;
      thetaDeg = state.classroom.thetaDeg;
      g = state.classroom.g;
    } else {
      p = state.sandbox.projPos;
      v0 = state.sandbox.v0;
      thetaDeg = state.sandbox.thetaDeg;
      g = state.sandbox.g;
    }

    const scrPt = worldToScreen(p.x, p.y, b);

    // Draw projectile body
    if (state.mode === "monkey") {
      // Banana projectile
      ctx.save();
      ctx.translate(scrPt.x, scrPt.y);
      ctx.rotate(state.simTime * 8);
      ctx.fillStyle = "#d67b19";
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (state.mode === "mark-rober") {
      // Dart projectile
      ctx.save();
      ctx.translate(scrPt.x, scrPt.y);
      const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
      const vel = ProjectilesPhysics.getVelocityAtTime({ vx: decomp.vx, vy: decomp.vy, g: g, t: state.simTime });
      ctx.rotate(-vel.angleDeg * (Math.PI / 180));
      ctx.fillStyle = "#123140";
      ctx.fillRect(-12, -2, 24, 4);
      // Fins
      ctx.fillStyle = "#d67b19";
      ctx.beginPath();
      ctx.moveTo(-12, -6);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 6);
      ctx.fill();
      ctx.restore();
    } else {
      // Ball projectile
      ctx.fillStyle = "#d67b19";
      ctx.beginPath();
      ctx.arc(scrPt.x, scrPt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Velocity Vectors
    if (state.showVectors && state.isRunning) {
      const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
      const vel = ProjectilesPhysics.getVelocityAtTime({
        vx: decomp.vx,
        vy: decomp.vy,
        g: g,
        t: state.simTime
      });

      const vScale = state.mode === "classroom" ? 0.8 : 2.5;

      // vx vector (horizontal, teal)
      drawArrow(ctx, scrPt.x, scrPt.y, scrPt.x + vel.vx * vScale, scrPt.y, "#0f7e9b", 2);

      // vy vector (vertical, amber)
      drawArrow(ctx, scrPt.x, scrPt.y, scrPt.x, scrPt.y - vel.vy * vScale, "#d67b19", 2);

      // Total v vector (hypotenuse, dark teal)
      drawArrow(ctx, scrPt.x, scrPt.y, scrPt.x + vel.vx * vScale, scrPt.y - vel.vy * vScale, "#095468", 2.5);
    }
  }

  function drawArrow(ctx, fromX, fromY, toX, toY, color, width) {
    const headLen = 7;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const len = Math.hypot(dx, dy);
    if (len < 2) return;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  // ==========================================================================
  // Mouse & Touch Interactivity (Canvas Dragging)
  // ==========================================================================

  function setupCanvasDragInteraction() {
    let activeDrag = null;

    canvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    canvas.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      onPointerDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault() });
    }, { passive: false });

    window.addEventListener("touchmove", (e) => {
      if (activeDrag) {
        const touch = e.touches[0];
        onPointerMove({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }, { passive: false });

    window.addEventListener("touchend", onPointerUp);

    function onPointerDown(e) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const bounds = getViewportBounds();
      const world = screenToWorld(sx, sy, bounds);

      if (state.mode === "monkey") {
        const m = state.monkey;
        // Check monkey click
        if (Math.hypot(world.x - m.xm, world.y - m.ym) < 2.5) {
          activeDrag = "monkeyTarget";
          canvas.style.cursor = "grabbing";
          return;
        }
        // Check cannon muzzle / aim click
        if (Math.hypot(world.x - m.x0, world.y - m.y0) < 3.0) {
          activeDrag = "cannonAngle";
          canvas.style.cursor = "grabbing";
          return;
        }
      } else if (state.mode === "mark-rober") {
        const mr = state.markRober;
        // Check dartboard click
        if (Math.hypot(world.x - mr.xBoard, world.y - mr.boardY) < 2.0) {
          activeDrag = "dartboard";
          canvas.style.cursor = "grabbing";
          return;
        }
        // Check throw angle click
        if (Math.hypot(world.x - mr.x0, world.y - mr.y0) < 2.5) {
          activeDrag = "roberAngle";
          canvas.style.cursor = "grabbing";
          return;
        }
      }
    }

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const bounds = getViewportBounds();
      const world = screenToWorld(sx, sy, bounds);

      if (!activeDrag) {
        // Hover cursor styling
        if (state.mode === "monkey") {
          const m = state.monkey;
          if (Math.hypot(world.x - m.xm, world.y - m.ym) < 2.5 || Math.hypot(world.x - m.x0, world.y - m.y0) < 3.0) {
            canvas.style.cursor = "grab";
          } else {
            canvas.style.cursor = "crosshair";
          }
        }
        return;
      }

      if (activeDrag === "monkeyTarget") {
        const newX = Math.max(15, Math.min(40, Math.round(world.x)));
        const newY = Math.max(6, Math.min(25, Number(world.y.toFixed(1))));
        state.monkey.xm = newX;
        state.monkey.ym = newY;
        document.getElementById("monkeyDist").value = newX;
        document.getElementById("monkeyDistVal").textContent = newX.toFixed(1) + " m";
        document.getElementById("monkeyHeight").value = newY;
        document.getElementById("monkeyHeightVal").textContent = newY.toFixed(1) + " m";
        resetSimulation();
      } else if (activeDrag === "cannonAngle") {
        const dx = world.x - state.monkey.x0;
        const dy = world.y - state.monkey.y0;
        let deg = Math.atan2(dy, dx) * (180 / Math.PI);
        deg = Math.max(-10, Math.min(75, Number(deg.toFixed(1))));
        state.monkey.thetaDeg = deg;
        document.getElementById("monkeyAngle").value = deg;
        document.getElementById("monkeyAngleVal").textContent = deg.toFixed(1) + "°";
        resetSimulation();
      } else if (activeDrag === "dartboard") {
        const newX = Math.max(3, Math.min(15, Number(world.x.toFixed(1))));
        state.markRober.xBoard = newX;
        document.getElementById("roberBoardX").value = newX;
        document.getElementById("roberBoardXVal").textContent = newX.toFixed(1) + " m";
        resetSimulation();
      } else if (activeDrag === "roberAngle") {
        const dx = world.x - state.markRober.x0;
        const dy = world.y - state.markRober.y0;
        let deg = Math.atan2(dy, dx) * (180 / Math.PI);
        deg = Math.max(10, Math.min(75, Number(deg.toFixed(1))));
        state.markRober.alphaDeg = deg;
        document.getElementById("roberAngle").value = deg;
        document.getElementById("roberAngleVal").textContent = deg.toFixed(1) + "°";
        resetSimulation();
      }
    }

    function onPointerUp() {
      if (activeDrag) {
        activeDrag = null;
        canvas.style.cursor = "crosshair";
      }
    }
  }

  // ==========================================================================
  // Trial Logger & CSV Export
  // ==========================================================================

  function logTrial(mode, v0, theta, g, tHit, finalX, finalY, result) {
    const trial = {
      id: state.trials.length + 1,
      mode: mode,
      v0: v0.toFixed(1),
      theta: theta.toFixed(1),
      g: g.toFixed(2),
      tHit: tHit.toFixed(2),
      finalX: finalX.toFixed(1),
      finalY: finalY.toFixed(1),
      result: result
    };
    state.trials.push(trial);
    updateTrialTable();
  }

  function updateTrialTable() {
    const tbody = document.getElementById("trialLogBody");
    if (!tbody) return;

    if (state.trials.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="9">No recorded trials yet. Fire a projectile to log data!</td></tr>';
      return;
    }

    tbody.innerHTML = state.trials.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${t.mode}</td>
        <td>${t.v0}</td>
        <td>${t.theta}°</td>
        <td>${t.g}</td>
        <td>${t.tHit}</td>
        <td>${t.finalX}</td>
        <td>${t.finalY}</td>
        <td class="${t.result.includes('HIT') || t.result.includes('CAUGHT') || t.result.includes('CLEARED') ? 'badge-hit' : 'badge-miss'}">${t.result}</td>
      </tr>
    `).join("");
  }

  function exportCSV() {
    if (state.trials.length === 0) {
      alert("No trial data to export yet. Please fire a few shots first!");
      return;
    }
    const headers = ["Trial", "Mode", "v0 (m/s)", "Angle (deg)", "g (m/s2)", "Flight Time (s)", "Final x (m)", "Final y (m)", "Result"];
    const rows = state.trials.map(t => [t.id, t.mode, t.v0, t.theta, t.g, t.tHit, t.finalX, t.finalY, `"${t.result}"`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "projectile_motion_trials.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==========================================================================
  // Student Prediction Challenge
  // ==========================================================================

  function setupChallenge() {
    const btnCheck = document.getElementById("btnCheckChallenge");
    const feedback = document.getElementById("challengeFeedback");
    const btnNew = document.getElementById("btnNewChallenge");

    btnCheck.addEventListener("click", () => {
      const selected = document.querySelector('input[name="monkeyPred"]:checked');
      if (!selected) return;

      if (selected.value === "direct") {
        feedback.className = "challenge-feedback correct";
        feedback.innerHTML = "<strong>✅ Correct!</strong> Because gravity accelerates both the projectile and the falling target downwards at identical rates ($a_y = -g$), both drop the exact same distance $\\frac{1}{2}gt^2$ from the line of sight. Aiming directly at the monkey guarantees a hit!";
      } else {
        feedback.className = "challenge-feedback incorrect";
        feedback.innerHTML = "<strong>❌ Incorrect:</strong> If you aim above or below, the projectile will miss. Because both start falling under gravity simultaneously, aiming directly at the monkey ensures their vertical drops cancel out!";
      }
    });

    btnNew.addEventListener("click", () => {
      feedback.className = "challenge-feedback";
      feedback.style.display = "none";
      const speeds = [18.0, 22.0, 26.0, 30.0, 35.0];
      const randomSpeed = speeds[Math.floor(Math.random() * speeds.length)];
      state.monkey.v0 = randomSpeed;
      document.getElementById("monkeyV0").value = randomSpeed;
      document.getElementById("monkeyV0Val").textContent = randomSpeed.toFixed(1) + " m/s";
      document.getElementById("challengePrompt").textContent = `Can you hit the monkey when launch speed is set to ${randomSpeed.toFixed(1)} m/s? Predict where to aim:`;
      resetSimulation();
    });
  }

  // ==========================================================================
  // Event Bindings & Initialization
  // ==========================================================================

  function initUIBindings() {
    // Mode Switcher
    modeTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        modeTabs.forEach(t => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");

        const targetMode = tab.dataset.mode;
        state.mode = targetMode;

        // Update mode panels
        Object.keys(modePanels).forEach(mKey => {
          if (mKey === targetMode) {
            modePanels[mKey].classList.add("active");
          } else {
            modePanels[mKey].classList.remove("active");
          }
        });

        // Update Title & Badge
        const titleMap = {
          monkey: "Feed the Monkey Controls",
          "mark-rober": "Mark Rober Dartboard Controls",
          classroom: "Classroom Notes & Obstacle Controls",
          sandbox: "Free Sandbox Controls"
        };
        const badgeMap = {
          monkey: "Mode: Feed the Monkey",
          "mark-rober": "Mode: Mark Rober Dartboard",
          classroom: "Mode: Classroom Notes",
          sandbox: "Mode: Free Sandbox"
        };
        document.getElementById("controlsTitle").textContent = titleMap[targetMode];
        modeBadge.textContent = badgeMap[targetMode];

        resetSimulation();
      });
    });

    // Playback Buttons
    btnFire.addEventListener("click", fireSimulation);
    btnPause.addEventListener("click", () => {
      if (state.isRunning) {
        if (state.isPaused) resumeSimulation();
        else pauseSimulation();
      }
    });
    btnStep.addEventListener("click", stepForward);
    btnReset.addEventListener("click", resetSimulation);
    speedSelect.addEventListener("change", (e) => {
      state.playbackSpeed = parseFloat(e.target.value);
    });

    // Toggles
    toggleTargetLine.addEventListener("click", () => {
      state.showTargetLine = !state.showTargetLine;
      toggleTargetLine.classList.toggle("active", state.showTargetLine);
      render();
    });
    toggleStrobes.addEventListener("click", () => {
      state.showStrobes = !state.showStrobes;
      toggleStrobes.classList.toggle("active", state.showStrobes);
      render();
    });
    toggleVectors.addEventListener("click", () => {
      state.showVectors = !state.showVectors;
      toggleVectors.classList.toggle("active", state.showVectors);
      render();
    });
    toggleGrid.addEventListener("click", () => {
      state.showGrid = !state.showGrid;
      toggleGrid.classList.toggle("active", state.showGrid);
      render();
    });
    toggleZeroG.addEventListener("click", () => {
      state.showZeroG = !state.showZeroG;
      toggleZeroG.classList.toggle("active", state.showZeroG);
      refreshCurrentPhysics();
      render();
    });
    toggleAudio.addEventListener("click", () => {
      sfx.enabled = !sfx.enabled;
      toggleAudio.classList.toggle("active", sfx.enabled);
      toggleAudio.textContent = sfx.enabled ? "🔊" : "🔇";
    });

    // Feed the Monkey Sliders
    const bindSlider = (id, valId, obj, key, unit, decimals = 1) => {
      const slider = document.getElementById(id);
      const display = document.getElementById(valId);
      if (!slider) return;
      slider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        obj[key] = val;
        if (display) display.textContent = `${val.toFixed(decimals)} ${unit}`;
        resetSimulation();
      });
    };

    bindSlider("monkeyV0", "monkeyV0Val", state.monkey, "v0", "m/s");
    bindSlider("monkeyAngle", "monkeyAngleVal", state.monkey, "thetaDeg", "°");
    bindSlider("monkeyDist", "monkeyDistVal", state.monkey, "xm", "m", 1);
    bindSlider("monkeyHeight", "monkeyHeightVal", state.monkey, "ym", "m", 1);
    bindSlider("cannonHeight", "cannonHeightVal", state.monkey, "y0", "m", 1);

    const simGravity = document.getElementById("simGravity");
    simGravity.addEventListener("change", (e) => {
      state.monkey.g = parseFloat(e.target.value);
      resetSimulation();
    });

    // Auto-Aim Monkey
    document.getElementById("btnAutoAimMonkey").addEventListener("click", () => {
      const m = state.monkey;
      const directDeg = Math.atan2(m.ym - m.y0, m.xm - m.x0) * (180 / Math.PI);
      m.thetaDeg = parseFloat(directDeg.toFixed(1));
      document.getElementById("monkeyAngle").value = m.thetaDeg;
      document.getElementById("monkeyAngleVal").textContent = m.thetaDeg.toFixed(1) + "°";
      resetSimulation();
    });

    // Mark Rober Sliders
    bindSlider("roberV0", "roberV0Val", state.markRober, "v0", "m/s");
    bindSlider("roberAngle", "roberAngleVal", state.markRober, "alphaDeg", "°");
    bindSlider("roberBoardX", "roberBoardXVal", state.markRober, "xBoard", "m");
    bindSlider("roberCeiling", "roberCeilingVal", state.markRober, "ceilingY", "m");
    bindSlider("roberReleaseY", "roberReleaseYVal", state.markRober, "y0", "m");

    const roberGravity = document.getElementById("roberGravity");
    roberGravity.addEventListener("change", (e) => {
      state.markRober.g = parseFloat(e.target.value);
      resetSimulation();
    });

    document.getElementById("btnPresetMarkWorksheet").addEventListener("click", () => {
      state.markRober.v0 = 15.0;
      state.markRober.alphaDeg = 40.0;
      state.markRober.xBoard = 5.0;
      state.markRober.y0 = 1.8;
      state.markRober.ceilingY = 7.0;
      state.markRober.g = 10.0;

      document.getElementById("roberV0").value = 15.0;
      document.getElementById("roberV0Val").textContent = "15.0 m/s";
      document.getElementById("roberAngle").value = 40.0;
      document.getElementById("roberAngleVal").textContent = "40.0°";
      document.getElementById("roberBoardX").value = 5.0;
      document.getElementById("roberBoardXVal").textContent = "5.0 m";
      document.getElementById("roberCeiling").value = 7.0;
      document.getElementById("roberCeilingVal").textContent = "7.0 m";
      document.getElementById("roberReleaseY").value = 1.8;
      document.getElementById("roberReleaseYVal").textContent = "1.8 m";
      roberGravity.value = "10.00";
      resetSimulation();
    });

    // Classroom Sliders
    bindSlider("classV0", "classV0Val", state.classroom, "v0", "m/s", 0);
    bindSlider("classAngle", "classAngleVal", state.classroom, "thetaDeg", "°", 0);
    bindSlider("classCliffH", "classCliffHVal", state.classroom, "y0", "m", 0);
    bindSlider("classBldgH", "classBldgHVal", state.classroom, "bldgHeight", "m", 0);
    bindSlider("classBldgX1", "classBldgX1Val", state.classroom, "x1", "m", 0);
    bindSlider("classBldgW", "classBldgWVal", state.classroom, "bldgWidth", "m", 0);

    // Preset Cliff
    const btnPresetCliff = document.getElementById("btnPresetCliff");
    const btnPresetShark = document.getElementById("btnPresetShark");

    btnPresetCliff.addEventListener("click", () => {
      btnPresetCliff.classList.add("active");
      btnPresetShark.classList.remove("active");
      state.classroom.y0 = 320;
      state.classroom.v0 = 42.0;
      state.classroom.thetaDeg = 30.0;
      state.classroom.x1 = 230;
      state.classroom.x2 = 310;
      state.classroom.bldgHeight = 70;
      state.classroom.g = 10.0;

      document.getElementById("classCliffH").value = 320;
      document.getElementById("classCliffHVal").textContent = "320 m";
      document.getElementById("classV0").value = 42;
      document.getElementById("classV0Val").textContent = "42.0 m/s";
      document.getElementById("classAngle").value = 30;
      document.getElementById("classAngleVal").textContent = "30.0°";
      document.getElementById("classBldgH").value = 70;
      document.getElementById("classBldgHVal").textContent = "70 m";
      document.getElementById("classBldgX1").value = 230;
      document.getElementById("classBldgX1Val").textContent = "230 m";
      resetSimulation();
    });

    btnPresetShark.addEventListener("click", () => {
      btnPresetShark.classList.add("active");
      btnPresetCliff.classList.remove("active");
      state.classroom.y0 = 0.9;
      state.classroom.v0 = 42.7;
      state.classroom.thetaDeg = 0.0;
      state.classroom.x1 = 18.0;
      state.classroom.x2 = 19.0;
      state.classroom.bldgHeight = 0.2;
      state.classroom.g = 9.8;

      document.getElementById("classCliffH").value = 1;
      document.getElementById("classCliffHVal").textContent = "0.9 m";
      document.getElementById("classV0").value = 43;
      document.getElementById("classV0Val").textContent = "42.7 m/s";
      document.getElementById("classAngle").value = 0;
      document.getElementById("classAngleVal").textContent = "0.0°";
      document.getElementById("classBldgH").value = 1;
      document.getElementById("classBldgHVal").textContent = "0.2 m";
      document.getElementById("classBldgX1").value = 18;
      document.getElementById("classBldgX1Val").textContent = "18 m";
      resetSimulation();
    });

    // Sandbox Sliders
    bindSlider("sbV0", "sbV0Val", state.sandbox, "v0", "m/s");
    bindSlider("sbAngle", "sbAngleVal", state.sandbox, "thetaDeg", "°");
    bindSlider("sbY0", "sbY0Val", state.sandbox, "y0", "m", 0);
    bindSlider("sbGravity", "sbGravityVal", state.sandbox, "g", "m/s²");

    // Clear and Export Log
    document.getElementById("btnClearLog").addEventListener("click", () => {
      state.trials = [];
      updateTrialTable();
    });
    document.getElementById("btnExportCsv").addEventListener("click", exportCSV);

    // Reset Defaults
    document.getElementById("btnPresetDefault").addEventListener("click", () => {
      if (state.mode === "monkey") {
        state.monkey.v0 = 26.0;
        state.monkey.thetaDeg = 32.6;
        state.monkey.xm = 25.0;
        state.monkey.ym = 16.0;
        state.monkey.y0 = 0.0;
        state.monkey.g = 9.80;
        document.getElementById("monkeyV0").value = 26.0;
        document.getElementById("monkeyV0Val").textContent = "26.0 m/s";
        document.getElementById("monkeyAngle").value = 32.6;
        document.getElementById("monkeyAngleVal").textContent = "32.6°";
        document.getElementById("monkeyDist").value = 25.0;
        document.getElementById("monkeyDistVal").textContent = "25.0 m";
        document.getElementById("monkeyHeight").value = 16.0;
        document.getElementById("monkeyHeightVal").textContent = "16.0 m";
        document.getElementById("cannonHeight").value = 0.0;
        document.getElementById("cannonHeightVal").textContent = "0.0 m";
        simGravity.value = "9.80";
      }
      resetSimulation();
    });

    setupCanvasDragInteraction();
    setupChallenge();
  }

  // Initialization
  function init() {
    initUIBindings();
    resizeCanvas();
    resetSimulation();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
