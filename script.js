import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ============================================
   1. INTERACTIVE PARTICLES BACKGROUND
   Particles attract towards mouse/touch
   ============================================ */
function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let width, height, particles;
    let mouseX = -1000, mouseY = -1000;
    const attractRadius = 150;
    const attractStrength = 0.02;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        const count = Math.floor((width * height) / 10000);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                baseX: 0, baseY: 0,
                size: Math.random() * 2.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: (Math.random() - 0.5) * 0.4,
                opacity: Math.random() * 0.6 + 0.15,
                color: ['#00f0ff', '#ff2d78', '#a855f7', '#00f0ff'][Math.floor(Math.random() * 4)]
            });
        }
        particles.forEach(p => { p.baseX = p.x; p.baseY = p.y; });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        for (const p of particles) {
            // Normal drift
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Mouse/touch attraction
            const dx = mouseX - p.x;
            const dy = mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let drawX = p.x;
            let drawY = p.y;
            let drawSize = p.size;
            let drawOpacity = p.opacity;

            if (dist < attractRadius) {
                const force = (1 - dist / attractRadius) * attractStrength;
                drawX += dx * force * 8;
                drawY += dy * force * 8;
                drawSize = p.size * (1 + (1 - dist / attractRadius) * 1.5);
                drawOpacity = Math.min(1, p.opacity + (1 - dist / attractRadius) * 0.5);
            }

            // Draw particle
            ctx.beginPath();
            ctx.arc(drawX, drawY, drawSize, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = drawOpacity;
            ctx.fill();

            // Draw connection lines near mouse
            if (dist < attractRadius * 0.8) {
                ctx.beginPath();
                ctx.moveTo(drawX, drawY);
                ctx.lineTo(mouseX, mouseY);
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = (1 - dist / attractRadius) * 0.15;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(animate);
    }

    // Mouse tracking
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    // Touch tracking
    window.addEventListener('touchmove', (e) => {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    resize();
    createParticles();
    animate();
    window.addEventListener('resize', () => { resize(); createParticles(); });
}

/* ============================================
   2. THREE.JS 3D MODEL — Interactive
   Drag to rotate on both desktop & mobile
   ============================================ */
function init3DModel() {
    const isMobile = window.innerWidth <= 640;
    const mobileSlot = document.getElementById('mobile-3d-slot');
    const desktopContainer = document.getElementById('model-container');

    let container;
    const canvas = document.getElementById('three-canvas');

    if (isMobile && mobileSlot) {
        mobileSlot.appendChild(canvas);
        container = mobileSlot;
        desktopContainer.style.display = 'none';
    } else {
        container = desktopContainer;
    }

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1, 100
    );
    camera.position.set(0, isMobile ? 0.8 : 1.5, isMobile ? 3.5 : 4);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    // Lighting — cinematic
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(3, 5, 4);
    scene.add(mainLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 3, 12);
    cyanLight.position.set(-3, 2, 2);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xff2d78, 2.5, 12);
    pinkLight.position.set(3, -1, 3);
    scene.add(pinkLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 1.5, 8);
    purpleLight.position.set(0, 3, -2);
    scene.add(purpleLight);

    // Load model
    let model = null;
    let baseScale = 1;
    const loader = new GLTFLoader();

    loader.load('red-monster.glb', (gltf) => {
        model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        baseScale = (isMobile ? 2.2 : 2.5) / maxDim;
        model.scale.setScalar(baseScale);
        model.position.sub(center.multiplyScalar(baseScale));

        scene.add(model);
    });

    // --- Interactive drag rotation ---
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let dragRotX = 0, dragRotY = 0;
    let targetRotX = 0, targetRotY = 0;

    // Enable pointer events on canvas for interaction
    canvas.style.pointerEvents = 'auto';

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        targetRotY = dragRotY + dx * 0.008;
        targetRotX = dragRotX + dy * 0.005;
        targetRotX = Math.max(-0.5, Math.min(0.5, targetRotX));
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        dragRotX = targetRotX;
        dragRotY = targetRotY;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            dragRotX = targetRotX;
            dragRotY = targetRotY;
            canvas.style.cursor = 'grab';
        }
    });

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        isDragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - dragStartX;
        const dy = e.touches[0].clientY - dragStartY;
        targetRotY = dragRotY + dx * 0.008;
        targetRotX = dragRotX + dy * 0.005;
        targetRotX = Math.max(-0.5, Math.min(0.5, targetRotX));
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
        isDragging = false;
        dragRotX = targetRotX;
        dragRotY = targetRotY;
    });

    canvas.style.cursor = 'grab';

    // Scroll state
    let scrollProgress = 0;
    const getScrollMax = () => document.documentElement.scrollHeight - window.innerHeight;

    window.addEventListener('scroll', () => {
        scrollProgress = window.scrollY / getScrollMax();
    }, { passive: true });

    // Current smooth values
    let currentRotY = 0, currentRotX = 0;

    // Animation loop
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        if (model) {
            // Auto rotation (gentle, stops if dragging)
            if (!isDragging) {
                targetRotY += 0.003;
            }

            // Smooth lerp to target rotation
            currentRotY += (targetRotY - currentRotY) * 0.05;
            currentRotX += (targetRotX - currentRotX) * 0.05;

            model.rotation.y = currentRotY;
            model.rotation.x = currentRotX;

            // Float animation
            model.position.y = Math.sin(time * 1.2) * 0.15;

            // Scale: gentle breathing
            const breathe = 1 + Math.sin(time * 0.8) * 0.03;
            model.scale.setScalar(baseScale * breathe);
        }

        // Animate lights — orbit around model
        cyanLight.position.x = Math.sin(time * 0.5) * 4;
        cyanLight.position.y = Math.cos(time * 0.3) * 2 + 2;
        pinkLight.position.x = Math.cos(time * 0.6) * 4;
        pinkLight.position.z = Math.sin(time * 0.4) * 3 + 2;
        purpleLight.position.x = Math.sin(time * 0.3) * 2;
        purpleLight.position.z = Math.cos(time * 0.5) * 3 - 2;

        renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

/* ============================================
   3. SCROLL REVEAL ANIMATIONS
   ============================================ */
function initScrollReveal() {
    const elements = document.querySelectorAll('.feature-card, .rule, .screenshot-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    });

    elements.forEach((el, i) => {
        el.style.transitionDelay = `${i * 80}ms`;
        observer.observe(el);
    });
}

/* ============================================
   4. MODEL OPACITY ON SCROLL (desktop only)
   ============================================ */
function initModelOpacity() {
    if (window.innerWidth <= 640) return; // Skip on mobile

    const container = document.getElementById('model-container');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const windowH = window.innerHeight;
        const heroEnd = windowH;

        if (scrollY < heroEnd) {
            container.style.opacity = 1;
        } else {
            container.style.opacity = Math.max(0.1, 1 - (scrollY - heroEnd) / (windowH * 0.8));
        }
    }, { passive: true });
}

/* ============================================
   INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    init3DModel();
    initScrollReveal();
    initModelOpacity();
});
