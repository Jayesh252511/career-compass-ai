/**
 * Pure-JS canvas confetti — no dependencies.
 * Fires a short celebration burst, auto-cleans up.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  life: number;
};

const COLORS = [
  "#6366f1", "#f472b6", "#34d399", "#fbbf24", "#60a5fa",
  "#a78bfa", "#fb923c", "#4ade80", "#f87171", "#38bdf8",
];

export function fireConfetti() {
  if (typeof document === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;
  const dpr = window.devicePixelRatio || 1;

  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
  };
  resize();

  const particles: Particle[] = [];
  const W = window.innerWidth;
  const H = window.innerHeight;
  const COUNT = 120;

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: W / 2 + (Math.random() - 0.5) * W * 0.4,
      y: H * 0.35 + (Math.random() - 0.5) * H * 0.15,
      vx: (Math.random() - 0.5) * 14,
      vy: -(Math.random() * 10 + 4),
      w: Math.random() * 8 + 4,
      h: Math.random() * 5 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      life: 1,
    });
  }

  const GRAVITY = 0.25;
  const DECAY = 0.008;
  let animId: number;

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    let alive = false;

    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;

      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life -= DECAY;

      ctx.save();
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (alive) {
      animId = requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  };

  animId = requestAnimationFrame(draw);

  // Safety cleanup after 5s
  setTimeout(() => {
    cancelAnimationFrame(animId);
    canvas.remove();
  }, 5000);
}
