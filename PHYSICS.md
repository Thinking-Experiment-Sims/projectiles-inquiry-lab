# Physics Guide: 2D Projectile Kinematics & Target Intercept Studio

A comprehensive theoretical and pedagogical guide for **The Thinking Experiment (PhysicsKit)** Projectiles Inquiry Studio.

[![Simulation Hub](https://img.shields.io/badge/Simulation_Hub-The_Thinking_Experiment-0f7e9b?style=flat-square)](https://thinking-experiment-sims.github.io/interactive-physics/)
[![Live Simulation](https://img.shields.io/badge/Live_App-Projectiles_Inquiry-d67b19?style=flat-square)](https://thinking-experiment-sims.github.io/projectiles-inquiry-lab/)

---

## 1. Pedagogical Overview & Curricular Framework

Projectile motion is the classic application of two-dimensional vector mechanics in secondary and introductory college physics (NGSS HS-PS2-1, AP Physics 1 Unit 1, and Modeling Instruction 2D Kinematics). 

The primary pedagogical pillars embedded in this laboratory include:
1. **Galilean Principle of Independence of Orthogonal Motions:** The horizontal component of motion is completely unaffected by the vertical component, and vice versa.
2. **The "Feed the Monkey" Theorem:** Demonstrating that gravitational acceleration acts equally on all objects regardless of velocity, proving why aiming directly along the line of sight guarantees intercept.
3. **Engineering Problem Solving (Mark Rober's Moving Dartboard):** Applying parametric trajectories to real-time intercept dynamics and spatial boundary constraints (ceiling clearance).
4. **The Cornell Two-Column T-Chart:** A systematic problem-solving methodology where time $t$ serves as the mathematical scalar bridge linking independent $x$ and $y$ kinematic channels.

---

## 2. Fundamental Mathematical Derivations

Under uniform gravitational acceleration $\vec{g} = -g\,\hat{j}$ near Earth's surface ($g = 9.80\,\text{m/s}^2$) and neglecting air resistance:

$$\vec{a}(t) = \begin{bmatrix} a_x \\ a_y \end{bmatrix} = \begin{bmatrix} 0 \\ -g \end{bmatrix}$$

### 2.1 The Two Independent Kinematic Channels

$$\begin{array}{|l|l|}
\hline
\textbf{Horizontal Channel } (a_x = 0) & \textbf{Vertical Channel } (a_y = -g) \\
\hline
v_x(t) = v_{0x} = v_0 \cos\theta = \text{constant} & v_y(t) = v_{0y} + g t = v_0 \sin\theta + g t \quad (\text{where } g = -9.8\,\text{m/s}^2) \\
x(t) = x_0 + (v_0 \cos\theta) t & y(t) = y_0 + (v_0 \sin\theta) t + \frac{1}{2} g t^2 \\
\text{No acceleration in } x & v_y^2 = v_{0y}^2 + 2 g (y - y_0) \\
\hline
\end{array}$$

### 2.2 Time as the Scalar Bridge
Because the projectile occupies a single spatial point at each clock instant $t$, time $t$ uniquely links both coordinate equations:

$$t = \frac{x - x_0}{v_0 \cos\theta}$$

Substituting $t$ into the vertical position equation yields the **Trajectory Parabola in Cartesian Form**:

$$y(x) = y_0 + (\tan\theta)(x - x_0) - \frac{g}{2 v_0^2 \cos^2\theta} (x - x_0)^2$$

This proves that the path of any projectile in a uniform gravitational field is an exact parabola opening downward.

---

## 3. The "Feed the Monkey" Theorem & Proof

A cannon at $(x_0, y_0) = (0, 0)$ aims directly at a target (monkey) hanging at coordinates $(X_M, Y_M)$ in a tree. The aiming angle $\theta$ satisfies:

$$\tan\theta = \frac{Y_M}{X_M} \implies \sin\theta = \frac{Y_M}{\sqrt{X_M^2 + Y_M^2}}, \quad \cos\theta = \frac{X_M}{\sqrt{X_M^2 + Y_M^2}}$$

At the instant $t = 0$ the projectile is launched with arbitrary initial speed $v_0$, the monkey releases its grip and begins falling from rest under gravity.

```
(0, Y_M) +-----------------------* Monkey at t=0: (X_M, Y_M)
         |                     . |
         |                   .   | |
         |                 .     | | Monkey drops: 1/2 g t^2
         |   Line of     .       | v
         |   Sight     .         * Intercept! (X_M, y_intercept)
         |           .         /
         |         .         / Projectile parabolic arc
         |       .         /
(0, 0)   +--*------------+
         Cannon Launch
```

### Mathematical Proof of Intercept:
1. **Time required for projectile to reach monkey's horizontal coordinate $X_M$:**
   $$t_{\text{cross}} = \frac{X_M}{v_0 \cos\theta}$$

2. **Vertical position of falling monkey at $t_{\text{cross}}$:**
   $$y_M(t_{\text{cross}}) = Y_M - \frac{1}{2} g t_{\text{cross}}^2$$

3. **Vertical position of projectile at $t_{\text{cross}}$:**
   $$y_P(t_{\text{cross}}) = (v_0 \sin\theta) t_{\text{cross}} - \frac{1}{2} g t_{\text{cross}}^2$$

Substitute $t_{\text{cross}} = \frac{X_M}{v_0 \cos\theta}$:
$$y_P(t_{\text{cross}}) = (v_0 \sin\theta) \left( \frac{X_M}{v_0 \cos\theta} \right) - \frac{1}{2} g t_{\text{cross}}^2 = X_M \tan\theta - \frac{1}{2} g t_{\text{cross}}^2$$

Since $\tan\theta = \frac{Y_M}{X_M}$, we have $X_M \tan\theta = Y_M$:
$$y_P(t_{\text{cross}}) = Y_M - \frac{1}{2} g t_{\text{cross}}^2$$

Comparing:
$$y_P(t_{\text{cross}}) = y_M(t_{\text{cross}})$$

> **The Intercept Principle:** Both the projectile and the falling target accelerate downward by the exact same gravitational drop $\Delta y_{\text{drop}} = \frac{1}{2} g t^2$ below the initial line of sight. Therefore, **the projectile is guaranteed to strike the target regardless of launch speed $v_0$**, provided only that $v_0$ is sufficient to reach $X_M$ before the monkey hits the ground!

---

## 4. Engineering Intercept: Mark Rober's Moving Dartboard

In Mark Rober's viral robotic dartboard challenge:
- Thrower launches dart from $(x_0, y_0) = (0, 1.80\,\text{m})$ at angle $\alpha = 40.0^\circ$ and speed $v_0 = 15.0\,\text{m/s}$.
- Dartboard is on a vertical track at fixed horizontal distance $D = 5.00\,\text{m}$.
- Workshop ceiling is at height $H_{\text{ceiling}} = 6.00\,\text{m}$.

### 4.1 Target Intercept Height ($H$)
1. **Flight time to board:**
   $$t = \frac{D}{v_0 \cos\alpha} = \frac{5.00}{15.0 \cos(40^\circ)} = \frac{5.00}{11.49} = 0.435\,\text{s}$$
2. **Impact elevation:**
   $$H = y_0 + (v_0 \sin\alpha) t + \frac{1}{2} g t^2$$
   $$H = 1.80 + (15.0 \sin 40^\circ)(0.435) + \frac{1}{2}(-9.80)(0.435)^2$$
   $$H = 1.80 + (9.642)(0.435) - 4.90(0.1892) = 1.80 + 4.194 - 0.927 = 5.067\,\text{m}$$

### 4.2 Ceiling Collision Check
The apex height of the trajectory:
$$h_{\text{apex}} = y_0 + \frac{(v_0 \sin\alpha)^2}{2g} = 1.80 + \frac{(9.642)^2}{19.60} = 1.80 + 4.743 = 6.543\,\text{m}$$

Since $h_{\text{apex}} = 6.54\,\text{m} > H_{\text{ceiling}} = 6.00\,\text{m}$, the dart hits the ceiling before reaching the dartboard! This provides an authentic engineering optimization constraint for students.

---

## 5. Standard Trajectory Formulas (Level Ground, $y_0 = 0$)

$$\begin{array}{|l|l|}
\hline
\textbf{Kinematic Quantity} & \textbf{Formula} \\
\hline
\text{Time to Apex} & t_{\text{apex}} = \frac{v_0 \sin\theta}{g} \\
\text{Total Flight Time} & T_{\text{total}} = \frac{2 v_0 \sin\theta}{g} \\
\text{Maximum Height (Apex)} & H_{\text{max}} = \frac{v_0^2 \sin^2\theta}{2g} \\
\text{Horizontal Range} & R = \frac{v_0^2 \sin(2\theta)}{g} \\
\text{Maximum Range Angle} & \theta_{\text{max}} = 45^\circ \implies R_{\text{max}} = \frac{v_0^2}{g} \\
\text{Complementary Angle Symmetry} & R(\theta) = R(90^\circ - \theta) \\
\hline
\end{array}$$

---

## 6. Common Student Misconceptions & Diagnostic Remediation

| Student Misconception | Physical Reality | How This Simulation Clarifies It |
| :--- | :--- | :--- |
| **"At the highest point of flight, the acceleration is zero."** | At the apex, $v_y = 0$, but horizontal velocity $v_x = v_0 \cos\theta \neq 0$ and acceleration remains $a_y = -9.80\,\text{m/s}^2$ downward. | The real-time vector display shows the amber acceleration arrow pointing straight down at the apex with unchanged length. |
| **"Heavier projectiles do not travel as far."** | In vacuum projectile motion, mass cancels from all equations of motion ($\vec{F}/m = \vec{g}$). | Students can test different projectile presets with identical kinematics results. |
| **"To hit a falling monkey, you should aim below it to compensate for gravity."** | Because gravity pulls both projectile and target downward at the exact same rate ($\frac{1}{2}gt^2$), aiming directly along the line of sight produces a guaranteed hit. | The ghost trace ($g = 0$) shows the straight line of sight, while the strobe dots show synchronized equal vertical drops. |

---

## 7. Sample Classroom Problem & Solution

**Scenario (Cliff Launch):**
A projectile is fired from the edge of a cliff $h_0 = 45.0\,\text{m}$ high with speed $v_0 = 25.0\,\text{m/s}$ at an angle $\theta = 37.0^\circ$ above the horizontal. Assume $g = 9.80\,\text{m/s}^2$.
1. Find initial velocity components $v_{0x}$ and $v_{0y}$.
2. Find total time of flight until it hits the ground below.
3. Find horizontal distance traveled (range).
4. Find speed and angle of impact.

**Solution:**
1. **Components:**
   $$v_{0x} = 25.0 \cos(37^\circ) = 25.0(0.7986) = 19.97\,\text{m/s}$$
   $$v_{0y} = 25.0 \sin(37^\circ) = 25.0(0.6018) = 15.05\,\text{m/s}$$
2. **Flight Time ($y = 0$):**
   $$0 = 45.0 + 15.05 t - 4.90 t^2 \implies 4.90 t^2 - 15.05 t - 45.0 = 0$$
   $$t = \frac{15.05 + \sqrt{(15.05)^2 - 4(4.90)(-45.0)}}{9.80} = \frac{15.05 + \sqrt{226.5 + 882.0}}{9.80} = \frac{15.05 + \sqrt{1108.5}}{9.80} = \frac{15.05 + 33.29}{9.80} = 4.933\,\text{s}$$
3. **Range:**
   $$\Delta x = v_{0x} t = 19.97 \times 4.933 = 98.51\,\text{m}$$
4. **Impact Velocity:**
   $$v_x = 19.97\,\text{m/s}$$
   $$v_y = 15.05 - 9.80(4.933) = 15.05 - 48.34 = -33.29\,\text{m/s}$$
   $$v_{\text{impact}} = \sqrt{(19.97)^2 + (-33.29)^2} = \sqrt{398.8 + 1108.2} = \sqrt{1507.0} = 38.82\,\text{m/s}$$
   $$\theta_{\text{impact}} = \arctan\left(\frac{33.29}{19.97}\right) = 59.0^\circ \text{ below horizontal}$$

---

*Authored for The Thinking Experiment (PhysicsKit). Pedagogically aligned with AP Physics 1 & Modeling Instruction 2D Kinematics.*
