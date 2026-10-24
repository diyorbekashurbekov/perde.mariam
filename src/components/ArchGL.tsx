import { useEffect, useRef } from "react"
import * as THREE from "three"
import { isLightDevice } from "@/lib/device"

type ArchGLProps = { photos: string[] }

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

// Сұйық ауысу: келесі сурет шу (noise) бойымен «ағып» шығады, тышқан/саусақ — су толқыны.
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform vec2 uRes;
  uniform vec2 uSizeA;
  uniform vec2 uSizeB;
  uniform float uP;
  uniform float uT;
  uniform vec2 uMouse;
  uniform float uHover;

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash(i), f), dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  vec2 cover(vec2 uv, vec2 size, float zoom) {
    float rs = uRes.x / uRes.y;
    float ri = size.x / size.y;
    vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
    return (uv - 0.5) * s / zoom + 0.5;
  }
  void main() {
    vec2 uv = vUv;
    float d = distance(uv * vec2(uRes.x / uRes.y, 1.0), uMouse * vec2(uRes.x / uRes.y, 1.0));
    uv += normalize(uv - uMouse + 1e-5) * sin(d * 34.0 - uT * 5.0) * 0.007 * uHover * smoothstep(0.4, 0.0, d);

    float n = noise(uv * 2.6 + vec2(0.0, uT * 0.08)) * 0.5 + 0.5;
    float edge = smoothstep(uP * 1.25 - 0.25, uP * 1.25, n);
    vec2 offA = vec2((n - 0.5) * 0.06, (n - 0.5) * 0.28) * uP;
    vec2 offB = vec2((n - 0.5) * 0.06, (0.5 - n) * 0.28) * (1.0 - uP);
    vec4 a = texture2D(uA, cover(uv + offA, uSizeA, 1.04 + uP * 0.06));
    vec4 b = texture2D(uB, cover(uv + offB, uSizeB, 1.10 - uP * 0.06));
    gl_FragColor = mix(b, a, edge);
  }
`

export default function ArchGL({ photos }: ArchGLProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    const light = isLightDevice()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, light ? 1.25 : 1.75))
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;opacity:0;transition:opacity 1.2s ease"
    mount.appendChild(renderer.domElement)
    // Телефон видеокартаны тартып алса (context lost) — канвасты жасырамыз, бет қатпайды.
    renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault()
      renderer.domElement.style.opacity = "0"
    })

    const scene = new THREE.Scene()
    const camera = new THREE.Camera()
    const loader = new THREE.TextureLoader()
    const blank = new THREE.Texture()
    const uniforms = {
      uA: { value: blank as THREE.Texture },
      uB: { value: blank as THREE.Texture },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSizeA: { value: new THREE.Vector2(3, 4) },
      uSizeB: { value: new THREE.Vector2(3, 4) },
      uP: { value: 0 },
      uT: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
    }
    const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    const textures: THREE.Texture[] = []
    let ready = false
    const sizeOf = (t: THREE.Texture) => {
      const img = t.image as HTMLImageElement | undefined
      return new THREE.Vector2(img?.width || 3, img?.height || 4)
    }
    // Доға кішкентай болса — 900 px нұсқа жеткілікті.
    const small = light || mount.clientWidth * Math.min(window.devicePixelRatio, 1.75) <= 900
    photos.forEach((src, i) => {
      const t = loader.load(small ? src.replace(/.webp$/, "-900.webp") : src, () => {
        if (i === 0) {
          uniforms.uA.value = t
          uniforms.uSizeA.value = sizeOf(t)
          ready = true
          renderer.domElement.style.opacity = "1"
        }
      })
      t.colorSpace = THREE.NoColorSpace
      t.minFilter = THREE.LinearFilter
      t.generateMipmaps = false
      textures[i] = t
    })

    const resize = () => {
      const w = mount.clientWidth || 1
      const h = mount.clientHeight || 1
      renderer.setSize(w, h, false)
      uniforms.uRes.value.set(w, h)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    let hoverTarget = 0
    const mouse = new THREE.Vector2(0.5, 0.5)
    const onMove = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = 1 - (e.clientY - r.top) / r.height
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1
      hoverTarget = inside ? 1 : 0
      if (inside) mouse.set(x, y)
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    io.observe(mount)

    const HOLD = 3.2
    const MOVE = 1.8
    let current = 0
    let phaseStart = performance.now() / 1000
    let moving = false
    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible || !ready) return
      const now = performance.now() / 1000
      uniforms.uT.value = clock.getElapsedTime()
      uniforms.uHover.value += (hoverTarget - uniforms.uHover.value) * 0.06
      uniforms.uMouse.value.lerp(mouse, 0.12)

      const elapsed = now - phaseStart
      if (!moving && elapsed > HOLD && textures.length > 1) {
        const next = textures[(current + 1) % textures.length]
        const img = next.image as HTMLImageElement | undefined
        if (img && img.complete && img.width) {
          uniforms.uB.value = next
          uniforms.uSizeB.value = sizeOf(next)
          moving = true
          phaseStart = now
        }
      } else if (moving) {
        const k = Math.min(1, elapsed / MOVE)
        uniforms.uP.value = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
        if (k >= 1) {
          current = (current + 1) % textures.length
          uniforms.uA.value = uniforms.uB.value
          uniforms.uSizeA.value = uniforms.uSizeB.value.clone()
          uniforms.uP.value = 0
          moving = false
          phaseStart = now
        }
      }
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener("pointermove", onMove)
      textures.forEach((t) => t.dispose())
      mesh.geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [photos])

  return <div ref={mountRef} role="img" aria-label="Shtor Mariam жұмыстары" className="absolute inset-0" />
}
