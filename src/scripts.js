const canvas = document.getElementById("universe");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const planets = [];
const stars = [];
const particles = [];
const ufos = [];
const satellites = [];
const G = 0.05; // gravity strength
let hueShift = 0;

// Planetary facts for loader
const planetaryFacts = [
  "Did you know? Jupiter's Great Red Spot is a storm that has been raging for over 300 years.",
  "Venus rotates so slowly that a day on Venus is longer than a year on Venus.",
  "Saturn's rings are made of billions of pieces of ice and rock, some as small as grains of sand.",
  "A teaspoon of neutron star material would weigh about 6 billion tons on Earth.",
  "Mars has the largest volcano in our solar system: Olympus Mons, three times taller than Mount Everest.",
  "Neptune's winds are the fastest in the solar system, reaching speeds of 1,200 mph.",
  "There are more stars in the universe than grains of sand on all of Earth's beaches.",
  "One year on Mercury is only 88 Earth days, but one day on Mercury is 59 Earth days long.",
];

// Show random fact in loader
const factElement = document.getElementById("planet-fact");
if (factElement) {
  factElement.textContent = planetaryFacts[Math.floor(Math.random() * planetaryFacts.length)];
}

// Initialize starfield
function createStarfield() {
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      opacity: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkle: Math.random() > 0.7, // Only some stars twinkle
    });
  }
}

createStarfield();

// Star drawing with twinkling
function drawStarfield() {
  stars.forEach((star) => {
    if (star.twinkle) {
      star.opacity += star.twinkleSpeed;
      if (star.opacity >= 1 || star.opacity <= 0.3) {
        star.twinkleSpeed *= -1;
      }
    }

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fill();
  });
}

// Particle class for explosions
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.radius = Math.random() * 3 + 1;
    this.color = color;
    this.life = 1;
    this.decay = Math.random() * 0.02 + 0.01;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.vx *= 0.98;
    this.vy *= 0.98;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color.replace("1)", `${this.life})`).replace("60%", "70%");
    ctx.fill();
  }
}

// UFO class
class UFO {
  constructor() {
    this.x = Math.random() > 0.5 ? -50 : canvas.width + 50;
    this.y = Math.random() * canvas.height;
    this.speed = Math.random() * 2 + 1;
    this.direction = this.x < 0 ? 1 : -1;
    this.wobble = 0;
  }

  update() {
    this.x += this.speed * this.direction;
    this.wobble += 0.1;
    this.y += Math.sin(this.wobble) * 0.5;
  }

  draw() {
    // UFO body
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 15, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(150, 200, 255, 0.8)";
    ctx.fill();

    // UFO dome
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - 5, 8, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(100, 255, 200, 0.6)";
    ctx.fill();

    // Lights
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(this.x + i * 8, this.y + 3, 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${(Date.now() / 10 + i * 60) % 360}, 100%, 60%)`;
      ctx.fill();
    }
  }

  isOffscreen() {
    return this.x < -100 || this.x > canvas.width + 100;
  }
}

// Satellite class
class Satellite {
  constructor() {
    this.angle = Math.random() * Math.PI * 2;
    this.distance = 150 + Math.random() * 100;
    this.speed = Math.random() * 0.01 + 0.005;
    this.size = Math.random() * 8 + 4;
  }

  update() {
    this.angle += this.speed;
  }

  draw() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const x = centerX + Math.cos(this.angle) * this.distance;
    const y = centerY + Math.sin(this.angle) * this.distance;

    // Satellite body
    ctx.fillStyle = "rgba(200, 200, 200, 0.9)";
    ctx.fillRect(x - this.size / 2, y - this.size / 2, this.size, this.size);

    // Solar panels
    ctx.fillStyle = "rgba(100, 150, 255, 0.7)";
    ctx.fillRect(x - this.size * 1.5, y - this.size / 4, this.size * 0.8, this.size / 2);
    ctx.fillRect(x + this.size * 0.7, y - this.size / 4, this.size * 0.8, this.size / 2);

    // Antenna
    ctx.strokeStyle = "rgba(200, 200, 200, 0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - this.size / 2);
    ctx.lineTo(x, y - this.size * 1.2);
    ctx.stroke();
  }
}

// Planet class
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

// Spawn UFOs occasionally
setInterval(() => {
  if (Math.random() > 0.7 && ufos.length < 3) {
    ufos.push(new UFO());
  }
}, 8000);

// Spawn satellites occasionally
setInterval(() => {
  if (Math.random() > 0.6 && satellites.length < 5) {
    satellites.push(new Satellite());
  }
}, 10000);

// Click to spawn planets
canvas.addEventListener("click", (e) => {
  planets.push(new Planet(e.clientX, e.clientY));
});

// Handle collisions with particle explosions
function handleCollisions() {
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const dx = planets[i].x - planets[j].x;
      const dy = planets[i].y - planets[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < planets[i].radius + planets[j].radius) {
        // Create particle explosion
        const explosionX = (planets[i].x + planets[j].x) / 2;
        const explosionY = (planets[i].y + planets[j].y) / 2;
        const color = planets[i].radius >= planets[j].radius ? planets[i].color : planets[j].color;

        for (let k = 0; k < 15; k++) {
          particles.push(new Particle(explosionX, explosionY, color));
        }

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

// Draw center star
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

// Reset button functionality
document.getElementById("reset-btn").addEventListener("click", () => {
  planets.length = 0;
  particles.length = 0;
  ufos.length = 0;
  satellites.length = 0;
  hueShift = 0;
});

// Dynamic background hue shift
function updateBackgroundHue() {
  hueShift = (hueShift + 0.2) % 360;
  const color1 = `hsl(${hueShift}, 80%, 3%)`;
  const color2 = `hsl(${(hueShift + 60) % 360}, 50%, 1%)`;
  document.body.style.background = `radial-gradient(circle at center, ${color1}, ${color2})`;
}

// Main animation loop
function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStarfield();
  updateBackgroundHue();
  drawCenterStar();

  // Update and draw planets
  planets.forEach((planet) => {
    planet.update();
    planet.draw();
  });

  // Update and draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Update and draw UFOs
  for (let i = ufos.length - 1; i >= 0; i--) {
    ufos[i].update();
    ufos[i].draw();
    if (ufos[i].isOffscreen()) {
      ufos.splice(i, 1);
    }
  }

  // Update and draw satellites
  satellites.forEach((satellite) => {
    satellite.update();
    satellite.draw();
  });

  handleCollisions();

  requestAnimationFrame(animate);
}

animate();