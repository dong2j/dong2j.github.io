// lava-planet.js: 3D lava planet animation (55 Cancri e) for the research page.
// The page needs a <div id="lava-planet"> and an import map for "three" (see research.jemdoc).
// This is a classic script that loads Three.js with import(), so it also works when you
// open the built page straight from your disk.
(async function () {
  const container = document.getElementById('lava-planet');
  if (!container) return;

  let THREE, EffectComposer, RenderPass, UnrealBloomPass, OutputPass;
  try {
    THREE = await import('three');
    ({ EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js'));
    ({ RenderPass } = await import('three/addons/postprocessing/RenderPass.js'));
    ({ UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js'));
    ({ OutputPass } = await import('three/addons/postprocessing/OutputPass.js'));
  } catch (e) {
    container.style.color = '#ccc';
    container.style.padding = '12px';
    container.textContent = 'The 3D animation could not load (no internet connection?).';
    return;
  }

  // ---------- Settings (edit these) ----------
  const PLANET_LABEL = '55 Cancri e';
  const PERIOD_HOURS = 17.7;        // orbital period of the lava planet (55 Cancri e: 17.7 hours)
  const ORBIT_AU = 0.0154;          // orbit size of the lava planet in AU (55 Cancri e: 0.0154)
  const DAYS_PER_SECOND = 2;        // Orbit view time-lapse: simulated days per real second
  const CLOSEUP_SECONDS_PER_ORBIT = 30;  // Close-up time-lapse: real seconds per lava-planet orbit
  const START_VIEW = 'orbit';       // 'orbit' or 'closeup'

  // Distances use real proportions. 1 AU = ORBIT_RADIUS / ORBIT_AU scene units.
  const STAR_RADIUS = 10;           // a Sun-like star
  const ORBIT_RADIUS = 35;          // 3.5 star radii, like 55 Cancri e
  const AU = ORBIT_RADIUS / ORBIT_AU;
  const PLANET_RADIUS = 2.0;        // enlarged so it is visible (the real planet is much smaller)
  const STAR_POS = new THREE.Vector3(0, 0, 0);
  const COMPARE = [
    { name: 'Mercury', days: 87.97, au: 0.387, px: 3, color: 0xc2bab0, phase0: -0.7 },
    { name: 'Earth', days: 365.25, au: 1.0, px: 4, color: 0x3d7be0, phase0: 2.4 },
  ];
  const STAR_COLOR = new THREE.Color(1.0, 0.86, 0.62);

  // ---------- Renderer ----------
  let renderer;
  try {
    // antialias is off here: all drawing goes through the bloom composers, which get their own 4x MSAA below
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  } catch (e) {
    container.textContent = 'This 3D scene needs WebGL, which your browser does not support.';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
  const insetCam = new THREE.PerspectiveCamera(40, 4 / 3, 1, 2000);

  // ---------- Shared GLSL: 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT) ----------
  const NOISE = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }
    float fbm(vec3 p, int octaves) {
      float f = 0.0, a = 0.5;
      for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        f += a * snoise(p);
        p = p * 2.03 + vec3(1.7, 9.2, 3.1);
        a *= 0.5;
      }
      return f;
    }
  `;

  const SPHERE_VERT = `
    varying vec3 vPos;
    varying vec3 vN;
    varying vec3 vV;
    void main() {
      vPos = normalize(position);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vN = normalize(mat3(modelMatrix) * normal);
      vV = cameraPosition - wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `;

  // ---------- Star ----------
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: SPHERE_VERT,
    fragmentShader: NOISE + `
      uniform float uTime;
      varying vec3 vPos;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(vV);
        float mu = clamp(dot(N, V), 0.0, 1.0);
        vec3 p = vPos;
        float t = uTime * 0.015;
        float gran = fbm(p * 28.0 + vec3(t, -t, t * 0.7), 4);
        float fine = snoise(p * 70.0 + vec3(0.0, t * 6.0, 0.0));
        float spots = smoothstep(0.46, 0.56, fbm(p * 3.5 + vec3(3.0, 1.0, t * 0.2), 4));
        vec3 base = vec3(1.0, 0.5, 0.1);
        vec3 hot = vec3(1.0, 0.82, 0.4);
        vec3 col = mix(base, hot, clamp(0.55 + 0.7 * gran + 0.12 * fine, 0.0, 1.0));
        col *= 1.0 - 0.55 * spots;
        float limb = 0.12 + 0.88 * pow(mu, 0.55);
        col *= limb;
        col = mix(col * vec3(1.0, 0.45, 0.2), col, smoothstep(0.0, 0.7, mu));
        gl_FragColor = vec4(col * 1.15, 1.0);
      }
    `,
  });
  const star = new THREE.Mesh(new THREE.SphereGeometry(STAR_RADIUS, 128, 128), starMat);
  star.position.copy(STAR_POS);
  scene.add(star);

  // Corona: a camera-facing plane with animated streamers around the star's edge
  const CORONA_SCALE = 2.6;
  const coronaMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uInner: { value: 1.0 / CORONA_SCALE } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: NOISE + `
      uniform float uTime;
      uniform float uInner;
      varying vec2 vUv;
      void main() {
        vec2 c = vUv * 2.0 - 1.0;
        float rr = length(c);
        float r = rr / uInner;
        float d = max(r - 1.0, 0.0);
        float a = atan(c.y, c.x);
        vec2 ring = vec2(cos(a), sin(a));
        float n1 = snoise(vec3(ring * 2.5, uTime * 0.04 - d * 0.9));
        float n2 = snoise(vec3(ring * 9.0, uTime * 0.07 - d * 2.2));
        float glow = exp(-d * 12.0) * 0.55 + exp(-d * 3.5) * 0.12 + exp(-d * 1.2) * 0.02;
        glow *= 0.75 + 0.35 * n1 + 0.2 * n2;
        glow *= 1.0 - smoothstep(0.75, 1.0, rr);
        vec3 col = mix(vec3(1.0, 0.4, 0.08), vec3(1.0, 0.75, 0.4), exp(-d * 5.0));
        gl_FragColor = vec4(col * max(glow, 0.0), 1.0);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), coronaMat);
  corona.scale.setScalar(STAR_RADIUS * CORONA_SCALE);
  corona.position.copy(STAR_POS);
  scene.add(corona);

  // ---------- Lava planet ----------
  const starDir = new THREE.Vector3(-1, 0, 0);
  const planetMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uStarDir: { value: starDir },
      uStarColor: { value: STAR_COLOR },
    },
    vertexShader: SPHERE_VERT,
    fragmentShader: NOISE + `
      uniform float uTime;
      uniform vec3 uStarDir;
      uniform vec3 uStarColor;
      varying vec3 vPos;
      varying vec3 vN;
      varying vec3 vV;

      vec3 lavaRamp(float h) {
        vec3 c = mix(vec3(0.25, 0.01, 0.0), vec3(0.95, 0.18, 0.01), smoothstep(0.0, 0.45, h));
        c = mix(c, vec3(1.0, 0.55, 0.08), smoothstep(0.4, 0.75, h));
        c = mix(c, vec3(1.0, 0.78, 0.38), smoothstep(0.75, 1.0, h));
        return c;
      }

      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(vV);
        vec3 L = normalize(uStarDir);
        float ndl = dot(N, L);
        // 0 on the night side, 1 on the day side, soft terminator
        float day = smoothstep(-0.35, 0.6, ndl);

        vec3 p = vPos;
        float t = uTime * 0.02;

        // Domain-warped noise makes the magma look like it is flowing
        vec3 q = vec3(
          fbm(p * 1.2 + vec3(0.0, t, 0.0), 4),
          fbm(p * 1.2 + vec3(5.2, 1.3, -t), 4),
          fbm(p * 1.2 + vec3(-t, 2.8, 7.1), 4)
        );
        float field = fbm(p * 1.7 + q * 1.3, 5);

        // Day side: a near-global magma ocean with a few crust rafts.
        // Night side: mostly cooled crust with glowing cracks and lava lakes.
        float thr = mix(-0.3, 0.4, day);
        float lava = 1.0 - smoothstep(thr - 0.05, thr + 0.05, field);

        // Heat inside the lava: hotter away from crust edges and on the day side
        float h = fbm(p * 4.5 + q * 2.5 + vec3(t * 3.0), 4);
        float heat = 0.45 + 0.5 * h + clamp((thr - field) * 1.6, 0.0, 0.5);
        heat *= mix(0.4, 1.0, day);
        vec3 lavaCol = lavaRamp(clamp(heat, 0.0, 1.0)) * mix(0.55, 2.3, day);

        // Cooled basalt crust, lit by the star
        float rough = fbm(p * 14.0, 3);
        vec3 crustAlb = vec3(0.075, 0.055, 0.05) * (0.7 + 0.5 * rough);
        vec3 crust = crustAlb * (0.02 + 1.8 * max(ndl, 0.0) * uStarColor);

        // Glowing fissures in the crust
        float ridge = 1.0 - abs(snoise(p * 3.8 + q * 1.8));
        float crackMask = smoothstep(-0.05, 0.35, fbm(p * 2.0 + vec3(9.1, 4.2, 1.3), 3));
        float crack = pow(ridge, 24.0) * crackMask;
        // Hot rim where crust meets magma
        float rim = smoothstep(thr + 0.07, thr + 0.01, field) * (1.0 - lava);
        vec3 glowCol = mix(vec3(0.9, 0.1, 0.01), vec3(1.0, 0.3, 0.03), day) * (crack * mix(0.6, 1.8, day) + rim * mix(0.3, 1.1, day));

        vec3 col = mix(crust + glowCol, lavaCol, lava);

        // Thin hot atmosphere / limb glow, strongest toward the star
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
        col += vec3(1.0, 0.38, 0.1) * fres * mix(0.08, 0.9, smoothstep(-0.4, 0.7, ndl));

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(PLANET_RADIUS, 160, 160), planetMat);
  scene.add(planet);

  // Orbit lines
  function makeRing(radius, color, opacity) {
    const pts = [];
    for (let i = 0; i < 512; i++) {
      const a = (i / 512) * Math.PI * 2;
      pts.push(new THREE.Vector3(radius * Math.cos(a), 0, -radius * Math.sin(a)));
    }
    const mat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity, depthWrite: false });
    mat.line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), mat);
    scene.add(mat.line);
    return mat;
  }
  const ringMat = makeRing(ORBIT_RADIUS, 0xff9a4d, 0.5);

  // Mercury and Earth, lit by a light at the star
  scene.add(new THREE.PointLight(0xfff1d6, 3.0, 0, 0));
  scene.add(new THREE.AmbientLight(0xffffff, 0.06));
  COMPARE.forEach(function (c) {
    c.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.85, metalness: 0.0 })
    );
    scene.add(c.mesh);
    c.ringMat = makeRing(c.au * AU, c.color, 0.4);
  });

  // ---------- Background stars ----------
  const STAR_COUNT = 2500;
  const pos = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  const tints = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    pos.set([300 * s * Math.cos(th), 300 * u, 300 * s * Math.sin(th)], i * 3);
    sizes[i] = Math.pow(Math.random(), 6) * 3.0 + 0.6;
    const warm = Math.random();
    tints.set(warm < 0.15 ? [1.0, 0.8, 0.6] : warm > 0.85 ? [0.7, 0.8, 1.0] : [1, 1, 1], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  starGeo.setAttribute('aTint', new THREE.BufferAttribute(tints, 3));
  const starfield = new THREE.Points(starGeo, new THREE.ShaderMaterial({
    uniforms: { uPR: { value: renderer.getPixelRatio() }, uTime: { value: 0 } },
    vertexShader: `
      attribute float aSize;
      attribute vec3 aTint;
      uniform float uPR;
      uniform float uTime;
      varying vec3 vTint;
      varying float vTw;
      void main() {
        vTint = aTint;
        vTw = 0.75 + 0.25 * sin(uTime * 1.5 + position.x * 0.37 + position.y * 0.11);
        gl_PointSize = aSize * uPR;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vTint;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vTint * a * vTw * 0.85, 1.0);
      }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  }));
  starfield.renderOrder = -1;
  starfield.frustumCulled = false;
  scene.add(starfield);

  // ---------- Bloom (one set of passes for the main view, one for the zoom window) ----------
  function makeComposer(cam) {
    // Multisampled (4x MSAA) buffers so orbit lines and planet edges stay smooth
    const comp = new EffectComposer(renderer, new THREE.WebGLRenderTarget(256, 256, { type: THREE.HalfFloatType, samples: 4 }));
    comp.addPass(new RenderPass(scene, cam));
    const bl = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.4, 0.9);
    comp.addPass(bl);
    comp.addPass(new OutputPass());
    comp.bloom = bl;
    return comp;
  }
  const composer = makeComposer(camera);
  const insetComposer = makeComposer(insetCam);

  // ---------- On-screen labels and view buttons ----------
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  container.style.overflow = 'hidden';
  // Font for all text in the animation. Geneva is on Macs; other devices use Verdana, its close relative.
  const FONT_FAMILY = 'Geneva, Verdana, "DejaVu Sans", sans-serif';
  const FONT = '12px/1.45 ' + FONT_FAMILY;
  const SMALL = '11px/1.2 ' + FONT_FAMILY;
  function addDiv(css, html) {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute; pointer-events:none; text-shadow:0 1px 2px #000; ' + css;
    if (html) el.innerHTML = html;
    container.appendChild(el);
    return el;
  }

  const hud = addDiv('left:12px; top:10px; max-width:calc(100% - 175px); color:rgba(255,255,255,0.9); font:' + FONT);
  const note = addDiv('left:12px; bottom:8px; right:12px; color:rgba(255,255,255,0.75); opacity:0.7; font:' + FONT);
  // Two versions of the top-left text, built once; the loop only swaps them and updates numbers
  const hudOrbit = document.createElement('div');
  hudOrbit.innerHTML = 'Time-lapse: 1 second \u2248 ' + DAYS_PER_SECOND + ' days<br>Elapsed: <b class="lp-days">0</b> days';
  const hudClose = document.createElement('div');
  hudClose.innerHTML = 'Time-lapse: one orbit (one year) = <b>' + PERIOD_HOURS + ' hours</b>' +
    '<div style="margin-top:6px; width:180px; max-width:100%; height:3px; background:rgba(255,255,255,0.2); border-radius:2px; overflow:hidden">' +
    '<div class="lp-bar" style="height:100%; width:0; background:#ffb347"></div></div>' +
    'Elapsed: <span class="lp-clock">0 h 00 min</span>';
  hud.appendChild(hudOrbit);
  hud.appendChild(hudClose);
  const daysText = hudOrbit.querySelector('.lp-days');
  const barEl = hudClose.querySelector('.lp-bar');
  const clockEl = hudClose.querySelector('.lp-clock');
  const NOTE_ORBIT = 'Orbit distances to scale. Planet and star sizes enlarged.';
  const NOTE_CLOSE = 'Tidally locked. The star never sets on the day side. Planet size enlarged.';

  // Write to the page only when a value actually changes (avoids re-layout every frame)
  function setText(el, text) {
    if (el._lpText !== text) { el._lpText = text; el.textContent = text; }
  }
  function setStyle(el, prop, value) {
    const key = '_lp_' + prop;
    if (el[key] !== value) { el[key] = value; el.style[prop] = value; }
  }

  // Zoom window: shows the lava planet's tiny orbit up close
  const insetBox = addDiv('border:1px solid rgba(255,255,255,0.35); border-radius:4px; box-sizing:border-box;');
  const insetTitle = addDiv('color:rgba(255,255,255,0.8); font:' + SMALL);
  const starMarker = addDiv('border:1px dashed rgba(255,255,255,0.55); box-sizing:border-box;');

  function makeTag(text) {
    return addDiv('left:0; top:0; white-space:nowrap; color:rgba(255,255,255,0.88); font:' + SMALL, text);
  }
  COMPARE.forEach(function (c) { c.tag = makeTag(c.name + ' · ' + Math.round(c.days) + ' days'); });
  // Fixed label in the zoom window's upper-left corner (easier to read than a moving tag)
  const lavaTag = addDiv('color:rgba(255,255,255,0.9); font:' + SMALL,
    '<span style="color:#ff9a4d">\u25cf</span> ' + PLANET_LABEL + ' \u00b7 ' + PERIOD_HOURS + ' hours');

  let view = START_VIEW;
  const buttons = {};
  const btnBox = document.createElement('div');
  btnBox.style.cssText = 'position:absolute; right:10px; top:10px; display:flex; gap:4px;';
  [['orbit', 'Orbit'], ['closeup', 'Close-up']].forEach(function (v) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = v[1];
    b.style.cssText = 'padding:3px 10px; border-radius:4px; border:1px solid rgba(255,255,255,0.35); color:#fff; cursor:pointer; font:' + FONT;
    b.addEventListener('click', function () { setView(v[0]); });
    btnBox.appendChild(b);
    buttons[v[0]] = b;
  });
  container.appendChild(btnBox);
  function setView(id) {
    view = id;
    for (const k in buttons) buttons[k].style.background = k === id ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.45)';
  }
  setView(view);

  // ---------- Camera views ----------
  // Orbit view: real distances, so the camera is far away and Earth's orbit fills the frame.
  const EARTH_ORBIT = AU;
  const ORBIT_CAM = new THREE.Vector3(0, 0.33, 1.0).multiplyScalar(EARTH_ORBIT * 1.85);
  const ORBIT_TARGET = new THREE.Vector3(0, -0.2 * EARTH_ORBIT, 0);
  // Zoom window camera: looks at the star from the same direction, close enough to see the lava planet.
  const INSET_CAM = new THREE.Vector3(0, 0.36, 1.0).normalize().multiplyScalar(ORBIT_RADIUS * 2.9);
  // Close-up view: camera rides along with the planet. Offsets are given in a frame
  // where x points toward the star, y is up and z is the third axis.
  const CLOSE_CAM = new THREE.Vector3(-6.2, -1.2, -7.9);
  const CLOSE_TARGET = new THREE.Vector3(11, -0.2, 2.4);
  const PLANET_AIM = new THREE.Vector3(1, 0.3, 0);
  const closeTargetLocal = new THREE.Vector3();

  const pointer = new THREE.Vector2(0, 0);
  window.addEventListener('pointermove', function (e) {
    const r = container.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    pointer.clampScalar(-1, 1);
  });
  const smoothPointer = new THREE.Vector2(0, 0);

  // ---------- Resize ----------
  let W = 1, H = 1, zoom = 1, orbitZoom = 1, portrait = 0;
  const inset = { x: 0, y: 0, w: 1, h: 1 };
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    W = w; H = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    portrait = Math.min(1, Math.max(0, (1.3 - camera.aspect) / 0.8));
    zoom = Math.max(1, (1.6 - 0.6 * portrait) / camera.aspect);
    orbitZoom = Math.max(1, 2.15 / camera.aspect);
    renderer.setSize(w, h);
    composer.setSize(w, h);

    inset.w = Math.round(Math.min(230, w * 0.34));
    inset.h = Math.round(inset.w * 0.72);
    inset.x = w - inset.w - 10;
    inset.y = 46;
    insetCam.aspect = inset.w / inset.h;
    insetCam.updateProjectionMatrix();
    insetComposer.setSize(inset.w, inset.h);
    insetBox.style.left = inset.x + 'px';
    insetBox.style.top = inset.y + 'px';
    insetBox.style.width = inset.w + 'px';
    insetBox.style.height = inset.h + 'px';
    insetTitle.style.left = (inset.x + 6) + 'px';
    lavaTag.style.left = (inset.x + 7) + 'px';
    lavaTag.style.top = (inset.y + 6) + 'px';
    lavaTag.style.maxWidth = (inset.w - 14) + 'px';
    insetTitle.style.top = (inset.y + inset.h + 3) + 'px';
    note.style.fontSize = w < 520 ? '10px' : '12px';
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // ---------- Animation (pauses when scrolled out of view) ----------
  const clock = new THREE.Clock();
  const UP = new THREE.Vector3(0, 1, 0);
  const e1 = new THREE.Vector3(), e3 = new THREE.Vector3();
  const closeCam = new THREE.Vector3(), closeTarget = new THREE.Vector3();
  const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3();
  const right = new THREE.Vector3(), proj = new THREE.Vector3();
  const dirA = new THREE.Vector3(), dirB = new THREE.Vector3();
  const sp = { x: 0, y: 0, ok: false };   // reused screen-position result
  const starRef = { position: STAR_POS };
  let blend = view === 'closeup' ? 1 : 0;
  let lastT = 0;
  let simHours = 0;                       // simulated time since the page loaded
  const PHASE0 = 0.5;
  const ORBIT_RATE = DAYS_PER_SECOND * 24;                    // simulated hours per real second
  const CLOSE_RATE = PERIOD_HOURS / CLOSEUP_SECONDS_PER_ORBIT;

  function toLocal(out, v) {
    return out.copy(e1).multiplyScalar(v.x).addScaledVector(UP, v.y).addScaledVector(e3, v.z);
  }
  function screenPos(obj, cam, w, h, lift) {
    proj.copy(obj.position);
    proj.y += lift;
    proj.project(cam);
    sp.x = (proj.x * 0.5 + 0.5) * w;
    sp.y = (-proj.y * 0.5 + 0.5) * h;
    sp.ok = proj.z < 1;
    return sp;
  }
  function placeTag(el, p, dx, dy, show) {
    setStyle(el, 'display', show && p.ok ? 'block' : 'none');
    if (show && p.ok) el.style.transform = 'translate(' + (p.x + dx).toFixed(1) + 'px,' + (p.y + dy).toFixed(1) + 'px) translate(-50%, -100%)';
  }

  function frame() {
    const t = clock.getElapsedTime();
    const dt = Math.min(t - lastT, 0.1);
    lastT = t;
    starMat.uniforms.uTime.value = t;
    coronaMat.uniforms.uTime.value = t;
    planetMat.uniforms.uTime.value = t;
    starfield.material.uniforms.uTime.value = t;

    blend += ((view === 'closeup' ? 1 : 0) - blend) * (1 - Math.exp(-dt * 2.5));
    const b = blend * blend * (3 - 2 * blend);

    // Time runs fast in the Orbit view and slowly in the Close-up
    const rate = Math.exp(Math.log(ORBIT_RATE) * (1 - b) + Math.log(CLOSE_RATE) * b);
    simHours += dt * rate;

    // Lava planet (tidally locked: the same side always faces the star)
    const lavaOrbits = simHours / PERIOD_HOURS;
    const theta = PHASE0 + (lavaOrbits % 1) * Math.PI * 2;
    planet.position.set(ORBIT_RADIUS * Math.cos(theta), 0, -ORBIT_RADIUS * Math.sin(theta));
    planet.rotation.y = theta;
    starDir.copy(STAR_POS).sub(planet.position).normalize();

    // Mercury and Earth at their real periods
    COMPARE.forEach(function (c) {
      c.orbits = simHours / 24 / c.days;
      const a = c.phase0 + (c.orbits % 1) * Math.PI * 2;
      c.mesh.position.set(c.au * AU * Math.cos(a), 0, -c.au * AU * Math.sin(a));
    });

    // Main camera: blend between the two views
    e1.copy(starDir);
    e3.crossVectors(e1, UP).normalize();
    toLocal(closeCam, CLOSE_CAM).multiplyScalar(zoom).add(planet.position);
    closeTargetLocal.copy(CLOSE_TARGET).lerp(PLANET_AIM, portrait * 0.85);
    toLocal(closeTarget, closeTargetLocal).add(planet.position);
    const orbitCam = camPos.copy(ORBIT_CAM).multiplyScalar(orbitZoom);
    // Blend in log-distance so the fly-in looks smooth across the huge change in scale
    const dOrbit = orbitCam.length(), dClose = closeCam.length();
    dirA.copy(orbitCam).divideScalar(dOrbit);
    dirB.copy(closeCam).divideScalar(dClose);
    camPos.lerpVectors(dirA, dirB, b).normalize()
      .multiplyScalar(Math.exp(Math.log(dOrbit) * (1 - b) + Math.log(dClose) * b));
    camTarget.copy(ORBIT_TARGET).lerp(closeTarget, b);

    smoothPointer.lerp(pointer, 1 - Math.exp(-dt * 3));
    right.subVectors(camTarget, camPos).cross(UP).normalize();
    const k = (0.8 + 0.03 * camPos.distanceTo(camTarget)) * 1.0;
    camPos.addScaledVector(right, smoothPointer.x * k).addScaledVector(UP, -smoothPointer.y * k * 0.6);
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
    const dist = camPos.length();
    camera.near = Math.max(0.1, dist * 0.004);
    camera.far = dist * 4 + 1000;
    camera.updateProjectionMatrix();

    // ---- Main view ----
    const orbitMode = b < 0.5;
    const unitsPerPx = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / H;
    COMPARE.forEach(function (c) {
      c.mesh.visible = orbitMode;
      c.mesh.scale.setScalar(c.px * unitsPerPx * camera.position.distanceTo(c.mesh.position));
      c.ringMat.opacity = 0.4 * (1 - b);
      c.ringMat.line.visible = true;
    });
    ringMat.opacity = 0.5 * (1 - b);
    planet.visible = !orbitMode || b > 0.2;
    starfield.position.copy(camera.position);
    corona.quaternion.copy(camera.quaternion);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
    composer.render();

    // ---- Zoom window (Orbit view only) ----
    const showInset = b < 0.3;
    const insetDisplay = showInset ? 'block' : 'none';
    setStyle(insetBox, 'display', insetDisplay);
    setStyle(insetTitle, 'display', insetDisplay);
    setStyle(starMarker, 'display', insetDisplay);
    if (showInset) {
      insetCam.position.copy(INSET_CAM);
      insetCam.lookAt(STAR_POS);
      planet.visible = true;
      COMPARE.forEach(function (c) { c.mesh.visible = false; c.ringMat.line.visible = false; });
      starfield.position.copy(insetCam.position);
      corona.quaternion.copy(insetCam.quaternion);
      renderer.setScissorTest(true);
      const gy = H - inset.y - inset.h;
      renderer.setScissor(inset.x, gy, inset.w, inset.h);
      renderer.setViewport(inset.x, gy, inset.w, inset.h);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
      insetComposer.render();
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, W, H);

      // Dashed box around the star in the main view marks the zoomed area
      const p = screenPos(starRef, camera, W, H, 0);
      const insetHalf = ORBIT_RADIUS * 1.5;
      const sizePx = Math.round(Math.max(14, 2 * insetHalf / (unitsPerPx * camera.position.distanceTo(STAR_POS))));
      setStyle(starMarker, 'left', Math.round(p.x - sizePx / 2) + 'px');
      setStyle(starMarker, 'top', Math.round(p.y - sizePx / 2) + 'px');
      setStyle(starMarker, 'width', sizePx + 'px');
      setStyle(starMarker, 'height', sizePx + 'px');
      const zf = Math.round((camera.position.distanceTo(STAR_POS) / insetCam.position.length()) * (inset.h / H) / 10) * 10;
      setText(insetTitle, 'Zoomed in about ' + zf + '× on the dashed box');
    }

    // ---- Labels ----
    COMPARE.forEach(function (c) {
      placeTag(c.tag, screenPos(c.mesh, camera, W, H, 0), 0, -6, orbitMode);
    });
    setStyle(lavaTag, 'display', insetDisplay);

    setStyle(hudOrbit, 'display', orbitMode ? 'block' : 'none');
    setStyle(hudClose, 'display', orbitMode ? 'none' : 'block');
    setText(note, orbitMode ? NOTE_ORBIT : NOTE_CLOSE);
    if (orbitMode) {
      setText(daysText, String(Math.floor(simHours / 24)));
    } else {
      const frac = lavaOrbits % 1;
      const hours = frac * PERIOD_HOURS;
      const hh = Math.floor(hours), mm = Math.floor((hours - hh) * 60);
      setStyle(barEl, 'width', (frac * 100).toFixed(1) + '%');
      setText(clockEl, hh + ' h ' + (mm < 10 ? '0' : '') + mm + ' min');
    }
  }
  // Build all shaders before the first frame, so the animation doesn't stutter when it appears
  try {
    if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera);
    else renderer.compile(scene, camera);
  } catch (e) { /* fall back to building on the first frame */ }

  new IntersectionObserver(function (entries) {
    renderer.setAnimationLoop(entries[0].isIntersecting ? frame : null);
  }).observe(container);
})();
