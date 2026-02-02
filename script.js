// Configuration
const CONFIG = {
    lerpFactor: 0.12,
    lightRadius: 400,
    heartCount: 15,
    repulsionRadius: 120, // For hearts
    visibilityRadius: 250,
    trailLength: 12,
    dustCount: 20
};

// State
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let light = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let firefly = { x: window.innerWidth / 2, y: window.innerHeight / 2, vx: 0, vy: 0 };
let hearts = [];
let trailPoints = [];
let dustMotes = [];
let noClickAttempts = 0;
let currentAct = 1;
let time = 0;

// Elements
let acts = {};
let bgMusic;

class Heart {
    constructor(container) {
        this.element = document.createElement('div');
        this.element.className = 'heart-entity';
        this.anchorX = Math.random() * window.innerWidth;
        this.anchorY = Math.random() * window.innerHeight;
        this.x = this.anchorX;
        this.y = this.anchorY;
        this.driftPhase = Math.random() * Math.PI * 2;
        this.updatePosition();
        
        if (container) {
            container.appendChild(this.element);
        } else {
            document.body.appendChild(this.element);
        }
    }

    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    update(lightX, lightY, t) {
        if (currentAct !== 1) {
            this.element.style.opacity = 0;
            return;
        }

        const dx = lightX - this.anchorX;
        const dy = lightY - this.anchorY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Natural Drift
        const driftX = Math.sin(t * 0.05 + this.driftPhase) * 5;
        const driftY = Math.cos(t * 0.03 + this.driftPhase) * 5;

        // Base Target (Anchor + Drift)
        let targetX = this.anchorX + driftX;
        let targetY = this.anchorY + driftY;

        if (dist > CONFIG.visibilityRadius) {
            this.element.style.opacity = 0;
        } else if (dist > CONFIG.repulsionRadius) {
             // Visible state (shy)
             const opacity = 1 - ((dist - CONFIG.repulsionRadius) / (CONFIG.visibilityRadius - CONFIG.repulsionRadius));
             this.element.style.opacity = Math.max(0, Math.min(0.8, opacity));
             // Go home interactively
             this.x += (targetX - this.x) * 0.05;
             this.y += (targetY - this.y) * 0.05;
        } else {
             // Repulsion (Run away from light)
             this.element.style.opacity = 1;
             const angle = Math.atan2(dy, dx);
             const pushDist = 60; // Push further
             targetX = this.anchorX - Math.cos(angle) * pushDist + driftX;
             targetY = this.anchorY - Math.sin(angle) * pushDist + driftY;
             this.x += (targetX - this.x) * 0.1;
             this.y += (targetY - this.y) * 0.1;
        }
        this.updatePosition();
    }
}

function init() {
    acts = {
        1: document.getElementById('act-1'),
        2: document.getElementById('act-2'),
        3: document.getElementById('act-3')
    };
    bgMusic = document.getElementById('bgMusic');

    // Trail setup
    for (let i = 0; i < CONFIG.trailLength; i++) {
        const dot = document.createElement('div');
        dot.className = 'firefly-trail';
        document.body.appendChild(dot);
        trailPoints.push({ x: 0, y: 0, el: dot });
    }

    setupAct1();
    checkAudio();
    
    // Global Loop
    requestAnimationFrame(loop);
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // Spawn hearts
    const act1Mask = acts[1].querySelector('.masked-layer');
    for (let i = 0; i < CONFIG.heartCount; i++) {
        hearts.push(new Heart(act1Mask));
    }
}

function checkAudio() {
    const warning = document.getElementById('sound-warning');
    if (!warning) return;

    // Show warning initially if paused
    if (bgMusic.paused) {
        warning.classList.add('visible');
    }

    // Check periodically
    setInterval(() => {
        if (!bgMusic.paused && bgMusic.volume > 0.1) {
            warning.classList.remove('visible');
        } else if (bgMusic.paused) {
             warning.classList.add('visible');
        }
    }, 2000);
}

function setupAct1() {
    const btnYes = document.getElementById('btn-yes-act1');
    const btnNo = document.getElementById('btn-no-act1');
    const msg = document.getElementById('persistent-msg');
    
    btnYes.addEventListener('click', () => {
        playMusic();
        transitionToAct2();
    });

    const runaway = (e) => {
        if (noClickAttempts >= 3) return;
        
        // SAFE ZONES: Defined relative to the button's starting position (which is center-ish)
        // or relative to viewport. Best to use fixed offsets from center but ensure they are FAR.
        // Let's toggle between 4 corners relative to the button group.
        
        const corners = [
            {x: 150, y: -100},  // Top Right
            {x: -150, y: -100}, // Top Left
            {x: 150, y: 100},   // Bottom Right
            {x: -150, y: 100},  // Bottom Left
            {x: 0, y: 150}      // Bottom Center (riskier but okay)
        ];

        // Pick a random corner that isn't the current/last one? 
        // Simple random is fine for now, just constrain the values.
        const pic = corners[Math.floor(Math.random() * corners.length)];
        
        // Add a bit of jitter so it's not robotic
        const jitterX = (Math.random() - 0.5) * 50;
        const jitterY = (Math.random() - 0.5) * 50;

        btnNo.style.position = 'absolute'; // Ensure it can move freely relative to parent
        // Note: It's in a flex container, so transform is better, but transform is relative to original spot.
        // The original spot is next to YES.
        
        btnNo.style.transition = "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        btnNo.style.transform = `translate(${pic.x + jitterX}px, ${pic.y + jitterY}px)`;
        
        noClickAttempts++;
        if (noClickAttempts === 3) {
            msg.classList.add('visible');
            btnNo.innerText = "NO (Broken)";
            btnNo.style.opacity = 0.5;
            btnNo.style.pointerEvents = "none";
        }
    };

    btnNo.addEventListener('mouseover', runaway);
}

