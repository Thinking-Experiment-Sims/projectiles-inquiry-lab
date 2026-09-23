/**
 * projectilesApp.js
 * 
 * Interactive controller and canvas renderer for The Thinking Experiment:
 * Projectiles: Target Intercept & Kinematics Studio.
 * 
 * Design System Compliance:
 * - Primary Teal: #0f7e9b
 * - Accent Amber: #d67b19
 * - Pure White & Surface: #ffffff, rgba(255, 255, 255, 0.96)
 * - Strict prohibition: Zero purple or gold.
 */

(function () {
  "use strict";

  // DOM Elements
  const canvas = document.getElementById("simCanvas");
  const ctx = canvas.getContext("2d");
  const canvasViewport = document.getElementById("canvasViewport");

  // Playback Buttons
  const btnFire = document.getElementById("btnFire");
  const btnFireText = document.getElementById("btnFireText");
  const btnPause = document.getElementById("btnPause");
  const btnStep = document.getElementById("btnStep");
  const btnReset = document.getElementById("btnReset");
  const btnQuickModeAction = document.getElementById("btnQuickModeAction");
  const speedPills = document.querySelectorAll(".speed-pill");

  // Toggles
  const toggleTargetLine = document.getElementById("toggleTargetLine");
  const toggleStrobes = document.getElementById("toggleStrobes");
  const toggleVectors = document.getElementById("toggleVectors");
  const toggleGrid = document.getElementById("toggleGrid");
  const toggleZeroG = document.getElementById("toggleZeroG");
  const toggleAudio = document.getElementById("toggleAudio");
  const btnAutoFitZoom = document.getElementById("btnAutoFitZoom");

  // Guide Drawer
  const btnToggleGuide = document.getElementById("btnToggleGuide");
  const btnCloseGuide = document.getElementById("btnCloseGuide");
  const activityGuide = document.getElementById("activityGuide");

  // Status Banner
  const lockBanner = document.getElementById("lockBanner");
  const lockBannerBadge = document.getElementById("lockBannerBadge");
  const lockBannerText = document.getElementById("lockBannerText");
  const lockBannerSub = document.getElementById("lockBannerSub");

  // Telemetry Console
  const teleTime = document.getElementById("teleTime");
  const telePos = document.getElementById("telePos");
  const teleVel = document.getElementById("teleVel");
  const teleSpeed = document.getElementById("teleSpeed");
  const teleTargetY = document.getElementById("teleTargetY");
  const teleDrop = document.getElementById("teleDrop");

  // Mode Nav Pills
  const modePillBtns = document.querySelectorAll(".mode-pill-btn");
  const modeControlPanels = {
    monkey: document.getElementById("controls-monkey"),
    "mark-rober": document.getElementById("controls-mark-rober"),
    classroom: document.getElementById("controls-classroom"),
    sandbox: document.getElementById("controls-sandbox")
  };

  // Subtabs in Right Column
  const tabPills = document.querySelectorAll(".tab-pill");
  const subtabContents = {
    controls: document.getElementById("subtab-controls"),
    math: document.getElementById("subtab-math"),
    tchart: document.getElementById("subtab-tchart"),
    logger: document.getElementById("subtab-logger")
  };

  // Preset Pills Container
  const presetPillsContainer = document.getElementById("presetPillsContainer");

  // Sound Engine
  class SoundFX {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
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
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
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
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08);
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
    mode: "monkey",
    isRunning: false,
    isPaused: false,
    hasEnded: false,
    simTime: 0,
    playbackSpeed: 1.0,

    // Toggles
    showTargetLine: true,
    showStrobes: true,
    showVectors: true,
    showGrid: false,
    showZeroG: false,

    // Mode 1: Monkey
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

    // Mode 2: Mark Rober
    markRober: {
      x0: 0,
      y0: 1.8,
      v0: 15.0,
      alphaDeg: 40.0,
      xBoard: 5.0,
      boardY: 1.8,
      ceilingY: 7.0,
      g: 10.0,
      dartPos: { x: 0, y: 1.8 },
      hitResult: null
    },

    // Mode 3: Classroom & Packet 6 Problems
    classroom: {
      problemType: "cliff-building", // "cliff-building", "tennis", "soccer", "box-drop", "cliff-100m"
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

    // Mode 4: Sandbox
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

    trials: []
  };

  let currentTrajectory = [];
  let currentStrobes = [];
  let currentZeroGTrajectory = [];

  // ==========================================================================
  // Math Renderer Helper (KaTeX + Pure Typographic HTML Fallback)
  // ==========================================================================

  function renderMathBlock(container, latexString, htmlFallback) {
    if (!container) return;
    if (window.katex && typeof window.katex.render === "function") {
      try {
        window.katex.render(latexString, container, {
          displayMode: true,
          throwOnError: false
        });
        return;
      } catch (e) {
        console.warn("KaTeX error, falling back to HTML:", e);
      }
    }
    container.innerHTML = htmlFallback;
  }

  // ==========================================================================
  // Viewport & Coordinate Transforms
  // ==========================================================================

  function resizeCanvas() {
    const rect = canvasViewport.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = rect.width;
    const displayHeight = displayWidth * (9 / 16);

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + "px";
    canvas.style.height = displayHeight + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
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
      worldXMax = Math.max(state.monkey.xm + 7, 34);
      worldYMin = -1.5;
      worldYMax = Math.max(state.monkey.ym + 5, 23);
    } else if (state.mode === "mark-rober") {
      worldXMin = -1.5;
      worldXMax = Math.max(state.markRober.xBoard + 3, 9);
      worldYMin = -0.5;
      worldYMax = Math.max(state.markRober.ceilingY + 1.2, 9.2);
    } else if (state.mode === "classroom") {
      const cp = state.classroom;
      const pType = cp.problemType || "cliff-building";
      const decomp = ProjectilesPhysics.decomposeVelocity(cp.v0, cp.thetaDeg);
      const tFlight = ProjectilesPhysics.calculateTimeOfFlight(cp.y0, decomp.vy, cp.g, 0);
      const xLand = cp.x0 + decomp.vx * tFlight;
      const tApex = decomp.vy > 0 ? decomp.vy / cp.g : 0;
      const maxH = cp.y0 + decomp.vy * tApex - 0.5 * cp.g * tApex * tApex;

      const objMaxX = Math.max(cp.x0, cp.x2 || 0, xLand, 4.0);
      const objMaxY = Math.max(cp.y0, cp.bldgHeight || 0, maxH, 2.0);

      const marginX = objMaxX * 0.12;
      const marginY = objMaxY * 0.14;

      worldXMin = -Math.max(marginX, 0.4);
      worldXMax = objMaxX + Math.max(marginX, 0.8);
      worldYMin = -Math.max(marginY * 0.5, 0.3);
      worldYMax = objMaxY + Math.max(marginY, 0.5);

      // Custom tuned bounds for sports inquiry scenarios
      if (pType === "tennis") {
        worldXMin = -2.5;
        worldXMax = Math.max(32.0, xLand + 3.0);
        worldYMin = -0.5;
        worldYMax = 4.5;
      } else if (pType === "soccer") {
        worldXMin = -4.0;
        worldXMax = Math.max(54.0, xLand + 4.0);
        worldYMin = -0.8;
        worldYMax = Math.max(maxH * 1.35, 10.0);
      }
    } else if (state.mode === "sandbox") {
      const sb = state.sandbox;
      const decomp = ProjectilesPhysics.decomposeVelocity(sb.v0, sb.thetaDeg);
      const tFlight = ProjectilesPhysics.calculateTimeOfFlight(sb.y0, decomp.vy, sb.g, 0);
      const xLand = sb.x0 + decomp.vx * tFlight;
      const tApex = decomp.vy > 0 ? decomp.vy / sb.g : 0;
      const maxH = sb.y0 + decomp.vy * tApex - 0.5 * sb.g * tApex * tApex;

      const objMaxX = Math.max(sb.x0, sb.targetX || 0, xLand, 10.0);
      const objMaxY = Math.max(sb.y0, maxH, 5.0);

      const marginX = objMaxX * 0.10;
      const marginY = objMaxY * 0.14;

      worldXMin = -Math.max(marginX, 1.0);
      worldXMax = objMaxX + Math.max(marginX, 2.0);
      worldYMin = -Math.max(marginY * 0.4, 0.5);
      worldYMax = objMaxY + Math.max(marginY, 1.0);
    }

    const padding = 42;
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
  // Physics Computation
  // ==========================================================================

  function refreshCurrentPhysics() {
    if (state.mode === "monkey") {
      const m = state.monkey;
      const directAim = Math.atan2(m.ym - m.y0, m.xm - m.x0) * (180 / Math.PI);

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
        catchRadius: 0.65
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
      const isBuilding = (cp.problemType === "cliff-building");
      const trajRes = ProjectilesPhysics.generateTrajectory({
        x0: cp.x0,
        y0: cp.y0,
        v0: cp.v0,
        thetaDeg: cp.thetaDeg,
        g: cp.g,
        groundY: 0,
        obstacle: isBuilding ? { x1: cp.x1, x2: cp.x2, height: cp.bldgHeight } : null,
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
  // Simulation Loop
  // ==========================================================================

  let lastTimestamp = null;
  let animFrameId = null;

  function runSimulationLoop(timestamp) {
    if (!state.isRunning) {
      animFrameId = null;
      return;
    }

    if (!lastTimestamp) lastTimestamp = timestamp;
    const realDt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (!state.isPaused) {
      stepSimulation(realDt * state.playbackSpeed);
    }

    render();

    if (state.isRunning && !state.isPaused) {
      animFrameId = requestAnimationFrame(runSimulationLoop);
    } else {
      animFrameId = null;
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
      m.monkeyY = Math.max(0, m.ym - 0.5 * m.g * t * t);

      const tHit = m.hitResult.tIntercept;
      if (t >= tHit && !state.hasEnded) {
        state.hasEnded = true;
        if (m.hitResult.isHit) {
          m.isCaught = true;
          sfx.playHit();
          setBanner("hit", "INTERCEPT HIT", `🎉 Monkey caught the banana at t = ${tHit.toFixed(2)}s, elevation = ${m.hitResult.yMonkeyAtTime.toFixed(2)}m!`);
          logTrial("Feed the Monkey", m.v0, m.thetaDeg, tHit, m.xm, m.hitResult.yMonkeyAtTime, "CAUGHT");
        } else {
          sfx.playMiss();
          const dev = m.hitResult.verticalDeviation.toFixed(2);
          const dir = m.bananaPos.y > m.monkeyY ? "above" : "below";
          setBanner("miss", "MISSED TARGET", `Banana passed ${dev}m ${dir} the falling monkey.`);
          logTrial("Feed the Monkey", m.v0, m.thetaDeg, tHit, m.bananaPos.x, m.bananaPos.y, `MISS (${dir})`);
        }
        pauseSimulation();
      } else if (pos.y <= 0 && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playMiss();
        setBanner("miss", "GROUND IMPACT", `Banana struck the ground before reaching monkey.`);
        logTrial("Feed the Monkey", m.v0, m.thetaDeg, t, pos.x, 0, "GROUND HIT");
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

      const targetH = mr.hitResult.targetHeightH;
      const tBoard = mr.hitResult.tBoard;
      const progress = Math.min(1, t / tBoard);
      mr.boardY = mr.y0 + (targetH - mr.y0) * progress;

      if (mr.hitResult.hitsCeiling && t >= mr.hitResult.tCeiling && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playMiss();
        setBanner("miss", "CEILING HIT", `💥 Dart collided with workshop ceiling at x = ${mr.hitResult.xCeiling.toFixed(1)}m!`);
        logTrial("Mark Rober", mr.v0, mr.alphaDeg, mr.hitResult.tCeiling, mr.hitResult.xCeiling, mr.ceilingY, "CEILING HIT");
        pauseSimulation();
      } else if (t >= tBoard && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playHit();
        setBanner("hit", "BULLSEYE HIT", `🎯 Perfect Bullseye! Dartboard caught dart at height H = ${targetH.toFixed(2)}m (t = ${tBoard.toFixed(2)}s)!`);
        logTrial("Mark Rober", mr.v0, mr.alphaDeg, tBoard, mr.xBoard, targetH, "BULLSEYE");
        pauseSimulation();
      }

    } else if (state.mode === "classroom") {
      const cp = state.classroom;
      const pType = cp.problemType || "cliff-building";
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

      // For cliff-building: check building collision first, then clearing the far edge
      if (pType === "cliff-building") {
        if (hit.collisionType !== "none" && t >= hit.collisionT && !state.hasEnded) {
          state.hasEnded = true;
          sfx.playMiss();
          setBanner("miss", "BUILDING COLLISION", `Crashed into building ${hit.collisionType === "roof" ? "roof" : "front wall"} at x = ${hit.collisionX.toFixed(1)}m!`);
          logTrial("Classroom", cp.v0, cp.thetaDeg, hit.collisionT, hit.collisionX, hit.collisionY, "BUILDING HIT");
          pauseSimulation();
        } else if (pos.x >= cp.x2 && !state.hasEnded) {
          state.hasEnded = true;
          sfx.playHit();
          setBanner("hit", "CLEARED BUILDING", `Cleared Building! Height at far edge was ${hit.y2.toFixed(1)}m (cleared ${cp.bldgHeight}m roof by ${(hit.y2 - cp.bldgHeight).toFixed(1)}m)!`);
          logTrial("Classroom", cp.v0, cp.thetaDeg, t, pos.x, pos.y, "CLEARED");
          pauseSimulation();
        } else if (pos.y <= 0 && !state.hasEnded) {
          state.hasEnded = true;
          sfx.playMiss();
          setBanner("miss", "GROUND IMPACT", `Landed on ground at x = ${pos.x.toFixed(1)}m.`);
          logTrial("Classroom", cp.v0, cp.thetaDeg, t, pos.x, 0, "GROUND HIT");
          pauseSimulation();
        }

      } else if (pType === "tennis") {
        const netX = 12.0;
        const netH = 0.92;
        const serviceLine = 18.4;
        const decomp2 = ProjectilesPhysics.decomposeVelocity(cp.v0, cp.thetaDeg);
        const tNet = decomp2.vx > 0 ? (netX - cp.x0) / decomp2.vx : 9999;
        const yAtNet = cp.y0 + decomp2.vy * tNet - 0.5 * cp.g * tNet * tNet;

        // Phase 1: Pedagogical pause when reaching net at x = 12.0m
        if (!state.hasEnded && !cp._hasReachedNet && t >= tNet) {
          cp._hasReachedNet = true;
          state.simTime = tNet;
          cp.projPos = { x: netX, y: Math.max(0, yAtNet) };
          const vel = ProjectilesPhysics.getVelocityAtTime({ vx: decomp2.vx, vy: decomp2.vy, g: cp.g, t: tNet });

          if (yAtNet <= netH) {
            state.hasEnded = true;
            sfx.playMiss();
            setBanner("miss", "FAULT (NET)", `Ball struck net at x = 12.0m (height y = ${Math.max(0, yAtNet).toFixed(2)}m ≤ 0.92m). Impact velocity = ${vel.speed.toFixed(1)} m/s.`);
            logTrial("Classroom", cp.v0, cp.thetaDeg, tNet, netX, yAtNet, "NET HIT");
            pauseSimulation();
            updateTelemetryHUD();
            return;
          } else {
            // Cleared net! Pause so students and teacher can examine clearance
            sfx.playHit();
            const marginStr = (yAtNet - netH).toFixed(2);
            setBanner("hit", "NET TRANSIT (x = 12.0m)", `🎾 Ball cleared net! Height y = ${yAtNet.toFixed(2)}m (+${marginStr}m margin over 0.92m net). Click "Resume" to watch court landing.`);
            pauseSimulation();
            updateTelemetryHUD();
            return;
          }
        }

        // Phase 2: Ground landing on tennis court
        const disc2 = decomp2.vy * decomp2.vy + 2 * cp.g * cp.y0;
        const tLand = disc2 >= 0 ? (decomp2.vy + Math.sqrt(disc2)) / cp.g : 9999;
        const xLand = cp.x0 + decomp2.vx * tLand;

        const hasPassedNet = cp._hasReachedNet || t >= tNet;
        const isTennisLanding = t >= tLand || (hasPassedNet && pos.y <= 0);

        if (!state.hasEnded && hasPassedNet && isTennisLanding) {
          state.hasEnded = true;
          state.simTime = tLand;
          cp.projPos = { x: xLand, y: 0 };
          const vel = ProjectilesPhysics.getVelocityAtTime({ vx: decomp2.vx, vy: decomp2.vy, g: cp.g, t: tLand });

          if (xLand > serviceLine) {
            sfx.playMiss();
            const pastLine = (xLand - serviceLine).toFixed(1);
            setBanner("miss", "FAULT (LONG)", `Ball lands long at x = ${xLand.toFixed(1)}m (+${pastLine}m past 18.4m service line)! Final impact velocity = ${vel.speed.toFixed(1)} m/s.`);
            logTrial("Classroom", cp.v0, cp.thetaDeg, tLand, xLand, 0, "FAULT LONG");
          } else if (xLand > netX) {
            sfx.playHit();
            setBanner("hit", "GOOD SERVE!", `Perfect serve! Lands in service court at x = ${xLand.toFixed(1)}m (≤ 18.4m). Final impact velocity = ${vel.speed.toFixed(1)} m/s.`);
            logTrial("Classroom", cp.v0, cp.thetaDeg, tLand, xLand, 0, "GOOD SERVE");
          } else {
            sfx.playMiss();
            setBanner("miss", "FAULT (SHORT)", `Landed short of net at x = ${xLand.toFixed(1)}m.`);
            logTrial("Classroom", cp.v0, cp.thetaDeg, tLand, xLand, 0, "SHORT");
          }
          pauseSimulation();
          updateTelemetryHUD();
          return;
        }

      } else if (pType === "soccer") {
        const wallX = 9.15;
        const wallH = 2.00;
        const goalX = 49.0;
        const decomp3 = ProjectilesPhysics.decomposeVelocity(cp.v0, cp.thetaDeg);
        const tWall = decomp3.vx > 0 ? (wallX - cp.x0) / decomp3.vx : 9999;
        const yAtWall = cp.y0 + decomp3.vy * tWall - 0.5 * cp.g * tWall * tWall;

        // Phase 1: Pedagogical pause when reaching defensive wall at x = 9.15m
        if (!state.hasEnded && !cp._hasReachedWall && t >= tWall) {
          cp._hasReachedWall = true;
          state.simTime = tWall;
          cp.projPos = { x: wallX, y: Math.max(0, yAtWall) };
          const vel = ProjectilesPhysics.getVelocityAtTime({ vx: decomp3.vx, vy: decomp3.vy, g: cp.g, t: tWall });

          if (yAtWall <= wallH) {
            state.hasEnded = true;
            sfx.playMiss();
            setBanner("miss", "WALL BLOCKED", `Kick blocked by 2.0m defensive wall at x = 9.15m (height y = ${Math.max(0, yAtWall).toFixed(2)}m). Impact velocity = ${vel.speed.toFixed(1)} m/s.`);
            logTrial("Classroom", cp.v0, cp.thetaDeg, tWall, wallX, yAtWall, "WALL BLOCKED");
            pauseSimulation();
            updateTelemetryHUD();
            return;
          } else {
            // Cleared wall! Pause so students and teacher can examine wall clearance
            sfx.playHit();
            const wallMargin = (yAtWall - wallH).toFixed(2);
            setBanner("hit", "WALL CLEARED (x = 9.15m)", `⚽ Ball cleared 2.0m defensive wall at height y = ${yAtWall.toFixed(2)}m (+${wallMargin}m margin)! Click "Resume" to watch flight to goal.`);
            pauseSimulation();
            updateTelemetryHUD();
            return;
          }
        }

        // Phase 2: Ground landing / Goal line arrival
        const disc3 = decomp3.vy * decomp3.vy + 2 * cp.g * cp.y0;
        const tGround = disc3 >= 0 ? (decomp3.vy + Math.sqrt(disc3)) / cp.g : 9999;
        const xGround = cp.x0 + decomp3.vx * tGround;

        const tApex = decomp3.vy > 0 ? decomp3.vy / cp.g : 0;
        const hasPassedWall = cp._hasReachedWall || t >= tWall;
        const isSoccerLanding = t >= tGround || (hasPassedWall && t >= tApex && pos.y <= 0);

        if (!state.hasEnded && hasPassedWall && isSoccerLanding) {
          state.hasEnded = true;
          state.simTime = tGround;
          cp.projPos = { x: xGround, y: 0 };
          const vel = ProjectilesPhysics.getVelocityAtTime({ vx: decomp3.vx, vy: decomp3.vy, g: cp.g, t: tGround });

          if (xGround >= goalX - 1.0) {
            // In Problem 48: range R = 48.98m ≈ 49.0m, lands right on goal line!
            sfx.playHit();
            setBanner("hit", "PITCH LANDING / GOAL! ⚽", `Ball lands at goal line (x = ${xGround.toFixed(1)}m) after t = ${tGround.toFixed(2)}s flight! Final impact velocity = ${vel.speed.toFixed(1)} m/s.`);
            logTrial("Classroom", cp.v0, cp.thetaDeg, tGround, xGround, 0, "GOAL HIT");
          } else {
            sfx.playMiss();
            setBanner("miss", "PITCH IMPACT", `Ball landed on pitch at x = ${xGround.toFixed(1)}m short of goal. Final impact velocity = ${vel.speed.toFixed(1)} m/s.`);
            logTrial("Classroom", cp.v0, cp.thetaDeg, tGround, xGround, 0, "PITCH HIT");
          }
          pauseSimulation();
          updateTelemetryHUD();
          return;
        }

      } else {
        // box-drop, cliff-100m, and anything else: just stop at ground
        if (pos.y <= 0 && !state.hasEnded) {
          state.hasEnded = true;
          sfx.playHit();
          setBanner("hit", "GROUND IMPACT", `Landed on ground at x = ${pos.x.toFixed(1)}m.`);
          logTrial("Classroom", cp.v0, cp.thetaDeg, t, pos.x, 0, "LANDED");
          pauseSimulation();
        }
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
        sfx.playHit();
        setBanner("ready", "FLIGHT COMPLETE", `Landed at x = ${pos.x.toFixed(1)}m, flight time = ${t.toFixed(2)}s.`);
        logTrial("Sandbox", sb.v0, sb.thetaDeg, t, pos.x, 0, "LANDED");
        pauseSimulation();
      }
    }

    updateTelemetryHUD();
  }

  function fireSimulation() {
    if (state.isRunning && state.isPaused && !state.hasEnded) {
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
    setBanner("running", "IN FLIGHT", "Projectile is in motion. Tracking telemetry...");
    sfx.playLaunch();
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
    }
    animFrameId = requestAnimationFrame(runSimulationLoop);
  }

  function pauseSimulation() {
    state.isPaused = true;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    btnPause.innerHTML = '<span>▶</span> Resume';
    btnFire.disabled = false;
    btnFireText.textContent = "Relaunch";
  }

  function resumeSimulation() {
    if (!state.isRunning || state.hasEnded) return;
    state.isPaused = false;
    btnPause.innerHTML = '<span>❚❚</span> Pause';
    lastTimestamp = null;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
    }
    animFrameId = requestAnimationFrame(runSimulationLoop);
  }

  function stepForward() {
    if (!state.isRunning) {
      state.isRunning = true;
      state.isPaused = true;
      btnPause.disabled = false;
      btnPause.innerHTML = '<span>▶</span> Resume';
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
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    btnFire.disabled = false;
    btnPause.disabled = true;
    btnPause.innerHTML = '<span>❚❚</span> Pause';
    const cp = state.classroom;
    const pType = (cp && cp.problemType) || "cliff-building";
    if (state.mode === "mark-rober") {
      btnFireText.textContent = "Throw Dart";
    } else if (state.mode === "classroom") {
      if (pType === "tennis") btnFireText.textContent = "Serve";
      else if (pType === "soccer") btnFireText.textContent = "Kick";
      else btnFireText.textContent = "Launch";
    } else {
      btnFireText.textContent = "Launch";
    }

    if (state.mode === "monkey") {
      state.monkey.bananaPos = { x: state.monkey.x0, y: state.monkey.y0 };
      state.monkey.monkeyY = state.monkey.ym;
      state.monkey.isCaught = false;
      setBanner("ready", "FEED THE MONKEY", "Aim directly along line of sight. Both will drop by ½gt²!");
    } else if (state.mode === "mark-rober") {
      state.markRober.dartPos = { x: state.markRober.x0, y: state.markRober.y0 };
      state.markRober.boardY = state.markRober.y0;
      setBanner("ready", "MARK ROBER DARTBOARD", "Release dart to see motorized board slide along vertical track to intercept!");
    } else if (state.mode === "classroom") {
      state.classroom.projPos = { x: state.classroom.x0, y: state.classroom.y0 };
      state.classroom._hasReachedWall = false;
      state.classroom._hasReachedNet = false;
      state.classroom._pausedAtNet = false;
      const pType = state.classroom.problemType || "cliff-building";
      if (pType === "tennis") {
        setBanner("ready", "PROBLEM 49: TENNIS FLAT SERVE", "Horizontal serve from 2.5m at 40 m/s. Check net clearance & service line boundary!");
      } else if (pType === "soccer") {
        setBanner("ready", "PROBLEM 48: SOCCER FREE KICK", "Angled kick (vx = 20 m/s, vy = 12 m/s). Test defensive wall clearance & pitch landing!");
      } else if (pType === "box-drop") {
        setBanner("ready", "PROBLEM 46: TABLETOP ROLL-OFF", "Horizontal roll-off from 2.0m table at 5 m/s. Compare fall time & landing distance!");
      } else if (pType === "cliff-100m") {
        setBanner("ready", "PROBLEM 47: 100M CLIFF LAUNCH", "100m elevated cliff launch. Test motion independence & hit 300m target!");
      } else {
        setBanner("ready", "LECTURE NOTES: CLIFF & BUILDING", "Launch from 320m cliff over 70m building. Watch horizontal & vertical kinematics!");
      }
    } else if (state.mode === "sandbox") {
      state.sandbox.projPos = { x: state.sandbox.x0, y: state.sandbox.y0 };
      setBanner("ready", "FREE SANDBOX", "Adjust velocity, launch angle, and platform height freely.");
    }

    refreshCurrentPhysics();
    updateTelemetryHUD();
    render();
  }

  function setBanner(type, badgeText, message) {
    lockBanner.className = `lock-banner ${type}`;
    lockBannerBadge.textContent = badgeText;
    lockBannerText.textContent = message;
    lockBannerSub.textContent = type.toUpperCase();
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
      teleTargetY.textContent = state.monkey.monkeyY.toFixed(1) + " m";
      teleDrop.textContent = (0.5 * g * t * t).toFixed(2) + " m";
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
      teleTargetY.textContent = state.classroom.bldgHeight.toFixed(0) + " m";
      teleDrop.textContent = (0.5 * g * t * t).toFixed(1) + " m";
    } else {
      pos = state.sandbox.projPos;
      v0 = state.sandbox.v0;
      thetaDeg = state.sandbox.thetaDeg;
      g = state.sandbox.g;
      teleTargetY.textContent = "0.0 m";
      teleDrop.textContent = (0.5 * g * t * t).toFixed(2) + " m";
    }

    telePos.textContent = `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) m`;

    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const vel = ProjectilesPhysics.getVelocityAtTime({
      vx: decomp.vx,
      vy: decomp.vy,
      g: g,
      t: t
    });

    teleVel.textContent = `(${vel.vx.toFixed(1)}, ${vel.vy.toFixed(1)}) m/s`;
    teleSpeed.textContent = vel.speed.toFixed(1) + " m/s";

    // Update live evaluation values in Cornell T-Chart
    const tcSubX = document.getElementById("tcSubX");
    const tcSubVy = document.getElementById("tcSubVy");
    const tcSubY = document.getElementById("tcSubY");
    if (tcSubX) tcSubX.textContent = `x = ${pos.x.toFixed(1)} m`;
    if (tcSubVy) tcSubVy.textContent = `vᵧ = ${vel.vy.toFixed(1)} m/s`;
    if (tcSubY) tcSubY.textContent = `y = ${pos.y.toFixed(1)} m`;
  }

  // ==========================================================================
  // Beautiful Math Solution Card (Fixed KaTeX + Clean Stacked Fractions)
  // ==========================================================================

  // ==========================================================================
  // KaTeX Vector Typesetting & Collapsible Step Card Builders
  // ==========================================================================

  function katex(latex, display = false) {
    if (window.katex && typeof window.katex.renderToString === "function") {
      try {
        return window.katex.renderToString(latex, { displayMode: display, throwOnError: false });
      } catch (e) {
        return latex;
      }
    }
    return latex;
  }

  function buildStepCard(stepNum, title, badge, desc, rows, isAccent = false, isAccentDark = false) {
    const accentClass = isAccent ? " accent-amber" : (isAccentDark ? " accent-dark" : "");
    const rowHtml = rows.map(r => `
      <div class="math-step-row">
        ${r.label ? `<span class="math-step-label">${r.label}</span>` : ""}
        <div class="math-step-math">${r.math}</div>
      </div>
    `).join("");

    return `
      <div class="math-step-card${accentClass}">
        <div class="math-step-header" onclick="this.parentElement.classList.toggle('open')">
          <div class="math-step-title">
            <span class="step-num-badge">${stepNum}</span>
            <span>${title}</span>
            ${badge ? `<span class="lab-badge">${badge}</span>` : ""}
          </div>
          <span class="math-step-chevron">▼</span>
        </div>
        <div class="math-step-body">
          ${desc ? `<div class="math-step-desc">${desc}</div>` : ""}
          ${rowHtml}
        </div>
      </div>
    `;
  }

  function updatePedagogyCards() {
    let v0 = 26, thetaDeg = 32.6, g = 9.80, x0 = 0, y0 = 0;
    const mathContainer = document.getElementById("mathCardContent");
    if (!mathContainer) return;

    if (state.mode === "monkey") {
      v0 = state.monkey.v0;
      thetaDeg = state.monkey.thetaDeg;
      g = state.monkey.g;
      x0 = state.monkey.x0;
      y0 = state.monkey.y0;

      const m = state.monkey;
      const res = m.hitResult;
      const directDeg = res ? res.directAimAngleDeg.toFixed(1) : "32.6";
      const tInt = res ? res.tIntercept.toFixed(2) : "1.00";
      const drop = res ? res.dropDist.toFixed(2) : "4.90";
      const yCatch = res ? res.yMonkeyAtTime.toFixed(2) : "11.10";

      const step1 = buildStepCard(
        1, "Step 1: Direct Line-of-Sight Aim Geometry", "Targeting Ray",
        "Aim the cannon barrel directly along the straight sightline connecting the cannon origin to the monkey.",
        [
          {
            label: "Trigonometric Sightline Angle",
            math: katex(`\\tan(\\theta) = \\frac{y_{\\text{monkey}} - y_0}{x_{\\text{monkey}} - x_0}`)
          },
          {
            label: "Numerical Evaluation",
            math: `${katex(`\\tan(\\theta) = \\frac{${m.ym.toFixed(1)} - ${m.y0.toFixed(1)}}{${m.xm.toFixed(1)} - ${m.x0.toFixed(1)}} \\implies \\theta_{\\text{aim}} = ${directDeg}^\\circ`)} <span class="math-eval-tag">Aim: ${directDeg}°</span>`
          }
        ]
      );

      const step2 = buildStepCard(
        2, "Step 2: Time as Bridge (Horizontal Motion, aₓ = 0)", "Flight Time",
        "Horizontal velocity is constant. Solve for time to reach the monkey's x-coordinate.",
        [
          {
            label: "Horizontal Position Law",
            math: katex(`x(t) = x_0 + v_{0x} t = x_0 + v_0 \\cos(\\theta) t \\implies t_{\\text{intercept}} = \\frac{x_{\\text{monkey}} - x_0}{v_0 \\cos(\\theta)}`)
          },
          {
            label: "Time to Intercept",
            math: `${katex(`t_{\\text{intercept}} = \\frac{${(m.xm - m.x0).toFixed(1)}\\text{ m}}{(${m.v0.toFixed(1)}\\text{ m/s}) \\cos(${thetaDeg.toFixed(1)}^\\circ)} = ${tInt}\\text{ s}`)} <span class="math-eval-tag">${tInt} s</span>`
          }
        ],
        true
      );

      const step3 = buildStepCard(
        3, "Step 3: Synchronized Vertical Free-Fall Drop (aᵧ = -g)", "Equal Drop Proof",
        "Both the projectile and the monkey accelerate downward under gravity from the instant of firing.",
        [
          {
            label: "Vertical Positions from Line of Sight",
            math: katex(`y_{\\text{banana}}(t) = y_{\\text{sight}}(t) - \\frac{1}{2}gt^2, \\quad y_{\\text{monkey}}(t) = y_{m,0} - \\frac{1}{2}gt^2`)
          },
          {
            label: "Identical Drop Distance",
            math: `${katex(`\\Delta y_{\\text{drop}} = \\frac{1}{2}gt^2 = 0.5 \\cdot (${g.toFixed(1)}\\text{ m/s}^2) \\cdot (${tInt}\\text{ s})^2 = ${drop}\\text{ m}`)} <span class="math-eval-tag">${drop} m</span>`
          },
          {
            label: "Intercept Collision Altitude",
            math: `${katex(`y_{\\text{catch}} = ${m.ym.toFixed(1)} - ${drop} = ${yCatch}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--primary-teal-light); color: var(--primary-teal-dark);">Catch y = ${yCatch} m</span>`
          }
        ],
        false, true
      );

      mathContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
          <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">🐵 Feed the Monkey: First-Principles Proof</span>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
            <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
          </div>
        </div>
        ${step1}
        ${step2}
        ${step3}
        <div class="status-badge-inline ${res && res.isAimedAtMonkey ? 'safe' : 'warn'}" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
          ${res && res.isAimedAtMonkey ? `🎯 Direct Aim Confirmed (${thetaDeg.toFixed(1)}°): Banana & Monkey meet at y = ${yCatch}m for ANY launch speed!` : `⚠️ Misaligned Aim (${thetaDeg.toFixed(1)}° vs ${directDeg}°). The banana will miss the falling monkey.`}
        </div>
      `;

    } else if (state.mode === "mark-rober") {
      v0 = state.markRober.v0;
      thetaDeg = state.markRober.alphaDeg;
      g = state.markRober.g;
      x0 = state.markRober.x0;
      y0 = state.markRober.y0;

      const mr = state.markRober;
      const res = mr.hitResult;
      const tBoard = res ? res.tBoard.toFixed(3) : "0.435";
      const targetH = res ? res.targetHeightH.toFixed(2) : "5.05";
      const tApex = res ? res.tApex.toFixed(3) : "0.964";
      const hMax = res ? res.maxDartHeight.toFixed(2) : "6.45";
      const vx = res ? res.vx.toFixed(2) : "11.49";
      const vy = res ? res.vy.toFixed(2) : "9.64";

      const step1 = buildStepCard(
        1, "Step 1: Velocity Decomposition (SOH CAHTOA)", "Initial Components",
        "Decompose initial launch speed into independent horizontal and vertical velocity components.",
        [
          {
            label: "Trigonometric Decomposition",
            math: katex(`v_{0x} = v_0 \\cos(\\alpha), \\quad v_{0y} = v_0 \\sin(\\alpha)`)
          },
          {
            label: "Numerical Components",
            math: `${katex(`v_{0x} = (${mr.v0.toFixed(1)}) \\cos(${thetaDeg.toFixed(1)}^\\circ) = ${vx}\\text{ m/s}, \\quad v_{0y} = (${mr.v0.toFixed(1)}) \\sin(${thetaDeg.toFixed(1)}^\\circ) = ${vy}\\text{ m/s}`)}`
          }
        ]
      );

      const step2 = buildStepCard(
        2, "Step 2: Time to Dartboard (Horizontal Motion, aₓ = 0)", "Time to Wall",
        "Horizontal velocity is unaccelerated. Find travel time to the wall at x = 5.0 m.",
        [
          {
            label: "Horizontal Kinematic Law",
            math: katex(`x(t) = x_0 + v_{0x} t \\implies t = \\frac{x_{\\text{board}} - x_0}{v_{0x}}`)
          },
          {
            label: "Numerical Travel Time",
            math: `${katex(`t = \\frac{${mr.xBoard.toFixed(1)}\\text{ m} - ${mr.x0.toFixed(1)}\\text{ m}}{${vx}\\text{ m/s}} = ${tBoard}\\text{ s}`)} <span class="math-eval-tag">${tBoard} s</span>`
          }
        ]
      );

      const step3 = buildStepCard(
        3, "Step 3: Target Height H (Worksheet Question 1)", "Motorized Target",
        "Evaluate vertical position equation at t = t_board to determine where the target carriage must intercept the dart.",
        [
          {
            label: "Vertical Position Law",
            math: katex(`H = y(t_{\\text{board}}) = y_0 + v_{0y} t_{\\text{board}} - \\frac{1}{2}g t_{\\text{board}}^2`)
          },
          {
            label: "Numerical Substitution",
            math: `${katex(`H = ${mr.y0.toFixed(1)} + (${vy})(${tBoard}) - 0.5(${g.toFixed(1)})(${tBoard})^2 = ${targetH}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">H = ${targetH} m</span>`
          }
        ],
        true
      );

      const step4 = buildStepCard(
        4, "Step 4: Maximum Height & Ceiling Clearance (Worksheet Question 2)", "Apex Process",
        "Determine maximum peak altitude when vertical velocity momentarily drops to zero (vᵧ = 0), and verify ceiling clearance.",
        [
          {
            label: "Part A: Time to Apex (from vᵧ = 0)",
            math: `${katex(`v_y(t) = v_{0y} - g t \\implies 0 = ${vy} - (${g.toFixed(1)}) t_{\\text{apex}} \\implies t_{\\text{apex}} = \\frac{${vy}}{${g.toFixed(1)}} = ${tApex}\\text{ s}`)} <span class="math-eval-tag">${tApex} s</span>`
          },
          {
            label: "Part B: Maximum Apex Altitude",
            math: `${katex(`h_{\\text{max}} = y_0 + \\frac{v_{0y}^2}{2g} = ${mr.y0.toFixed(1)} + \\frac{(${vy})^2}{2(${g.toFixed(1)})} = ${hMax}\\text{ m}`)} <span class="math-eval-tag">${hMax} m</span>`
          },
          {
            label: "Part C: Ceiling Clearance Margin",
            math: `${katex(`\\text{Ceiling: } ${mr.ceilingY.toFixed(1)}\\text{ m} \\quad \\text{vs} \\quad h_{\\text{max}} = ${hMax}\\text{ m} \\implies \\text{Margin} = ${(mr.ceilingY - parseFloat(hMax)).toFixed(2)}\\text{ m}`)}`
          }
        ],
        false, true
      );

      mathContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
          <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">🎯 Mark Rober Dartboard: Step Derivations</span>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
            <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
          </div>
        </div>
        ${step1}
        ${step2}
        ${step3}
        ${step4}
        <div class="status-badge-inline ${res && res.hitsCeiling ? 'warn' : 'safe'}" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
          ${res && res.hitsCeiling ? `⚠️ Ceiling Collision: Roof at ${mr.ceilingY.toFixed(1)}m intercepts dart at x = ${res.xCeiling.toFixed(1)}m!` : `✅ Safe Workshop Clearance: Ceiling at ${mr.ceilingY.toFixed(1)}m > ${hMax}m!`}
        </div>
      `;

    } else if (state.mode === "classroom") {
      v0 = state.classroom.v0;
      thetaDeg = state.classroom.thetaDeg;
      g = state.classroom.g;
      x0 = state.classroom.x0;
      y0 = state.classroom.y0;

      const cp = state.classroom;
      const type = cp.problemType || "cliff-building";

      if (type === "tennis") {
        const tNet = (cp.x1 / (cp.v0 || 1)).toFixed(3);
        const yNet = (cp.y0 - 0.5 * cp.g * parseFloat(tNet) * parseFloat(tNet)).toFixed(3);
        const tGround = Math.sqrt((2 * cp.y0) / cp.g).toFixed(3);
        const xLand = (cp.v0 * parseFloat(tGround)).toFixed(2);
        const clearsNet = parseFloat(yNet) > cp.bldgHeight;
        const inCourt = parseFloat(xLand) <= cp.x2;

        const step1 = buildStepCard(
          1, "Step 1: Given Values & Horizontal Launch", "Initial State",
          `Horizontal serve at contact height y₀ = ${cp.y0.toFixed(1)} m at speed v₀ = ${cp.v0.toFixed(1)} m/s.`,
          [
            {
              label: "Velocity Components (θ = 0°)",
              math: katex(`v_{0x} = v_0 \\cos(0^\\circ) = ${cp.v0.toFixed(1)}\\text{ m/s}, \\quad v_{0y} = v_0 \\sin(0^\\circ) = 0\\text{ m/s}`)
            }
          ]
        );

        const step2 = buildStepCard(
          2, "Step 2: Condition 1 — Net Clearance at x_net = 12.0 m", "Net Height: 0.92 m",
          "Find time to reach the net and evaluate ball height.",
          [
            {
              label: "Time to Net",
              math: `${katex(`t_{\\text{net}} = \\frac{x_{\\text{net}}}{v_{0x}} = \\frac{${cp.x1.toFixed(1)}}{${cp.v0.toFixed(1)}} = ${tNet}\\text{ s}`)} <span class="math-eval-tag">${tNet} s</span>`
            },
            {
              label: "Ball Height at Net",
              math: `${katex(`y_{\\text{net}} = y_0 - \\frac{1}{2}g t_{\\text{net}}^2 = ${cp.y0.toFixed(1)} - 0.5(${cp.g.toFixed(1)})(${tNet})^2 = ${yNet}\\text{ m}`)} <span class="math-eval-tag">${yNet} m</span>`
            },
            {
              label: "Net Clearance Comparison",
              math: clearsNet
                ? `${katex(`y_{\\text{net}} = ${yNet}\\text{ m} > ${cp.bldgHeight.toFixed(2)}\\text{ m} \\implies \\text{Margin} = +${(parseFloat(yNet) - cp.bldgHeight).toFixed(2)}\\text{ m}`)} <span class="math-eval-tag" style="color: var(--success);">Net Cleared!</span>`
                : `${katex(`y_{\\text{net}} = ${yNet}\\text{ m} \\le ${cp.bldgHeight.toFixed(2)}\\text{ m} \\implies \\text{Hits Net by } ${(cp.bldgHeight - parseFloat(yNet)).toFixed(2)}\\text{ m}`)} <span class="math-eval-tag" style="color: var(--error);">Hits Net!</span>`
            }
          ]
        );

        const step3 = buildStepCard(
          3, "Step 3: Condition 2 — Service Court Landing (x ≤ 18.4 m)", "Court Boundary",
          "Solve for total time to reach the ground and calculate landing position.",
          [
            {
              label: "Ground Flight Time",
              math: `${katex(`0 = y_0 - \\frac{1}{2}gt^2 \\implies t_{\\text{ground}} = \\sqrt{\\frac{2y_0}{g}} = \\sqrt{\\frac{2(${cp.y0.toFixed(1)})}{${cp.g.toFixed(1)}}} = ${tGround}\\text{ s}`)} <span class="math-eval-tag">${tGround} s</span>`
            },
            {
              label: "Landing Distance",
              math: `${katex(`x_{\\text{land}} = v_{0x} t_{\\text{ground}} = (${cp.v0.toFixed(1)})(${tGround}) = ${xLand}\\text{ m}`)} <span class="math-eval-tag">${xLand} m</span>`
            },
            {
              label: "Service Box Comparison",
              math: inCourt
                ? `${katex(`x_{\\text{land}} = ${xLand}\\text{ m} \\le ${cp.x2.toFixed(1)}\\text{ m} \\implies \\text{In by } ${(cp.x2 - parseFloat(xLand)).toFixed(1)}\\text{ m}`)} <span class="math-eval-tag" style="color: var(--success);">IN / GOOD</span>`
                : `${katex(`x_{\\text{land}} = ${xLand}\\text{ m} > ${cp.x2.toFixed(1)}\\text{ m} \\implies \\text{Over by } ${(parseFloat(xLand) - cp.x2).toFixed(1)}\\text{ m}`)} <span class="math-eval-tag" style="color: var(--error);">LONG / OUT</span>`
            }
          ],
          true
        );

        mathContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
            <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">🎾 Tennis Serve: Full Clearance Analysis</span>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
              <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
            </div>
          </div>
          ${step1}
          ${step2}
          ${step3}
          <div class="status-badge-inline ${clearsNet && inCourt ? 'safe' : 'warn'}" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
            ${clearsNet && inCourt ? '✅ Valid Serve: Clears net and lands inside service court!' : '❌ INVALID SERVE: Clears net successfully, but ball is LONG / OUT!'}
          </div>
        `;
        return;
      }

      if (type === "box-drop") {
        const tFall = Math.sqrt((2 * cp.y0) / cp.g).toFixed(3);
        const range = (cp.v0 * parseFloat(tFall)).toFixed(2);

        const step1 = buildStepCard(
          1, "Step 1: Given Values & Motion Independence", "Horizontal Launch",
          `Ball rolls horizontally off desk (y₀ = ${cp.y0.toFixed(1)} m) at speed v₀ = ${cp.v0.toFixed(1)} m/s.`,
          [
            {
              label: "Components",
              math: katex(`v_{0x} = ${cp.v0.toFixed(1)}\\text{ m/s}, \\quad v_{0y} = 0\\text{ m/s}, \\quad a_x = 0, \\quad a_y = -${cp.g.toFixed(1)}\\text{ m/s}^2`)
            }
          ]
        );

        const step2 = buildStepCard(
          2, "Step 2: Fall Time from Vertical Free Fall (y = 0)", "Flight Time",
          "Vertical free fall alone dictates time of flight.",
          [
            {
              label: "Position Equation",
              math: `${katex(`0 = y_0 - \\frac{1}{2}gt^2 \\implies t_{\\text{fall}} = \\sqrt{\\frac{2y_0}{g}} = \\sqrt{\\frac{2(${cp.y0.toFixed(1)})}{${cp.g.toFixed(1)}}} = ${tFall}\\text{ s}`)} <span class="math-eval-tag">${tFall} s</span>`
            }
          ]
        );

        const step3 = buildStepCard(
          3, "Step 3: Horizontal Landing Distance from Desk Base", "Range Solution",
          "Time connects horizontal velocity to ground range.",
          [
            {
              label: "Range Equation",
              math: `${katex(`x = v_{0x} t_{\\text{fall}} = (${cp.v0.toFixed(1)})(${tFall}) = ${range}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">x = ${range} m</span>`
            }
          ],
          true
        );

        mathContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
            <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">📦 Box Roll-Off: Kinematic Derivation</span>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
              <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
            </div>
          </div>
          ${step1}
          ${step2}
          ${step3}
          <div class="status-badge-inline safe" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
            ✅ Landing Distance: Ball lands ${range} m from the base of the desk!
          </div>
        `;
        return;
      }

      if (type === "soccer") {
        const vx = 20.0, vy = 12.0;
        const v0Calc = Math.hypot(vx, vy).toFixed(2);
        const thetaCalc = (Math.atan2(vy, vx) * (180 / Math.PI)).toFixed(1);
        const tApex = (vy / cp.g).toFixed(2);
        const tFlight = (2 * vy / cp.g).toFixed(2);
        const maxH = (0.5 * vy * parseFloat(tApex)).toFixed(2);
        const range = (vx * parseFloat(tFlight)).toFixed(1);

        const step1 = buildStepCard(
          1, "Step 1: Launch Speed & Angle from Velocity Components", "Vector Inversion",
          "Given initial components: v₀ₓ = 20.0 m/s and v₀ᵧ = 12.0 m/s.",
          [
            {
              label: "Speed and Angle",
              math: `${katex(`v_0 = \\sqrt{v_{0x}^2 + v_{0y}^2} = \\sqrt{20^2 + 12^2} = ${v0Calc}\\text{ m/s}, \\quad \\theta = \\arctan\\left(\\frac{12}{20}\\right) = ${thetaCalc}^\\circ`)}`
            }
          ]
        );

        const step2 = buildStepCard(
          2, "Step 2: Time to Apex & Maximum Altitude (vᵧ = 0)", "Apex Derivation",
          "Vertical velocity ceases at the peak altitude.",
          [
            {
              label: "Rise Time & Apex Height",
              math: `${katex(`t_{\\text{apex}} = \\frac{v_{0y}}{g} = \\frac{12.0}{${cp.g.toFixed(1)}} = ${tApex}\\text{ s}, \\quad h_{\\text{max}} = \\frac{v_{0y}^2}{2g} = ${maxH}\\text{ m}`)}`
            }
          ]
        );

        const step3 = buildStepCard(
          3, "Step 3: Total Flight Time & Range Downfield", "Range Solution",
          "By parabolic symmetry over level ground, flight time is 2 × t_apex.",
          [
            {
              label: "Flight Time & Range",
              math: `${katex(`t_{\\text{flight}} = 2 t_{\\text{apex}} = ${tFlight}\\text{ s}, \\quad x = v_{0x} t_{\\text{flight}} = (20.0)(${tFlight}) = ${range}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">Range = ${range} m</span>`
            }
          ],
          true
        );

        mathContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
            <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">⚽ Soccer Kick: Full Solution</span>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
              <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
            </div>
          </div>
          ${step1}
          ${step2}
          ${step3}
          <div class="status-badge-inline safe" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
            ✅ Solved: v₀ = ${v0Calc} m/s at θ = ${thetaCalc}°, flying a total range of ${range} m!
          </div>
        `;
        return;
      }

      if (type === "cliff-100m") {
        const tFall = Math.sqrt((2 * 100) / cp.g).toFixed(3);
        const reqV0 = (300 / parseFloat(tFall)).toFixed(2);

        const step1 = buildStepCard(
          1, "Step 1: Given Values & Target Range", "Setup",
          "Cliff height y₀ = 100.0 m, target range x = 300.0 m, fired horizontally (v₀ᵧ = 0).",
          [
            {
              label: "Given State",
              math: katex(`y_0 = 100.0\\text{ m}, \\quad x_{\\text{target}} = 300.0\\text{ m}, \\quad v_{0y} = 0\\text{ m/s}`)
            }
          ]
        );

        const step2 = buildStepCard(
          2, "Step 2: Fall Time from 100m Height", "Vertical Fall",
          "Time in air depends solely on vertical cliff height and gravity.",
          [
            {
              label: "Fall Duration",
              math: `${katex(`0 = y_0 - \\frac{1}{2}gt^2 \\implies t_{\\text{flight}} = \\sqrt{\\frac{2(100.0)}{${cp.g.toFixed(1)}}} = ${tFall}\\text{ s}`)} <span class="math-eval-tag">${tFall} s</span>`
            }
          ]
        );

        const step3 = buildStepCard(
          3, "Step 3: Required Initial Speed v₀", "Speed Solution",
          "Calculate horizontal velocity necessary to travel 300 m during flight time.",
          [
            {
              label: "Required Velocity",
              math: `${katex(`v_{0x} = \\frac{x_{\\text{target}}}{t_{\\text{flight}}} = \\frac{300.0\\text{ m}}{${tFall}\\text{ s}} = ${reqV0}\\text{ m/s}`)} <span class="math-eval-tag" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">Required v₀ = ${reqV0} m/s</span>`
            }
          ],
          true
        );

        mathContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
            <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">⛰️ 100m Cliff Launch: Required Velocity</span>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
              <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
            </div>
          </div>
          ${step1}
          ${step2}
          ${step3}
          <div class="status-badge-inline safe" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
            ✅ Required Launch Velocity: v₀ = ${reqV0} m/s guarantees hitting the 300m target!
          </div>
        `;
        return;
      }

      // Default: Classroom Notes Cliff & 70m Building
      const res = cp.hitResult;
      const maxH = res ? res.maxH.toFixed(2) : "342.05";
      const tApex = res ? res.tApex.toFixed(2) : "2.10";
      const t2 = res ? res.t2.toFixed(2) : "8.52";
      const y2 = res ? res.y2.toFixed(1) : "135.8";
      const vx = res ? res.vx.toFixed(1) : "36.4";
      const vy = res ? res.vy.toFixed(1) : "21.0";

      const step1 = buildStepCard(
        1, "Step 1: Velocity Decomposition (SOH CAHTOA)", "Components",
        `Fired from cliff (y₀ = ${cp.y0} m) at speed v₀ = ${cp.v0.toFixed(1)} m/s at angle θ = ${cp.thetaDeg.toFixed(1)}°.`,
        [
          {
            label: "Trigonometric Components",
            math: katex(`v_{0x} = v_0 \\cos(\\theta) = (${cp.v0.toFixed(1)}) \\cos(${cp.thetaDeg.toFixed(1)}^\\circ) = ${vx}\\text{ m/s}, \\quad v_{0y} = (${cp.v0.toFixed(1)}) \\sin(${cp.thetaDeg.toFixed(1)}^\\circ) = ${vy}\\text{ m/s}`)
          }
        ]
      );

      const step2 = buildStepCard(
        2, "Step 2: Maximum Height h_max (vᵧ = 0 at Peak)", "Apex",
        "Vertical velocity ceases at apex: vᵧ(t_apex) = 0.",
        [
          {
            label: "Apex Rise Time & Height",
            math: `${katex(`t_{\\text{apex}} = \\frac{v_{0y}}{g} = \\frac{${vy}}{${cp.g.toFixed(1)}} = ${tApex}\\text{ s}, \\quad h_{\\text{max}} = y_0 + \\frac{v_{0y}^2}{2g} = ${cp.y0} + \\frac{(${vy})^2}{2(${cp.g.toFixed(1)})} = ${maxH}\\text{ m}`)} <span class="math-eval-tag">Apex = ${maxH} m</span>`
          }
        ]
      );

      const step3 = buildStepCard(
        3, `Step 3: Time as Bridge to Far Wall (x₂ = ${cp.x2} m)`, "Bridge Time",
        "Horizontal velocity is constant. Find flight time to reach the far obstacle edge.",
        [
          {
            label: "Travel Time to Far Wall",
            math: `${katex(`t_2 = \\frac{x_2 - x_0}{v_{0x}} = \\frac{${cp.x2} - 0}{${vx}} = ${t2}\\text{ s}`)} <span class="math-eval-tag">${t2} s</span>`
          }
        ],
        true
      );

      const step4 = buildStepCard(
        4, "Step 4: Building Roof Clearance Check", "Roof Clearance",
        `Evaluate vertical position at t = ${t2} s and compare with building height (${cp.bldgHeight} m).`,
        [
          {
            label: "Vertical Position at Far Edge",
            math: `${katex(`y(t_2) = y_0 + v_{0y} t_2 - \\frac{1}{2}g t_2^2 = ${cp.y0} + (${vy})(${t2}) - 0.5(${cp.g.toFixed(1)})(${t2})^2 = ${y2}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--primary-teal-light); color: var(--primary-teal-dark);">y = ${y2} m</span>`
          },
          {
            label: "Roof Clearance Margin",
            math: `${katex(`y(${t2}\\text{ s}) = ${y2}\\text{ m} > ${cp.bldgHeight}\\text{ m} \\implies \\text{Roof Clearance} = +${(parseFloat(y2) - cp.bldgHeight).toFixed(1)}\\text{ m}`)} <span class="math-eval-tag" style="color: var(--success);">SAFE!</span>`
          }
        ],
        false, true
      );

      mathContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
          <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">📋 Classroom Notes: Cliff &amp; 70m Building</span>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
            <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
          </div>
        </div>
        ${step1}
        ${step2}
        ${step3}
        ${step4}
        <div class="status-badge-inline ${res && res.clearsBuilding ? 'safe' : 'warn'}" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
          ${res && res.clearsBuilding ? `✅ Projectile Clears Building: Passes ${cp.x2}m edge at altitude y = ${y2}m (> ${cp.bldgHeight}m roof)!` : `❌ Building Collision: Strikes ${res ? res.collisionType : 'wall'}!`}
        </div>
      `;

    } else {
      v0 = state.sandbox.v0;
      thetaDeg = state.sandbox.thetaDeg;
      g = state.sandbox.g;
      x0 = state.sandbox.x0;
      y0 = state.sandbox.y0;

      const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
      const tFlight = ProjectilesPhysics.calculateTimeOfFlight(y0, decomp.vy, g, 0);
      const range = (decomp.vx * tFlight).toFixed(1);
      const tApex = (decomp.vy > 0 ? decomp.vy / g : 0).toFixed(2);
      const maxH = ProjectilesPhysics.calculateMaxHeight(y0, decomp.vy, g).toFixed(1);

      const step1 = buildStepCard(
        1, "Step 1: Velocity Decomposition (SOH CAHTOA)", "Components",
        "Resolve 2D launch velocity into perpendicular components.",
        [
          {
            label: "Trigonometric Components",
            math: katex(`v_{0x} = (${v0.toFixed(1)}) \\cos(${thetaDeg.toFixed(1)}^\\circ) = ${decomp.vx.toFixed(2)}\\text{ m/s}, \\quad v_{0y} = (${v0.toFixed(1)}) \\sin(${thetaDeg.toFixed(1)}^\\circ) = ${decomp.vy.toFixed(2)}\\text{ m/s}`)
          }
        ]
      );

      const step2 = buildStepCard(
        2, "Step 2: Peak Altitude & Rise Time (vᵧ = 0)", "Apex",
        "Calculate rise time and maximum height reached.",
        [
          {
            label: "Apex Rise Time & Altitude",
            math: `${katex(`t_{\\text{apex}} = \\frac{v_{0y}}{g} = ${tApex}\\text{ s}, \\quad h_{\\text{max}} = y_0 + \\frac{v_{0y}^2}{2g} = ${maxH}\\text{ m}`)} <span class="math-eval-tag">Apex = ${maxH} m</span>`
          }
        ]
      );

      const step3 = buildStepCard(
        3, "Step 3: Total Flight Time & Range", "Ground Impact",
        "Solve for total time until ground landing (y = 0) and total horizontal range.",
        [
          {
            label: "Flight Time & Range",
            math: `${katex(`t_{\\text{flight}} = ${tFlight.toFixed(2)}\\text{ s}, \\quad \\text{Range } x = v_{0x} t_{\\text{flight}} = ${range}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">${range} m</span>`
          }
        ],
        true
      );

      mathContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
          <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">🧪 Free Sandbox: Kinematic Derivation</span>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
            <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
          </div>
        </div>
        ${step1}
        ${step2}
        ${step3}
      `;
    }

    // Attach listeners for Expand All / Collapse All in math panel
    const btnExpand = document.getElementById("btnExpandAllMath");
    const btnCollapse = document.getElementById("btnCollapseAllMath");
    if (btnExpand) btnExpand.onclick = () => document.querySelectorAll(".math-step-card").forEach(c => c.classList.add("open"));
    if (btnCollapse) btnCollapse.onclick = () => document.querySelectorAll(".math-step-card").forEach(c => c.classList.remove("open"));

    // Update Cornell T-Chart
    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const tcVx = document.getElementById("tcVx");
    const tcAy = document.getElementById("tcAy");
    const sohCalcVx = document.getElementById("sohCalcVx");
    const sohCalcVy = document.getElementById("sohCalcVy");
    const tcSubX = document.getElementById("tcSubX");
    const tcSubVy = document.getElementById("tcSubVy");
    const tcSubY = document.getElementById("tcSubY");

    if (tcVx) tcVx.textContent = decomp.vx.toFixed(1);
    if (tcAy) tcAy.textContent = (-g).toFixed(1);
    if (sohCalcVx) sohCalcVx.textContent = `${v0.toFixed(1)} · cos(${thetaDeg.toFixed(1)}°) = ${decomp.vx.toFixed(2)} m/s`;
    if (sohCalcVy) sohCalcVy.textContent = `${v0.toFixed(1)} · sin(${thetaDeg.toFixed(1)}°) = ${decomp.vy.toFixed(2)} m/s`;
    if (tcSubX) tcSubX.textContent = `x = ${x0.toFixed(1)} + (${decomp.vx.toFixed(1)})·t`;
    if (tcSubVy) tcSubVy.textContent = `vᵧ = ${decomp.vy.toFixed(1)} - (${g.toFixed(1)})·t`;
    if (tcSubY) tcSubY.textContent = `y = ${y0.toFixed(1)} + (${decomp.vy.toFixed(1)})·t - ${(0.5 * g).toFixed(1)}·t²`;
  }

  // ==========================================================================
  // Inquiry Scenario Card & Pedagogical Problem Prompts
  // ==========================================================================

  function toggleInquiryCard(forceState) {
    const card = document.getElementById("inquiryScenarioCard");
    const header = document.getElementById("inquiryHeader");
    const toggleText = document.getElementById("inquiryToggleText");
    if (!card) return;

    const isOpen = typeof forceState === "boolean" ? forceState : !card.classList.contains("open");
    card.classList.toggle("open", isOpen);
    if (header) header.setAttribute("aria-expanded", String(isOpen));
    if (toggleText) toggleText.textContent = isOpen ? "Hide Problem & Questions" : "View Problem & Questions";
  }

  function updateInquiryScenarioCard(mode, presetKey = "") {
    const iconEl = document.getElementById("inquiryIcon");
    const titleEl = document.getElementById("inquiryTitle");
    const subtitleEl = document.getElementById("inquirySubtitle");
    const qCountEl = document.getElementById("inquiryQCount");
    const narrativeEl = document.getElementById("inquiryNarrative");
    const listEl = document.getElementById("inquiryQuestionsList");
    if (!titleEl || !narrativeEl || !listEl) return;

    if (mode === "monkey") {
      if (iconEl) iconEl.textContent = "🐵";
      titleEl.textContent = "Feed the Monkey: Free-Fall Intercept Challenge";
      if (subtitleEl) subtitleEl.textContent = "Direct sightline targeting & equal gravitational drop investigation";
      if (qCountEl) qCountEl.textContent = "4 Questions";
      narrativeEl.innerHTML = `A hungry monkey hangs from a tree branch at horizontal distance ${katex("x_m")} and vertical elevation ${katex("y_m")}. A cannon fires a banana directly along the straight line of sight to the monkey with initial launch velocity ${katex("v_0")}. The exact millisecond the cannon discharges, the monkey releases the branch and falls vertically from rest in free fall under gravity.`;
      listEl.innerHTML = `
        <li><span class="q-badge">(a) Aim Direction</span> Where must the cannon aim relative to the monkey to guarantee an intercept before hitting the ground? (Above, directly at, or below?)</li>
        <li><span class="q-badge">(b) Speed Invariance</span> Why does the projectile strike the falling monkey regardless of the launch speed ${katex("v_0")} (provided the banana reaches distance ${katex("x_m")} before ground impact)?</li>
        <li><span class="q-badge">(c) Deflection from Sight Line</span> In flight time ${katex("t")}, how far do both the banana and monkey drop below the unaccelerated line-of-sight ray? (Show using ${katex("\\Delta y = \\frac{1}{2}gt^2")}).</li>
        <li><span class="q-badge">(d) Minimum Catch Velocity</span> Calculate the minimum initial launch speed ${katex("v_0")} required so that the intercept occurs at or above ground level (${katex("y \\ge 0")}).</li>
      `;
    } else if (mode === "mark-rober") {
      if (iconEl) iconEl.textContent = "🎯";
      titleEl.textContent = "Mark Rober's Automated Dartboard Challenge";
      if (subtitleEl) subtitleEl.textContent = "Ceiling clearance & motorized target intercept trajectory";
      if (qCountEl) qCountEl.textContent = "4 Questions";
      narrativeEl.innerHTML = `A dart is thrown from release height ${katex("y_0")} with initial speed ${katex("v_0")} at angle ${katex("\\alpha")} toward a motorized target dartboard at horizontal distance ${katex("x_{\\text{board}}")}. A low overhead ceiling beam is located at height ${katex("H_{\\text{ceiling}}")}.`;
      listEl.innerHTML = `
        <li><span class="q-badge">(a) Low Ceiling Clearance</span> Does the dart clear the low overhead ceiling beam at its trajectory apex, or does it collide? Calculate peak altitude ${katex("y_{\\text{max}} = y_0 + \\frac{v_{0y}^2}{2g}")}.</li>
        <li><span class="q-badge">(b) Target Impact Height</span> At what exact vertical height ${katex("H")} does the dart strike the motorized target board at ${katex("x = x_{\\text{board}}")}?</li>
        <li><span class="q-badge">(c) Impact Velocity Vector</span> Find the velocity components ${katex("v_x")} and ${katex("v_y")} upon striking the board, and determine the penetration angle below horizontal.</li>
        <li><span class="q-badge">(d) Critical Ceiling Velocity</span> What is the maximum allowable launch speed ${katex("v_0")} before the dart collides with the ceiling beam?</li>
      `;
    } else if (mode === "classroom") {
      const pType = presetKey || (state.classroom ? state.classroom.problemType : "cliff-building");
      if (pType === "tennis") {
        if (iconEl) iconEl.textContent = "🎾";
        titleEl.textContent = "Problem 49: Tennis Flat Serve Clearance & Service Box Landing";
        if (subtitleEl) subtitleEl.textContent = "Horizontal projectile launch over net obstacle";
        if (qCountEl) qCountEl.textContent = "3 Questions";
        narrativeEl.innerHTML = `A tennis player strikes a horizontal serve (${katex("\\theta = 0^\\circ")}) from baseline height ${katex("y_0 = 2.50\\text{ m}")} at speed ${katex("v_0 = 40.0\\text{ m/s}")}. The net is positioned ${katex("12.0\\text{ m}")} away with height ${katex("0.92\\text{ m}")}, and the legal service court boundary is ${katex("18.4\\text{ m}")} from the server.`;
        listEl.innerHTML = `
          <li><span class="q-badge">(a) Net Clearance</span> Does the tennis ball clear the ${katex("0.92\\text{ m}")} net at distance ${katex("x = 12.0\\text{ m}")}? Calculate the vertical clearance margin.</li>
          <li><span class="q-badge">(b) Service Box Landing</span> Does the serve land within the legal service box boundary (${katex("x \\le 18.4\\text{ m}")})? What is its exact court landing distance ${katex("x_{\\text{land}}")}?</li>
          <li><span class="q-badge">(c) Impact Speed</span> Find the magnitude and direction of the velocity vector when the ball hits the court surface.</li>
        `;
      } else if (pType === "soccer") {
        if (iconEl) iconEl.textContent = "⚽";
        titleEl.textContent = "Problem 48: Soccer Free Kick over Defensive Wall";
        if (subtitleEl) subtitleEl.textContent = "Angled ground-to-ground projectile over regulation obstacle";
        if (qCountEl) qCountEl.textContent = "3 Questions";
        narrativeEl.innerHTML = `A soccer player takes a free kick from ground level (${katex("y_0 = 0")}) at initial speed ${katex("v_0 = 23.3\\text{ m/s}")} at an elevation angle of ${katex("\\theta = 31.0^\\circ")} (${katex("v_{0x} = 20.0\\text{ m/s}, v_{0y} = 12.0\\text{ m/s}")}). A defensive wall of height ${katex("2.44\\text{ m}")} stands between ${katex("x = 49.0\\text{ m}")} and ${katex("52.0\\text{ m}")}.`;
        listEl.innerHTML = `
          <li><span class="q-badge">(a) Wall Clearance</span> Does the ball clear the top of the defensive wall? Calculate the height of the ball at ${katex("x = 49.0\\text{ m}")} and ${katex("x = 52.0\\text{ m}")}.</li>
          <li><span class="q-badge">(b) Total Range &amp; Hang Time</span> How long does the ball remain airborne (${katex("t_{\\text{flight}} = \\frac{2v_{0y}}{g}")}), and at what horizontal distance does it hit the pitch?</li>
          <li><span class="q-badge">(c) Peak Height</span> What is the maximum apex altitude reached by the soccer ball above the pitch?</li>
        `;
      } else if (pType === "box-drop") {
        if (iconEl) iconEl.textContent = "📦";
        titleEl.textContent = "Problem 46: Tabletop Roll-Off Kinematics";
        if (subtitleEl) subtitleEl.textContent = "Horizontal launch from elevated flat surface";
        if (qCountEl) qCountEl.textContent = "3 Questions";
        narrativeEl.innerHTML = `A laboratory block slides horizontally off the flat edge of a table at height ${katex("y_0 = 2.00\\text{ m}")} with speed ${katex("v_0 = 5.00\\text{ m/s}")} (${katex("\\theta = 0^\\circ")}).`;
        listEl.innerHTML = `
          <li><span class="q-badge">(a) Time in Free Fall</span> Calculate the time required for the block to fall from the tabletop to the floor (${katex("y = 0")}).</li>
          <li><span class="q-badge">(b) Horizontal Displacement</span> How far from the edge of the table (${katex("\\Delta x")}) does the block land?</li>
          <li><span class="q-badge">(c) Impact Velocity</span> Determine the final velocity vector (magnitude and angle below horizontal) immediately prior to landing.</li>
        `;
      } else if (pType === "cliff-100m") {
        if (iconEl) iconEl.textContent = "⛰️";
        titleEl.textContent = "Problem 47: 100m Elevated Cliff Launch (Target Range)";
        if (subtitleEl) subtitleEl.textContent = "Determining required horizontal speed for ground target";
        if (qCountEl) qCountEl.textContent = "3 Questions";
        narrativeEl.innerHTML = `A projectile is launched horizontally (${katex("v_{0y} = 0")}) from the summit of a vertical cliff of height ${katex("y_0 = 100.0\\text{ m}")} toward a ground target at horizontal distance ${katex("x = 300.0\\text{ m}")}.`;
        listEl.innerHTML = `
          <li><span class="q-badge">(a) Free Fall Duration</span> How long does it take for any object dropped or horizontally fired from ${katex("100.0\\text{ m}")} to hit the ground?</li>
          <li><span class="q-badge">(b) Required Launch Speed</span> What horizontal launch velocity ${katex("v_0")} must be imparted to hit the target at ${katex("x = 300.0\\text{ m}")}?</li>
          <li><span class="q-badge">(c) Final Velocity at Impact</span> Compute the impact speed and angle with the ground upon target contact.</li>
        `;
      } else {
        if (iconEl) iconEl.textContent = "🏔️";
        titleEl.textContent = "Lecture Notes: Cliff Launch over 70m Obstacle Building";
        if (subtitleEl) subtitleEl.textContent = "Classroom lecture problem: multi-condition clearance & flight";
        if (qCountEl) qCountEl.textContent = "4 Questions";
        narrativeEl.innerHTML = `A projectile is launched from the top edge of a ${katex("320\\text{ m}")} cliff at speed ${katex("v_0 = 42.0\\text{ m/s}")} angled at ${katex("\\theta = 30.0^\\circ")} above horizontal. Standing between ${katex("x = 230\\text{ m}")} and ${katex("x = 310\\text{ m}")} is a building of height ${katex("70.0\\text{ m}")}.`;
        listEl.innerHTML = `
          <li><span class="q-badge">(a) Peak Altitude &amp; Rise Time</span> What is the maximum height reached by the projectile above the ground, and at what time is apex achieved?</li>
          <li><span class="q-badge">(b) Obstacle Clearance</span> Does the projectile clear the roof of the building at its front face (${katex("x = 230\\text{ m}")}) and back face (${katex("x = 310\\text{ m}")})? Calculate clearance heights.</li>
          <li><span class="q-badge">(c) Total Flight Time</span> Solve the quadratic position equation ${katex("y(t) = 0")} for total time of flight until ground impact.</li>
          <li><span class="q-badge">(d) Final Impact Velocity &amp; Range</span> Determine the horizontal range and the speed and angle upon ground landing.</li>
        `;
      }
    } else {
      if (iconEl) iconEl.textContent = "🧪";
      titleEl.textContent = "2D Projectile Kinematics Sandbox";
      if (subtitleEl) subtitleEl.textContent = "Exploration of arbitrary launch angles, elevations, and gravity fields";
      if (qCountEl) qCountEl.textContent = "3 Questions";
      narrativeEl.innerHTML = `Explore arbitrary 2D projectile trajectories with custom initial launch velocity ${katex("v_0")}, angle ${katex("\\theta")}, initial height ${katex("y_0")}, and gravitational acceleration ${katex("g")}.`;
      listEl.innerHTML = `
        <li><span class="q-badge">(a) Angle of Maximum Range</span> Investigate how the launch angle ${katex("\\theta")} maximizing range shifts from ${katex("45^\\circ")} when launch height ${katex("y_0 > 0")}.</li>
        <li><span class="q-badge">(b) Independence of Components</span> Observe how horizontal velocity ${katex("v_x")} remains strictly constant while vertical velocity ${katex("v_y")} decreases linearly at rate ${katex("-g")}.</li>
        <li><span class="q-badge">(c) Parabolic Path Equation</span> Verify the trajectory equation ${katex("y(x) = y_0 + x\\tan(\\theta) - \\frac{g x^2}{2 v_0^2 \\cos^2(\\theta)}")} by inspecting coordinates along the path.</li>
      `;
    }
  }

  // ==========================================================================
  // Canvas Rendering Pipeline (Laboratory Quality Vector Graphics)
  // ==========================================================================

  function render() {
    const rect = canvasViewport.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const bounds = getViewportBounds();

    drawBackground(bounds, w, h);

    if (state.mode === "monkey") {
      drawMonkeyScene(bounds);
    } else if (state.mode === "mark-rober") {
      drawMarkRoberScene(bounds);
    } else if (state.mode === "classroom") {
      drawClassroomScene(bounds);
    } else if (state.mode === "sandbox") {
      drawSandboxScene(bounds);
    }

    drawTrajectories(bounds);
    drawProjectileAndVectors(bounds);
  }

  function drawBackground(b, w, h) {
    // Sky gradient matching The Thinking Experiment theme
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#ffffff");
    sky.addColorStop(1, "#f4f9fb");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Metric Grid
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

    // Ground line & floor hatch
    const gL = worldToScreen(b.worldXMin, 0, b);
    const gR = worldToScreen(b.worldXMax, 0, b);
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gL.x, gL.y);
    ctx.lineTo(gR.x, gR.y);
    ctx.stroke();

    ctx.fillStyle = "#eaf2f5";
    ctx.fillRect(gL.x, gL.y, gR.x - gL.x, h - gL.y);

    // Graduation ticks along ground
    ctx.strokeStyle = "#a9c4cf";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const tickStep = state.mode === "classroom" ? 50 : 5;
    for (let wx = 0; wx <= b.worldXMax; wx += tickStep) {
      const p = worldToScreen(wx, 0, b);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y + 6);
    }
    ctx.stroke();
  }

  function drawMonkeyScene(b) {
    const m = state.monkey;
    const treeX = worldToScreen(m.xm, 0, b).x;
    const treeBase = worldToScreen(m.xm, 0, b).y;
    const branchTop = worldToScreen(m.xm, m.ym, b).y;

    // Tree Trunk
    ctx.fillStyle = "#7a4e2d";
    ctx.fillRect(treeX - 10, branchTop - 12, 20, treeBase - branchTop + 12);

    // Branch
    ctx.fillStyle = "#5a3820";
    ctx.beginPath();
    ctx.roundRect(treeX - 45, branchTop - 14, 65, 14, 4);
    ctx.fill();

    // Foliage
    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.arc(treeX + 10, branchTop - 32, 36, 0, Math.PI * 2);
    ctx.arc(treeX - 20, branchTop - 40, 28, 0, Math.PI * 2);
    ctx.arc(treeX + 35, branchTop - 24, 26, 0, Math.PI * 2);
    ctx.fill();

    // Monkey
    const monkPt = worldToScreen(m.xm, m.monkeyY, b);
    drawMonkeySprite(monkPt.x - 14, monkPt.y, m.isCaught);

    // Initial branch reference marker
    if (state.simTime > 0) {
      ctx.strokeStyle = "rgba(18, 49, 64, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(treeX - 40, branchTop);
      ctx.lineTo(treeX + 40, branchTop);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Cannon
    const canPt = worldToScreen(m.x0, m.y0, b);
    drawCannonSprite(canPt.x, canPt.y, m.thetaDeg);

    // Line of Sight
    if (state.showTargetLine) {
      const aimPt = worldToScreen(m.xm, m.ym, b);
      ctx.strokeStyle = "#d67b19";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(canPt.x, canPt.y);
      ctx.lineTo(aimPt.x, aimPt.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Target reticle
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

  function drawMonkeySprite(x, y, isCaught) {
    ctx.save();
    ctx.translate(x, y);

    // Body
    ctx.fillStyle = "#7a4e2d";
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = "#b88a65";
    ctx.beginPath();
    ctx.ellipse(0, 3, 8, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#7a4e2d";
    ctx.beginPath();
    ctx.arc(0, -18, 12, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.arc(-12, -19, 5, 0, Math.PI * 2);
    ctx.arc(12, -19, 5, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.fillStyle = "#b88a65";
    ctx.beginPath();
    ctx.ellipse(0, -16, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#123140";
    ctx.beginPath();
    ctx.arc(-3, -18, 2, 0, Math.PI * 2);
    ctx.arc(3, -18, 2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = "#123140";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -14, isCaught ? 5 : 3.5, 0, Math.PI);
    ctx.stroke();

    // Arms
    ctx.strokeStyle = "#7a4e2d";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (isCaught) {
      ctx.moveTo(-11, -5);
      ctx.lineTo(-2, 4);
      ctx.moveTo(11, -5);
      ctx.lineTo(2, 4);
    } else {
      ctx.moveTo(-11, -5);
      ctx.lineTo(-16, -20);
      ctx.moveTo(11, -5);
      ctx.lineTo(16, -20);
    }
    ctx.stroke();

    if (isCaught) {
      drawBanana(ctx, 0, 7, 0.25, 0.75);
    }

    ctx.restore();
  }

  function drawBanana(ctx, cx, cy, angleRad, scale) {
    scale = scale || 1.0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad || 0);
    ctx.scale(scale, scale);

    // Outer Crescent Body
    ctx.beginPath();
    ctx.moveTo(-16, -5);
    ctx.bezierCurveTo(-6, 9, 8, 9, 16, -2);
    ctx.lineTo(17, -1);
    ctx.bezierCurveTo(8, 4.5, -6, 4.5, -16, -5);
    ctx.closePath();

    // Vibrant Yellow-Amber Peel Gradient
    const grad = ctx.createLinearGradient(-16, 0, 16, 0);
    grad.addColorStop(0, "#e8a817");
    grad.addColorStop(0.45, "#f5c531");
    grad.addColorStop(1, "#d67b19");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = "#b06210";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 3D Banana Longitudinal Ridge
    ctx.beginPath();
    ctx.moveTo(-14, -4);
    ctx.bezierCurveTo(-5, 6, 7, 6, 15, -2);
    ctx.strokeStyle = "#e09310";
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Stem at base (Greenish-Brown)
    ctx.fillStyle = "#5c4015";
    ctx.beginPath();
    ctx.moveTo(-16, -5);
    ctx.lineTo(-20, -7);
    ctx.lineTo(-20, -9);
    ctx.lineTo(-15, -7);
    ctx.closePath();
    ctx.fill();

    // Blossom tip (Dark Brown)
    ctx.fillStyle = "#382307";
    ctx.beginPath();
    ctx.arc(17, -1, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawCannonSprite(x, y, angleDeg) {
    ctx.save();
    ctx.translate(x, y);

    // Aim guide / Drag ring hint (Teal/Amber dashed arc)
    ctx.strokeStyle = "rgba(214, 123, 25, 0.4)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 42, -Math.PI * 0.45, 0.05);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pedestal
    ctx.fillStyle = "#0f7e9b";
    ctx.beginPath();
    ctx.arc(0, 0, 16, Math.PI, 0);
    ctx.fill();

    // Barrel
    ctx.rotate(-angleDeg * (Math.PI / 180));
    ctx.fillStyle = "#095f76";
    ctx.beginPath();
    ctx.roundRect(-6, -9, 42, 18, [0, 5, 5, 0]);
    ctx.fill();

    // Amber muzzle ring
    ctx.strokeStyle = "#d67b19";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(33, -9);
    ctx.lineTo(33, 9);
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = "#d67b19";
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── High-Quality Sports Ball Sprites ──────────────────────────────────────────
  function drawTennisBallSprite(ctx, cx, cy, rot = 0) {
    const r = 7.5;
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);

    // Subtle drop shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    // Ball Body - Optic Yellow Radial Gradient
    const grad = ctx.createRadialGradient(-2, -2, 1, 0, 0, r);
    grad.addColorStop(0, "#effb65");
    grad.addColorStop(0.65, "#cbe035");
    grad.addColorStop(1, "#98b015");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Turn off shadow for seams
    ctx.shadowColor = "transparent";

    // Crisp white curved parabolic tennis seams
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 1.3;
    ctx.lineCap = "round";

    // Left curved seam arc
    ctx.beginPath();
    ctx.arc(-4.5, 0, 4.8, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();

    // Right curved seam arc
    ctx.beginPath();
    ctx.arc(4.5, 0, 4.8, Math.PI * 0.58, Math.PI * 1.42);
    ctx.stroke();

    // Thin outer rim
    ctx.strokeStyle = "rgba(70, 95, 10, 0.35)";
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawSoccerBallSprite(ctx, cx, cy, rot = 0) {
    const r = 8.5;
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);

    // Drop shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    // White leather sphere with shading
    const grad = ctx.createRadialGradient(-2.5, -2.5, 1, 0, 0, r);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.7, "#f0f4f6");
    grad.addColorStop(1, "#c8d4da");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // Outer rim
    ctx.strokeStyle = "#123140";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Center pentagon patch
    ctx.fillStyle = "#123140";
    ctx.beginPath();
    const pentaR = 3.2;
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
      const px = Math.cos(a) * pentaR;
      const py = Math.sin(a) * pentaR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Radial seam stitches from pentagon vertices to edge
    ctx.strokeStyle = "rgba(18, 49, 64, 0.75)";
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
      const px = Math.cos(a) * pentaR;
      const py = Math.sin(a) * pentaR;
      const ex = Math.cos(a) * (r - 0.5);
      const ey = Math.sin(a) * (r - 0.5);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ── Tennis Server Figure ───────────────────────────────────────────────────
  // baseX/baseY = player feet on court, contactY = serve contact height on screen
  function drawTennisServerFigure(baseX, baseY, contactY) {
    const h = baseY - contactY; // screen height (2.5m)
    const bodyH = Math.max(h * 0.70, 36);
    const hipY = baseY - bodyH * 0.44;
    const shoulderY = baseY - bodyH * 0.80;
    const headR = Math.max(bodyH * 0.09, 5);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Shoes on baseline
    ctx.fillStyle = "#123140";
    ctx.fillRect(baseX - 9, baseY - 3, 8, 3);
    ctx.fillRect(baseX + 2, baseY - 3, 8, 3);

    // Legs in athletic service stance
    ctx.strokeStyle = "#095f76";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(baseX - 5, baseY - 3);
    ctx.lineTo(baseX - 3, hipY);
    ctx.moveTo(baseX + 6, baseY - 3);
    ctx.lineTo(baseX + 1, hipY);
    ctx.stroke();

    // Shorts
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(baseX - 3, hipY + 5);
    ctx.lineTo(baseX - 1, hipY);
    ctx.lineTo(baseX + 2, hipY + 5);
    ctx.stroke();

    // Torso arched in serve stretch
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(baseX - 1, hipY);
    ctx.lineTo(baseX - 2, shoulderY);
    ctx.stroke();

    // Head
    ctx.fillStyle = "#123140";
    ctx.beginPath();
    ctx.arc(baseX - 2, shoulderY - headR - 2, headR, 0, Math.PI * 2);
    ctx.fill();

    // Left arm (tucked after toss)
    ctx.strokeStyle = "#095f76";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(baseX - 2, shoulderY);
    ctx.lineTo(baseX - 12, shoulderY + 8);
    ctx.stroke();

    // Serving arm extended up to racket
    ctx.strokeStyle = "#095f76";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(baseX - 2, shoulderY);
    ctx.lineTo(baseX, contactY + 16);
    ctx.stroke();

    // Tennis Racket
    ctx.strokeStyle = "#123140";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(baseX, contactY + 16);
    ctx.lineTo(baseX, contactY + 9);
    ctx.stroke();

    // Oval racket head centered exactly at (baseX, contactY)
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(baseX, contactY, 8, 11, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Racket string crosshairs
    ctx.strokeStyle = "rgba(15, 126, 155, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(baseX - 6, contactY);
    ctx.lineTo(baseX + 6, contactY);
    ctx.moveTo(baseX, contactY - 8);
    ctx.lineTo(baseX, contactY + 8);
    ctx.stroke();

    ctx.restore();
  }

  // ── Soccer Player Kick Figure ───────────────────────────────────────────────
  function drawSoccerPlayerFigure(baseX, baseY, angleDeg) {
    const H = 36;
    const hipY = baseY - H * 0.45;
    const shoulderY = baseY - H * 0.82;
    const headR = 5.5;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Plant foot (left)
    ctx.fillStyle = "#123140";
    ctx.fillRect(baseX - 15, baseY - 3, 9, 3);

    // Plant leg
    ctx.strokeStyle = "#095f76";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(baseX - 10, baseY - 3);
    ctx.lineTo(baseX - 6, hipY);
    ctx.stroke();

    // Torso leaning forward into free kick
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(baseX - 6, hipY);
    ctx.lineTo(baseX - 2, shoulderY);
    ctx.stroke();

    // Head
    ctx.fillStyle = "#123140";
    ctx.beginPath();
    ctx.arc(baseX - 2, shoulderY - headR - 2, headR, 0, Math.PI * 2);
    ctx.fill();

    // Balancing arms
    ctx.strokeStyle = "#095f76";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(baseX - 2, shoulderY);
    ctx.lineTo(baseX - 14, shoulderY + 8);
    ctx.moveTo(baseX - 2, shoulderY);
    ctx.lineTo(baseX + 10, shoulderY + 6);
    ctx.stroke();

    // Kicking leg: swings through toward ball at launch angle
    const rad = (-angleDeg * Math.PI / 180);
    const kickLen = H * 0.46;
    ctx.strokeStyle = "#d67b19";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(baseX - 6, hipY);
    ctx.lineTo(baseX - 4 + Math.cos(rad) * kickLen, hipY - Math.sin(-rad) * kickLen);
    ctx.stroke();

    // Kicking boot striking behind ball
    ctx.fillStyle = "#123140";
    ctx.beginPath();
    ctx.arc(baseX - 4 + Math.cos(rad) * kickLen, hipY - Math.sin(-rad) * kickLen, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawMarkRoberScene(b) {
    const mr = state.markRober;

    // Workshop Ceiling
    const cL = worldToScreen(b.worldXMin, mr.ceilingY, b);
    const cR = worldToScreen(b.worldXMax, mr.ceilingY, b);
    ctx.strokeStyle = "#4b6570";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cL.x, cL.y);
    ctx.lineTo(cR.x, cR.y);
    ctx.stroke();

    ctx.fillStyle = "#e2eef3";
    ctx.fillRect(cL.x, 0, cR.x - cL.x, cL.y);
    ctx.fillStyle = "#123140";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`WORKSHOP CEILING (${mr.ceilingY.toFixed(1)}m)`, cL.x + 20, cL.y - 8);

    // Mark Rober Figure
    const markBase = worldToScreen(mr.x0, 0, b);
    const markHand = worldToScreen(mr.x0, mr.y0, b);
    drawMarkRoberFigure(markBase.x, markBase.y, markHand.y);

    // Vertical Linear Actuator Track
    const trackX = worldToScreen(mr.xBoard, 0, b).x;
    const trackBottom = worldToScreen(mr.xBoard, 0, b).y;
    const trackTop = worldToScreen(mr.xBoard, mr.ceilingY, b).y;

    ctx.fillStyle = "#a9c4cf";
    ctx.fillRect(trackX - 6, trackTop, 4, trackBottom - trackTop);
    ctx.fillRect(trackX + 2, trackTop, 4, trackBottom - trackTop);

    // Sliding Motorized Dartboard
    const boardPt = worldToScreen(mr.xBoard, mr.boardY, b);
    drawDartboard(boardPt.x, boardPt.y);
  }

  function drawMarkRoberFigure(baseX, baseY, handY) {
    ctx.save();
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(baseX, baseY - 12);
    ctx.lineTo(baseX, handY + 12);
    ctx.moveTo(baseX, baseY - 12);
    ctx.lineTo(baseX - 8, baseY);
    ctx.moveTo(baseX, baseY - 12);
    ctx.lineTo(baseX + 6, baseY);
    ctx.stroke();

    ctx.strokeStyle = "#d67b19";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(baseX, handY + 14);
    ctx.lineTo(baseX + 14, handY);
    ctx.stroke();

    ctx.fillStyle = "#d67b19";
    ctx.beginPath();
    ctx.arc(baseX, handY - 6, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawDartboard(x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Carriage backplate
    ctx.fillStyle = "#123140";
    ctx.fillRect(-14, -26, 10, 52);

    // Outer board rim
    ctx.fillStyle = "#123140";
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Double ring
    ctx.fillStyle = "#e6f4f8";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();

    // Bullseye
    ctx.fillStyle = "#d67b19";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawClassroomScene(b) {
    const cp = state.classroom;
    const type = cp.problemType || "cliff-building";

    if (type === "tennis") {
      // 1. Tennis Court Ground
      const cL = worldToScreen(b.worldXMin, 0, b);
      const cR = worldToScreen(b.worldXMax, 0, b);
      ctx.fillStyle = "#e8f4f0";
      ctx.fillRect(cL.x, cL.y, cR.x - cL.x, b.h - cL.y);

      // Baseline & Service Line Markers
      const basePt = worldToScreen(0, 0, b);
      const netPt = worldToScreen(12.0, 0, b);
      const netTop = worldToScreen(12.0, 0.92, b);
      const servPt = worldToScreen(18.4, 0, b);

      // Court Lines
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(basePt.x, basePt.y);
      ctx.lineTo(servPt.x + 60, basePt.y);
      ctx.stroke();

      // Net Posts and Mesh
      ctx.strokeStyle = "#0f7e9b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(netPt.x, netPt.y);
      ctx.lineTo(netTop.x, netTop.y);
      ctx.stroke();

      // Net mesh pattern
      ctx.fillStyle = "rgba(15, 126, 155, 0.15)";
      ctx.fillRect(netTop.x - 3, netTop.y, 6, netPt.y - netTop.y);
      ctx.strokeStyle = "#123140";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(netTop.x - 6, netTop.y);
      ctx.lineTo(netTop.x + 6, netTop.y);
      ctx.stroke();

      ctx.fillStyle = "#0f7e9b";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText("NET (0.92m)", netTop.x - 28, netTop.y - 8);

      // Service Line boundary
      ctx.strokeStyle = "#d67b19";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(servPt.x, servPt.y);
      ctx.lineTo(servPt.x, servPt.y - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#d67b19";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillText("SERVICE LINE (18.4m)", servPt.x - 50, servPt.y - 45);

      // Server position: tennis server figure
      const canPt = worldToScreen(cp.x0, cp.y0, b);
      const playerBase = worldToScreen(cp.x0, 0, b);
      drawTennisServerFigure(playerBase.x, playerBase.y, canPt.y);

      ctx.fillStyle = "#0f7e9b";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(`SERVE CONTACT (h₀ = ${cp.y0}m)`, canPt.x + 8, canPt.y - 10);

      // ── Net clearance annotation ──────────────────────────────────────────────
      // Draw only when simulation has run or ended
      if (state.isRunning || state.hasEnded) {
        const tennisRes = ProjectilesPhysics.calculateTennisServe({
          y0: cp.y0, v0: cp.v0, thetaDeg: cp.thetaDeg,
          g: cp.g, xNet: cp.x1, hNet: cp.bldgHeight, xCourt: cp.x2
        });

        // Ghost ball at net
        const netBallPt = worldToScreen(cp.x1, tennisRes.yNet, b);
        ctx.beginPath();
        ctx.arc(netBallPt.x, netBallPt.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = tennisRes.clearsNet ? "rgba(15,126,155,0.35)" : "rgba(200,50,50,0.35)";
        ctx.fill();
        ctx.strokeStyle = tennisRes.clearsNet ? "#0f7e9b" : "#c83232";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Vertical clearance guide line at net
        const netTopPx = worldToScreen(cp.x1, cp.bldgHeight, b);
        ctx.strokeStyle = tennisRes.clearsNet ? "rgba(15,126,155,0.6)" : "rgba(200,50,50,0.6)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(netBallPt.x + 10, netTopPx.y);
        ctx.lineTo(netBallPt.x + 10, netBallPt.y);
        ctx.stroke();
        ctx.setLineDash([]);
        // Tick marks
        ctx.beginPath();
        ctx.moveTo(netBallPt.x + 6, netTopPx.y);
        ctx.lineTo(netBallPt.x + 14, netTopPx.y);
        ctx.moveTo(netBallPt.x + 6, netBallPt.y);
        ctx.lineTo(netBallPt.x + 14, netBallPt.y);
        ctx.stroke();

        // Clearance badge
        ctx.fillStyle = tennisRes.clearsNet ? "#0f7e9b" : "#c83232";
        ctx.font = "bold 10px Inter, sans-serif";
        const clearLabel = tennisRes.clearsNet
          ? `↕ +${tennisRes.netClearanceMargin.toFixed(2)}m`
          : `↕ ${tennisRes.netClearanceMargin.toFixed(2)}m`;
        ctx.fillText(clearLabel, netBallPt.x + 16, (netTopPx.y + netBallPt.y) / 2 + 4);

        // Landing place bullseye
        if (state.hasEnded && cp.projPos) {
          const landX = cp.projPos.x;
          const landPt = worldToScreen(landX, 0, b);
          // Bullseye rings
          ctx.strokeStyle = "#d67b19";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(landPt.x, landPt.y, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = "rgba(214,123,25,0.45)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(landPt.x, landPt.y, 17, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "#d67b19";
          ctx.beginPath();
          ctx.arc(landPt.x, landPt.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Horizontal distance bracket: service line → landing
          const servLinePx = worldToScreen(cp.x2, 0, b);
          const overshoot = landX - cp.x2;
          if (overshoot > 0.1) {
            ctx.strokeStyle = "#d67b19";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(servLinePx.x, landPt.y - 18);
            ctx.lineTo(landPt.x, landPt.y - 18);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(servLinePx.x, landPt.y - 22);
            ctx.lineTo(servLinePx.x, landPt.y - 14);
            ctx.moveTo(landPt.x, landPt.y - 22);
            ctx.lineTo(landPt.x, landPt.y - 14);
            ctx.stroke();
            ctx.fillStyle = "#d67b19";
            ctx.font = "bold 10px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`+${overshoot.toFixed(1)}m past line`, (servLinePx.x + landPt.x) / 2, landPt.y - 24);
            ctx.textAlign = "left";
          }

          // Landing badge
          ctx.font = "bold 10px Inter, sans-serif";
          ctx.fillStyle = landX <= cp.x2 ? "#0f7e9b" : "#d67b19";
          ctx.fillText(`LANDS: x = ${landX.toFixed(1)}m`, landPt.x + 12, landPt.y - 4);
        }
      }

      return;
    }

    if (type === "box-drop") {
      // Cubical box: 2m wide, 2m tall
      const boxEdge = worldToScreen(cp.x0, cp.y0, b);
      const boxBase = worldToScreen(cp.x0, 0, b);
      const boxLeft = worldToScreen(cp.x0 - 2.0, cp.y0, b);

      ctx.fillStyle = "#e2eef3";
      ctx.fillRect(boxLeft.x, boxEdge.y, boxEdge.x - boxLeft.x, boxBase.y - boxEdge.y);
      ctx.strokeStyle = "#0f7e9b";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(boxLeft.x, boxEdge.y, boxEdge.x - boxLeft.x, boxBase.y - boxEdge.y);

      ctx.fillStyle = "#0f7e9b";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText("BOX (2m × 2m)", boxLeft.x + 8, boxEdge.y + 24);

      drawCannonSprite(boxEdge.x, boxEdge.y, cp.thetaDeg);
      return;
    }

    if (type === "soccer") {
      // Soccer pitch ground
      const cL = worldToScreen(b.worldXMin, 0, b);
      const cR = worldToScreen(b.worldXMax, 0, b);
      ctx.fillStyle = "#e6f5ee";
      ctx.fillRect(cL.x, cL.y, cR.x - cL.x, b.h - cL.y);

      // Pitch lines (centre line, penalty arc guide)
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(cL.x, cL.y);
      ctx.lineTo(cR.x, cL.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Defensive wall at 9.15m (free kick rule) ~ shown at x=9.15
      const wallX = 9.15;
      const wallPt = worldToScreen(wallX, 0, b);
      const wallTop = worldToScreen(wallX, 2.0, b); // ~avg player height
      // Draw 3 defenders shoulder-to-shoulder
      for (let i = -1; i <= 1; i++) {
        const wx = wallPt.x + i * 8;
        ctx.strokeStyle = "#095f76";
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Body
        ctx.moveTo(wx, wallPt.y);
        ctx.lineTo(wx, wallPt.y - (wallPt.y - wallTop.y) * 0.55);
        // Arms outstretched
        ctx.moveTo(wx - 8, wallPt.y - (wallPt.y - wallTop.y) * 0.35);
        ctx.lineTo(wx + 8, wallPt.y - (wallPt.y - wallTop.y) * 0.35);
        ctx.stroke();
        // Head
        ctx.beginPath();
        ctx.arc(wx, wallTop.y + 8, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#d67b19";
        ctx.fill();
      }
      ctx.fillStyle = "#0f7e9b";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillText("WALL (9.15m)", wallPt.x - 20, wallTop.y - 14);

      // Wall clearance annotation when running, ended, or paused at wall
      if (state.isRunning || state.hasEnded || cp._hasReachedWall) {
        const decompS = ProjectilesPhysics.decomposeVelocity(cp.v0, cp.thetaDeg);
        const tW = decompS.vx > 0 ? (wallX - cp.x0) / decompS.vx : 0;
        const yW = cp.y0 + decompS.vy * tW - 0.5 * cp.g * tW * tW;
        const clearsWall = yW > 2.00;

        const wallBallPt = worldToScreen(wallX, Math.max(0, yW), b);
        const wallTopPt = worldToScreen(wallX, 2.00, b);

        // Ghost ball at wall
        ctx.beginPath();
        ctx.arc(wallBallPt.x, wallBallPt.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = clearsWall ? "rgba(15,126,155,0.35)" : "rgba(200,50,50,0.35)";
        ctx.fill();
        ctx.strokeStyle = clearsWall ? "#0f7e9b" : "#c83232";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Vertical dimension bracket
        ctx.strokeStyle = clearsWall ? "rgba(15,126,155,0.6)" : "rgba(200,50,50,0.6)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(wallBallPt.x + 10, wallTopPt.y);
        ctx.lineTo(wallBallPt.x + 10, wallBallPt.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Tick marks
        ctx.beginPath();
        ctx.moveTo(wallBallPt.x + 6, wallTopPt.y);
        ctx.lineTo(wallBallPt.x + 14, wallTopPt.y);
        ctx.moveTo(wallBallPt.x + 6, wallBallPt.y);
        ctx.lineTo(wallBallPt.x + 14, wallBallPt.y);
        ctx.stroke();

        // Clearance badge
        ctx.fillStyle = clearsWall ? "#0f7e9b" : "#c83232";
        ctx.font = "bold 10px Inter, sans-serif";
        const wMargin = (yW - 2.00).toFixed(2);
        ctx.fillText(`↕ ${clearsWall ? '+' : ''}${wMargin}m`, wallBallPt.x + 16, (wallTopPt.y + wallBallPt.y) / 2 + 4);
      }

      // Goal at range ~49m
      const goalPt = worldToScreen(49.0, 0, b);
      const goalTop = worldToScreen(49.0, 2.44, b);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3.5;
      ctx.strokeRect(goalPt.x, goalTop.y, 25, goalPt.y - goalTop.y);

      // Goal cross-bar detail
      ctx.strokeStyle = "rgba(200,200,200,0.6)";
      ctx.lineWidth = 1;
      for (let gy = goalTop.y + 6; gy < goalPt.y; gy += 8) {
        ctx.beginPath();
        ctx.moveTo(goalPt.x, gy);
        ctx.lineTo(goalPt.x + 22, gy);
        ctx.stroke();
      }

      ctx.fillStyle = "#0f7e9b";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText("GOAL (49m)", goalPt.x - 20, goalTop.y - 8);
      ctx.fillStyle = "#123140";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText("h = 2.44m", goalPt.x - 14, goalTop.y + 14);

      // Soccer player kick figure
      const playerBase = worldToScreen(cp.x0, 0, b);
      drawSoccerPlayerFigure(playerBase.x, playerBase.y, cp.thetaDeg);

      // Landing marker (show after simulation ends)
      if (state.hasEnded && cp.projPos) {
        const landX = cp.projPos.x;
        const landPt = worldToScreen(landX, 0, b);
        ctx.strokeStyle = "#d67b19";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(landPt.x, landPt.y, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(214,123,25,0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(landPt.x, landPt.y, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#d67b19";
        ctx.beginPath();
        ctx.arc(landPt.x, landPt.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText(`LANDS: x = ${landX.toFixed(1)}m`, landPt.x + 12, landPt.y - 5);
      }

      return;
    }

    // Default: Cliff & Building (or 100m cliff)
    const cliffEdge = worldToScreen(cp.x0, cp.y0, b);
    const cliffBase = worldToScreen(cp.x0, 0, b);
    const screenLeft = worldToScreen(b.worldXMin, 0, b).x;

    ctx.fillStyle = "#e2eef3";
    ctx.fillRect(screenLeft, cliffEdge.y, cliffEdge.x - screenLeft + 8, cliffBase.y - cliffEdge.y);
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenLeft, cliffEdge.y);
    ctx.lineTo(cliffEdge.x, cliffEdge.y);
    ctx.lineTo(cliffEdge.x, cliffBase.y);
    ctx.stroke();

    ctx.fillStyle = "#0f7e9b";
    ctx.font = "bold 12px 'IBM Plex Sans', sans-serif";
    ctx.fillText(`CLIFF h₀ = ${cp.y0}m`, cliffEdge.x - 90, cliffEdge.y - 12);

    if (cp.bldgHeight > 0 && cp.x2 > cp.x1) {
      // 2. Obstacle Building
      const bldgL = worldToScreen(cp.x1, cp.bldgHeight, b);
      const bldgR = worldToScreen(cp.x2, 0, b);
      const bldgW = bldgR.x - bldgL.x;
      const bldgH = bldgR.y - bldgL.y;

      ctx.fillStyle = "#f0f8fa";
      ctx.fillRect(bldgL.x, bldgL.y, bldgW, bldgH);
      ctx.strokeStyle = "#0f7e9b";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(bldgL.x, bldgL.y, bldgW, bldgH);

      // Windows
      ctx.fillStyle = "#0f7e9b";
      const winW = 6, winH = 8, gapX = 14, gapY = 16;
      for (let wx = bldgL.x + 10; wx < bldgL.x + bldgW - 8; wx += gapX) {
        for (let wy = bldgL.y + 12; wy < bldgR.y - 10; wy += gapY) {
          ctx.fillRect(wx, wy, winW, winH);
        }
      }

      ctx.fillStyle = "#123140";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(`BUILDING (${cp.bldgHeight}m)`, bldgL.x + 6, bldgL.y - 8);
    } else if (type === "cliff-100m") {
      const tgt = worldToScreen(300, 0, b);
      ctx.strokeStyle = "#d67b19";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(tgt.x, tgt.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#d67b19";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText("TARGET (300m)", tgt.x - 35, tgt.y - 14);
    }

    // Launcher
    drawCannonSprite(cliffEdge.x, cliffEdge.y, cp.thetaDeg);
  }

  function drawSandboxScene(b) {
    const sb = state.sandbox;
    const canPt = worldToScreen(sb.x0, sb.y0, b);

    if (sb.y0 > 0) {
      const gPt = worldToScreen(sb.x0, 0, b);
      ctx.fillStyle = "#e6f4f8";
      ctx.fillRect(canPt.x - 20, canPt.y, 40, gPt.y - canPt.y);
      ctx.strokeStyle = "#0f7e9b";
      ctx.lineWidth = 2;
      ctx.strokeRect(canPt.x - 20, canPt.y, 40, gPt.y - canPt.y);
    }

    drawCannonSprite(canPt.x, canPt.y, sb.thetaDeg);
  }

  function drawTrajectories(b) {
    if (!currentTrajectory || currentTrajectory.length < 2) return;

    if (state.showZeroG && currentZeroGTrajectory.length > 1) {
      ctx.strokeStyle = "rgba(18, 49, 64, 0.25)";
      ctx.lineWidth = 2;
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

    ctx.strokeStyle = "rgba(15, 126, 155, 0.88)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < currentTrajectory.length; i++) {
      const pt = worldToScreen(currentTrajectory[i].x, currentTrajectory[i].y, b);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    if (state.showStrobes && currentStrobes.length > 0) {
      for (let i = 0; i < currentStrobes.length; i++) {
        const st = currentStrobes[i];
        const sPt = worldToScreen(st.x, st.y, b);

        ctx.fillStyle = "#d67b19";
        ctx.beginPath();
        ctx.arc(sPt.x, sPt.y, 4, 0, Math.PI * 2);
        ctx.fill();

        if (state.mode === "monkey") {
          const m = state.monkey;
          const drop = 0.5 * m.g * st.t * st.t;
          const monkY = Math.max(0, m.ym - drop);
          const mPt = worldToScreen(m.xm, monkY, b);

          ctx.fillStyle = "#0f7e9b";
          ctx.beginPath();
          ctx.arc(mPt.x, mPt.y, 4, 0, Math.PI * 2);
          ctx.fill();

          if (i % 2 === 0 && st.t <= m.hitResult.tIntercept) {
            ctx.strokeStyle = "rgba(214, 123, 25, 0.2)";
            ctx.lineWidth = 1.2;
            ctx.setLineDash([3, 4]);
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

    if (state.mode === "monkey") {
      drawBanana(ctx, scrPt.x, scrPt.y, state.simTime * 8, 0.95);
    } else if (state.mode === "mark-rober") {
      ctx.save();
      ctx.translate(scrPt.x, scrPt.y);
      const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
      const vel = ProjectilesPhysics.getVelocityAtTime({ vx: decomp.vx, vy: decomp.vy, g: g, t: state.simTime });
      ctx.rotate(-vel.angleDeg * (Math.PI / 180));
      ctx.fillStyle = "#123140";
      ctx.fillRect(-13, -2.5, 26, 5);
      ctx.fillStyle = "#d67b19";
      ctx.beginPath();
      ctx.moveTo(-13, -7);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-13, 7);
      ctx.fill();
      ctx.restore();
    } else if (state.mode === "classroom" && state.classroom.problemType === "tennis") {
      drawTennisBallSprite(ctx, scrPt.x, scrPt.y, state.simTime * 12);
    } else if (state.mode === "classroom" && state.classroom.problemType === "soccer") {
      drawSoccerBallSprite(ctx, scrPt.x, scrPt.y, state.simTime * 8);
    } else {
      ctx.fillStyle = "#d67b19";
      ctx.beginPath();
      ctx.arc(scrPt.x, scrPt.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (state.showVectors && (state.isRunning || state.hasEnded)) {
      const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
      const vel = ProjectilesPhysics.getVelocityAtTime({
        vx: decomp.vx,
        vy: decomp.vy,
        g: g,
        t: state.simTime
      });

      const vScale = state.mode === "classroom" ? 0.75 : 2.4;
      drawArrow(ctx, scrPt.x, scrPt.y, scrPt.x + vel.vx * vScale, scrPt.y, "#0f7e9b", 2);
      drawArrow(ctx, scrPt.x, scrPt.y, scrPt.x, scrPt.y - vel.vy * vScale, "#d67b19", 2);
      drawArrow(ctx, scrPt.x, scrPt.y, scrPt.x + vel.vx * vScale, scrPt.y - vel.vy * vScale, "#095f76", 2.5);
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
  // Presets Bar Population per Mode
  // ==========================================================================

  function updatePresetBar() {
    if (!presetPillsContainer) return;
    presetPillsContainer.innerHTML = "";

    if (state.mode === "monkey") {
      btnQuickModeAction.innerHTML = "<span>🎯</span> Auto-Aim Directly";
      btnQuickModeAction.style.display = "inline-flex";

      addPresetPill("Classic Intercept (26 m/s)", true, () => {
        state.monkey.v0 = 26.0;
        state.monkey.xm = 25.0;
        state.monkey.ym = 16.0;
        state.monkey.thetaDeg = 32.6;
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("monkey", "classic");
        updatePredictionQuiz();
      });

      addPresetPill("Slow Feed (18 m/s)", false, () => {
        state.monkey.v0 = 18.0;
        state.monkey.xm = 25.0;
        state.monkey.ym = 16.0;
        state.monkey.thetaDeg = 32.6;
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("monkey", "slow");
        updatePredictionQuiz();
      });

      addPresetPill("High Fast Feed (40 m/s)", false, () => {
        state.monkey.v0 = 40.0;
        state.monkey.xm = 25.0;
        state.monkey.ym = 16.0;
        state.monkey.thetaDeg = 32.6;
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("monkey", "fast");
        updatePredictionQuiz();
      });

      addPresetPill("Zero-Gravity (g = 0)", false, () => {
        state.monkey.g = 0;
        document.getElementById("simGravity").value = "0.00";
        state.showZeroG = true;
        toggleZeroG.classList.add("active");
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("monkey", "zerog");
        updatePredictionQuiz();
      });

    } else if (state.mode === "mark-rober") {
      btnQuickModeAction.innerHTML = "<span>📐</span> Load Worksheet Setup";
      btnQuickModeAction.style.display = "inline-flex";

      addPresetPill("Worksheet Default (15 m/s, 40°)", true, () => {
        state.markRober.v0 = 15.0;
        state.markRober.alphaDeg = 40.0;
        state.markRober.xBoard = 5.0;
        state.markRober.ceilingY = 7.0;
        state.markRober.g = 10.0;
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("mark-rober", "default");
        updatePredictionQuiz();
      });

      addPresetPill("Low Ceiling Test (5.5m)", false, () => {
        state.markRober.v0 = 15.0;
        state.markRober.alphaDeg = 40.0;
        state.markRober.xBoard = 5.0;
        state.markRober.ceilingY = 5.5;
        state.markRober.g = 10.0;
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("mark-rober", "low-ceiling");
        updatePredictionQuiz();
      });

      addPresetPill("Long Throw (10m Board)", false, () => {
        state.markRober.v0 = 20.0;
        state.markRober.alphaDeg = 45.0;
        state.markRober.xBoard = 10.0;
        state.markRober.ceilingY = 8.5;
        state.markRober.g = 10.0;
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("mark-rober", "long-throw");
        updatePredictionQuiz();
      });

    } else if (state.mode === "classroom") {
      btnQuickModeAction.style.display = "none";

      const curType = state.classroom.problemType || "cliff-building";

      addPresetPill("🏔️ Lecture Notes: 320m Cliff & 70m Building", curType === "cliff-building", () => {
        state.classroom.problemType = "cliff-building";
        state.classroom.y0 = 320;
        state.classroom.v0 = 42.0;
        state.classroom.thetaDeg = 30.0;
        state.classroom.x1 = 230;
        state.classroom.x2 = 310;
        state.classroom.bldgHeight = 70;
        state.classroom.g = 10.0;
        updateClassroomParamControls("cliff-building");
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("classroom", "cliff-building");
        updatePredictionQuiz();
      });

      addPresetPill("⛰️ Problem 47: 100m Cliff Launch", curType === "cliff-100m", () => {
        state.classroom.problemType = "cliff-100m";
        state.classroom.y0 = 100.0;
        state.classroom.v0 = 66.4;
        state.classroom.thetaDeg = 0.0;
        state.classroom.x1 = 0.0;
        state.classroom.x2 = 0.0;
        state.classroom.bldgHeight = 0.0;
        state.classroom.g = 9.8;
        updateClassroomParamControls("cliff-100m");
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("classroom", "cliff-100m");
        updatePredictionQuiz();
      });

      addPresetPill("⚽ Problem 48: Soccer Player Kick", curType === "soccer", () => {
        state.classroom.problemType = "soccer";
        state.classroom.y0 = 0.0;
        state.classroom.v0 = 23.3;
        state.classroom.thetaDeg = 31.0;
        state.classroom.x1 = 49.0;
        state.classroom.x2 = 52.0;
        state.classroom.bldgHeight = 2.44;
        state.classroom.g = 9.8;
        updateClassroomParamControls("soccer");
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("classroom", "soccer");
        updatePredictionQuiz();
      });

      addPresetPill("🎾 Problem 49: Tennis Serve Challenge", curType === "tennis", () => {
        state.classroom.problemType = "tennis";
        state.classroom.y0 = 2.5;
        state.classroom.v0 = 40.0;
        state.classroom.thetaDeg = 0.0;
        state.classroom.x1 = 12.0;
        state.classroom.x2 = 18.4;
        state.classroom.bldgHeight = 0.92;
        state.classroom.g = 9.8;
        updateClassroomParamControls("tennis");
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("classroom", "tennis");
        updatePredictionQuiz();
      });

      addPresetPill("📦 Problem 46: Tabletop Box Roll-Off", curType === "box-drop", () => {
        state.classroom.problemType = "box-drop";
        state.classroom.y0 = 2.0;
        state.classroom.v0 = 5.0;
        state.classroom.thetaDeg = 0.0;
        state.classroom.x1 = 0.0;
        state.classroom.x2 = 0.0;
        state.classroom.bldgHeight = 0.0;
        state.classroom.g = 9.8;
        updateClassroomParamControls("box-drop");
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("classroom", "box-drop");
        updatePredictionQuiz();
      });

      // Synchronize parameter controls for the current classroom problem
      updateClassroomParamControls(curType);

    } else {
      btnQuickModeAction.style.display = "none";
      addPresetPill("45° Maximum Range", true, () => {
        state.sandbox.v0 = 25.0;
        state.sandbox.thetaDeg = 45.0;
        state.sandbox.y0 = 0;
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("sandbox", "max-range");
        updatePredictionQuiz();
      });
      addPresetPill("Elevated Launch (15m, 30°)", false, () => {
        state.sandbox.v0 = 25.0;
        state.sandbox.thetaDeg = 30.0;
        state.sandbox.y0 = 15.0;
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("sandbox", "elevated");
        updatePredictionQuiz();
      });
    }

    updateInquiryScenarioCard(state.mode);
  }

  function addPresetPill(text, isActive, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `preset-pill ${isActive ? 'active' : ''}`;
    btn.textContent = text;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-pill").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      onClick();
    });
    presetPillsContainer.appendChild(btn);
  }

  function updateClassroomParamControls(pType) {
    const lblV0 = document.getElementById("labelClassV0");
    const lblAngle = document.getElementById("labelClassAngle");
    const lblCliffH = document.getElementById("labelClassCliffH");
    const inV0 = document.getElementById("classV0");
    const inAngle = document.getElementById("classAngle");
    const inCliffH = document.getElementById("classCliffH");
    const obstGroup = document.getElementById("classObstacleGroup");
    const specsCard = document.getElementById("classScenarioSpecsCard");

    if (!lblV0 || !lblAngle || !lblCliffH || !inV0 || !inAngle || !inCliffH) return;

    if (pType === "tennis") {
      lblV0.innerHTML = `Serve Speed (<span class="math-expr">v<sub>0</sub></span>):`;
      inV0.min = "20"; inV0.max = "60"; inV0.step = "0.5";
      lblAngle.innerHTML = `Serve Angle (<span class="math-expr">θ</span>):`;
      inAngle.min = "-5"; inAngle.max = "15"; inAngle.step = "0.5";
      lblCliffH.innerHTML = `Serve Contact Height (<span class="math-expr">h<sub>0</sub></span>):`;
      inCliffH.min = "1.5"; inCliffH.max = "3.5"; inCliffH.step = "0.05";
      if (obstGroup) obstGroup.style.display = "none";
      if (specsCard) {
        specsCard.style.display = "block";
        specsCard.innerHTML = `
          <strong>🎾 Regulation Tennis Court Specifications:</strong><br>
          • <strong>Net:</strong> Distance <span class="math-expr">x = 12.0 m</span> · Height <span class="math-expr">h = 0.92 m</span> (at center)<br>
          • <strong>Service Line:</strong> Boundary <span class="math-expr">x = 18.4 m</span> from baseline (<span class="math-expr">12.0 + 6.4 m</span>)<br>
          • <strong>Flat Serve Rule:</strong> Must clear the net (<span class="math-expr">y &gt; 0.92 m</span>) and land before the service line (<span class="math-expr">x ≤ 18.4 m</span>).
        `;
      }
    } else if (pType === "soccer") {
      lblV0.innerHTML = `Kick Speed (<span class="math-expr">v<sub>0</sub></span>):`;
      inV0.min = "10"; inV0.max = "40"; inV0.step = "0.1";
      lblAngle.innerHTML = `Launch Angle (<span class="math-expr">θ</span>):`;
      inAngle.min = "15"; inAngle.max = "60"; inAngle.step = "0.5";
      lblCliffH.innerHTML = `Pitch Elevation (<span class="math-expr">h<sub>0</sub></span>):`;
      inCliffH.min = "0"; inCliffH.max = "5"; inCliffH.step = "0.1";
      if (obstGroup) obstGroup.style.display = "none";
      if (specsCard) {
        specsCard.style.display = "block";
        specsCard.innerHTML = `
          <strong>⚽ Free Kick Pitch Specifications:</strong><br>
          • <strong>Defensive Wall:</strong> Distance <span class="math-expr">x = 9.15 m</span> (10 yards) · Wall height <span class="math-expr">2.00 m</span><br>
          • <strong>Goal Target:</strong> Distance <span class="math-expr">x = 49.0 m</span> · Crossbar height <span class="math-expr">2.44 m</span> (8 ft)<br>
          • <strong>Velocity Components:</strong> <span class="math-expr">v_x = 20.0 m/s</span> · <span class="math-expr">v_y = 12.0 m/s</span> (<span class="math-expr">v_0 = 23.3 m/s</span> at <span class="math-expr">θ = 31.0°</span>).
        `;
      }
    } else if (pType === "box-drop") {
      lblV0.innerHTML = `Roll-Off Speed (<span class="math-expr">v<sub>0</sub></span>):`;
      inV0.min = "1"; inV0.max = "20"; inV0.step = "0.5";
      lblAngle.innerHTML = `Roll-Off Angle (<span class="math-expr">θ</span>):`;
      inAngle.min = "0"; inAngle.max = "0"; inAngle.step = "0";
      lblCliffH.innerHTML = `Tabletop Height (<span class="math-expr">h<sub>0</sub></span>):`;
      inCliffH.min = "0.5"; inCliffH.max = "10"; inCliffH.step = "0.1";
      if (obstGroup) obstGroup.style.display = "none";
      if (specsCard) {
        specsCard.style.display = "block";
        specsCard.innerHTML = `
          <strong>📦 Problem 46 Tabletop Specifications:</strong><br>
          • Table height <span class="math-expr">h_0 = 2.0 m</span> · Horizontal roll-off <span class="math-expr">v_0 = 5.0 m/s</span> (<span class="math-expr">θ = 0°</span>).
        `;
      }
    } else if (pType === "cliff-100m") {
      lblV0.innerHTML = `Launch Speed (<span class="math-expr">v<sub>0</sub></span>):`;
      inV0.min = "10"; inV0.max = "120"; inV0.step = "0.5";
      lblAngle.innerHTML = `Launch Angle (<span class="math-expr">θ</span>):`;
      inAngle.min = "0"; inAngle.max = "0"; inAngle.step = "0";
      lblCliffH.innerHTML = `Cliff Height (<span class="math-expr">h<sub>0</sub></span>):`;
      inCliffH.min = "10"; inCliffH.max = "200"; inCliffH.step = "1";
      if (obstGroup) obstGroup.style.display = "none";
      if (specsCard) {
        specsCard.style.display = "block";
        specsCard.innerHTML = `
          <strong>⛰️ Problem 47 Specifications:</strong><br>
          • 100m elevated cliff · Horizontal launch (<span class="math-expr">θ = 0°</span>) · Ground target <span class="math-expr">x = 300 m</span>.
        `;
      }
    } else {
      // Default: cliff-building
      lblV0.innerHTML = `Launch Speed (<span class="math-expr">v<sub>0</sub></span>):`;
      inV0.min = "1"; inV0.max = "100"; inV0.step = "0.5";
      lblAngle.innerHTML = `Angle (<span class="math-expr">θ</span>):`;
      inAngle.min = "0"; inAngle.max = "85"; inAngle.step = "0.5";
      lblCliffH.innerHTML = `Platform / Launch Height (<span class="math-expr">h<sub>0</sub></span>):`;
      inCliffH.min = "0"; inCliffH.max = "400"; inCliffH.step = "1";
      if (obstGroup) obstGroup.style.display = "block";
      if (specsCard) specsCard.style.display = "none";
    }
  }

  function syncSliders() {
    if (state.mode === "monkey") {
      const m = state.monkey;
      document.getElementById("monkeyV0").value = m.v0;
      document.getElementById("monkeyV0Val").textContent = m.v0.toFixed(1) + " m/s";
      document.getElementById("monkeyAngle").value = m.thetaDeg;
      document.getElementById("monkeyAngleVal").textContent = m.thetaDeg.toFixed(1) + "°";
      document.getElementById("monkeyDist").value = m.xm;
      document.getElementById("monkeyDistVal").textContent = m.xm.toFixed(1) + " m";
      document.getElementById("monkeyHeight").value = m.ym;
      document.getElementById("monkeyHeightVal").textContent = m.ym.toFixed(1) + " m";
      document.getElementById("cannonHeight").value = m.y0;
      document.getElementById("cannonHeightVal").textContent = m.y0.toFixed(1) + " m";
    } else if (state.mode === "mark-rober") {
      const mr = state.markRober;
      document.getElementById("roberV0").value = mr.v0;
      document.getElementById("roberV0Val").textContent = mr.v0.toFixed(1) + " m/s";
      document.getElementById("roberAngle").value = mr.alphaDeg;
      document.getElementById("roberAngleVal").textContent = mr.alphaDeg.toFixed(1) + "°";
      document.getElementById("roberBoardX").value = mr.xBoard;
      document.getElementById("roberBoardXVal").textContent = mr.xBoard.toFixed(1) + " m";
      document.getElementById("roberCeiling").value = mr.ceilingY;
      document.getElementById("roberCeilingVal").textContent = mr.ceilingY.toFixed(1) + " m";
      document.getElementById("roberReleaseY").value = mr.y0;
      document.getElementById("roberReleaseYVal").textContent = mr.y0.toFixed(1) + " m";
      document.getElementById("roberGravity").value = mr.g.toFixed(2);
    } else if (state.mode === "classroom") {
      const cp = state.classroom;
      document.getElementById("classV0").value = cp.v0;
      document.getElementById("classV0Val").textContent = cp.v0.toFixed(1) + " m/s";
      document.getElementById("classAngle").value = cp.thetaDeg;
      document.getElementById("classAngleVal").textContent = cp.thetaDeg.toFixed(1) + "°";
      document.getElementById("classCliffH").value = cp.y0;
      document.getElementById("classCliffHVal").textContent = cp.y0.toFixed(cp.y0 % 1 === 0 ? 0 : 2) + " m";
      document.getElementById("classBldgH").value = cp.bldgHeight;
      document.getElementById("classBldgHVal").textContent = cp.bldgHeight.toFixed(cp.bldgHeight % 1 === 0 ? 0 : 2) + " m";
      document.getElementById("classBldgX1").value = cp.x1;
      document.getElementById("classBldgX1Val").textContent = cp.x1.toFixed(0) + " m";
      document.getElementById("classBldgW").value = cp.x2 - cp.x1;
      document.getElementById("classBldgWVal").textContent = (cp.x2 - cp.x1).toFixed(0) + " m";
      const classGravEl = document.getElementById("classGravity");
      if (classGravEl) {
        classGravEl.value = (Math.abs(cp.g - 10.0) < 0.05 ? "10.00" : "9.80");
      }
    } else if (state.mode === "sandbox") {
      const sb = state.sandbox;
      document.getElementById("sbV0").value = sb.v0;
      document.getElementById("sbV0Val").textContent = sb.v0.toFixed(1) + " m/s";
      document.getElementById("sbAngle").value = sb.thetaDeg;
      document.getElementById("sbAngleVal").textContent = sb.thetaDeg.toFixed(1) + "°";
      document.getElementById("sbY0").value = sb.y0;
      document.getElementById("sbY0Val").textContent = sb.y0.toFixed(1) + " m";
      document.getElementById("sbGravity").value = sb.g;
      document.getElementById("sbGravityVal").textContent = sb.g.toFixed(2) + " m/s²";
      updateSandboxGravityButtons();
    }
  }

  function updateSandboxGravityButtons() {
    const curG = state.sandbox.g;
    const btn98 = document.getElementById("btnSbG98");
    const btn10 = document.getElementById("btnSbG10");
    const btnMoon = document.getElementById("btnSbGMoon");
    const btnZero = document.getElementById("btnSbGZero");
    if (btn98) btn98.classList.toggle("active", Math.abs(curG - 9.80) < 0.05);
    if (btn10) btn10.classList.toggle("active", Math.abs(curG - 10.00) < 0.05);
    if (btnMoon) btnMoon.classList.toggle("active", Math.abs(curG - 1.62) < 0.05);
    if (btnZero) btnZero.classList.toggle("active", Math.abs(curG - 0.00) < 0.01);
  }

  // ==========================================================================
  // Mouse & Touch Interactivity (Canvas Dragging)
  // ==========================================================================

  function setupCanvasDrag() {
    let activeDrag = null;

    canvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        onPointerDown({
          clientX: touch.clientX,
          clientY: touch.clientY,
          preventDefault: () => e.preventDefault()
        });
      }
    }, { passive: false });

    window.addEventListener("touchmove", (e) => {
      if (activeDrag && e.touches.length === 1) {
        const touch = e.touches[0];
        onPointerMove({ clientX: touch.clientX, clientY: touch.clientY });
        if (e.cancelable) e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener("touchend", onPointerUp);

    function getLauncherPivot() {
      if (state.mode === "monkey") {
        return { x: state.monkey.x0, y: state.monkey.y0 };
      } else if (state.mode === "mark-rober") {
        return { x: state.markRober.x0, y: state.markRober.y0 };
      } else if (state.mode === "classroom") {
        return { x: state.classroom.x0, y: state.classroom.y0 };
      } else if (state.mode === "sandbox") {
        return { x: state.sandbox.x0, y: state.sandbox.y0 };
      }
      return { x: 0, y: 0 };
    }

    function onPointerDown(e) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const bounds = getViewportBounds();

      // Check Cannon Launcher pivot in screen space (hit radius: 75px covers barrel + pedestal)
      const pivot = getLauncherPivot();
      const lScreen = worldToScreen(pivot.x, pivot.y, bounds);
      const dLauncher = Math.hypot(sx - lScreen.x, sy - lScreen.y);

      if (dLauncher <= 75) {
        if (state.mode === "classroom") {
          const cpType = state.classroom.problemType || "cliff-building";
          if (cpType === "tennis" || cpType === "box-drop" || cpType === "cliff-100m") {
            // Angle is locked to 0° for these horizontal packet problems
            return;
          }
        }
        activeDrag = "cannonAngle";
        canvas.style.cursor = "grabbing";
        if (e.preventDefault) e.preventDefault();
        return;
      }

      // Check Monkey Target in Monkey mode (hit radius: 50px)
      if (state.mode === "monkey") {
        const m = state.monkey;
        const mScreen = worldToScreen(m.xm, m.ym, bounds);
        if (Math.hypot(sx - mScreen.x, sy - mScreen.y) <= 50) {
          activeDrag = "monkeyTarget";
          canvas.style.cursor = "grabbing";
          if (e.preventDefault) e.preventDefault();
          return;
        }
      }

      // Check Dartboard in Mark Rober mode (hit radius: 50px)
      if (state.mode === "mark-rober") {
        const mr = state.markRober;
        const dScreen = worldToScreen(mr.xBoard, mr.boardY, bounds);
        if (Math.hypot(sx - dScreen.x, sy - dScreen.y) <= 50) {
          activeDrag = "dartboard";
          canvas.style.cursor = "grabbing";
          if (e.preventDefault) e.preventDefault();
          return;
        }
      }
    }

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const bounds = getViewportBounds();

      if (!activeDrag) {
        const pivot = getLauncherPivot();
        const lScreen = worldToScreen(pivot.x, pivot.y, bounds);
        const dLauncher = Math.hypot(sx - lScreen.x, sy - lScreen.y);

        if (dLauncher <= 75) {
          if (state.mode === "classroom") {
            const cpType = state.classroom.problemType || "cliff-building";
            if (cpType === "tennis" || cpType === "box-drop" || cpType === "cliff-100m") {
              // Not draggable
            } else {
              canvas.style.cursor = "grab";
              return;
            }
          } else {
            canvas.style.cursor = "grab";
            return;
          }
        }
        if (state.mode === "monkey") {
          const m = state.monkey;
          const mScreen = worldToScreen(m.xm, m.ym, bounds);
          if (Math.hypot(sx - mScreen.x, sy - mScreen.y) <= 50) {
            canvas.style.cursor = "grab";
            return;
          }
        }
        if (state.mode === "mark-rober") {
          const mr = state.markRober;
          const dScreen = worldToScreen(mr.xBoard, mr.boardY, bounds);
          if (Math.hypot(sx - dScreen.x, sy - dScreen.y) <= 50) {
            canvas.style.cursor = "grab";
            return;
          }
        }
        canvas.style.cursor = "crosshair";
        return;
      }

      if (activeDrag === "cannonAngle") {
        const pivot = getLauncherPivot();
        const lScreen = worldToScreen(pivot.x, pivot.y, bounds);
        const dx = sx - lScreen.x;
        const dy = lScreen.y - sy; // Screen Y is inverted
        let deg = Math.atan2(dy, dx) * (180 / Math.PI);

        if (state.mode === "classroom") {
          deg = Math.max(0, Math.min(85, Math.round(deg * 2) / 2));
          state.classroom.thetaDeg = deg;
        } else if (state.mode === "sandbox") {
          deg = Math.max(0, Math.min(85, Math.round(deg * 2) / 2));
          state.sandbox.thetaDeg = deg;
        } else if (state.mode === "monkey") {
          deg = Math.max(-10, Math.min(80, Math.round(deg * 2) / 2));
          state.monkey.thetaDeg = deg;
        } else if (state.mode === "mark-rober") {
          deg = Math.max(10, Math.min(80, Math.round(deg * 2) / 2));
          state.markRober.alphaDeg = deg;
        }
        syncSliders();
        resetSimulation();
      } else if (activeDrag === "monkeyTarget") {
        const world = screenToWorld(sx, sy, bounds);
        const newX = Math.max(15, Math.min(40, Math.round(world.x)));
        const newY = Math.max(6, Math.min(25, Number(world.y.toFixed(1))));
        state.monkey.xm = newX;
        state.monkey.ym = newY;
        syncSliders();
        resetSimulation();
      } else if (activeDrag === "dartboard") {
        const world = screenToWorld(sx, sy, bounds);
        const newX = Math.max(3, Math.min(15, Number(world.x.toFixed(1))));
        state.markRober.xBoard = newX;
        syncSliders();
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
  // Trials Logger & CSV
  // ==========================================================================

  function logTrial(mode, v0, theta, tHit, finalX, finalY, result) {
    const trial = {
      id: state.trials.length + 1,
      mode: mode,
      v0: v0.toFixed(1),
      theta: theta.toFixed(1),
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
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--subtle); padding:1rem;">No trials logged yet. Fire a projectile!</td></tr>';
      return;
    }

    tbody.innerHTML = state.trials.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${t.mode}</td>
        <td>${t.v0}</td>
        <td>${t.theta}°</td>
        <td>${t.tHit}</td>
        <td>${t.finalX}</td>
        <td>${t.finalY}</td>
        <td style="font-weight:700; color:${t.result.includes('CAUGHT') || t.result.includes('BULLSEYE') || t.result.includes('CLEARED') ? 'var(--success)' : 'var(--error)'};">${t.result}</td>
      </tr>
    `).join("");
  }

  function exportCSV() {
    if (state.trials.length === 0) {
      alert("No trial data to export yet. Please launch a projectile first!");
      return;
    }
    const headers = ["Trial", "Mode", "v0 (m/s)", "Angle (deg)", "Flight Time (s)", "Final x (m)", "Final y (m)", "Result"];
    const rows = state.trials.map(t => [t.id, t.mode, t.v0, t.theta, t.tHit, t.finalX, t.finalY, `"${t.result}"`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "projectile_motion_trials.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==========================================================================
  // Student Challenge & Prediction Engine
  // ==========================================================================

  let currentQuiz = null;
  let currentQuizIndex = 0;

  const scenarioQuizzes = {
    "monkey": [
      {
        title: "🐵 Feed the Monkey: Sightline Aiming",
        prompt: "Where must the cannon aim relative to the falling monkey to guarantee an intercept before ground impact?",
        options: [
          { text: "Directly along the line of sight toward the monkey", correct: true, explanation: "Because gravity accelerates both objects downward at identical -g, both drop the exact same vertical distance (½gt²) from the straight sightline. Aiming directly guarantees intercept at any launch speed!" },
          { text: "Above the monkey to compensate for gravitational bullet drop", correct: false, explanation: "Since the monkey drops simultaneously, aiming above will cause the banana to pass over the falling monkey's head." },
          { text: "Below the monkey to intercept where the monkey will be", correct: false, explanation: "Gravity acts on the banana too! Aiming below will cause the projectile to fall beneath the monkey." }
        ]
      },
      {
        title: "🐵 Feed the Monkey: Launch Speed Invariance",
        prompt: "If launch speed v₀ is reduced from 30 m/s to 18 m/s while maintaining direct sightline aim, what happens?",
        options: [
          { text: "The banana still hits the monkey, but intercept happens at a lower altitude", correct: true, explanation: "The geometric line-of-sight cancellation holds for any speed. A slower speed takes longer to reach the monkey's distance, so both objects fall further, meeting closer to the ground!" },
          { text: "The banana misses because slower projectiles curve downward much more steeply", correct: false, explanation: "Both objects experience the exact same downward acceleration g = 9.8 m/s² regardless of launch speed." },
          { text: "The monkey reaches the ground before the banana arrives, causing a miss", correct: false, explanation: "Provided the minimum required speed is met (v0 ≥ xm / sqrt(2ym/g)), intercept always occurs before ground contact." }
        ]
      }
    ],
    "cliff-building": [
      {
        title: "🏔️ Lecture Notes: Building Obstacle Clearance",
        prompt: "A projectile is launched from the 320 m cliff at 42 m/s and 30° above horizontal. Standing between x = 230 m and 310 m is a 70 m tall building. Does it clear the roof at x = 230 m?",
        options: [
          { text: "Yes, it clears the 70 m roof by over 180 meters (y = 257.0 m)", correct: true, explanation: "At x = 230 m, flight time is t = 230 / (42 · cos 30°) = 6.32 s. Vertical position y(6.32) = 320 + 21(6.32) - 4.9(6.32)² = 257.0 m, which is 187 m above the 70 m roof!" },
          { text: "No, it strikes the front vertical wall of the building below 70 m", correct: false, explanation: "At x = 230 m, y = 257 m, well above the 70 m building height." },
          { text: "It clears the front face but crashes onto the rooftop near x = 280 m", correct: false, explanation: "At x = 310 m (the back edge), y(8.52 s) = 143.1 m, still far above the 70 m rooftop!" }
        ]
      },
      {
        title: "🏔️ Lecture Notes: Peak Apex Altitude",
        prompt: "At what time does the projectile launched from the 320 m cliff at 42 m/s (30°) reach its peak altitude above ground?",
        options: [
          { text: "t = 2.14 s (reaching apex height y_max = 342.5 m)", correct: true, explanation: "Setting vy(t) = v0y - gt = 0 gives t = (42 · sin 30°) / 9.8 = 21 / 9.8 = 2.14 s. Then y_max = 320 + (21)² / (2 · 9.8) = 342.5 m." },
          { text: "t = 4.29 s at ground level", correct: false, explanation: "4.29 s is the time to return to launch altitude (y = 320 m), not peak apex." },
          { text: "Apex occurs immediately at launch (t = 0)", correct: false, explanation: "Because launch angle is +30° above horizontal, the projectile initially rises upwards until vy = 0." }
        ]
      }
    ],
    "cliff-100m": [
      {
        title: "⛰️ Problem 47: Motion Independence",
        prompt: "Rock A is dropped vertically from rest from the 100 m cliff. Rock B is simultaneously fired horizontally at 66.4 m/s. Which rock hits the ground first?",
        options: [
          { text: "Both rocks strike the ground at the exact same instant (t = 4.52 s)", correct: true, explanation: "Horizontal and vertical motions are completely independent! Both start with v0y = 0 and accelerate downward at ay = -9.8 m/s², so both take t = sqrt(2h/g) = sqrt(200/9.8) = 4.52 s to hit the ground." },
          { text: "Rock A hits first because it travels a shorter straight vertical distance", correct: false, explanation: "Vertical acceleration is identical for both; horizontal velocity does not slow down vertical descent." },
          { text: "Rock B hits first because its total speed is much higher", correct: false, explanation: "Speed along the x-axis contributes zero downward acceleration." }
        ]
      },
      {
        title: "⛰️ Problem 47: Target Range Launch Speed",
        prompt: "To hit a ground target located 300 m from the base of the 100 m cliff with a horizontal launch, what initial speed v₀ is required?",
        options: [
          { text: "v₀ = 66.4 m/s (Δx / t_fall = 300 m / 4.52 s)", correct: true, explanation: "Fall time is t = sqrt(2 · 100 / 9.8) = 4.518 s. Since horizontal velocity is constant, v0 = Δx / t = 300 / 4.518 = 66.4 m/s." },
          { text: "v₀ = 30.0 m/s", correct: false, explanation: "At 30 m/s, the projectile only reaches Δx = 30 · 4.52 = 135.5 m, falling far short of the 300 m target." },
          { text: "v₀ = 100.0 m/s", correct: false, explanation: "At 100 m/s, Δx = 100 · 4.52 = 452 m, overshooting the target by 152 m." }
        ]
      }
    ],
    "soccer": [
      {
        title: "⚽ Problem 48: Defensive Wall Clearance",
        prompt: "A soccer ball is kicked with vx = 20 m/s and vy = 12 m/s. A 2.44 m tall defensive wall stands at x = 49.0 m. Does the ball clear the wall?",
        options: [
          { text: "No, the ball has already hit the pitch at ground level right at x = 49.0 m", correct: true, explanation: "Total hang time is t = 2 · v0y / g = 2(12) / 9.8 = 2.449 s. The horizontal range is R = vx · t = 20 · 2.449 = 48.98 m ≈ 49.0 m. The ball strikes the pitch right at the wall base!" },
          { text: "Yes, it flies over the top of the wall with over 3 meters of clearance", correct: false, explanation: "At t = 2.45 s, y ≈ 0 m, so it does not clear a 2.44 m elevated obstacle." },
          { text: "Yes, it passes through the wall at its apex", correct: false, explanation: "Apex occurred much earlier at t = 12/9.8 = 1.22 s and x = 20(1.22) = 24.5 m." }
        ]
      },
      {
        title: "⚽ Problem 48: Maximum Apex Altitude",
        prompt: "What is the maximum height above the pitch reached by this soccer kick (v0y = 12 m/s)?",
        options: [
          { text: "y_max = 7.35 m (v0y² / 2g = 144 / 19.6)", correct: true, explanation: "Using kinematic formula vy² = v0y² - 2gΔy: at apex vy = 0, so Δy = (12)² / (2 · 9.8) = 144 / 19.6 = 7.35 m." },
          { text: "y_max = 12.0 m", correct: false, explanation: "12 m/s is the initial vertical velocity, not the altitude in meters." },
          { text: "y_max = 24.5 m", correct: false, explanation: "24.5 m is the horizontal distance x to apex, not the vertical altitude." }
        ]
      }
    ],
    "tennis": [
      {
        title: "🎾 Problem 49: Net Clearance & Court Fault",
        prompt: "A tennis player strikes a horizontal serve (v₀ = 40 m/s) from height 2.50 m. The 0.92 m net is at x = 12.0 m, and the service line is at x = 18.4 m. What is the outcome?",
        options: [
          { text: "Clears the net easily (y = 2.06 m), but FAULTS long at x = 28.6 m (> 18.4 m)", correct: true, explanation: "Time to net is t = 12/40 = 0.30 s. Net height y = 2.50 - ½(9.8)(0.30)² = 2.06 m (> 0.92 m, clears by 1.14 m!). But court landing time is t = sqrt(2 · 2.5 / 9.8) = 0.714 s, giving range x = 40 · 0.714 = 28.6 m, landing deep beyond the 18.4 m service box boundary!" },
          { text: "Hits the net below 0.92 m and drops back", correct: false, explanation: "The ball is at 2.06 m when crossing the net, clearing it by over 1.1 meters." },
          { text: "Clears the net and lands legally inside the 18.4 m service box", correct: false, explanation: "At 40 m/s horizontal speed, the landing range is 28.6 m, which is 10.2 meters past the service line." }
        ]
      },
      {
        title: "🎾 Problem 49: Maximum Legal Serve Speed",
        prompt: "To land right on the 18.4 m service line from a 2.50 m horizontal strike, what would the serve speed need to be?",
        options: [
          { text: "v₀ = 25.8 m/s (18.4 m / 0.714 s)", correct: true, explanation: "With fall time t = 0.714 s, hitting the 18.4 m boundary requires v0 = 18.4 / 0.714 = 25.77 m/s ≈ 25.8 m/s (clearing the net at y = 1.50 m)." },
          { text: "v₀ = 40.0 m/s", correct: false, explanation: "40 m/s causes the serve to sail long to 28.6 m." },
          { text: "v₀ = 50.0 m/s", correct: false, explanation: "Higher speed increases the landing range even further." }
        ]
      }
    ],
    "box-drop": [
      {
        title: "📦 Problem 46: Tabletop Roll-Off Height Scaling",
        prompt: "A block rolls off a 2.0 m table at 5.0 m/s. If the table height is quadrupled to 8.0 m at the same horizontal speed, how does the landing distance Δx change?",
        options: [
          { text: "Landing distance doubles (2×)", correct: true, explanation: "Fall time scales as sqrt(h): t = sqrt(2h/g). Quadrupling height (4h) doubles the time (sqrt(4) = 2). Since Δx = vx · t, the landing range exactly doubles from 3.19 m to 6.39 m!" },
          { text: "Landing distance quadruples (4×)", correct: false, explanation: "Displacement y depends quadratically on time (y = ½gt²), so time scales as sqrt(h), not linearly with h." },
          { text: "Landing distance stays the same because horizontal speed is unchanged", correct: false, explanation: "Although vx is constant, more time in the air allows the object to travel further horizontally." }
        ]
      }
    ],
    "mark-rober": [
      {
        title: "🎯 Mark Rober: Ceiling Clearance",
        prompt: "If a dart is thrown with v₀ = 20 m/s at 45° from y₀ = 1.8 m under an 8.5 m ceiling, does it collide with the ceiling?",
        options: [
          { text: "Yes, apex altitude is 12.0 m, which exceeds the 8.5 m ceiling beam", correct: true, explanation: "v0y = 20 · sin 45° = 14.14 m/s. Theoretical apex is y_max = 1.8 + (14.14)² / (2 · 9.8) = 1.8 + 10.2 = 12.0 m. Since 12.0 m > 8.5 m, the dart strikes the ceiling!" },
          { text: "No, it clears smoothly under the 8.5 m ceiling", correct: false, explanation: "Apex altitude 12.0 m is higher than the 8.5 m ceiling limit." },
          { text: "The dart never rises above release height 1.8 m", correct: false, explanation: "The upward launch velocity v0y = 14.14 m/s causes significant vertical rise." }
        ]
      }
    ],
    "sandbox": [
      {
        title: "🧪 Sandbox: Maximum Range Launch Angle",
        prompt: "For projectile motion over level ground with negligible air resistance, which launch angle achieves maximum horizontal range?",
        options: [
          { text: "θ = 45.0° (where sin(2θ) = 1)", correct: true, explanation: "The level-ground range formula R = (v₀² · sin(2θ)) / g reaches its mathematical maximum when sin(2θ) = 1, which occurs at 2θ = 90° ⇒ θ = 45°!" },
          { text: "θ = 60.0° because higher elevation increases hang time", correct: false, explanation: "While 60° gives longer hang time, horizontal velocity vx = v0 cos(60°) is cut in half, reducing overall range." },
          { text: "θ = 30.0° because lower launch yields higher horizontal velocity", correct: false, explanation: "30° gives faster forward speed but insufficient air time to travel as far as 45°." }
        ]
      }
    ]
  };

  function getActiveQuizKey() {
    if (state.mode === "monkey") return "monkey";
    if (state.mode === "mark-rober") return "mark-rober";
    if (state.mode === "classroom") {
      return state.classroom.problemType || "cliff-building";
    }
    return "sandbox";
  }

  function updatePredictionQuiz() {
    const key = getActiveQuizKey();
    const quizList = scenarioQuizzes[key] || scenarioQuizzes["cliff-building"];
    if (!quizList || quizList.length === 0) return;

    if (currentQuizIndex >= quizList.length) {
      currentQuizIndex = 0;
    }
    currentQuiz = quizList[currentQuizIndex];

    const titleEl = document.getElementById("challengeTitle");
    const promptEl = document.getElementById("challengePrompt");
    const optionsCont = document.getElementById("challengeOptionsContainer");
    const feedback = document.getElementById("challengeFeedback");

    if (titleEl) titleEl.textContent = currentQuiz.title;
    if (promptEl) promptEl.textContent = currentQuiz.prompt;
    if (feedback) feedback.style.display = "none";

    if (optionsCont) {
      optionsCont.innerHTML = currentQuiz.options.map((opt, idx) => `
        <label class="radio-item" style="padding: 0.35rem 0.5rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;">
          <input type="radio" name="predChoice" value="${idx}" ${idx === 0 ? "checked" : ""}>
          <span>${opt.text}</span>
        </label>
      `).join("");
    }
  }

  function setupChallenge() {
    const btnCheck = document.getElementById("btnCheckChallenge");
    const feedback = document.getElementById("challengeFeedback");
    const btnNew = document.getElementById("btnNewChallenge");

    if (btnCheck) {
      btnCheck.addEventListener("click", () => {
        const selected = document.querySelector('input[name="predChoice"]:checked');
        if (!selected || !currentQuiz) return;

        const idx = parseInt(selected.value, 10);
        const opt = currentQuiz.options[idx];
        if (!opt) return;

        feedback.style.display = "block";
        if (opt.correct) {
          feedback.style.background = "var(--success-bg)";
          feedback.style.color = "var(--success)";
          feedback.style.border = "1px solid var(--success-border)";
          feedback.innerHTML = `<strong>✅ Correct!</strong> ${opt.explanation}`;
        } else {
          feedback.style.background = "var(--error-bg)";
          feedback.style.color = "var(--error)";
          feedback.style.border = "1px solid var(--error-border)";
          feedback.innerHTML = `<strong>❌ Not quite:</strong> ${opt.explanation}`;
        }
      });
    }

    if (btnNew) {
      btnNew.addEventListener("click", () => {
        const key = getActiveQuizKey();
        const quizList = scenarioQuizzes[key] || scenarioQuizzes["cliff-building"];
        if (quizList && quizList.length > 1) {
          currentQuizIndex = (currentQuizIndex + 1) % quizList.length;
        }
        if (state.mode === "monkey") {
          const speeds = [18.0, 22.0, 26.0, 30.0, 35.0, 42.0];
          state.monkey.v0 = speeds[Math.floor(Math.random() * speeds.length)];
          syncSliders();
          resetSimulation();
        }
        updatePredictionQuiz();
      });
    }

    updatePredictionQuiz();
  }

  // ==========================================================================
  // Initialization & Event Binding
  // ==========================================================================

  function initUI() {
    // Mode Switcher
    modePillBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        modePillBtns.forEach(b => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        state.mode = btn.dataset.mode;
        currentQuizIndex = 0;

        // Switch control panels
        Object.keys(modeControlPanels).forEach(k => {
          if (k === state.mode) {
            modeControlPanels[k].style.display = "block";
            modeControlPanels[k].classList.add("active");
          } else {
            modeControlPanels[k].style.display = "none";
            modeControlPanels[k].classList.remove("active");
          }
        });

        updatePresetBar();
        updatePredictionQuiz();
        resetSimulation();
      });
    });

    // Subtabs in right column
    tabPills.forEach(pill => {
      pill.addEventListener("click", () => {
        tabPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");

        const target = pill.dataset.subtab;
        Object.keys(subtabContents).forEach(k => {
          if (k === target) {
            subtabContents[k].style.display = "block";
            subtabContents[k].classList.add("active");
          } else {
            subtabContents[k].style.display = "none";
            subtabContents[k].classList.remove("active");
          }
        });
      });
    });

    // Activity Guide Drawer Toggle
    btnToggleGuide.addEventListener("click", () => {
      const isOpen = activityGuide.classList.contains("open");
      activityGuide.classList.toggle("open", !isOpen);
      btnToggleGuide.setAttribute("aria-expanded", String(!isOpen));
      btnToggleGuide.textContent = isOpen ? "📘 Guided Activities & How-To" : "✖ Hide Guide";
    });

    btnCloseGuide.addEventListener("click", () => {
      activityGuide.classList.remove("open");
      btnToggleGuide.setAttribute("aria-expanded", "false");
      btnToggleGuide.textContent = "📘 Guided Activities & How-To";
    });

    // Inquiry Problem Scenario Drawer Toggle
    const inquiryHeader = document.getElementById("inquiryHeader");
    const btnToggleInquiry = document.getElementById("btnToggleInquiry");
    if (inquiryHeader) {
      inquiryHeader.addEventListener("click", () => toggleInquiryCard());
      inquiryHeader.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleInquiryCard();
        }
      });
    }
    if (btnToggleInquiry) {
      btnToggleInquiry.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleInquiryCard();
      });
    }

    // Quick Action button in controls bar
    btnQuickModeAction.addEventListener("click", () => {
      if (state.mode === "monkey") {
        const m = state.monkey;
        const directDeg = Math.atan2(m.ym - m.y0, m.xm - m.x0) * (180 / Math.PI);
        m.thetaDeg = parseFloat(directDeg.toFixed(1));
        syncSliders();
        resetSimulation();
      } else if (state.mode === "mark-rober") {
        state.markRober.v0 = 15.0;
        state.markRober.alphaDeg = 40.0;
        state.markRober.xBoard = 5.0;
        state.markRober.ceilingY = 7.0;
        state.markRober.g = 10.0;
        syncSliders();
        resetSimulation();
      } else if (state.mode === "classroom") {
        state.classroom.problemType = "cliff-building";
        state.classroom.y0 = 320;
        state.classroom.v0 = 42.0;
        state.classroom.thetaDeg = 30.0;
        state.classroom.x1 = 230;
        state.classroom.x2 = 310;
        state.classroom.bldgHeight = 70;
        state.classroom.g = 10.0;
        syncSliders();
        resetSimulation();
        updateInquiryScenarioCard("classroom", "cliff-building");
        updatePredictionQuiz();
      }
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

    // Speed Pills
    speedPills.forEach(sp => {
      sp.addEventListener("click", () => {
        speedPills.forEach(p => p.classList.remove("active"));
        sp.classList.add("active");
        state.playbackSpeed = parseFloat(sp.dataset.speed);
      });
    });

    // Floating Toggles
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
      toggleAudio.textContent = sfx.enabled ? "🔊 Audio" : "🔇 Muted";
    });
    if (btnAutoFitZoom) {
      btnAutoFitZoom.addEventListener("click", () => {
        resizeCanvas();
        render();
      });
    }

    // Sliders Event Binding
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

    document.getElementById("simGravity").addEventListener("change", (e) => {
      state.monkey.g = parseFloat(e.target.value);
      resetSimulation();
    });

    bindSlider("roberV0", "roberV0Val", state.markRober, "v0", "m/s");
    bindSlider("roberAngle", "roberAngleVal", state.markRober, "alphaDeg", "°");
    bindSlider("roberBoardX", "roberBoardXVal", state.markRober, "xBoard", "m");
    bindSlider("roberCeiling", "roberCeilingVal", state.markRober, "ceilingY", "m");
    bindSlider("roberReleaseY", "roberReleaseYVal", state.markRober, "y0", "m");

    document.getElementById("roberGravity").addEventListener("change", (e) => {
      state.markRober.g = parseFloat(e.target.value);
      resetSimulation();
    });

    bindSlider("classV0", "classV0Val", state.classroom, "v0", "m/s", 1);
    bindSlider("classAngle", "classAngleVal", state.classroom, "thetaDeg", "°", 1);
    bindSlider("classCliffH", "classCliffHVal", state.classroom, "y0", "m", 2);
    bindSlider("classBldgH", "classBldgHVal", state.classroom, "bldgHeight", "m", 2);
    bindSlider("classBldgX1", "classBldgX1Val", state.classroom, "x1", "m", 0);

    const bldgWEl = document.getElementById("classBldgW");
    if (bldgWEl) {
      bldgWEl.addEventListener("input", (e) => {
        const w = parseFloat(e.target.value);
        state.classroom.x2 = state.classroom.x1 + w;
        const disp = document.getElementById("classBldgWVal");
        if (disp) disp.textContent = `${w.toFixed(0)} m`;
        resetSimulation();
      });
    }

    const classGravEl = document.getElementById("classGravity");
    if (classGravEl) {
      classGravEl.addEventListener("change", (e) => {
        state.classroom.g = parseFloat(e.target.value);
        resetSimulation();
      });
    }

    bindSlider("sbV0", "sbV0Val", state.sandbox, "v0", "m/s");
    bindSlider("sbAngle", "sbAngleVal", state.sandbox, "thetaDeg", "°");
    bindSlider("sbY0", "sbY0Val", state.sandbox, "y0", "m", 0);
    bindSlider("sbGravity", "sbGravityVal", state.sandbox, "g", "m/s²", 2);

    const sbGravEl = document.getElementById("sbGravity");
    if (sbGravEl) {
      sbGravEl.addEventListener("input", () => {
        updateSandboxGravityButtons();
      });
    }

    const sbGravPills = [
      { id: "btnSbG98", g: 9.80 },
      { id: "btnSbG10", g: 10.00 },
      { id: "btnSbGMoon", g: 1.62 },
      { id: "btnSbGZero", g: 0.00 }
    ];
    sbGravPills.forEach(({ id, g }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          state.sandbox.g = g;
          if (sbGravEl) sbGravEl.value = g;
          const disp = document.getElementById("sbGravityVal");
          if (disp) disp.textContent = `${g.toFixed(2)} m/s²`;
          updateSandboxGravityButtons();
          resetSimulation();
        });
      }
    });

    // Table actions
    document.getElementById("btnClearLog").addEventListener("click", () => {
      state.trials = [];
      updateTrialTable();
    });
    document.getElementById("btnExportCsv").addEventListener("click", exportCSV);

    setupCanvasDrag();
    setupChallenge();
    updatePresetBar();
  }

  function init() {
    initUI();
    resizeCanvas();
    resetSimulation();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
