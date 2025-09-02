/* Black Cat: 9 Lives — readable source
   js13k-friendly architecture in one file when built (no external assets).
   Gameplay:
   - Move a black cat around neon arenas collecting cheese, avoiding dogs.
   - Start with 9 lives, +1 life at every 10 score.
   - Each level requires 10 cheese to advance; colors & simple melody change.
   - No dash (Shift removed for stability).
*/
(() => {
  // --- Canvas & UI ---
  const W = 960, H = 540;
  const canvas = document.getElementById('c');
  const ui = document.getElementById('ui');
  const ctx = canvas.getContext('2d');

  // --- Globals & Input ---
  let scaleFactor = 1;
  let keys = Object.create(null);
  let time = 0;
  let started = false, gameOver = false;
  const ns = "bc9l_"; // namespaced localStorage key
  let best = +localStorage.getItem(ns + "best") || 0;

  function scale() {
    scaleFactor = Math.min(innerWidth / W, innerHeight / H);
    canvas.style.width = (W * scaleFactor) + "px";
    canvas.style.height = (H * scaleFactor) + "px";
  }
  addEventListener('resize', scale); scale();
  onkeydown = e => {
    keys[e.key] = 1;
    if (!started && (e.key === " " || e.key === "Enter")) start();
    if (e.key === "m") musicOn = !musicOn;
  };
  onkeyup = e => keys[e.key] = 0;

  // --- Audio (simple, tiny) ---
  let audioCtx, musicOn = true;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function beep(freq = 440, dur = 0.08, type = "square", vol = 0.04) {
    const a = ensureAudio();
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(a.destination);
    const t = a.currentTime;
    osc.start(t);
    osc.stop(t + dur);
  }

  // Level palettes (bg gradient CSS, hue offset) and tiny melodies
  const LEVELS = {
    target: 10,
    palettes: [
      ["radial-gradient(circle at 30% 20%,#2800ff,#ff00a8 40%,#0ff 70%,#001)", 0],
      ["radial-gradient(circle at 70% 30%,#00ffa5,#00b3ff 40%,#ff00e1 70%,#01002a)", 120],
      ["radial-gradient(circle at 40% 60%,#ff7b00,#ffe600 45%,#00ffd5 75%,#100008)", 200],
      ["radial-gradient(circle at 50% 50%,#5bff00,#00ffd9 45%,#ff0095 70%,#020011)", 280],
      ["radial-gradient(circle at 20% 80%,#ffd500,#ff5f00 40%,#00b3ff 70%,#060006)", 40]
    ],
    tunes: [
      [220,330,262,392,330,262,330,494],
      [262,349,294,440,349,294,392,523],
      [196,294,247,392,294,247,330,494],
      [247,370,311,466,370,311,415,587],
      [233,349,277,415,349,277,392,554]
    ]
  };
  let level = 1, needed = LEVELS.target, collected = 0, tuneIndex = 0;

  setInterval(() => {
    if (musicOn && started && !gameOver) {
      const seq = LEVELS.tunes[(level - 1) % LEVELS.tunes.length];
      beep(seq[tuneIndex++ % seq.length], 0.07, "square", 0.01);
    }
  }, 250);

  // --- Entities ---
  const rand = Math.random;
  function randomPos(m = 30) {
    return { x: m + rand() * (W - 2 * m), y: m + rand() * (H - 2 * m) };
  }
  let cat, cheese, dogs, score = 0, lives = 9;

  function reset() {
    cat = { x: W/2, y: H/2, vx: 0, vy: 0, r: 16, speed: 3.2 };
    placeCheese();
    dogs = [];
    const n = 3 + Math.min(level - 1, 9);
    for (let i = 0; i < n; i++) {
      const p = randomPos(40);
      dogs.push({
        x: p.x, y: p.y,
        vx: (rand() * 2 - 1) * (.8 + .05 * level),
        vy: (rand() * 2 - 1) * (.8 + .05 * level),
        r: 18, ang: rand() * 6
      });
    }
    needed = LEVELS.target;
    collected = 0;
    gameOver = false;
    canvas.style.background = LEVELS.palettes[(level - 1) % LEVELS.palettes.length][0];
  }
  function start() { started = true; level = 1; lives = 9; score = 0; reset(); }
  function nextLevel() { level++; lives = Math.min(18, lives + 1); reset(); }

  // --- Drawing helpers ---
  function circle(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  function tri(x, y, r, a, c) {
    ctx.fillStyle = c; ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a + 2.7) * r, y + Math.sin(a + 2.7) * r);
    ctx.lineTo(x + Math.cos(a - 2.7) * r, y + Math.sin(a - 2.7) * r);
    ctx.fill();
  }

  function drawCat(p) {
    const x = p.x, y = p.y;
    ctx.shadowColor = "#0ff"; ctx.shadowBlur = 12;
    circle(x, y, 14, "#000");
    tri(x - 6, y - 10, 8, -0.2, "#000");
    tri(x + 6, y - 10, 8, 0.2, "#000");
    ctx.fillStyle = "#000"; ctx.fillRect(x - 10, y, 20, 18);
    ctx.save(); ctx.translate(x + 12, y + 14); ctx.rotate(Math.sin(time / 12) / 3); ctx.fillRect(0, -2, 18, 4); ctx.restore();
    ctx.shadowBlur = 0;
    circle(x - 4, y - 1, 2, "#0f0"); circle(x + 4, y - 1, 2, "#0f0");
  }
  function drawDog(d) {
    const x = d.x, y = d.y;
    ctx.shadowColor = "#ff0"; ctx.shadowBlur = 8;
    ctx.fillStyle = "#e11"; ctx.fillRect(x - 16, y - 12, 32, 24);
    tri(x - 10, y - 18, 8, -0.5, "#e11"); tri(x + 10, y - 18, 8, 0.5, "#e11");
    ctx.shadowBlur = 0;
    circle(x - 6, y - 2, 3, "#fff"); circle(x + 6, y - 2, 3, "#fff");
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 8); ctx.lineTo(x - 2, y - 4);
    ctx.moveTo(x + 10, y - 8); ctx.lineTo(x + 2, y - 4);
    ctx.stroke();
    tri(x, y + 8, 5, Math.PI / 2, "#fff");
  }
  function drawCheese(o) {
    ctx.fillStyle = "#ff3";
    ctx.beginPath();
    ctx.moveTo(o.x - 12, o.y + 10);
    ctx.lineTo(o.x + 12, o.y + 10);
    ctx.lineTo(o.x + 8, o.y - 8);
    ctx.closePath();
    ctx.fill();
    circle(o.x - 2, o.y, 2, "#e5c400");
    circle(o.x + 4, o.y + 4, 2, "#e5c400");
  }

  // --- Mechanics ---
  function placeCheese(){ cheese = randomPos(30); cheese.r = 10; }
  function collides(a,b){
    const dx=a.x-b.x, dy=a.y-b.y, rr=(a.r+b.r)*(a.r+b.r);
    return dx*dx+dy*dy < rr;
  }
  function sparkles(){
    const hueBase = LEVELS.palettes[(level-1)%LEVELS.palettes.length][1];
    for(let i=0;i<80;i++){
      const r=1+((i+time)%7);
      ctx.fillStyle=`hsl(${(hueBase+i*20+time)%360} 90% 55%)`;
      ctx.fillRect((i*37+time*2)%W,(i*61+time)%H,r,r);
    }
  }
  function hud(){
    ui.innerHTML = `L${level} &nbsp; Score: ${score} &nbsp; Lives: ${lives} &nbsp; Cheese: ${collected}/${needed} &nbsp; Best: ${best} &nbsp; <span style="opacity:.7">[WASD/Arrows] [M:music]</span>`;
  }
  function banner(){
    ctx.fillStyle="rgba(0,0,0,.45)"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#fff"; ctx.textAlign="center";
    ctx.font="bold 52px system-ui,Segoe UI,Arial"; ctx.fillText("BLACK CAT: 9 LIVES", W/2, H/2-40);
    ctx.font="bold 20px monospace"; ctx.fillText("Grab "+LEVELS.target+" cheese to advance.", W/2, H/2);
    ctx.fillText("Press SPACE to begin — M to mute", W/2, H/2+70);
  }
  function showGameOver(){
    ctx.fillStyle="rgba(0,0,0,.6)"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#fff"; ctx.textAlign="center";
    ctx.font="bold 46px system-ui,Segoe UI,Arial"; ctx.fillText("GAME OVER", W/2, H/2-20);
    ctx.font="bold 22px monospace"; ctx.fillText("Score: "+score+"   Best: "+best, W/2, H/2+12);
    ctx.fillText("Press SPACE to play again", W/2, H/2+42);
    if(keys[" "] || keys.Enter){ start(); }
  }

  function step(){
    time++; ctx.clearRect(0,0,W,H); sparkles();
    if(!started){ banner(); return requestAnimationFrame(step); }
    if(gameOver){ showGameOver(); return requestAnimationFrame(step); }

    // Input & movement (no dash)
    let ax=(keys.ArrowRight||keys.d)?1:0; ax-=(keys.ArrowLeft||keys.a)?1:0;
    let ay=(keys.ArrowDown||keys.s)?1:0; ay-=(keys.ArrowUp||keys.w)?1:0;
    cat.vx=(cat.vx+ax*0.7)*0.84; cat.vy=(cat.vy+ay*0.7)*0.84;
    const sp = cat.speed;
    cat.x += Math.max(-sp, Math.min(sp, cat.vx));
    cat.y += Math.max(-sp, Math.min(sp, cat.vy));
    if(cat.x<16)cat.x=16; if(cat.y<16)cat.y=16; if(cat.x>W-16)cat.x=W-16; if(cat.y>H-16)cat.y=H-16;

    // Dogs update (mild chase with jitter)
    for(const d of dogs){
      const dx=cat.x-d.x, dy=cat.y-d.y, L=Math.hypot(dx,dy)+.001;
      const s=.9+(Math.sin(time/50+d.ang)*.4)+level*0.03;
      d.vx=(d.vx+dx/L*0.05*s)*0.97; d.vy=(d.vy+dy/L*0.05*s)*0.97;
      d.x+=d.vx; d.y+=d.vy;
      if(d.x<18||d.x>W-18)d.vx*=-1;
      if(d.y<18||d.y>H-18)d.vy*=-1;
    }

    // Cheese
    drawCheese(cheese);
    if(collides(cat,cheese)){
      score++; collected++; beep(660,0.06,"triangle",0.02);
      if(score%10===0 && lives<18){ lives++; beep(880,0.12,"sawtooth",0.03); }
      if(collected>=needed){
        beep(988,0.14,"square",0.04); beep(1245,0.12,"square",0.03);
        nextLevel();
      }else{
        placeCheese();
      }
      if(score%7===0 && dogs.length<14){
        const p=randomPos(40); dogs.push({x:p.x,y:p.y,vx:(rand()*2-1),vy:(rand()*2-1),r:18,ang:rand()*6});
      }
    }

    // Collisions with dogs
    for(const d of dogs){
      if(collides(cat,d)){
        lives--; beep(140,0.2,"sawtooth",0.06);
        cat.x=W/2; cat.y=H/2; cat.vx=cat.vy=0;
        if(lives<=0){
          gameOver=true; best=Math.max(best,score);
          localStorage.setItem(ns+"best",best);
        }
        break;
      }
    }

    // Draw
    drawCat(cat); for(const d of dogs) drawDog(d);
    hud();
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
})();