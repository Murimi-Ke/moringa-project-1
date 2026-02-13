const canvas = document.getElementById("universe");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const planets = [];
const G = 0.05; // gravity strength

class Planet {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.radius = Math.random() * 6 + 4;
    this.mass = this.radius * 0.8;

    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;

    this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
  }

  update() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const dx = centerX - this.x;
    const dy = centerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    const force = G * this.mass;

    this.vx += (dx / distance) * force;
    this.vy += (dy / distance) * force;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

canvas.addEventListener("click", (e) => {
  planets.push(new Planet(e.clientX, e.clientY));
});

function handleCollisions() {
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const dx = planets[i].x - planets[j].x;
      const dy = planets[i].y - planets[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < planets[i].radius + planets[j].radius) {
        // Merge smaller into larger
        if (planets[i].radius >= planets[j].radius) {
          planets[i].radius += planets[j].radius * 0.4;
          planets.splice(j, 1);
        } else {
          planets[j].radius += planets[i].radius * 0.4;
          planets.splice(i, 1);
        }
        return;
      }
    }
  }
}

function drawCenterStar() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    40
  );

  gradient.addColorStop(0, "rgba(255,255,200,1)");
  gradient.addColorStop(1, "rgba(255,255,200,0)");

  ctx.beginPath();
  ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCenterStar();

  planets.forEach((planet) => {
    planet.update();
    planet.draw();
  });

  handleCollisions();

  requestAnimationFrame(animate);
}

animate();
