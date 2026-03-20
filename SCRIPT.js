// canvas//
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const arcadeCanvas = document.getElementById("arcade");
const arcadeCtx = arcadeCanvas.getContext("2d");
arcadeCtx.imageSmoothingEnabled = false;
// audio//
const sfxShoot = new Audio("sounds/shoot.wav");
const sfxExplosion = new Audio("sounds/explosion.wav");
const sfxHit = new Audio("sounds/hit.wav");
sfxShoot.volume = 0.2;
sfxExplosion.volume = 0.1;
sfxHit.volume = 0.2;
//imges//
const imgbox = new Image();
imgbox.src = "images/box.png";
const imgPlayer = new Image();
imgPlayer.src = "images/player.png";
const imgBullet = new Image();
imgBullet.src = "images/bullet.png";
const imgEnemies = new Image();
imgEnemies.src = "images/enemies.png";
const imgBackground = new Image();
imgBackground.src = "images/background.png";
const imgheart = new Image();
imgheart.src = "images/heart.png";
//game start//
let gameState = "start";
let score = 0;
let lives = 3;
let frame = 0;
let lastTime = 0;
//bullets enemies something//
let bullets = [];
let shootCooldown = 0;
let enemies = [];
let spawnTimer = 0;
let backgroundY = 0;
let heartFrame = 0;
let heartTimer = 0;
//arcade//
const arcade = {
  frame: 0,
  animatimer: 0,
  w: 960,
  h: 1280,
  totalFrames: 6,
};
//player//
const player = {
  x: 220,
  y: 560,
  w: 60,
  h: 60,
  speed: 7,
  frame: 0,
  animatimer: 0,
};
//input//
const keys = {};
document.addEventListener("keydown", function (e) {
  keys[e.key] = true;
  if (e.key === "Enter") {
    if (gameState === "start") {
      score = 0;
      lives = 3;
      frame = 0;
      bullets = [];
      enemies = [];
      player.x = 220;
      player.y = 560;
      gameState = "playing";
    }
    if (gameState === "gameover") {
      gameState = "start";
    }
  }
});
document.addEventListener("keyup", function (e) {
  keys[e.key] = false;
});
//functions//
function shoot() {
  sfxShoot.currentTime = 0;
  sfxShoot.play();
  let dw = 24;
  bullets.push({
    x: player.x + player.w / 2 - dw / 2,
    y: player.y,
    w: dw,
    h: 48,
    speed: 20,
    frame: 0,
    animatimer: 0,
  });
}
function fillTextWithOutline(text, x, y, fillColor, outlineColor, outlineWidth) {
  ctx.lineWidth = outlineWidth;
  ctx.strokeStyle = outlineColor;
  ctx.lineJoin = "round";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}
