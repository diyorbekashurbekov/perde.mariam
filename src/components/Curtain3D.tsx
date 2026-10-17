import { useEffect, useRef } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import type { MotionValue } from "motion/react"
import { isLightDevice } from "@/lib/device"

type Curtain3DProps = {
  // Hero скроллының прогресі (0 → 1). 0–0.62 аралығында перде толық ашылады.
  progress: MotionValue<number>
}

const TAU = Math.PI * 2
const RINGS = 12
const DIST = 10

// Зығыр матаның ұсақ тоқымасы — бетке нәзік бедер береді.
function makeWeaveTexture() {
  const c = document.createElement("canvas")
  c.width = c.height = 256
  const g = c.getContext("2d")!
  g.fillStyle = "#808080"
  g.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 2) {
    g.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.14})`
    g.fillRect(0, y, 256, 1)
  }
  for (let x = 0; x < 256; x += 2) {
    g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.12})`
    g.fillRect(x, 0, 1, 256)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

export default function Curtain3D({ progress }: Curtain3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Телефонда торды сирегірек, ажыратымдылықты төменірек етеміз — көзге білінбейді, ал жүктеме 3–4 есе аз.
    const light = isLightDevice()
    const SEG_X = light ? 64 : 150
    const SEG_Y = light ? 28 : 56
    const renderer = new THREE.WebGLRenderer({ antialias: !light, alpha: true, powerPreference: "high-performance" })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, light ? 1.25 : 1.75))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%"
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex
    scene.environmentIntensity = 0.5

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 0, DIST)

    scene.add(new THREE.HemisphereLight("#fffaf0", "#cbbca5", 0.55))
    const key = new THREE.DirectionalLight("#fff0da", 2.6)
    key.position.set(-2, 4, 7)
    scene.add(key)
    const fill = new THREE.DirectionalLight("#e2e8ff", 0.45)
    fill.position.set(5, -2, 4)
    scene.add(fill)

    const weave = makeWeaveTexture()
    const cloth = new THREE.MeshPhysicalMaterial({
      color: "#ebe2d5",
      roughness: 0.82,
      sheen: 1,
      sheenRoughness: 0.4,
      sheenColor: new THREE.Color("#fff3df"),
      bumpMap: weave,
      bumpScale: 0.6,
      side: THREE.DoubleSide,
    })
    const brass = new THREE.MeshStandardMaterial({ color: "#b08a55", metalness: 0.85, roughness: 0.32 })

    // Екі перде: -1 сол жақ, +1 оң жақ.
    const panels = [-1, 1].map((side, idx) => {
      const geo = new THREE.PlaneGeometry(1, 1, SEG_X, SEG_Y)
      const uv = geo.attributes.uv
      const n = uv.count
      const us = new Float32Array(n)
      const vs = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        us[i] = side < 0 ? uv.getX(i) : 1 - uv.getX(i) // 0 = сыртқы шет, 1 = ортадағы шет
        vs[i] = 1 - uv.getY(i) // 0 = жоғары, 1 = төмен
      }
      const mesh = new THREE.Mesh(geo, cloth)
      scene.add(mesh)
      const rings = Array.from({ length: RINGS }, () => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.013, 10, 28), brass)
        ring.rotation.y = Math.PI / 2
        scene.add(ring)
        return ring
      })
      return { side, seed: idx * 2.7, geo, us, vs, rings }
    })

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1, 20), brass)
    rod.rotation.z = Math.PI / 2
    scene.add(rod)

    let viewW = 1
    let viewH = 1
    const resize = () => {
      const w = mount.clientWidth || 1
      const h = mount.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      viewH = 2 * DIST * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      viewW = viewH * camera.aspect
      weave.repeat.set(viewW * 3, viewH * 3)
      rod.scale.y = viewW + 2
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // Тышқан: камера параллаксы және «жел».
    let mx = 0
    let my = 0
    let camX = 0
    let camY = 0
    let wind = 0
    let lastMx: number | null = null
    const onMove = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect()
      mx = ((e.clientX - r.left) / r.width) * 2 - 1
      my = -(((e.clientY - r.top) / r.height) * 2 - 1)
      if (lastMx !== null) wind = Math.max(-1.4, Math.min(1.4, wind + (mx - lastMx) * 4))
      lastMx = mx
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    io.observe(mount)

    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible) return
      const t = clock.getElapsedTime()
      wind *= 0.965

      const raw = Math.min(1, Math.max(0, progress.get() / 0.62))
      const open = raw * raw * (3 - 2 * raw)

      const halfW = viewW / 2
      const fullW = halfW + 0.35 + 0.12
      const span = fullW * (1 - open * 0.78)
      const topY = viewH / 2 - 0.62
      const H = viewH + 0.8
      const folds = 9 * Math.min(1, Math.max(0.5, viewW / 9))
      const amp = 0.12 * (1 + open * 1.9)
      const gx = mx * halfW
      const gy = my * (viewH / 2)

      for (const p of panels) {
        const pos = p.geo.attributes.position
        const outerX = p.side * (halfW + 0.35)
        const fold = (u: number, hang: number) =>
          u * folds * TAU +
          Math.sin(u * folds * 0.41 * TAU + p.seed * 3) * 1.6 +
          Math.sin(u * folds * 1.63 * TAU + p.seed) * 0.45 +
          Math.sin(t * 0.45 + u * 2.4 + p.seed) * 0.9 * (0.3 + hang)

        for (let i = 0; i < pos.count; i++) {
          const u = p.us[i]
          const v = p.vs[i]
          const hang = v * v
          const phase = fold(u, hang)
          const sway = Math.sin(t * 0.8 - v * 2.4 + u * 2.2 + p.seed) * (0.15 + hang)
          const x0 = outerX - p.side * u * span
          const y = topY - v * H
          const dx = x0 - gx
          const dy = y - gy
          const gust = Math.exp(-(dx * dx + dy * dy) / 1.4) * wind * (0.2 + hang)
          const x = x0 + Math.cos(phase) * amp * 0.35 + sway * 0.05 + gust * 0.22
          const z = Math.sin(phase) * amp + sway * 0.12 + Math.abs(gust) * 0.45
          pos.setXYZ(i, x, y, z)
        }
        pos.needsUpdate = true
        p.geo.computeVertexNormals()

        p.rings.forEach((ring, k) => {
          const u = k / (RINGS - 1)
          const phase = fold(u, 0)
          ring.position.set(outerX - p.side * u * span + Math.cos(phase) * amp * 0.35, topY + 0.07, Math.sin(phase) * amp)
        })
      }
      rod.position.set(0, topY + 0.07, 0)

      // Камера: тышқанға қарай сәл бұрылады, перде ашылғанда ішке «кіреді».
      camX += (mx * 0.28 - camX) * 0.05
      camY += (my * 0.14 - camY) * 0.05
      camera.position.set(camX, camY, DIST - open * 0.8)
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener("pointermove", onMove)
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose()
      })
      cloth.dispose()
      brass.dispose()
      weave.dispose()
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [progress])

  return <div ref={mountRef} aria-hidden className="h-full w-full" />
}
