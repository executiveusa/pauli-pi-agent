# SKILL: 3D WORLD GENERATION — LYRA PIPELINE + WEB DELIVERY

**Use this skill whenever:** creating explorable 3D worlds from images/videos, integrating
3D Gaussian Splatting into web frontends, building interactive scene navigation, or producing
camera-controlled generative world experiences for clients.

Reference implementation: NVIDIA Lyra (https://github.com/nv-tlabs/lyra)
- Lyra 1.0 — feed-forward 3D/4D scene from single image via video diffusion self-distillation
- Lyra 2.0 — explorable generative 3D worlds with long-horizon, 3D-consistent generation

---

## THE 4-STAGE WORLD PIPELINE

```
1. Scene Seed        — single image + text caption + camera trajectory
2. World Generation  — Lyra model: video diffusion → multi-view synthesis
3. 3D Reconstruction — depth + pose estimation → 3D Gaussian Splatting (3DGS)
4. Web Delivery      — PLY/KSPLAT → Three.js gsplat renderer → interactive scene
```

---

## STAGE 1 — SCENE SEED: INPUT PREPARATION

### Image Requirements
- Resolution: 1024×576 (Lyra-2 native) or 512×512 (Lyra-1)
- Format: PNG/JPG — no alpha channel
- Composition: clear horizon line increases spatial coherence
- Avoid: heavy motion blur, extreme close-ups, abstract textures

### Camera Trajectory Design (Lyra-2)
```python
import numpy as np

def orbit_trajectory(radius=3.0, height=1.0, n_frames=120):
    """Smooth orbital path around scene center."""
    poses = []
    for i in range(n_frames):
        angle = 2 * np.pi * i / n_frames
        cam_pos = np.array([radius * np.cos(angle), height, radius * np.sin(angle)])
        forward = -cam_pos / np.linalg.norm(cam_pos)
        up = np.array([0, 1, 0])
        right = np.cross(forward, up); right /= np.linalg.norm(right)
        up = np.cross(right, forward)
        c2w = np.eye(4)
        c2w[:3, 0] = right; c2w[:3, 1] = up
        c2w[:3, 2] = -forward; c2w[:3, 3] = cam_pos
        poses.append(c2w)
    return np.stack(poses)

def dolly_trajectory(start_dist=5.0, end_dist=1.5, n_frames=60):
    """Cinematic pull toward scene center — Hitchcock zoom."""
    poses = []
    for i in range(n_frames):
        t = (i / (n_frames - 1)) ** 2  # ease-in
        dist = start_dist + (end_dist - start_dist) * t
        c2w = np.eye(4); c2w[2, 3] = dist
        poses.append(c2w)
    return np.stack(poses)

def flythrough_trajectory(waypoints: list[dict], n_frames=180):
    """Smooth spline flythrough between {position, target} keyframes."""
    from scipy.interpolate import CubicSpline
    t = np.linspace(0, 1, len(waypoints))
    t_new = np.linspace(0, 1, n_frames)
    pos = np.array([w['position'] for w in waypoints])
    cs = CubicSpline(t, pos)
    return cs(t_new)  # [n_frames, 3] positions
```

### Text Caption Guidelines
```
For Lyra-2 video generation captions:
- Describe atmosphere: "golden hour light, long shadows across stone courtyard"
- Include environmental motion: "gentle breeze, leaves rustling, water flowing"
- Skip character descriptions — no people in captions
- Stay under 77 tokens (CLIP encoder hard limit)
```

---

## STAGE 2 — LYRA INFERENCE

### Lyra-1: Static 3D Scene from Single Image
```bash
cd Lyra-1
pip install -r requirements_lyra.txt

python sample.py \
  --config configs/lyra1_inference.yaml \
  --input path/to/scene.jpg \
  --output 3d/exports/scene/ \
  --format ply
# → outputs scene.ply (3D Gaussian splat point cloud)
```

### Lyra-2: Explorable World from Image + Trajectory
```bash
cd Lyra-2
pip install -r requirements.txt

python lyra_2/inference.py \
  --image path/to/scene.jpg \
  --trajectory assets/trajectories/orbit.json \
  --caption "cinematic wide shot, dramatic atmospheric depth" \
  --output 3d/exports/world/ \
  --save_video \
  --save_ply
# → outputs flythrough.mp4 + world.ply (3DGS) + camera_poses.json
```

### Output Structure
```
3d/exports/{project}/
├── world.ply            ← raw 3D Gaussian splat cloud (Lyra output)
├── world.ksplat         ← compressed browser format (see Stage 4)
├── flythrough.mp4       ← rendered preview video (use in AURORA/Remotion)
├── depth_maps/          ← per-frame depth PNGs (for compositing)
└── camera_poses.json    ← estimated camera poses for web playback
```

---

## STAGE 3 — 3D RECONSTRUCTION INTERNALS

### Depth Estimation (Depth Anything V3)
```python
from depth_anything_v3.dpt import DepthAnythingV3
import torch

model = DepthAnythingV3(encoder='vitl', features=256)
model.load_state_dict(torch.load('depth_anything_v3_vitl.pth'))
model.eval()

with torch.no_grad():
    depth = model(frame_tensor)  # [H, W] metric depth map
```

### Camera Pose Estimation (VIPE)
```python
from vipe import PoseEstimator

estimator = PoseEstimator(mode='video')
poses = estimator.estimate(video_frames)  # list of 4×4 c2w matrices
```

### Depth → Point Cloud → 3DGS Init
```python
import numpy as np

def depth_to_pointcloud(depth_map, intrinsics, c2w):
    """Unproject depth map to world-space 3DGS initialization."""
    H, W = depth_map.shape
    fx, fy, cx, cy = intrinsics
    u, v = np.meshgrid(np.arange(W), np.arange(H))
    x = (u - cx) / fx * depth_map
    y = (v - cy) / fy * depth_map
    z = depth_map
    pts_cam = np.stack([x, y, z, np.ones_like(z)], axis=-1)
    pts_world = (c2w @ pts_cam.reshape(-1, 4).T).T[:, :3]
    return pts_world  # [N, 3] world-space point cloud
```

---

## STAGE 4 — WEB DELIVERY: 3DGS IN THREE.JS

### PLY → KSPLAT Conversion (pre-build step)
```bash
# SuperSplat CLI — convert Lyra PLY to browser-optimized format
npx @supersplat/cli convert \
  --input 3d/exports/world/world.ply \
  --output 3d/exports/world/world.ksplat \
  --compress
# Result: ~60% smaller than raw PLY
```

### Three.js Gaussian Splat Viewer
```html
<script type="module">
import * as GaussianSplats3D from
  'https://cdn.jsdelivr.net/npm/@mkkellogg/gaussian-splats-3d@latest/build/gaussian-splats-3d.module.js';

const viewer = new GaussianSplats3D.Viewer({
  cameraUp: [0, 1, 0],
  initialCameraPosition: [0, 1.5, 5],
  initialCameraLookAt: [0, 0, 0],
  selfDrivenMode: true,
  useBuiltInControls: false
});

viewer.addSplatScene('3d/exports/world/world.ksplat', {
  splatAlphaRemovalThreshold: 5,
  showLoadingUI: false,
  maxSplatCount: getMaxSplats(),
  progressiveLoad: true
}).then(() => {
  viewer.start();
  setupNavigation(viewer);
  setupFlythrough(viewer);
});

function getMaxSplats() {
  const gl = document.createElement('canvas').getContext('webgl2');
  const r = gl?.getParameter(gl.RENDERER) || '';
  if (/Apple M[23]|RTX 4/.test(r)) return 3_000_000;
  if (/Apple M1|RTX 3/.test(r)) return 1_500_000;
  return 500_000;  // mobile / integrated GPU
}
</script>
```

### FPS Navigation Controller
```javascript
class WorldNavigator {
  constructor(viewer, canvas) {
    this.viewer = viewer;
    this.canvas = canvas;
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.keys = new Set();
    this.speed = 0.05;
    this.sensitivity = 0.002;
    this._bind();
  }

  _bind() {
    document.addEventListener('keydown', e => this.keys.add(e.code));
    document.addEventListener('keyup', e => this.keys.delete(e.code));
    // Pointer lock — opt-in only, never auto-capture
    this.canvas.addEventListener('click', () => this.canvas.requestPointerLock());
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.canvas) {
        document.addEventListener('mousemove', this._onMouse.bind(this));
      }
    });
  }

  _onMouse(e) {
    this.euler.y -= e.movementX * this.sensitivity;
    this.euler.x = Math.max(
      -Math.PI / 2.5,
      Math.min(Math.PI / 2.5, this.euler.x - e.movementY * this.sensitivity)
    );
  }

  update() {
    const cam = this.viewer.camera;
    cam.quaternion.setFromEuler(this.euler);
    const speed = this.keys.has('ShiftLeft') ? this.speed * 3 : this.speed;
    const dir = new THREE.Vector3();
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp'))     dir.z -= speed;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown'))   dir.z += speed;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft'))   dir.x -= speed;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight'))  dir.x += speed;
    if (this.keys.has('Space') || this.keys.has('KeyQ'))       dir.y += speed;
    if (this.keys.has('ControlLeft') || this.keys.has('KeyE')) dir.y -= speed;
    dir.applyQuaternion(cam.quaternion);
    cam.position.add(dir);
  }
}
```

### Cinematic Auto-Flythrough
```javascript
class CinematicFlythrough {
  constructor(viewer, poses) {
    this.viewer = viewer;
    this.poses = poses;       // [{position:[x,y,z], target:[x,y,z]}]
    this.duration = 8000;     // ms per segment
    this.active = false;
  }

  start() { this.active = true; this.startTime = performance.now(); }
  stop()  { this.active = false; }

  update() {
    if (!this.active) return;
    const elapsed = performance.now() - this.startTime;
    const segCount = this.poses.length - 1;
    const globalT = Math.min(elapsed / (this.duration * segCount), 1);
    const segIdx = Math.min(Math.floor(globalT * segCount), segCount - 1);
    const rawT = (globalT * segCount) - segIdx;
    const ease = rawT < 0.5 ? 2 * rawT * rawT : -1 + (4 - 2 * rawT) * rawT;

    const from = this.poses[segIdx];
    const to   = this.poses[segIdx + 1];
    const cam  = this.viewer.camera;

    cam.position.lerpVectors(
      new THREE.Vector3(...from.position),
      new THREE.Vector3(...to.position),
      ease
    );
    cam.lookAt(new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...from.target),
      new THREE.Vector3(...to.target),
      ease
    ));

    if (globalT >= 1) this.stop();
  }
}
```

---

## FULL PAGE INTEGRATION TEMPLATE

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3D World</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #000; overflow: hidden; font-family: 'DM Mono', monospace; }
    #world { width: 100dvw; height: 100dvh; display: block; }
    #world-static { width: 100dvw; height: 100dvh; object-fit: cover; display: none; }
    #hud {
      position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
      color: rgba(255,255,255,0.6); font-size: 0.75rem; letter-spacing: 0.15em;
      text-transform: uppercase; pointer-events: none;
    }
    #loading {
      position: fixed; inset: 0; background: #000;
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.4); font-size: 0.875rem; letter-spacing: 0.2em;
      text-transform: uppercase; transition: opacity 0.8s;
    }
    #loading.hidden { opacity: 0; pointer-events: none; }
  </style>
