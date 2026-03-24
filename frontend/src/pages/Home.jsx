import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import "../utils/Home.css";

/* ─── Inline SVG icons ─────────────────────────────────── */
const IconLogo = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M3 6l7-3 7 3v8l-7 3-7-3V6z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M3 6l7 3m0 8V9m7-3l-7 3" stroke="#fff" strokeWidth="1.5"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconPlay = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

/* ─── Feature data ─────────────────────────────────────── */
const FEATURES = [
  {
    icon: "⚡",
    name: "Real-Time Sync",
    desc: "Every keystroke, every cursor — synced across your team in under 20ms. Zero lag, zero friction.",
  },
  {
    icon: "🔀",
    name: "Live Collaboration",
    desc: "See exactly who's editing what, with live cursors and presence indicators across any project.",
  },
  {
    icon: "🛡️",
    name: "Role-Based Access",
    desc: "Fine-grained permissions per workspace, project, or file. Your code, your rules.",
  },
  {
    icon: "🔗",
    name: "Smart Integrations",
    desc: "Connect GitHub, Slack, Jira and more. DevCollab lives where your workflow already is.",
  },
  {
    icon: "🧠",
    name: "AI Code Review",
    desc: "Inline suggestions, auto-refactoring hints, and smart comments powered by your team's patterns.",
  },
  {
    icon: "🌐",
    name: "Edge-Deployed",
    desc: "Servers in 40+ regions. Sub-50ms latency no matter where your team is in the world.",
  },
];

