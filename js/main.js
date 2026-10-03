/*
 * OptanAR interactive background
 * --------------------------------
 * This intentionally uses lightweight canvas rendering first.
 * Later we can replace it with a full Three.js scene containing
 * a 3D headset, point cloud, neural network or data architecture.
 */

const canvas = document.getElementById("xr-background");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let particles = [];

function resize() {
  width = canvas.width = window.innerWidth * devicePixelRatio;
  height = canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  const count = Math.min(90, Math.floor(window.innerWidth / 16));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - .5) * .15 * devicePixelRatio,
    vy: (Math.random() - .5) * .15 * devicePixelRatio,
    r: (Math.random() * 1.4 + .3) * devicePixelRatio
  }));
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(98,230,255,.28)";
    ctx.fill();
  }

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 150 * devicePixelRatio) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(98,230,255,${0.045 * (1 - distance / (150 * devicePixelRatio))})`;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
resize();
animate();
