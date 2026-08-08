(() => {
  'use strict';

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const revealPage = () => {
    document.querySelector('.intro')?.remove();
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelectorAll('.hero-copy > *,.device-wrap,.metric-card,.nav').forEach(el => {
      el.style.opacity = '1';
      if (!el.classList.contains('device-wrap')) el.style.transform = '';
    });
  };

  window.setTimeout(revealPage, 2600);

  document.addEventListener('DOMContentLoaded', () => {
    if (isIOS) document.documentElement.classList.add('ios-device');

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      });
    });

    if (!window.gsap || !window.ScrollTrigger) {
      revealPage();
      document.querySelectorAll('#webgl,#globe').forEach(c => c.style.display = 'none');
      return;
    }

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    try {
      if (!reduceMotion) {
        const introEl = document.querySelector('.intro');
        if (introEl) {
          const intro = gsap.timeline({ onComplete: () => introEl.remove() });
          intro
            .to('.intro-symbol', { scale: 1, rotation: 0, duration: .7, ease: 'back.out(1.8)' })
            .to('.intro-bar', { width: 190, duration: .6, ease: 'power3.out' }, '-=.3')
            .to('.intro span', { opacity: 1, y: 0, duration: .4 }, '-=.25')
            .to('.intro', { yPercent: -100, duration: .9, ease: 'power4.inOut', delay: .35 });
          gsap.from('.intro-symbol', { scale: .3, rotation: -20, duration: 0 });
          gsap.set('.intro span', { opacity: 0, y: 8 });
        }

        gsap.from('.nav', { y: -90, opacity: 0, duration: 1, delay: 1.4, ease: 'power4.out' });
        gsap.from('.hero-copy>*', { y: 45, opacity: 0, stagger: .09, duration: 1, delay: 1.25, ease: 'power4.out' });
        gsap.from('.device-wrap', { y: 100, rotation: 10, scale: .82, opacity: 0, duration: 1.5, delay: 1.35, ease: 'expo.out' });
        gsap.from('.metric-card', { scale: .4, opacity: 0, stagger: .15, duration: .8, delay: 2.05, ease: 'back.out(1.8)' });
      } else {
        revealPage();
      }

      document.querySelectorAll('.reveal').forEach(el => {
        gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: reduceMotion ? 0 : 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 84%', once: true } });
      });

      const aura = document.querySelector('.cursor-aura');
      if (aura && !isIOS && matchMedia('(pointer:fine)').matches && !reduceMotion) {
        window.addEventListener('pointermove', e => gsap.to(aura, { x: e.clientX, y: e.clientY, duration: .45, ease: 'power3.out' }));
      }

      const device = document.getElementById('device');
      const visualStage = document.querySelector('.visual-stage');
      if (device && visualStage && !isIOS && matchMedia('(pointer:fine)').matches && !reduceMotion) {
        window.addEventListener('pointermove', e => {
          const r = device.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) / r.width;
          const y = (e.clientY - r.top - r.height / 2) / r.height;
          gsap.to(device, { rotationY: x * 18, rotationX: -y * 14, x: x * 10, y: y * 8, duration: .6, ease: 'power3.out' });
        });
        visualStage.addEventListener('pointerleave', () => gsap.to(device, { rotationY: 0, rotationX: 0, x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.5)' }));
      }

      document.querySelectorAll('[data-count]').forEach(el => {
        ScrollTrigger.create({
          trigger: el, start: 'top 88%', once: true,
          onEnter: () => {
            const target = +el.dataset.count;
            gsap.fromTo(el, { innerText: 0 }, { innerText: target, duration: reduceMotion ? 0 : 1.5, snap: { innerText: 1 }, ease: 'power3.out' });
          }
        });
      });
    } catch (err) {
      console.error('VeiCloud animation fallback:', err);
      revealPage();
    }

    if (!isIOS && !reduceMotion) {
      try { initBackground(); } catch (e) { console.warn('Background WebGL disabled:', e); }
      try { initGlobe(); } catch (e) { console.warn('Globe WebGL disabled:', e); }
    } else {
      document.querySelectorAll('#webgl,#globe').forEach(c => c.style.display = 'none');
    }
  });

  function initBackground() {
    const canvas = document.getElementById('webgl');
    if (!canvas || !window.THREE) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
    renderer.setSize(innerWidth, innerHeight);
    camera.position.z = 7;
    const count = 520;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - .5) * 16;
      pos[i * 3 + 1] = (Math.random() - .5) * 11;
      pos[i * 3 + 2] = (Math.random() - .5) * 8;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xff5a3c, size: .018, transparent: true, opacity: .58, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.8, .008, 10, 160), new THREE.MeshBasicMaterial({ color: 0xff4325, transparent: true, opacity: .18 }));
    ring.rotation.x = 1.15;
    ring.rotation.z = .3;
    scene.add(ring);
    let mx = 0, my = 0;
    addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
    const tick = () => {
      requestAnimationFrame(tick);
      points.rotation.y += .00045;
      points.rotation.x += (my * .08 - points.rotation.x) * .01;
      points.rotation.y += (mx * .12 - points.rotation.y) * .008;
      ring.rotation.z += .0012;
      renderer.render(scene, camera);
    };
    tick();
    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    }, { passive: true });
  }

  function initGlobe() {
    const canvas = document.getElementById('globe');
    if (!canvas || !window.THREE) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, Math.max(canvas.clientWidth, 1) / Math.max(canvas.clientHeight, 1), .1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.4));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    camera.position.z = 4.6;
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1.55, 40, 40), new THREE.MeshBasicMaterial({ color: 0x0b0d12, wireframe: true, transparent: true, opacity: .33 }));
    scene.add(globe);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1.62, 40, 40), new THREE.MeshBasicMaterial({ color: 0xff4325, transparent: true, opacity: .035, side: THREE.BackSide }));
    scene.add(glow);
    const dots = [];
    [[.2,.8,1.2],[-1,.5,.8],[1.1,.2,.7],[-.5,-.8,1.1],[.8,-.6,.9]].forEach(p => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff5b3d }));
      m.position.set(...p); scene.add(m); dots.push(m);
    });
    const tick = () => {
      requestAnimationFrame(tick);
      globe.rotation.y += .0025;
      glow.rotation.y += .0025;
      dots.forEach((d, i) => d.scale.setScalar(1 + Math.sin(performance.now() * .003 + i) * .25));
      renderer.render(scene, camera);
    };
    tick();
  }
})();