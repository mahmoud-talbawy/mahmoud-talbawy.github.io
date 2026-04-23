import * as THREE from 'three';

// ============================================
// THREE.JS — Inside bento card
// ============================================
const canvas = document.getElementById('threeBg');
const container = canvas.parentElement;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Particles
const count = 400;
const positions = new Float32Array(count * 3);
const sizes = new Float32Array(count);
for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    sizes[i] = Math.random() * 3 + 1;
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const mat = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0xa78bfa) },
        uColor2: { value: new THREE.Color(0x34d399) },
        uPixelRatio: { value: renderer.getPixelRatio() },
    },
    vertexShader: `
        attribute float size;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vDist;
        void main() {
            vec3 p = position;
            p.x += sin(uTime * .3 + position.y * .5) * .4;
            p.y += cos(uTime * .2 + position.x * .4) * .4;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vDist = length(mv.xyz);
            gl_PointSize = size * uPixelRatio * (150.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
        }
    `,
    fragmentShader: `
        uniform vec3 uColor1, uColor2;
        uniform float uTime;
        varying float vDist;
        void main() {
            float d = length(gl_PointCoord - .5);
            if (d > .5) discard;
            float a = (1.0 - smoothstep(0.0, .5, d)) * smoothstep(20.0, 3.0, vDist) * .7;
            vec3 c = mix(uColor1, uColor2, sin(vDist * .4 + uTime * .5) * .5 + .5);
            a += exp(-d * 5.0) * .3;
            gl_FragColor = vec4(c, a);
        }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
});

const particles = new THREE.Points(geo, mat);
scene.add(particles);
camera.position.z = 8;

function animate() {
    requestAnimationFrame(animate);
    mat.uniforms.uTime.value = performance.now() * 0.001;
    particles.rotation.y += 0.001;
    particles.rotation.x += 0.0005;
    renderer.render(scene, camera);
}
animate();

// Resize observer for the card
const ro = new ResizeObserver(() => {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});
ro.observe(container);

// ============================================
// THEME
// ============================================
const html = document.documentElement;
const toggle = document.getElementById('themeToggle');

function setTheme(t) {
    html.dataset.theme = t;
    localStorage.setItem('theme', t);
    const dark = t === 'dark';
    mat.uniforms.uColor1.value.set(dark ? 0xa78bfa : 0x7c3aed);
    mat.uniforms.uColor2.value.set(dark ? 0x34d399 : 0x059669);
}
toggle.addEventListener('click', () => setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark'));
setTheme(localStorage.getItem('theme') || 'dark');

// ============================================
// SCROLL ANIMATIONS
// ============================================
const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            const d = e.target.dataset.delay || 0;
            setTimeout(() => e.target.classList.add('visible'), +d);
            obs.unobserve(e.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));

// ============================================
// SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        if (t) window.scrollTo({ top: t.offsetTop - 80, behavior: 'smooth' });
    });
});
