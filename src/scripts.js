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
const meteors = [];
const G = 0.05; // gravity strength
let hueShift = 0;
let isResetting = false;
let blackHoleRadius = 0;
let resetPhase = 0; // 0: normal, 1: black hole forming, 2: consuming, 3: imploding

// Collision sound
const collisionSound = new Audio('content/media/audio/pop.mp3');
collisionSound.volume = 0.3;

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

// Meteor class
class Meteor {
  constructor() {
    const side = Math.floor(Math.random() * 4);
    switch(side) {
      case 0: // top
        this.x = Math.random() * canvas.width;
        this.y = -20;
        break;
      case 1: // right
        this.x = canvas.width + 20;
        this.y = Math.random() * canvas.height;
        break;
      case 2: // bottom
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 20;
        break;
      case 3: // left
        this.x = -20;
        this.y = Math.random() * canvas.height;
        break;
    }
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const angle = Math.atan2(centerY - this.y, centerX - this.x);
    const speed = Math.random() * 3 + 2;
    
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = Math.random() * 4 + 2;
    this.trail = [];
    this.trailLength = 10;
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }
    
    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    // Draw trail
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = i / this.trail.length;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.6})`;
      ctx.fill();
    }
    
    // Draw meteor
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 200, 100, 0.9)";
    ctx.fill();
    
    // Glow
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
    gradient.addColorStop(0, "rgba(255, 150, 50, 0.5)");
    gradient.addColorStop(1, "rgba(255, 150, 50, 0)");
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  isOffscreen() {
    return this.x < -50 || this.x > canvas.width + 50 || 
           this.y < -50 || this.y > canvas.height + 50;
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
    this.hasRings = Math.random() > 0.7;
    this.details = this.generateDetails();
  }

  generateDetails() {
    const details = [];
    const numDetails = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < numDetails; i++) {
      details.push({
        type: Math.random() > 0.5 ? 'spot' : 'line',
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 0.7,
        size: Math.random() * 0.3 + 0.1,
        brightness: Math.random() > 0.5 ? 1.3 : 0.7
      });
    }
    
    return details;
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
    // Main planet body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Add details if planet is large enough
    if (this.radius > 15) {
      this.details.forEach(detail => {
        const detailX = this.x + Math.cos(detail.angle) * this.radius * detail.distance;
        const detailY = this.y + Math.sin(detail.angle) * this.radius * detail.distance;
        
        if (detail.type === 'spot') {
          ctx.beginPath();
          ctx.arc(detailX, detailY, this.radius * detail.size, 0, Math.PI * 2);
          const hsl = this.color.match(/\d+/g);
          ctx.fillStyle = `hsl(${hsl[0]}, ${hsl[1]}%, ${parseInt(hsl[2]) * detail.brightness}%)`;
          ctx.fill();
        } else {
          ctx.strokeStyle = this.color.replace('60%', `${60 * detail.brightness}%`);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * (0.5 + detail.distance * 0.5), 
                  detail.angle - 0.5, detail.angle + 0.5);
          ctx.stroke();
        }
      });
      
      // Add rings if applicable
      if (this.hasRings && this.radius > 20) {
        ctx.strokeStyle = this.color.replace('60%', '40%').replace('1)', '0.6)');
        ctx.lineWidth = this.radius * 0.15;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius * 1.5, this.radius * 0.3, 
                    Math.PI * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
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

// Spawn meteors occasionally
setInterval(() => {
  if (Math.random() > 0.5 && meteors.length < 4) {
    meteors.push(new Meteor());
  }
}, 6000);

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
        // Play collision sound
        collisionSound.currentTime = 0;
        collisionSound.play().catch(e => console.log('Audio play failed:', e));
        
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
          planets[i].details = planets[i].generateDetails(); // Regenerate details
          planets.splice(j, 1);
        } else {
          planets[j].radius += planets[i].radius * 0.4;
          planets[j].details = planets[j].generateDetails(); // Regenerate details
          planets.splice(i, 1);
        }
        return;
      }
    }
  }
}

// Draw center star with shimmer effect
function drawCenterStar() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const time = Date.now() * 0.001;
  
  // Shimmer effect - outer glow
  for (let i = 0; i < 3; i++) {
    const shimmerRadius = 50 + Math.sin(time + i) * 10;
    const shimmerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, shimmerRadius
    );
    shimmerGradient.addColorStop(0, `rgba(255, 255, 200, ${0.3 - i * 0.1})`);
    shimmerGradient.addColorStop(1, "rgba(255, 255, 200, 0)");
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, shimmerRadius, 0, Math.PI * 2);
    ctx.fillStyle = shimmerGradient;
    ctx.fill();
  }

  // Main star gradient
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

// Black hole reset animation
function drawBlackHole() {
  if (resetPhase === 0) return;
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  if (resetPhase === 1) {
    // Black hole forming
    blackHoleRadius += 2;
    
    // Dark center
    const blackGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, blackHoleRadius
    );
    blackGradient.addColorStop(0, "rgba(0, 0, 0, 1)");
    blackGradient.addColorStop(0.6, "rgba(20, 0, 40, 0.8)");
    blackGradient.addColorStop(1, "rgba(100, 0, 200, 0)");
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, blackHoleRadius, 0, Math.PI * 2);
    ctx.fillStyle = blackGradient;
    ctx.fill();
    
    // Accretion disk
    ctx.strokeStyle = `rgba(138, 43, 226, ${0.6 * (blackHoleRadius / 60)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, blackHoleRadius * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    
    if (blackHoleRadius >= 60) {
      resetPhase = 2;
    }
  } else if (resetPhase === 2) {
    // Consuming phase - pull planets in
    const consumeGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, blackHoleRadius * 2
    );
    consumeGradient.addColorStop(0, "rgba(0, 0, 0, 1)");
    consumeGradient.addColorStop(0.5, "rgba(50, 0, 100, 0.6)");
    consumeGradient.addColorStop(1, "rgba(100, 0, 200, 0)");
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, blackHoleRadius, 0, Math.PI * 2);
    ctx.fillStyle = consumeGradient;
    ctx.fill();
    
    // Spiral effect
    const spirals = 6;
    const time = Date.now() * 0.01;
    for (let i = 0; i < spirals; i++) {
      ctx.strokeStyle = `rgba(138, 43, 226, 0.3)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
        const radius = blackHoleRadius * 1.5 - (angle / (Math.PI * 4)) * blackHoleRadius * 1.5;
        const x = centerX + Math.cos(angle + time + i * Math.PI / 3) * radius;
        const y = centerY + Math.sin(angle + time + i * Math.PI / 3) * radius;
        if (angle === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    
    if (planets.length === 0 && particles.length === 0) {
      resetPhase = 3;
    }
  } else if (resetPhase === 3) {
    // Implosion
    blackHoleRadius -= 3;
    
    const implodeGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.max(blackHoleRadius, 5)
    );
    implodeGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    implodeGradient.addColorStop(0.5, "rgba(200, 150, 255, 0.8)");
    implodeGradient.addColorStop(1, "rgba(100, 0, 200, 0)");
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(blackHoleRadius, 5), 0, Math.PI * 2);
    ctx.fillStyle = implodeGradient;
    ctx.fill();
    
    if (blackHoleRadius <= 0) {
      // Create explosion particles for new star birth
      for (let i = 0; i < 30; i++) {
        particles.push(new Particle(centerX, centerY, 'rgba(255, 255, 200, 1)'));
      }
      resetPhase = 0;
      isResetting = false;
      blackHoleRadius = 0;
    }
  }
}

// Reset button functionality with black hole
document.getElementById("reset-btn").addEventListener("click", () => {
  if (isResetting) return;
  
  isResetting = true;
  resetPhase = 1;
  blackHoleRadius = 40;
  
  // Clear other entities immediately
  ufos.length = 0;
  satellites.length = 0;
  meteors.length = 0;
});

// Technical section toggle
const technicalSection = document.getElementById("technical-section");
const technicalBtn = document.getElementById("technical-btn");
const closeTechnicalBtn = document.getElementById("close-technical");

technicalBtn.addEventListener("click", () => {
  technicalSection.classList.add("active");
});

closeTechnicalBtn.addEventListener("click", () => {
  technicalSection.classList.remove("active");
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
  
  // Draw black hole if resetting, otherwise draw star
  if (resetPhase > 0) {
    drawBlackHole();
    
    // During consumption phase, pull planets toward center
    if (resetPhase === 2) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      planets.forEach((planet) => {
        const dx = centerX - planet.x;
        const dy = centerY - planet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < blackHoleRadius + planet.radius) {
          // Planet consumed
          for (let k = 0; k < 10; k++) {
            particles.push(new Particle(planet.x, planet.y, planet.color));
          }
          planets.splice(planets.indexOf(planet), 1);
        } else {
          // Strong pull toward black hole
          const pullForce = 0.3;
          planet.vx += (dx / distance) * pullForce;
          planet.vy += (dy / distance) * pullForce;
          planet.update();
          planet.draw();
        }
      });
    }
  } else {
    drawCenterStar();
  }

  // Update and draw planets (only if not in consuming phase)
  if (resetPhase !== 2) {
    planets.forEach((planet) => {
      planet.update();
      planet.draw();
    });
  }

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

  // Update and draw meteors
  for (let i = meteors.length - 1; i >= 0; i--) {
    meteors[i].update();
    meteors[i].draw();
    if (meteors[i].isOffscreen()) {
      meteors.splice(i, 1);
    }
  }

  if (!isResetting) {
    handleCollisions();
  }

  requestAnimationFrame(animate);
}

animate();