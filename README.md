# Projectiles: Target Intercept & Kinematics Studio

An interactive 2D projectile kinematics virtual laboratory and inquiry simulator created for **The Thinking Experiment** (PhysicsKit).

[![Live Simulation](https://img.shields.io/badge/Live_Simulation-GitHub_Pages-0f7e9b?style=for-the-badge)](https://thinking-experiment-sims.github.io/projectiles-inquiry-lab/)
[![Design System](https://img.shields.io/badge/Design_System-The_Thinking_Experiment-d67b19?style=for-the-badge)](https://github.com/Thinking-Experiment-Sims)

---

## 🎯 Pedagogical Pillars

### 1. Feed the Monkey (Gizmo Activity Inquiry)
- **The Setup**: A banana cannon aims at a monkey in a tree. The sound of the launch startles the monkey, which lets go of the branch and begins free-falling at $t = 0$.
- **The Theorem**: Both the projectile and the falling target accelerate downward at the identical rate ($a_y = -g$). Over flight time $t$, both objects drop by the exact same distance:
  $$\Delta y_{\text{drop}} = \frac{1}{2}gt^2$$
- **The Conclusion**: Aiming directly along the line of sight guarantees an intercept at *any* launch velocity $v_0$ fast enough to reach the target before hitting the ground.
- **Key Features**:
  - Interactive line of sight aiming ray.
  - Synchronized time strobe dots ($\Delta t = 0.10\text{ s}$) with horizontal alignment indicators.
  - Zero-gravity ($g = 0$) ghost trace comparison.
  - Draggable cannon angle, cannon height, and monkey coordinates.

---

### 2. Mark Rober's Automated Dartboard
- **The Setup**: Based on Mark Rober's viral engineering challenge and student worksheet:
  - Launch position: $x_0 = 0\text{ m}$, $y_0 = 1.8\text{ m}$.
  - Launch parameters: $v_0 = 15.0\text{ m/s}$, $\alpha = 40.0^\circ$.
  - Motorized target board at fixed distance $x = 5.0\text{ m}$.
- **Worksheet Questions Solved Real-Time**:
  1. **Bullseye Height ($H$)**:
     $$t = \frac{x}{v_0 \cos\alpha} \approx 0.435\text{ s}$$
     $$H = y_0 + v_0 \sin\alpha\, t - \frac{1}{2}gt^2 = 5.05\text{ m}$$
  2. **Dart Apex ($h_{\max}$) & Workshop Ceiling Clearance**:
     $$h_{\max} = y_0 + \frac{(v_0 \sin\alpha)^2}{2g} = 6.45\text{ m}$$
     - Checks whether $h_{\max} \ge H_{\text{ceiling}}$ to verify if the dart will hit the workshop ceiling before reaching the board.
- **Visuals**:
  - High-speed motorized carriage dynamically sliding along a vertical actuator track.
  - Ceiling clearance detector with collision warnings.

---

### 3. Classroom Kinematics & Cornell T-Chart Engine
- **Classroom 3-Step Methodology**:
  1. Draw diagram and establish coordinate system.
  2. Identify and list Givens ($x_0, y_0, v_0, \theta, g$).
  3. Formulate the Horizontal ($x$) and Vertical ($y$) 2-column T-Chart.
- **T-Chart Structure**:
  - **Horizontal**: $a_x = 0$, $v_x = v_0 \cos\theta = \text{const}$, $x = x_0 + v_{0x}t$
  - **Vertical**: $a_y = -g$, $v_y = v_{0y} - gt$, $y = y_0 + v_{0y}t - \frac{1}{2}gt^2$
  - **Time ($t$) as the Bridge**: Visual connecting bridge illustrating that time links the two independent 1D motions.
- **Curated Problem Presets**:
  - **Cliff & Obstacle Building**: Cliff $h_0 = 320\text{ m}$, $v_0 = 42\text{ m/s}$ at $30^\circ$, building between $230\text{ m}$ and $310\text{ m}$ of height $70\text{ m}$ (Pages 7–8, 13–14 of lecture notes).
  - **Shark Pool Horizontal Launch**: $v_{0y} = 0$, demonstrating that fall time depends purely on height: $t = \sqrt{2h/g}$ (Pages 5, 11 of lecture notes).

---

## 🎨 Design System Compliance

- **Primary Teal Header**: `#0f7e9b`
- **Interactive Amber Accent**: `#d67b19`
- **Background**: Pure white `#ffffff`
- **Typography**: `Inter`, `IBM Plex Sans`, and monospace for data.
- **Strict Prohibition**: Zero purple (`#59118e`) or gold (`#ffc61e`).

---

## 🧪 Testing

Automated physical tests run via Node's native test runner:

```bash
npm test
```

Verifies vector decomposition (SOH CAHTOA), the Feed the Monkey theorem, Mark Rober worksheet solutions, building collision detection, and strobe time step monotonicity.

---

## 📜 License
ISC &copy; Vladimir Lopez & The Thinking Experiment.