function update(dt) {
  frame++;
  //arcade animation//
  arcade.animatimer += dt;
  if (arcade.animatimer >= 0.1) {
    arcade.animatimer = 0;
    arcade.frame++;
    if (arcade.frame >= arcade.totalFrames) arcade.frame = 0;
  }
  //heart animation//
  heartTimer += dt;
  if (heartTimer >= 0.1) {
    heartTimer = 0;
    heartFrame++;
    if (heartFrame >= 5) heartFrame = 0;
  }
  //background scroll//
  backgroundY += 120 * dt;
  if (backgroundY >= 640) backgroundY = 0;
  if (gameState !== "playing") return;
  //player movement//
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed * dt * 60;
  if (keys["ArrowRight"] && player.x + player.w < 480) player.x += player.speed * dt * 60;
  if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed * dt * 60;
  if (keys["ArrowDown"] && player.y + player.h < 640) player.y += player.speed * dt * 60;
  //player animation//
  player.animatimer += dt;
  if (player.animatimer >= 0.1) {
    player.animatimer = 0;
    player.frame++;
    if (player.frame >= 4) player.frame = 0;
  }
  //shoot//
  if (keys[" "] && shootCooldown <= 0) {
    shoot();
    shootCooldown = 0.4;
  }
  if (shootCooldown > 0) shootCooldown -= dt;
  bullets.forEach(function (b) {
    b.y -= b.speed * dt * 60;
    b.animatimer += dt;
    if (b.animatimer >= 0.08) {
      b.animatimer = 0;
      b.frame++;
      if (b.frame >= 2) b.frame = 0;
    }
  });
  bullets = bullets.filter(function (b) {
    return b.y > -20;
  });
  //spawn enemies//
  spawnTimer += dt;
  if (spawnTimer >= 0.7) {
    enemies.push({
      x: Math.random() * (480 - 64),
      y: -40,
      w: 64,
      h: 64,
      speed: 5 + Math.random() * 2,
      frame: 0,
      animatimer: 0,
    });
    spawnTimer = 0;
  }
  //enemies movement//
  enemies.forEach(function (e) {
    e.y += e.speed * dt * 60;
    e.animatimer += dt;
    if (e.animatimer >= 0.1) {
      e.animatimer = 0;
      e.frame++;
      if (e.frame >= 4) e.frame = 0;
    }
  });
  enemies = enemies.filter(function (e) {
    return e.y < 680;
  });
  //bullet hit//
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      let b = bullets[bi];
      let e = enemies[ei];
      if (!b || !e) continue;
      if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        score += 10;
        sfxExplosion.currentTime = 0;
        sfxExplosion.play();
        break;
      }
    }
  }
  //player hit//
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    let e = enemies[ei];
    if (e.x < player.x + player.w && e.x + e.w > player.x && e.y < player.y + player.h && e.y + e.h > player.y) {
      enemies.splice(ei, 1);
      lives--;
      sfxHit.currentTime = 0;
      sfxHit.play();
      if (lives <= 0) {
        gameState = "gameover";
      }
    }
  }
}
function draw() {
  //arcade box//
  if (imgbox.complete && imgbox.width > 0) {
    const frameW = imgbox.width / arcade.totalFrames;
    arcadeCtx.clearRect(0, 0, arcade.w, arcade.h);
    arcadeCtx.drawImage(imgbox, frameW * arcade.frame, 0, frameW, imgbox.height, 0, 0, arcade.w, arcade.h);
  }
  //background//
  ctx.drawImage(imgBackground, 0, backgroundY, 480, 640);
  ctx.drawImage(imgBackground, 0, backgroundY - 640, 480, 640);
  //start screen//
  if (gameState === "start") {
    ctx.textAlign = "center";
    ctx.font = "48px 'Alfa Slab One'";
    fillTextWithOutline("ARCADE GAME", 240, 310, "#0011ff", "#8bb3fd", 8);
    ctx.font = "24px 'Alfa Slab One'";
    fillTextWithOutline("Press Enter to Start", 240, 370, "#e5ff00", "#001aff", 4);
    //playing screen//
  } else if (gameState === "playing") {
    ctx.drawImage(imgPlayer, player.frame * 40, 0, 40, 40, player.x, player.y, player.w, player.h);
    bullets.forEach(function (b) {
      ctx.drawImage(imgBullet, b.frame * 32, 0, 32, 32, b.x, b.y, b.w, b.h);
    });
    enemies.forEach(function (e) {
      ctx.drawImage(imgEnemies, e.frame * 48, 0, 48, 48, e.x, e.y, e.w, e.h);
    });
    //score and lives//
    ctx.font = "20px 'Alfa Slab One'";
    ctx.textAlign = "left";
    fillTextWithOutline("score >" + score, 10, 30, "#fbff00", "#4400ff", 4);
    for (let i = 0; i < lives; i++) {
      ctx.drawImage(imgheart, heartFrame * 32, 0, 32, 32, i * 34 + 10, 40, 32, 32);
    }
    //game over screen//
  } else if (gameState === "gameover") {
    ctx.textAlign = "center";
    ctx.font = "60px 'Alfa Slab One'";
    fillTextWithOutline("GAME OVER", 240, 280, "#ff0000", "#500b01", 4);
    ctx.font = "22px 'Alfa Slab One'";
    fillTextWithOutline("score > " + score, 240, 330, "#e5ff00", "#ffae00", 4);
    ctx.font = "22px 'Alfa Slab One'";
    fillTextWithOutline("Press Enter to Restart", 240, 370, "#001aff", "#0091bd", 4);
  }
}
function scaleGame() {
  let wrapper = document.getElementById("wrapper");
  let w = window.innerWidth;
  let h = window.innerHeight;
  let scale = Math.min(w / 960, h / 1280);
  wrapper.style.transform = "scale(" + scale + ")";
  wrapper.style.transformOrigin = "center";
}
scaleGame();
window.addEventListener("resize", scaleGame);
function loop(timestamp) {
  let dt = (timestamp - lastTime) / 1000;
  if (dt > 0.1) dt = 0.1;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