function playMusic() {
    if (bgMusic) {
        bgMusic.volume = 0.2;
        bgMusic.play().then(() => {
            document.getElementById('sound-warning').classList.remove('visible');
        }).catch(e => console.log("Audio play failed", e));
        
        let vol = 0.2;
        const fadeInterval = setInterval(() => {
            if (vol < 0.8) {
                vol += 0.05;
                bgMusic.volume = vol;
            } else {
                clearInterval(fadeInterval);
            }
        }, 500);
    }
}

function transitionToAct2() {
    currentAct = 2;
    acts[1].classList.remove('active');
    acts[1].classList.add('hidden');
    
    // Firefly stays! logic handled in loop

    acts[2].classList.remove('hidden');
    setTimeout(() => acts[2].classList.add('active'), 100);

    // Act 2 Particles
    setupAct2Particles();

    startTypewriterSequence();
}

function setupAct2Particles() {
    const container = acts[2];
    for (let i = 0; i < CONFIG.dustCount; i++) {
        const d = document.createElement('div');
        d.className = 'firefly-trail'; // Reuse style but modify
        d.style.position = 'absolute';
        d.style.background = 'rgba(255,255,255,0.2)';
        d.style.width = Math.random() * 4 + 2 + 'px';
        d.style.height = d.style.width;
        d.style.top = Math.random() * 100 + '%';
        d.style.left = Math.random() * 100 + '%';
        container.appendChild(d);
        dustMotes.push({
            el: d,
            x: parseFloat(d.style.left),
            y: parseFloat(d.style.top),
            vx: (Math.random() - 0.5) * 0.05,
            vy: (Math.random() - 0.5) * 0.05
        });
    }
}

// Book Reading Logic (Magic Ink)
function startTypewriterSequence() {
    const sections = [
        document.getElementById('poem-part-1'),
        document.getElementById('poem-part-2'),
        document.getElementById('poem-part-3'),
        document.getElementById('poem-part-4'),
        document.getElementById('poem-part-5')
    ];

    let queue = [];
    sections.forEach(sec => {
        // Prepare Section: split into ghost characters
        prepareSectionText(sec);
        
        // Collect all char spans
        const chars = Array.from(sec.querySelectorAll('.char-span'));
        queue.push({ 
            chars: chars, 
            section: sec
        });
        
        queue.push({ pause: 2500 }); // Pause between sections
    });

    readNextBatch(queue, 0);
}

function prepareSectionText(section) {
    // Save original content structure (paragraphs)
    const lines = Array.from(section.querySelectorAll('p'));
    lines.forEach(line => {
        const text = line.innerText;
        line.innerHTML = ''; // Clear text
        
        // Split by words to keep word-breaks nice
        const words = text.split(/(\s+)/); // Keep spaces
        words.forEach(word => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word-span';
            
            // Split word into chars
            for (let char of word) {
                const charSpan = document.createElement('span');
                charSpan.className = 'char-span';
                charSpan.innerText = char;
                wordSpan.appendChild(charSpan);
            }
            line.appendChild(wordSpan);
        });
        line.style.opacity = 1;
    });
}

function readNextBatch(queue, index) {
    if (index >= queue.length) {
        setTimeout(() => {
            // Turn Page Logic
            // Hide all current sections on the right page
            document.querySelectorAll('.poem-section').forEach(s => {
                s.classList.remove('active-section');
                s.classList.add('fade-out-up');
            });
            
            // Show new page content
            setTimeout(() => {
                const endContent = document.getElementById('page-end-content');
                endContent.classList.remove('hidden-section');
                endContent.classList.remove('fade-out-up'); // CRITICAL FIX
                endContent.classList.add('active-section');
                
                const btn = document.getElementById('btn-act2-next');
                if(btn) btn.addEventListener('click', transitionToAct3);
            }, 800);
            
        }, 1000);
        return;
    }

    const item = queue[index];

    if (item.pause) {
        setTimeout(() => readNextBatch(queue, index + 1), item.pause);
        return;
    }

    // It's a section
    const section = item.section;
    const chars = item.chars;

    // Logic to hide previous section
    document.querySelectorAll('.poem-section').forEach(s => {
        if (s !== section) {
            s.classList.remove('active-section');
            s.classList.add('fade-out-up');
        }
    });
    section.classList.remove('fade-out-up');
    section.classList.remove('hidden-section');
    section.classList.add('active-section');

    // Animate Chars
    let charIndex = 0;
    const revealChar = () => {
        if (charIndex < chars.length) {
            chars[charIndex].classList.add('inked');
            charIndex++;
            // Reading speed
            setTimeout(revealChar, 50 + Math.random() * 30);
        } else {
            // Batch finished
            setTimeout(() => readNextBatch(queue, index + 1), 800);
        }
    };
    
    // Start revealing
    revealChar();
}