</head>
<body>
  <div id="loading">Generating world&hellip;</div>
  <canvas id="world" role="img" aria-label="Interactive 3D world scene. Press Enter to explore."></canvas>
  <!-- Accessibility fallback: static render for no-WebGL or reduced motion -->
  <img id="world-static" src="3d/renders/world-preview.jpg" alt="3D world scene preview">
  <div id="hud" aria-hidden="true">WASD · Move &nbsp;|&nbsp; Mouse · Look &nbsp;|&nbsp; Shift · Sprint &nbsp;|&nbsp; Space · Up</div>

  <script type="module">
  import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168/build/three.module.js';
  import * as GaussianSplats3D from
    'https://cdn.jsdelivr.net/npm/@mkkellogg/gaussian-splats-3d@latest/build/gaussian-splats-3d.module.js';

  // Reduced-motion gate
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.getElementById('world').style.display = 'none';
    document.getElementById('world-static').style.display = 'block';
    document.getElementById('loading').classList.add('hidden');
  } else {
    initWorld();
  }

  async function initWorld() {
    const canvas = document.getElementById('world');
    const viewer = new GaussianSplats3D.Viewer({
      canvas,
      cameraUp: [0, 1, 0],
      initialCameraPosition: [0, 1.5, 5],
      initialCameraLookAt: [0, 0, 0],
      selfDrivenMode: false,
      useBuiltInControls: false
    });

    await viewer.addSplatScene('3d/exports/world/world.ksplat', {
      splatAlphaRemovalThreshold: 5,
      showLoadingUI: false,
      progressiveLoad: true
    });

    document.getElementById('loading').classList.add('hidden');
    const nav = new WorldNavigator(viewer, canvas);

    // Auto-flythrough until user interacts
    const flythrough = new CinematicFlythrough(viewer, WORLD_POSES);
    flythrough.start();
    canvas.addEventListener('click', () => flythrough.stop(), { once: true });

    function loop() {
      nav.update();
      flythrough.update();
      viewer.update();
      viewer.render();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // Pose keyframes — replace with camera_poses.json from Lyra output
  const WORLD_POSES = [
    { position: [0, 1.5, 5],   target: [0, 0, 0] },
    { position: [3, 1.0, 3],   target: [0, 0, 0] },
    { position: [4, 0.8, 0],   target: [0, 0, 0] },
    { position: [2, 1.2, -3],  target: [0, 0, 0] },
    { position: [-2, 1.5, -3], target: [0, 0, 0] },
    { position: [0, 1.5, 5],   target: [0, 0, 0] },
  ];
  </script>
</body>
</html>
```

---

## AURORA INTEGRATION (Remotion + Video)

```typescript
// Embed Lyra flythrough.mp4 in Remotion composition
import { AbsoluteFill, Video, staticFile, interpolate, useCurrentFrame } from 'remotion';

export const WorldScene: React.FC<{ caption: string }> = ({ caption }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <Video
        src={staticFile('flythrough.mp4')}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <AbsoluteFill style={{ opacity, padding: '4rem' }}>
        <WorldTitle caption={caption} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

---

## PERFORMANCE TARGETS

| Metric | Target | Blocker threshold |
|--------|--------|-------------------|
| Gaussian count | < 1M splats | > 3M — mobile GPU crash |
| File size (ksplat) | < 15MB | > 30MB — loading abandon |
| FPS desktop | ≥ 60 fps | < 30 fps — UX fail |
| FPS mobile | ≥ 30 fps | < 24 fps — full rebuild |
| Time-to-first-splat | < 3s on 4G | > 6s — bounce |
| Depth estimation | ≥ 90% coverage | < 75% — floating artifacts |

---

## ANTI-PATTERNS — 3D WORLD

| Pattern | Why Banned |
|---------|-----------|
| `<iframe>` for 3D viewer | Layout thrash, no z-index control |
| Raw uncompressed PLY served to browser | 100MB+ transfer — mobile crash |
| Auto pointer lock on page load | UX violation, browser blocks it |
| `scroll` event for camera movement | Laggy — use pointer events only |
| Missing WebGL fallback | Black screen on unsupported devices |
| Fixed FOV without device check | Phone FOV ≠ desktop — spatial distortion |
| `requestAnimationFrame` without tab-visibility guard | Battery drain on hidden tabs |
| Blocking main thread during PLY parse | Jank — always stream progressively |

### Tab Visibility Guard (always include)
```javascript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) viewer.stop();
  else viewer.start();
});
```

---

## COMPUTATIONAL REQUIREMENTS

Lyra inference requires GPU. Do not run on CPU.
- Lyra-1: H100/A100, ~43GB VRAM (with offloading)
- Lyra-2: H100 recommended, 80GB VRAM for full pipeline
- Web delivery (Three.js 3DGS): runs in any WebGL2 browser — no GPU required server-side
