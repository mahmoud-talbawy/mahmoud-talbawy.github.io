import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============================================
   1. PARTICLES BACKGROUND
   ============================================ */
function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let width, height, particles;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        const count = Math.floor((width * height) / 12000);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.1,
                color: ['#00f0ff', '#ff2d78', '#a855f7'][Math.floor(Math.random() * 3)]
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    animate();
    window.addEventListener('resize', () => { resize(); createParticles(); });
}

/* ============================================
   2. THREE.JS 3D MODEL + SCROLL ANIMATION
   ============================================ */
function init3DModel() {
    const container = document.getElementById('model-container');
    const canvas = document.getElementById('three-canvas');

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.5, 4);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(3, 5, 4);
    scene.add(mainLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 2, 10);
    cyanLight.position.set(-3, 2, 2);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xff2d78, 1.5, 10);
    pinkLight.position.set(3, -1, 3);
    scene.add(pinkLight);

    // Load model
    let model = null;
    const loader = new GLTFLoader();
    loader.load('red-monster.glb', (gltf) => {
        model = gltf.scene;

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        scene.add(model);
    });

    // Scroll state
    let scrollProgress = 0;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

    window.addEventListener('scroll', () => {
        scrollProgress = window.scrollY / totalHeight;
    }, { passive: true });

    // Scroll-based animation keyframes
    // 0.0 = top (hero) → 1.0 = bottom (download)
    function getScrollTransform(t) {
        // Rotation: full 360 + wobble
        const rotationY = t * Math.PI * 4;
        const rotationX = Math.sin(t * Math.PI * 2) * 0.3;

        // Position: float up and down
        const posY = Math.sin(t * Math.PI * 3) * 0.5;

        // Scale: pulse
        const scaleBase = 1 + Math.sin(t * Math.PI * 2) * 0.15;

        return { rotationX, rotationY, posY, scaleBase };
    }

    // Animation loop
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        if (model) {
            const st = getScrollTransform(scrollProgress);

            // Scroll-driven rotation + gentle auto-rotation
            model.rotation.y = st.rotationY + time * 0.3;
            model.rotation.x = st.rotationX;

            // Float position
            model.position.y = st.posY + Math.sin(time * 1.5) * 0.1;

            // Scale pulse
            const s = st.scaleBase;
            model.scale.setScalar(2.5 / 2 * s); // base scale * pulse
        }

        // Animate lights
        cyanLight.position.x = Math.sin(time * 0.7) * 4;
        cyanLight.position.y = Math.cos(time * 0.5) * 3 + 2;
        pinkLight.position.x = Math.cos(time * 0.8) * 4;
        pinkLight.position.z = Math.sin(time * 0.6) * 3 + 2;

        renderer.render(scene, camera);
    }

    animate();

    // Resize
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
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Staggered animation
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

/* ============================================
   4. SMOOTH SECTION TRANSITIONS
   ============================================ */
function initModelOpacity() {
    const container = document.getElementById('model-container');
    const sections = document.querySelectorAll('.section');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const windowH = window.innerHeight;

        // Fade model based on scroll position
        // Fully visible in hero, fades in other sections
        const heroEnd = windowH;
        if (scrollY < heroEnd) {
            container.style.opacity = 1;
        } else {
            container.style.opacity = Math.max(0.15, 1 - (scrollY - heroEnd) / windowH);
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
