/* ============================================================
   A tiny self-playing brick-breaker.
   Same core ideas as Poccer, just in JavaScript on a <canvas>:
   a game loop, a ball with velocity, and collision checks.

   Things to try changing:
   - SPEED, ROWS, brick colors in the tokens below
   - make the paddle miss sometimes (it's perfect right now)
   - keep score and draw it in a corner
   ============================================================ */

const canvas = document.getElementById("bricks");
const ctx = canvas.getContext("2d");

// Pull theme colors from CSS so the game re-themes with the site.
const css = getComputedStyle(document.documentElement);
const INK    = css.getPropertyValue("--ink").trim();
const ACCENT = css.getPropertyValue("--accent").trim();
const LINE   = css.getPropertyValue("--line").trim();

const SPEED = 4.2;   // ball speed (pixels per frame)
const ROWS  = 3;     // rows of bricks

let W, H, bricks, ball, paddle, brickW, brickH;

/* ---------- setup ---------- */

function resize() {
  // Match the canvas's internal pixels to its on-screen size,
  // scaled for high-DPI screens so nothing looks blurry.
  const dpr = window.devicePixelRatio || 1;
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  reset();
}

function reset() {
  const cols = Math.max(6, Math.floor(W / 90));
  brickW = W / cols;
  brickH = 16;

  bricks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({ x: c * brickW, y: 14 + r * (brickH + 6), alive: true });
    }
  }

  // Start the ball somewhere new each time, heading up.
  const angle = (-Math.PI / 4) - (Math.random() * Math.PI / 2);
  ball = {
    x: W * (0.2 + Math.random() * 0.6),
    y: H * 0.65,
    vx: Math.cos(angle) * SPEED,
    vy: Math.sin(angle) * SPEED,
    r: 6,
  };

  paddle = { w: 70, h: 8, x: W / 2 };
}

/* ---------- update ---------- */

function update() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Walls
  if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
  if (ball.y < ball.r) ball.vy *= -1;

  // Paddle drifts toward the ball, so it never loses. (Change that!)
  paddle.x += (ball.x - paddle.x) * 0.08;

  // Paddle bounce
  const py = H - 18;
  if (ball.vy > 0 && ball.y + ball.r >= py &&
      Math.abs(ball.x - paddle.x) < paddle.w / 2 + ball.r) {
    ball.vy = -Math.abs(ball.vy);
    // Add a little english based on where it hit the paddle.
    ball.vx += (ball.x - paddle.x) * 0.04;
  }

  // Safety net: if the ball somehow escapes, start over.
  if (ball.y > H + 40) reset();

  // Bricks
  for (const b of bricks) {
    if (!b.alive) continue;
    if (ball.x > b.x && ball.x < b.x + brickW &&
        ball.y - ball.r < b.y + brickH && ball.y + ball.r > b.y) {
      b.alive = false;
      ball.vy *= -1;
      break;
    }
  }

  // Cleared the board? Rack 'em up again.
  if (bricks.every(b => !b.alive)) reset();
}

/* ---------- draw ---------- */

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const b of bricks) {
    if (!b.alive) continue;
    ctx.fillStyle = INK;
    ctx.fillRect(b.x + 2, b.y, brickW - 4, brickH);
  }

  // Paddle
  ctx.fillStyle = INK;
  ctx.fillRect(paddle.x - paddle.w / 2, H - 18, paddle.w, paddle.h);

  // Ball
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- run ---------- */

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
resize();

// Respect users who've turned off animation in their OS settings:
// draw one still frame instead of running the loop.
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  draw();
} else {
  loop();
}