/* ─── Component ────────────────────────────────────────── */
export default function Home() {
  const canvasRef    = useRef(null);
  const hero3dRef    = useRef(null);
  const mousePos     = useRef({ x: 0, y: 0 });
  const targetTilt   = useRef({ x: 0, y: 0 });
  const currentTilt  = useRef({ x: 0, y: 0 });

  /* ── Three.js animated background ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 28;

    /* ── Particle field ── */
    const PARTICLE_COUNT = 1800;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors    = new Float32Array(PARTICLE_COUNT * 3);
    const sizes     = new Float32Array(PARTICLE_COUNT);

    const palette = [
      new THREE.Color(0x5b5ef4), // indigo
      new THREE.Color(0x8857e9), // violet
      new THREE.Color(0x22d3ee), // cyan
      new THREE.Color(0x1e1b4b), // deep indigo
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 22 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = Math.random() * 2.2 + 0.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size",     new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uTime;
        void main() {
          vColor = color;
          vec3 pos = position;
          float wave = sin(uTime * 0.4 + pos.x * 0.08) * 0.6
                     + cos(uTime * 0.3 + pos.y * 0.06) * 0.4;
          pos.z += wave;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position  = projectionMatrix * mvPos;
          gl_PointSize = size * (260.0 / -mvPos.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d) * 0.75;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    /* ── Glowing inner sphere ── */
    const sphereGeo = new THREE.SphereGeometry(4, 48, 48);
    const sphereMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform float uTime;
        void main() {
          float rim = pow(1.0 - abs(dot(vNormal, vec3(0,0,1))), 2.8);
          vec3 col1 = vec3(0.36, 0.37, 0.96); // indigo
          vec3 col2 = vec3(0.53, 0.34, 0.91); // violet
          vec3 c = mix(col1, col2, 0.5 + 0.5 * sin(uTime * 0.7));
          gl_FragColor = vec4(c * rim * 0.55, rim * 0.18);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(0, 0, 0);
    scene.add(sphere);

    /* ── Wireframe icosahedron ── */
    const icoGeo  = new THREE.IcosahedronGeometry(6, 1);
    const icoMat  = new THREE.MeshBasicMaterial({
      color: 0x5b5ef4, wireframe: true, transparent: true, opacity: 0.06,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    scene.add(ico);

    /* ── Resize ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    /* ── Mouse ── */
    const onMouse = (e) => {
      mat.uniforms.uMouse.value.set(
        (e.clientX / window.innerWidth)  * 2 - 1,
       -(e.clientY / window.innerHeight) * 2 + 1,
      );
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouse);

    /* ── Animate ── */
    let rafId;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mat.uniforms.uTime.value        = t;
      sphereMat.uniforms.uTime.value  = t;

      const mx = mat.uniforms.uMouse.value.x;
      const my = mat.uniforms.uMouse.value.y;

      particles.rotation.y = t * 0.03 + mx * 0.06;
      particles.rotation.x = t * 0.015 + my * 0.04;
      ico.rotation.y       = t * 0.06;
      ico.rotation.x       = t * 0.04;
      sphere.rotation.y    = t * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      renderer.dispose();
    };
  }, []);


  /* ── 3D hero tilt (mouse parallax) ── */
  useEffect(() => {
    let rafId;
    const lerp = (a, b, t) => a + (b - a) * t;

    const onMouse = (e) => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      targetTilt.current = {
        x: ((e.clientY - cy) / cy) * -7,
        y: ((e.clientX - cx) / cx) *  7,
      };
    };
    window.addEventListener("mousemove", onMouse);

    const tick = () => {
      currentTilt.current.x = lerp(currentTilt.current.x, targetTilt.current.x, 0.06);
      currentTilt.current.y = lerp(currentTilt.current.y, targetTilt.current.y, 0.06);
      if (hero3dRef.current) {
        hero3dRef.current.style.transform =
          `rotateX(${currentTilt.current.x}deg) rotateY(${currentTilt.current.y}deg)`;
      }
      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("mousemove", onMouse);
      cancelAnimationFrame(rafId);
    };
  }, []);

  /* ── Intersection observer for feature cards ── */
  useEffect(() => {
    const cards = document.querySelectorAll(".feat-card");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.style.opacity = "1";
      }),
      { threshold: 0.15 }
    );
    cards.forEach((c, i) => {
      c.style.opacity = "0";
      c.style.animationDelay = `${i * 0.08}s`;
      obs.observe(c);
    });
    return () => obs.disconnect();
  }, []);

  /* ── Navbar scroll tint ── */
  useEffect(() => {
    const nav = document.querySelector(".home-nav");
    const onScroll = () => {
      if (window.scrollY > 40) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>

      {/* Three.js canvas */}
      <canvas id="home-canvas" ref={canvasRef} />

      {/* Noise grain */}
      <div className="home-grain" />

      {/* ── Navbar ── */}
      <nav className="home-nav">
        <Link to="/" className="home-nav-brand">
          <div className="home-nav-gem"><IconLogo /></div>
          <span className="home-nav-wordmark">DevCollab</span>
        </Link>

        {/* Top-right auth buttons */}
        <div className="home-nav-auth">
          <Link to="/login"  className="btn-ghost">Sign in</Link>
          <Link to="/signup" className="btn-primary">
            Get started <IconArrow />
          </Link>
        </div>
      </nav>

      {/* ── Page ── */}
      <div className="home-page">

        {/* ── HERO ── */}
        <section className="home-hero">
          <div className="hero-3d-wrapper">
            <div className="hero-3d-inner" ref={hero3dRef}>

              <div className="hero-badge">
                <div className="hero-badge-dot">⚡</div>
                Real-time collaboration · Now in open beta
              </div>

              <h1 className="hero-title">
                <span className="line-1">Code Together.</span>
                <span className="line-2">Ship Faster.</span>
                <span className="line-3">Build Anything.</span>
              </h1>

              <p className="hero-sub">
                DevCollab is the real-time workspace built for engineering teams —
                synchronized editors, live cursors, and instant feedback so you
                spend time building, not coordinating.
              </p>

              <div className="hero-ctas">
                <Link to="/signup" className="btn-hero-primary">
                  Start for free <IconArrow />
                </Link>
                <button className="btn-hero-ghost">
                  <IconPlay /> Watch demo
                </button>
              </div>

              {/* floating UI card */}
              <div className="hero-ui-card">
                {/* floating badges */}
                <div className="hero-float-badge"
                  style={{ top: -22, left: -60, "--dur": "4.2s", "--delay": "0s" }}>
                  <div className="hfb-label">Sync latency</div>
                  <div className="hfb-value" style={{ color: "#34d399" }}>18 ms</div>
                </div>

                <div className="hero-float-badge"
                  style={{ bottom: 20, right: -70, "--dur": "3.8s", "--delay": "1.2s" }}>
                  <div className="hfb-label">Active now</div>
                  <div className="hfb-value" style={{ color: "#818cf8" }}>4 devs</div>
                </div>

                <div className="hero-ui-card-inner">
                  <div className="ui-card-bar">
                    <div className="ui-card-dot" style={{ background: "#f87171" }} />
                    <div className="ui-card-dot" style={{ background: "#fbbf24" }} />
                    <div className="ui-card-dot" style={{ background: "#34d399" }} />
                    <div className="ui-card-tab active">useCollab.ts</div>
                    <div className="ui-card-tab">socket.ts</div>
                  </div>

                  <div className="ui-card-body">
                    {[
                      <><span className="cm">// Real-time hook — syncing cursors & state</span></>,
                      <><span className="kw">export const</span> <span className="fn">useCollab</span> = (<span className="str">roomId</span>) =&gt; {"{"}</>,
                      <>&nbsp;&nbsp;<span className="kw">const</span> [peers, setPeers] = useState([]);</>,
                      <>&nbsp;&nbsp;<span className="kw">const</span> socket = <span className="fn">io</span>(`/room/${"{"}<span className="str">roomId</span>{"}"}`);</>,
                      <>&nbsp;&nbsp;<span className="kw">useEffect</span>(() =&gt; {"{"}</>,
                      <>&nbsp;&nbsp;&nbsp;&nbsp;socket.<span className="fn">on</span>(<span className="str">'cursor'</span>, <span className="fn">syncCursor</span>);<span className="cursor-blink" /></>,
                    ].map((line, i) => (
                      <div className="code-line" key={i}>
                        <span className="code-num">{i + 1}</span>
                        <span className="tx">{line}</span>
                      </div>
                    ))}
                  </div>

                  <div className="ui-card-footer">
                    <div className="live-pill">
                      <div className="live-pip" /> Live sync active
                    </div>
                    <div className="collab-faces">
                      {[
                        { l: "A", bg: "#6366f1" },
                        { l: "S", bg: "#ec4899" },
                        { l: "R", bg: "#f59e0b" },
                        { l: "K", bg: "#10b981" },
                      ].map((f) => (
                        <div key={f.l} className="collab-face" style={{ background: f.bg }}>
                          {f.l}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* end ui card */}

            </div>
          </div>
        </section>

        {/* ── NUMBERS ── */}
        <div className="home-numbers">
          <div className="numbers-inner">
            {[
              { value: "12K+",   label: "Active developers" },
              { value: "98ms",   label: "Avg. sync latency"  },
              { value: "340K+",  label: "Sessions launched"  },
              { value: "99.9%",  label: "Uptime SLA"         },
            ].map((n) => (
              <div className="num-item" key={n.label}>
                <div className="num-value">{n.value}</div>
                <div className="num-label">{n.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section className="home-features">
          <div className="section-label">Why DevCollab</div>
          <h2 className="section-title">Everything your team needs</h2>
          <p className="section-sub">
            One workspace. Real-time everything. No more Slack threads about who's touching which file.
          </p>

          <div className="feat-grid">
            {FEATURES.map((f) => (
              <div className="feat-card" key={f.name}>
                <div className="feat-card-glow" />
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-name">{f.name}</div>
                <p className="feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="home-cta-section">
          <div className="section-label">Get started today</div>
          <h2 className="cta-title">
            Your team is waiting.<br />
            Stop the context switching.
          </h2>
          <p className="cta-sub">Free for teams up to 5. No credit card required.</p>
          <div className="hero-ctas">
            <Link to="/signup" className="btn-hero-primary">
              Create free workspace <IconArrow />
            </Link>
            <Link to="/login" className="btn-hero-ghost">
              Already have an account →
            </Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer>
          <div className="home-footer">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="home-nav-gem" style={{ width: 26, height: 26, borderRadius: 7 }}>
                <IconLogo />
              </div>
              <span style={{ fontFamily: "var(--font-d)", fontWeight: 800, fontSize: 14 }}>
                DevCollab
              </span>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Docs</a>
              <a href="#">Status</a>
            </div>
            <span>© {new Date().getFullYear()} DevCollab. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </>
  );
}