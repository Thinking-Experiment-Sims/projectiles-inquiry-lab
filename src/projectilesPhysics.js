/**
 * projectilesPhysics.js
 * 
 * Comprehensive 2D Kinematics and Intercept Engine for The Thinking Experiment:
 * - Vector decomposition (SOH CAHTOA)
 * - Classical projectile trajectory with analytic and discrete modeling
 * - "Feed the Monkey" intercept theorem with free-fall drop equivalence
 * - Mark Rober automated dartboard bullseye height and ceiling collision solver
 * - Classroom Cliff & Obstacle Building collision solver from lecture notes
 * - Synchronized time strobe points and Cornell T-Chart mathematical formulation
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ProjectilesPhysics = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const ProjectilesPhysics = {};

  const DEG_TO_RAD = Math.PI / 180;
  const RAD_TO_DEG = 180 / Math.PI;

  /**
   * Decompose initial velocity into horizontal and vertical components.
   * vx = v0 * cos(theta)
   * vy = v0 * sin(theta)
   */
  ProjectilesPhysics.decomposeVelocity = function (v0, thetaDeg) {
    const angleRad = thetaDeg * DEG_TO_RAD;
    const vx = v0 * Math.cos(angleRad);
    const vy = v0 * Math.sin(angleRad);
    return {
      v0: Number(v0),
      thetaDeg: Number(thetaDeg),
      angleRad: angleRad,
      vx: vx,
      vy: vy
    };
  };

  /**
   * Calculate position at arbitrary time t.
   */
  ProjectilesPhysics.getPositionAtTime = function (params) {
    const x0 = params.x0 || 0;
    const y0 = params.y0 || 0;
    const vx = params.vx || 0;
    const vy = params.vy || 0;
    const g = params.g !== undefined ? params.g : 9.80;
    const t = Math.max(0, params.t || 0);

    const x = x0 + vx * t;
    const y = y0 + vy * t - 0.5 * g * t * t;

    return { x: x, y: y, t: t };
  };

  /**
   * Calculate velocity at arbitrary time t.
   */
  ProjectilesPhysics.getVelocityAtTime = function (params) {
    const vx = params.vx || 0;
    const vy = params.vy || 0;
    const g = params.g !== undefined ? params.g : 9.80;
    const t = Math.max(0, params.t || 0);

    const currentVx = vx;
    const currentVy = vy - g * t;
    const speed = Math.hypot(currentVx, currentVy);
    const angleDeg = Math.atan2(currentVy, currentVx) * RAD_TO_DEG;

    return {
      vx: currentVx,
      vy: currentVy,
      speed: speed,
      angleDeg: angleDeg,
      t: t
    };
  };

  /**
   * Calculate time to reach maximum height (apex).
   * t_apex = vy / g (for vy > 0 and g > 0)
   */
  ProjectilesPhysics.calculateApexTime = function (vy, g) {
    g = g !== undefined ? g : 9.80;
    if (g <= 0 || vy <= 0) return 0;
    return vy / g;
  };

  /**
   * Calculate maximum height reached during flight.
   * h_max = y0 + vy^2 / (2 * g)
   */
  ProjectilesPhysics.calculateMaxHeight = function (y0, vy, g) {
    g = g !== undefined ? g : 9.80;
    y0 = y0 || 0;
    if (g <= 0 || vy <= 0) return y0;
    return y0 + (vy * vy) / (2 * g);
  };

  /**
   * Calculate total time of flight until projectile reaches groundY.
   * y0 + vy * t - 0.5 * g * t^2 = groundY
   */
  ProjectilesPhysics.calculateTimeOfFlight = function (y0, vy, g, groundY) {
    groundY = groundY !== undefined ? groundY : 0;
    g = g !== undefined ? g : 9.80;
    y0 = y0 || 0;

    if (g === 0) {
      if (vy < 0 && y0 > groundY) {
        return (y0 - groundY) / Math.abs(vy);
      }
      return 100; // arbitrary high number if floating in zero-g
    }

    const deltaY = y0 - groundY;
    const discriminant = vy * vy + 2 * g * deltaY;
    if (discriminant < 0) return 0;

    // Quadratic formula root: t = (vy + sqrt(vy^2 + 2*g*deltaY)) / g
    const tFlight = (vy + Math.sqrt(discriminant)) / g;
    return Math.max(0, tFlight);
  };

  /**
   * Calculate horizontal range to landing.
   */
  ProjectilesPhysics.calculateRange = function (x0, y0, vx, vy, g, groundY) {
    x0 = x0 || 0;
    const tFlight = ProjectilesPhysics.calculateTimeOfFlight(y0, vy, g, groundY);
    return x0 + vx * tFlight;
  };

  /**
   * Feed the Monkey Inquiry Solver:
   * Cannon at (x0, y0), Monkey in tree at (xm, ym).
   * Sound startles monkey at t=0 -> monkey free-falls from rest.
   * Line of sight angle: thetaAim = atan2(ym - y0, xm - x0)
   */
  ProjectilesPhysics.calculateMonkeyIntercept = function (params) {
    const x0 = params.x0 || 0;
    const y0 = params.y0 || 0;
    const xm = params.xm !== undefined ? params.xm : 25;
    const ym = params.ym !== undefined ? params.ym : 16;
    const v0 = params.v0 !== undefined ? params.v0 : 25;
    const thetaDeg = params.thetaDeg !== undefined ? params.thetaDeg : 0;
    const g = params.g !== undefined ? params.g : 9.80;
    const catchRadius = params.catchRadius || 0.60;

    const dx = xm - x0;
    const dy = ym - y0;
    const directAimAngleDeg = Math.atan2(dy, dx) * RAD_TO_DEG;

    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const vx = decomp.vx;
    const vy = decomp.vy;

    // Time for banana to reach monkey's horizontal coordinate xm
    const tIntercept = vx > 0 ? dx / vx : 0;

    // Positions at tIntercept
    const dropDist = 0.5 * g * tIntercept * tIntercept;
    const yMonkeyAtTime = ym - dropDist;
    const yBananaAtTime = y0 + vy * tIntercept - dropDist;

    // Line of sight position at xm without gravity
    const yNoGravity = y0 + Math.tan(thetaDeg * DEG_TO_RAD) * dx;

    // Vertical miss distance at xm
    const verticalDeviation = Math.abs(yBananaAtTime - yMonkeyAtTime);

    // Hit evaluation
    const isAimedAtMonkey = Math.abs(thetaDeg - directAimAngleDeg) < 0.5;
    const reachesTreeBeforeGround = yBananaAtTime >= 0 && yMonkeyAtTime >= 0;
    const isHit = reachesTreeBeforeGround && (verticalDeviation <= catchRadius);

    // Monkey ground hit time
    const monkeyGroundTime = g > 0 ? Math.sqrt((2 * ym) / g) : 100;

    return {
      directAimAngleDeg: directAimAngleDeg,
      isAimedAtMonkey: isAimedAtMonkey,
      tIntercept: tIntercept,
      dropDist: dropDist,
      yMonkeyAtTime: yMonkeyAtTime,
      yBananaAtTime: yBananaAtTime,
      yNoGravity: yNoGravity,
      verticalDeviation: verticalDeviation,
      isHit: isHit,
      reachesTreeBeforeGround: reachesTreeBeforeGround,
      monkeyGroundTime: monkeyGroundTime
    };
  };

  /**
   * Mark Rober Automated Dartboard Solver:
   * Mark at x0 = 0, y0 = 1.8m. Dart speed v0, angle alpha.
   * Motorized dartboard at xBoard (default 5.0m).
   * Ceiling height ceilingY (default 7.0m).
   */
  ProjectilesPhysics.calculateMarkRoberDartboard = function (params) {
    const x0 = params.x0 || 0;
    const y0 = params.y0 !== undefined ? params.y0 : 1.80;
    const xBoard = params.xBoard !== undefined ? params.xBoard : 5.0;
    const v0 = params.v0 !== undefined ? params.v0 : 15.0;
    const alphaDeg = params.alphaDeg !== undefined ? params.alphaDeg : 40.0;
    const g = params.g !== undefined ? params.g : 10.0;
    const ceilingY = params.ceilingY !== undefined ? params.ceilingY : 7.0;

    const decomp = ProjectilesPhysics.decomposeVelocity(v0, alphaDeg);
    const vx = decomp.vx;
    const vy = decomp.vy;

    // 1. Time to reach dartboard
    const dx = xBoard - x0;
    const tBoard = vx > 0 ? dx / vx : 0;

    // 2. Dartboard target height H to hit bullseye
    const targetHeightH = y0 + vy * tBoard - 0.5 * g * tBoard * tBoard;

    // 3. Apex / Maximum height of dart
    const tApex = ProjectilesPhysics.calculateApexTime(vy, g);
    const maxDartHeight = ProjectilesPhysics.calculateMaxHeight(y0, vy, g);

    // 4. Workshop Ceiling collision check
    let hitsCeiling = false;
    let tCeiling = null;
    let xCeiling = null;
    const apexExceedsCeiling = maxDartHeight >= ceilingY;

    if (apexExceedsCeiling && g > 0) {
      // y0 + vy*t - 0.5*g*t^2 = ceilingY
      // 0.5*g*t^2 - vy*t + (ceilingY - y0) = 0
      const deltaY = ceilingY - y0;
      const disc = vy * vy - 2 * g * deltaY;
      if (disc >= 0) {
        const tHitCeiling = (vy - Math.sqrt(disc)) / g;
        if (tHitCeiling > 0 && tHitCeiling <= tBoard) {
          hitsCeiling = true;
          tCeiling = tHitCeiling;
          xCeiling = x0 + vx * tCeiling;
        }
      }
    }

    return {
      v0: v0,
      alphaDeg: alphaDeg,
      vx: vx,
      vy: vy,
      xBoard: xBoard,
      tBoard: tBoard,
      targetHeightH: targetHeightH,
      tApex: tApex,
      maxDartHeight: maxDartHeight,
      ceilingY: ceilingY,
      apexExceedsCeiling: apexExceedsCeiling,
      hitsCeiling: hitsCeiling,
      tCeiling: tCeiling,
      xCeiling: xCeiling,
      ceilingMargin: ceilingY - maxDartHeight
    };
  };

  /**
   * Classroom Notes Building Obstacle Solver (Pages 7-8 & 13-14):
   * Cliff at height h0 (e.g. 320m), launch v0 = 42m/s, angle theta = 30 deg.
   * Obstacle building between x1 (230m) and x2 (310m) of height bldgH (70m).
   */
  ProjectilesPhysics.calculateBuildingObstacle = function (params) {
    const x0 = params.x0 || 0;
    const y0 = params.y0 !== undefined ? params.y0 : 320;
    const v0 = params.v0 !== undefined ? params.v0 : 42.0;
    const thetaDeg = params.thetaDeg !== undefined ? params.thetaDeg : 30.0;
    const g = params.g !== undefined ? params.g : 10.0;
    const x1 = params.x1 !== undefined ? params.x1 : 230;
    const x2 = params.x2 !== undefined ? params.x2 : 310;
    const bldgHeight = params.bldgHeight !== undefined ? params.bldgHeight : 70;

    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const vx = decomp.vx;
    const vy = decomp.vy;

    // Peak height
    const tApex = ProjectilesPhysics.calculateApexTime(vy, g);
    const maxH = ProjectilesPhysics.calculateMaxHeight(y0, vy, g);

    // Front edge x1
    const t1 = vx > 0 ? (x1 - x0) / vx : 0;
    const y1 = y0 + vy * t1 - 0.5 * g * t1 * t1;

    // Far edge x2
    const t2 = vx > 0 ? (x2 - x0) / vx : 0;
    const y2 = y0 + vy * t2 - 0.5 * g * t2 * t2;

    // Check collision with front wall or roof
    let collisionType = "none"; // 'front_wall', 'roof', 'none'
    let collisionX = null;
    let collisionY = null;
    let collisionT = null;

    if (y1 <= bldgHeight && y1 >= 0) {
      collisionType = "front_wall";
      collisionX = x1;
      collisionY = y1;
      collisionT = t1;
    } else if (y1 > bldgHeight) {
      // Check if it drops onto the roof between x1 and x2
      // y(t) = bldgHeight => 0.5*g*t^2 - vy*t + (bldgHeight - y0) = 0
      const deltaY = y0 - bldgHeight;
      const disc = vy * vy + 2 * g * deltaY;
      if (disc >= 0) {
        const tRoof = (vy + Math.sqrt(disc)) / g;
        const xRoof = x0 + vx * tRoof;
        if (xRoof >= x1 && xRoof <= x2) {
          collisionType = "roof";
          collisionX = xRoof;
          collisionY = bldgHeight;
          collisionT = tRoof;
        }
      }
    }

    const clearsBuilding = collisionType === "none" && y2 > bldgHeight;

    return {
      vx: vx,
      vy: vy,
      tApex: tApex,
      maxH: maxH,
      t1: t1,
      y1: y1,
      t2: t2,
      y2: y2,
      clearsBuilding: clearsBuilding,
      collisionType: collisionType,
      collisionX: collisionX,
      collisionY: collisionY,
      collisionT: collisionT
    };
  };

  /**
   * Packet 6 Problem 46: Box Rolling Drop
   * Cubical box (height y0 = 2m), horizontal speed v0 = 5 m/s.
   */
  ProjectilesPhysics.calculateBoxDrop = function (params) {
    const y0 = params && params.y0 !== undefined ? params.y0 : 2.0;
    const v0 = params && params.v0 !== undefined ? params.v0 : 5.0;
    const g = params && params.g !== undefined ? params.g : 9.80;

    const tFall = Math.sqrt((2 * y0) / g);
    const range = v0 * tFall;

    return {
      y0: y0,
      v0: v0,
      vx: v0,
      vy0: 0,
      g: g,
      tFall: tFall,
      range: range,
      vyImpact: -g * tFall,
      speedImpact: Math.hypot(v0, -g * tFall)
    };
  };

  /**
   * Packet 6 Problem 47: 100m Cliff Cannonball Launch
   * Cliff height y0 = 100m, lands range x = 300m away.
   */
  ProjectilesPhysics.calculate100mCliff = function (params) {
    const y0 = params && params.y0 !== undefined ? params.y0 : 100.0;
    const targetRange = params && params.targetRange !== undefined ? params.targetRange : 300.0;
    const g = params && params.g !== undefined ? params.g : 9.80;

    const tFall = Math.sqrt((2 * y0) / g);
    const requiredV0 = targetRange / tFall;

    return {
      y0: y0,
      targetRange: targetRange,
      g: g,
      tFall: tFall,
      requiredV0: requiredV0,
      vyImpact: -g * tFall,
      speedImpact: Math.hypot(requiredV0, -g * tFall)
    };
  };

  /**
   * Packet 6 Problem 48: Soccer Player Kick
   * Given horizontal velocity vx = 20 m/s and vertical velocity vy = 12 m/s.
   */
  ProjectilesPhysics.calculateSoccerKick = function (params) {
    const vx = params && params.vx !== undefined ? params.vx : 20.0;
    const vy = params && params.vy !== undefined ? params.vy : 12.0;
    const g = params && params.g !== undefined ? params.g : 9.80;

    const v0 = Math.hypot(vx, vy);
    const thetaDeg = Math.atan2(vy, vx) * RAD_TO_DEG;
    const tApex = vy / g;
    const tFlight = (2 * vy) / g;
    const maxH = 0.5 * vy * tApex; // or 0.5 * g * tApex^2
    const range = vx * tFlight;

    return {
      vx: vx,
      vy: vy,
      v0: v0,
      thetaDeg: thetaDeg,
      g: g,
      tApex: tApex,
      tFlight: tFlight,
      maxH: maxH,
      range: range
    };
  };

  /**
   * Packet 6 Problem 49: Tennis Serve Challenge
   * Horizontal serve at v0 = 40 m/s from height y0 = 2.5m.
   * Net at xNet = 12m, net height hNet = 0.92m.
   * Service court boundary at xCourt = 18.4m (12 + 6.4m).
   */
  ProjectilesPhysics.calculateTennisServe = function (params) {
    const y0 = params && params.y0 !== undefined ? params.y0 : 2.50;
    const v0 = params && params.v0 !== undefined ? params.v0 : 40.0;
    const thetaDeg = params && params.thetaDeg !== undefined ? params.thetaDeg : 0.0;
    const g = params && params.g !== undefined ? params.g : 9.80;
    const xNet = params && params.xNet !== undefined ? params.xNet : 12.0;
    const hNet = params && params.hNet !== undefined ? params.hNet : 0.92;
    const xCourt = params && params.xCourt !== undefined ? params.xCourt : 18.40;

    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const vx = decomp.vx;
    const vy0 = decomp.vy;

    // 1. Check Net Clearance
    const tNet = vx > 0 ? xNet / vx : 0;
    const yNet = y0 + vy0 * tNet - 0.5 * g * tNet * tNet;
    const clearsNet = yNet > hNet;
    const netClearanceMargin = yNet - hNet;

    // 2. Check Ground Landing in Service Court
    // y0 + vy0*t - 0.5*g*t^2 = 0
    let tGround = 0;
    const disc = vy0 * vy0 + 2 * g * y0;
    if (disc >= 0) {
      tGround = (vy0 + Math.sqrt(disc)) / g;
    }
    const xLand = vx * tGround;
    const inServiceCourt = xLand > xNet && xLand <= xCourt;
    const isValidServe = clearsNet && inServiceCourt;

    return {
      y0: y0,
      v0: v0,
      thetaDeg: thetaDeg,
      vx: vx,
      vy0: vy0,
      g: g,
      xNet: xNet,
      hNet: hNet,
      xCourt: xCourt,
      tNet: tNet,
      yNet: yNet,
      clearsNet: clearsNet,
      netClearanceMargin: netClearanceMargin,
      tGround: tGround,
      xLand: xLand,
      inServiceCourt: inServiceCourt,
      isValidServe: isValidServe,
      faultReason: !clearsNet ? "net_hit" : (xLand > xCourt ? "long_out" : "none")
    };
  };

  /**
   * Generate discretized trajectory points including collision detection.
   */
  ProjectilesPhysics.generateTrajectory = function (params) {
    const x0 = params.x0 !== undefined ? params.x0 : 0;
    const y0 = params.y0 !== undefined ? params.y0 : 0;
    const v0 = params.v0 !== undefined ? params.v0 : 20;
    const thetaDeg = params.thetaDeg !== undefined ? params.thetaDeg : 45;
    const g = params.g !== undefined ? params.g : 9.80;
    const groundY = params.groundY !== undefined ? params.groundY : 0;
    const ceilingY = params.ceilingY !== undefined ? params.ceilingY : null;
    const obstacle = params.obstacle || null; // { x1, x2, height }
    const dt = params.dt || 0.01;
    const maxT = params.maxT || 30;

    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const vx = decomp.vx;
    const vy = decomp.vy;

    const points = [];
    let t = 0;
    let collisionOccurred = false;
    let collisionReason = "none";

    while (t <= maxT && !collisionOccurred) {
      const x = x0 + vx * t;
      const y = y0 + vy * t - 0.5 * g * t * t;
      const currentVy = vy - g * t;

      // Check ceiling collision
      if (ceilingY !== null && y >= ceilingY && t > 0.01) {
        points.push({ t: t, x: x, y: ceilingY, vx: vx, vy: 0, speed: vx });
        collisionOccurred = true;
        collisionReason = "ceiling";
        break;
      }

      // Check obstacle collision
      if (obstacle && x >= obstacle.x1 && x <= obstacle.x2) {
        if (y <= obstacle.height) {
          points.push({ t: t, x: x, y: Math.max(obstacle.height, y), vx: vx, vy: currentVy, speed: Math.hypot(vx, currentVy) });
          collisionOccurred = true;
          collisionReason = "obstacle";
          break;
        }
      }

      // Check ground collision
      if (y <= groundY && t > 0.01) {
        // Linear interpolation to exact ground impact point
        const prev = points[points.length - 1] || { t: 0, x: x0, y: y0 };
        const fraction = (prev.y - groundY) / (prev.y - y || 1);
        const exactT = prev.t + (t - prev.t) * fraction;
        const exactX = prev.x + (x - prev.x) * fraction;
        points.push({
          t: exactT,
          x: exactX,
          y: groundY,
          vx: vx,
          vy: vy - g * exactT,
          speed: Math.hypot(vx, vy - g * exactT)
        });
        collisionOccurred = true;
        collisionReason = "ground";
        break;
      }

      points.push({
        t: t,
        x: x,
        y: y,
        vx: vx,
        vy: currentVy,
        speed: Math.hypot(vx, currentVy)
      });

      t += dt;
    }

    return {
      points: points,
      collisionReason: collisionReason,
      totalFlightTime: points[points.length - 1].t,
      landingX: points[points.length - 1].x,
      landingY: points[points.length - 1].y
    };
  };

  /**
   * Generate synchronized strobe points at exact time intervals (e.g. every 0.10s).
   */
  ProjectilesPhysics.generateStrobePoints = function (trajectoryPoints, intervalSec) {
    intervalSec = intervalSec || 0.10;
    if (!trajectoryPoints || trajectoryPoints.length === 0) return [];

    const strobes = [];
    let nextStrobeT = 0;

    for (let i = 0; i < trajectoryPoints.length; i++) {
      const pt = trajectoryPoints[i];
      if (pt.t >= nextStrobeT - 0.0001) {
        strobes.push({
          t: Number(pt.t.toFixed(3)),
          x: pt.x,
          y: pt.y,
          vx: pt.vx,
          vy: pt.vy,
          speed: pt.speed
        });
        nextStrobeT += intervalSec;
      }
    }

    return strobes;
  };

  /**
   * Build Cornell T-Chart mathematical breakdown object.
   */
  ProjectilesPhysics.buildTChartData = function (params) {
    const x0 = params.x0 !== undefined ? params.x0 : 0;
    const y0 = params.y0 !== undefined ? params.y0 : 0;
    const v0 = params.v0 !== undefined ? params.v0 : 20;
    const thetaDeg = params.thetaDeg !== undefined ? params.thetaDeg : 45;
    const g = params.g !== undefined ? params.g : 9.80;
    const t = Math.max(0, params.t || 0);

    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const vx = decomp.vx;
    const vy = decomp.vy;

    const currentX = x0 + vx * t;
    const currentY = y0 + vy * t - 0.5 * g * t * t;
    const currentVy = vy - g * t;

    return {
      givens: {
        x0: x0,
        y0: y0,
        v0: v0,
        thetaDeg: thetaDeg,
        g: g
      },
      horizontal: {
        ax: 0,
        vox: vx,
        vx: vx,
        formula_x: "x = x₀ + v₀ₓ·t",
        sub_x: `${x0.toFixed(1)} + (${vx.toFixed(2)})·(${t.toFixed(2)})`,
        current_x: currentX
      },
      vertical: {
        ay: -g,
        voy: vy,
        vy: currentVy,
        formula_y: "y = y₀ + v₀ᵧ·t + ½·g·t²",
        sub_y: `${y0.toFixed(1)} + (${vy.toFixed(2)})·(${t.toFixed(2)}) + ½·(-${g.toFixed(1)})·(${t.toFixed(2)})²`,
        current_y: currentY,
        formula_vy: "vᵧ = v₀ᵧ + g·t",
        sub_vy: `${vy.toFixed(2)} + (-${g.toFixed(1)})·(${t.toFixed(2)})`
      },
      timeBridge: {
        t: t,
        label: "Time t is the universal link between horizontal and vertical motion"
      }
    };
  };

  return ProjectilesPhysics;
});
