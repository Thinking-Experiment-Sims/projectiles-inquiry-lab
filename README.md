# Projectiles: Target Intercept & Kinematics Studio

An interactive 2D projectile kinematics virtual laboratory and inquiry simulator created for **The Thinking Experiment** (PhysicsKit).

[![Live Simulation](https://img.shields.io/badge/Live_Simulation-GitHub_Pages-0f7e9b?style=for-the-badge)](https://thinking-experiment-sims.github.io/projectiles-inquiry-lab/)
[![Physics Theory Guide](https://img.shields.io/badge/Physics_Guide-Deep_Theory-d67b19?style=for-the-badge)](./PHYSICS.md)
[![Simulation Hub](https://img.shields.io/badge/Simulation_Hub-The_Thinking_Experiment-123140?style=for-the-badge)](https://thinking-experiment-sims.github.io/interactive-physics/)

---

## 🎯 Pedagogical Pillars

### 1. Feed the Monkey (Classic Intercept Challenge)
- **The Setup**: A banana cannon aims directly at a monkey hanging from a tree branch. As the cannon fires, the sound startles the monkey, which releases the branch and begins free-falling at $t = 0$.
- **The Theorem**: Both the projectile and the falling target accelerate downward at the identical gravitational rate ($a_y = -g$). Over flight duration $t$, both objects drop by the exact same vertical distance:
  $$\Delta y_{\text{drop}} = \frac{1}{2}gt^2$$
- **The Conclusion**: Aiming directly along the visual line of sight guarantees an intercept at *any* launch speed $v_0$ sufficient to reach the target before it hits the ground.

### 2. Mark Rober's Automated Dartboard
- Replicates Mark Rober's viral engineering challenge:
  - Launch position: $x_0 = 0\text{ m}$, $y_0 = 1.8\text{ m}$, $v_0 = 15.0\text{ m/s}$, launch angle $\alpha = 40.0^\circ$.
  - Motorized target board at distance $x = 5.0\text{ m}$.
  - Students calculate required board height and check ceiling clearance ($h_{\max} \le H_{\text{ceiling}}$).

### 3. Classroom Kinematics & Cornell T-Chart Engine
- **Horizontal Channel ($a_x = 0$):** $v_x = v_0 \cos\theta = \text{const}$, $x = x_0 + v_{0x}t$
- **Vertical Channel ($a_y = -g$):** $v_y = v_{0y} + gt$, $y = y_0 + v_{0y}t + \frac{1}{2}gt^2$ (with $g = -9.8\,\text{m/s}^2$)
- **Time as the Scalar Bridge:** Visual connecting bridge illustrating how time links the two independent 1D motions.

For complete mathematical derivations, the algebraic proof of the Monkey-Hunter theorem, and worked examples, see [PHYSICS.md](./PHYSICS.md).

---

## 🎨 Design System Compliance

This simulation adheres strictly to **The Thinking Experiment** brand standards:
- **Teal Headers / Primary:** `#0f7e9b` / `#095f76`
- **Amber Accents / Highlights:** `#d67b19`
- **Background:** Pure White (`#ffffff`) with Blueprint Grid (`#e9f4fb`)
- **Typography:** Sans-serif (`Inter`, `IBM Plex Sans`)
- **Prohibited:** No Purple (`#59118e`) or Gold (`#ffc61e`)

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/Thinking-Experiment-Sims/projectiles-inquiry-lab.git
cd projectiles-inquiry-lab

# Start local server
python3 -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your web browser.

---

## 📱 Embedding in Canvas LMS

```html
<iframe 
  src="https://thinking-experiment-sims.github.io/projectiles-inquiry-lab/" 
  width="100%" 
  height="800" 
  style="border: 1px solid #c8dbe3; border-radius: 8px;"
  loading="lazy"
  allowfullscreen>
</iframe>
```

---

## 📁 Repository Structure

```
projectiles-inquiry-lab/
├── index.html                       # Main interactive lab interface
├── styles.css                        # The Thinking Experiment CSS stylesheet
├── Unit_1_Packet_6_Projectiles.pdf   # Accompanying classroom packet
├── src/
│   ├── app.js                       # Canvas rendering, drag handlers, UI state
│   └── physics.js                   # Analytical 2D projectile kinematics engine
├── tests/
│   └── physics.test.js              # Automated unit tests for trajectories
├── PHYSICS.md                       # Comprehensive theoretical physics guide
└── README.md                        # Project documentation
```

---

## 📄 License & Attribution

Authored by **Vladimir Lopez** for **The Thinking Experiment (PhysicsKit)**.  
Open-source under the MIT License for educational use in physics classrooms worldwide.