function transitionToAct3() {
    currentAct = 3;
    acts[2].classList.remove('active');
    setTimeout(() => acts[2].classList.add('hidden'), 1000);

    acts[3].classList.remove('hidden');
    setTimeout(() => acts[3].classList.add('active'), 500);

    setupAct3();
}

function setupAct3() {
    const container = document.querySelector('.final-container');
    const texts = container.querySelectorAll('.final-text');
    const buttons = document.getElementById('final-buttons');
    const btnYes = document.getElementById('btn-yes-final');
    const btnNo = document.getElementById('btn-no-final');
    const sadEnding = document.getElementById('sad-ending');

    let delay = 0;
    texts.forEach((p, i) => {
        setTimeout(() => {
            p.classList.add('visible');
        }, delay);
        delay += 2000;
    });

    setTimeout(() => {
        buttons.classList.add('visible');
    }, delay + 500);

    btnYes.addEventListener('click', () => {
        // Clear previous text nicely
        texts.forEach(t => t.style.opacity = 0);
        buttons.style.opacity = 0;
        setTimeout(() => {
             container.innerHTML = "<h1 style='font-family:Dancing Script; font-size:3rem; margin-top:20vh;'>Really, is it YES! ❤️</h1><p style='margin-top:20px; font-size:1.5rem;'>My golden evening has begun.</p>";
             celebrate();
        }, 1000);
    });

    btnNo.addEventListener('click', () => {
        // Hide only buttons and text, show sad ending
        texts.forEach(t => t.style.display = 'none');
        buttons.style.display = 'none';
        
        sadEnding.classList.remove('hidden');
        sadEnding.style.display = 'block';
        setTimeout(() => sadEnding.classList.add('active'), 100);
    });
}

function loop() {
    time += 1;

    // Firefly Physics
    const dx = mouse.x - firefly.x;
    const dy = mouse.y - firefly.y;
    
    firefly.vx += dx * 0.005 + Math.sin(time * 0.1) * 0.2;
    firefly.vy += dy * 0.005 + Math.cos(time * 0.1) * 0.2;
    firefly.vx *= 0.9;
    firefly.vy *= 0.9;
    firefly.x += firefly.vx;
    firefly.y += firefly.vy;

    // Update Firefly Element
    const fireflyEl = document.querySelector('.firefly-cursor');
    if (fireflyEl) {
        fireflyEl.style.left = firefly.x + 'px';
        fireflyEl.style.top = firefly.y + 'px';
    }

    // Update Trail
    // Shift trail points with LERP for smooth streak
    trailPoints[0].x = firefly.x;
    trailPoints[0].y = firefly.y;
    
    for (let i = 1; i < CONFIG.trailLength; i++) {
        const prev = trailPoints[i-1];
        const curr = trailPoints[i];
        
        curr.x += (prev.x - curr.x) * 0.6; // Follow smoothly
        curr.y += (prev.y - curr.y) * 0.6;
    }

    trailPoints.forEach((p, i) => {
        const scale = 1 - (i / CONFIG.trailLength);
        p.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${scale})`;
        p.el.style.opacity = scale * 0.6;
    });

    // Light follows firefly
    light.x += (firefly.x - light.x) * 0.2;
    light.y += (firefly.y - light.y) * 0.2;

    document.documentElement.style.setProperty('--x', `${light.x}px`);
    document.documentElement.style.setProperty('--y', `${light.y}px`);
    
    // Act 1 Hearts
    if (currentAct === 1) {
        hearts.forEach(h => h.update(light.x, light.y, time));
    }

    // Act 2 Dust
    if (currentAct === 2) {
        dustMotes.forEach(d => {
            d.x += d.vx;
            d.y += d.vy;
            if (d.x > 100) d.x = 0; else if (d.x < 0) d.x = 100;
            if (d.y > 100) d.y = 0; else if (d.y < 0) d.y = 100;
            d.el.style.left = d.x + '%';
            d.el.style.top = d.y + '%';
        });
    }

    requestAnimationFrame(loop);
}

function celebrate() {
    const canvas = document.getElementById('celebration-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let particles = [];
    const colors = ['#FFD700', '#FF69B4', '#ff4d4d', '#ffffff'];
    
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            size: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 100
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let active = false;
        particles.forEach(p => {
            if (p.life > 0) {
                active = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // Gravity
                p.life--;
                
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        if (active) requestAnimationFrame(animate);
    }
    
    animate();
}

document.addEventListener('DOMContentLoaded', init);
