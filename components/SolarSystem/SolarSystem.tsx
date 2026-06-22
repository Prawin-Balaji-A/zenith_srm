'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import styles from './SolarSystem.module.css'

interface PlanetConfig {
  name: string
  radius: number
  distance: number
  color: number
  ringColor?: number
  hasRings?: boolean
  rotationSpeed: number
  orbitSpeed: number
  tilt: number
  facts: string[]
  moons: number
  diameter: string
  distanceFromSun: string
  dayLength: string
}

const PLANETS: PlanetConfig[] = [
  {
    name: 'Mercury', radius: 0.15, distance: 2.2, color: 0x9c9c9c,
    rotationSpeed: 0.002, orbitSpeed: 0.047, tilt: 0.03,
    facts: ['Smallest planet', 'No atmosphere', 'Extreme temperatures: -180°C to 430°C'],
    moons: 0, diameter: '4,879 km', distanceFromSun: '57.9M km', dayLength: '59 Earth days',
  },
  {
    name: 'Venus', radius: 0.22, distance: 3.2, color: 0xe8c84a,
    rotationSpeed: 0.0005, orbitSpeed: 0.035, tilt: 2.64,
    facts: ['Hottest planet (462°C avg)', 'Rotates backwards', 'Thick CO₂ atmosphere'],
    moons: 0, diameter: '12,104 km', distanceFromSun: '108.2M km', dayLength: '243 Earth days',
  },
  {
    name: 'Earth', radius: 0.24, distance: 4.4, color: 0x4da6ff,
    rotationSpeed: 0.005, orbitSpeed: 0.03, tilt: 0.41,
    facts: ['Only known life-bearing planet', '71% ocean coverage', 'Perfect magnetic field'],
    moons: 1, diameter: '12,742 km', distanceFromSun: '149.6M km', dayLength: '24 hours',
  },
  {
    name: 'Mars', radius: 0.18, distance: 5.8, color: 0xd4513a,
    rotationSpeed: 0.005, orbitSpeed: 0.024, tilt: 0.44,
    facts: ['Home of Olympus Mons', 'Has two moons', 'Day is 24h 37min'],
    moons: 2, diameter: '6,779 km', distanceFromSun: '227.9M km', dayLength: '24h 37min',
  },
  {
    name: 'Jupiter', radius: 0.55, distance: 8.0, color: 0xc8a97e,
    rotationSpeed: 0.012, orbitSpeed: 0.013, tilt: 0.05,
    facts: ['Largest planet', 'Great Red Spot storm', '95 known moons'],
    moons: 95, diameter: '139,820 km', distanceFromSun: '778.5M km', dayLength: '9h 56min',
  },
  {
    name: 'Saturn', radius: 0.45, distance: 11.0, color: 0xd4b483, hasRings: true, ringColor: 0xb8976e,
    rotationSpeed: 0.010, orbitSpeed: 0.009, tilt: 0.47,
    facts: ['Iconic ring system', 'Least dense planet', '146 known moons'],
    moons: 146, diameter: '116,460 km', distanceFromSun: '1.43B km', dayLength: '10h 42min',
  },
  {
    name: 'Uranus', radius: 0.32, distance: 14.0, color: 0x7de8e8,
    rotationSpeed: 0.007, orbitSpeed: 0.006, tilt: 1.71,
    facts: ['Rotates on its side', 'Coldest planet (-224°C)', 'Has faint rings'],
    moons: 27, diameter: '50,724 km', distanceFromSun: '2.87B km', dayLength: '17h 14min',
  },
  {
    name: 'Neptune', radius: 0.30, distance: 17.0, color: 0x4169e1,
    rotationSpeed: 0.008, orbitSpeed: 0.005, tilt: 0.49,
    facts: ['Strongest winds (2,100 km/h)', 'Has Triton (backwards moon)', 'Farthest from Sun'],
    moons: 16, diameter: '49,244 km', distanceFromSun: '4.50B km', dayLength: '16h 6min',
  },
]

export default function SolarSystem() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetConfig | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Refs for animation loop
    const selectedPlanetRef = { current: selectedPlanet }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.set(0, 8, 22)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    mount.appendChild(renderer.domElement)

    // Lights
    const sunLight = new THREE.PointLight(0xfff5e0, 500, 500)
    sunLight.position.set(0, 0, 0)
    scene.add(sunLight)
    
    // Add a soft directional light to ensure the far side isn't pitch black
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5)
    fillLight.position.set(20, 10, 20)
    scene.add(fillLight)
    
    const ambientLight = new THREE.AmbientLight(0x222244, 1.5)
    scene.add(ambientLight)

    // Sun
    const sunGeo = new THREE.SphereGeometry(0.9, 32, 32)
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc44 })
    const sun = new THREE.Mesh(sunGeo, sunMat)
    scene.add(sun)

    // Sun glow
    const sunGlowGeo = new THREE.SphereGeometry(1.1, 32, 32)
    const sunGlowMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0,0,1)), 2.0);
          gl_FragColor = vec4(1.0, 0.7, 0.1, 1.0) * intensity * 0.9;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    })
    scene.add(new THREE.Mesh(sunGlowGeo, sunGlowMat))

    // Stars
    const starGeo = new THREE.BufferGeometry()
    const starVerts = []
    for (let i = 0; i < 3000; i++) {
      starVerts.push((Math.random() - 0.5) * 600, (Math.random() - 0.5) * 600, (Math.random() - 0.5) * 600)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.7 })))

    // Build planet meshes
    const planetMeshes: { config: PlanetConfig; mesh: THREE.Mesh; pivot: THREE.Object3D; angle: number }[] = []
    const raycasterObjects: THREE.Mesh[] = []

    PLANETS.forEach((p) => {
      // Orbit ring
      const orbitGeo = new THREE.RingGeometry(p.distance - 0.02, p.distance + 0.02, 128)
      const orbitMat = new THREE.MeshBasicMaterial({
        color: 0x334455,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      })
      const orbitRing = new THREE.Mesh(orbitGeo, orbitMat)
      orbitRing.rotation.x = -Math.PI / 2
      scene.add(orbitRing)

      // Planet
      const geo = new THREE.SphereGeometry(p.radius, 32, 32)

      // Create canvas texture for each planet
      const pCanvas = document.createElement('canvas')
      pCanvas.width = 512
      pCanvas.height = 256
      const pctx = pCanvas.getContext('2d')!
      const grad = pctx.createLinearGradient(0, 0, 512, 256)
      const color = '#' + p.color.toString(16).padStart(6, '0')
      grad.addColorStop(0, color)
      grad.addColorStop(0.5, shadeColor(color, -20))
      grad.addColorStop(1, shadeColor(color, -40))
      pctx.fillStyle = grad
      pctx.fillRect(0, 0, 512, 256)

      // Add surface details
      if (p.name === 'Jupiter') {
        // Bands
        for (let i = 0; i < 8; i++) {
          pctx.fillStyle = `rgba(${Math.random() > 0.5 ? '180,140,100' : '200,160,120'},0.3)`
          pctx.fillRect(0, i * 32, 512, 16)
        }
        // GRS
        pctx.fillStyle = 'rgba(180,80,60,0.5)'
        pctx.beginPath()
        pctx.ellipse(250, 128, 40, 25, 0, 0, Math.PI * 2)
        pctx.fill()
      } else if (p.name === 'Saturn') {
        for (let i = 0; i < 6; i++) {
          pctx.fillStyle = `rgba(200,170,120,0.2)`
          pctx.fillRect(0, i * 43, 512, 22)
        }
      } else if (p.name === 'Earth') {
        pctx.fillStyle = 'rgba(30,100,30,0.6)'
        pctx.beginPath()
        pctx.ellipse(150, 100, 80, 60, -0.3, 0, Math.PI * 2)
        pctx.fill()
        pctx.beginPath()
        pctx.ellipse(360, 120, 100, 70, 0.2, 0, Math.PI * 2)
        pctx.fill()
      }

      const tex = new THREE.CanvasTexture(pCanvas)
      tex.colorSpace = THREE.SRGBColorSpace
      
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.7,
        metalness: 0.1,
      })

      const mesh = new THREE.Mesh(geo, mat)
      mesh.userData = { planet: p }
      mesh.rotation.z = p.tilt

      // Rings for Saturn
      if (p.hasRings) {
        const ringGeo = new THREE.RingGeometry(p.radius * 1.4, p.radius * 2.2, 64)
        const ringMat = new THREE.MeshBasicMaterial({
          color: p.ringColor || 0xb8976e,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        })
        const rings = new THREE.Mesh(ringGeo, ringMat)
        rings.rotation.x = Math.PI / 3
        mesh.add(rings)
      }

      // Pivot for orbit
      const pivot = new THREE.Object3D()
      pivot.add(mesh)
      scene.add(pivot)

      const startAngle = Math.random() * Math.PI * 2
      mesh.position.set(p.distance, 0, 0)

      planetMeshes.push({ config: p, mesh, pivot, angle: startAngle })
      raycasterObjects.push(mesh)
    })

    // Raycaster for planet clicks
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onClick = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(raycasterObjects)
      if (hits.length > 0) {
        const planet = hits[0].object.userData.planet as PlanetConfig
        setSelectedPlanet((prev) => prev?.name === planet.name ? null : planet)
      } else {
        setSelectedPlanet(null)
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(raycasterObjects)
      setHovered(hits.length > 0 ? (hits[0].object.userData.planet as PlanetConfig).name : null)
    }

    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.addEventListener('mousemove', onMouseMove)

    // Camera orbit controls
    let isDragging = false, lastX = 0, lastY = 0
    let cameraTheta = Math.PI / 3, cameraPhi = Math.PI / 4, cameraR = 25
    const currentLookAt = new THREE.Vector3(0, 0, 0)
    
    // updateCamera is now fully handled in the animate loop to support smooth lerping
    const updateCameraDrag = () => {}
    renderer.domElement.addEventListener('mousedown', (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY })
    renderer.domElement.addEventListener('mousemove', (e) => {
      if (!isDragging) return
      cameraTheta -= (e.clientX - lastX) * 0.005
      cameraPhi = Math.max(0.1, Math.min(Math.PI / 2, cameraPhi + (e.clientY - lastY) * 0.005))
      lastX = e.clientX; lastY = e.clientY
    })
    renderer.domElement.addEventListener('mouseup', () => { isDragging = false })
    renderer.domElement.addEventListener('wheel', (e) => {
      // If focused on a planet, don't allow zooming all the way out to 50
      const maxZoom = selectedPlanetRef.current ? 15 : 50
      cameraR = Math.max(1.5, Math.min(maxZoom, cameraR + e.deltaY * 0.02))
    }, { passive: true })

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    let sunTime = 0
    const animate = () => {
      const frameId = requestAnimationFrame(animate)
      sunTime += 0.01

      sun.rotation.y += 0.002
      sunGlowMat.uniforms.time.value = sunTime

      planetMeshes.forEach(({ config, mesh, pivot, angle: _ }, idx) => {
        planetMeshes[idx].angle += config.orbitSpeed * 0.1 // Slower, more majestic speed
        const a = planetMeshes[idx].angle
        mesh.position.set(
          Math.cos(a) * config.distance,
          0,
          Math.sin(a) * config.distance
        )
        mesh.rotation.y += config.rotationSpeed
      })

      // Sync ref for animation loop
      selectedPlanetRef.current = selectedPlanet

      // Cinematic Camera Tracking
      if (selectedPlanetRef.current) {
        const targetObj = planetMeshes.find(p => p.config.name === selectedPlanetRef.current?.name)
        if (targetObj) {
          const targetPos = new THREE.Vector3()
          targetObj.mesh.getWorldPosition(targetPos)
          
          // Smoothly interpolate lookAt center to the moving planet
          currentLookAt.lerp(targetPos, 0.08)
          
          // Smoothly zoom in to the planet
          // cameraR = THREE.MathUtils.lerp(cameraR, targetObj.config.radius * 8, 0.05)
          // Actually, let user control zoom but lerp it closer if it's too far
          if (!isDragging) {
             const targetZoom = targetObj.config.radius * 10
             cameraR = THREE.MathUtils.lerp(cameraR, targetZoom, 0.05)
          }
        }
      } else {
        // Return to center (Sun)
        currentLookAt.lerp(new THREE.Vector3(0, 0, 0), 0.05)
        if (!isDragging) cameraR = THREE.MathUtils.lerp(cameraR, 25, 0.05)
      }

      camera.position.set(
        currentLookAt.x + cameraR * Math.sin(cameraPhi) * Math.sin(cameraTheta),
        currentLookAt.y + cameraR * Math.cos(cameraPhi),
        currentLookAt.z + cameraR * Math.sin(cameraPhi) * Math.cos(cameraTheta)
      )
      camera.lookAt(currentLookAt)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      renderer.domElement.removeEventListener('click', onClick)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className={styles.wrapper} id="solar-system-canvas-wrapper">
      <div ref={mountRef} className={styles.mount} style={{ cursor: hovered ? 'pointer' : 'grab' }} />

      {/* Planet selector pills */}
      <div className={styles.planetNav} role="list" aria-label="Planet list">
        {PLANETS.map((p) => (
          <button
            key={p.name}
            role="listitem"
            className={`${styles.planetPill} ${selectedPlanet?.name === p.name ? styles.planetPillActive : ''}`}
            onClick={() => setSelectedPlanet((prev) => prev?.name === p.name ? null : p)}
            id={`solar-planet-${p.name.toLowerCase()}`}
            aria-label={`View ${p.name} information`}
          >
            <span className={styles.planetDot} style={{ background: '#' + p.color.toString(16).padStart(6, '0') }} />
            {p.name}
          </button>
        ))}
      </div>

      {/* Planet info panel */}
      {selectedPlanet && (
        <div className={styles.planetPanel} id="solar-planet-info-panel">
          <button className={styles.closeBtn} onClick={() => setSelectedPlanet(null)} aria-label="Close planet info">✕</button>
          <div className={styles.planetHeader}>
            <div className={styles.planetOrb} style={{ background: `radial-gradient(circle at 35% 35%, ${lightenColor('#' + selectedPlanet.color.toString(16).padStart(6, '0'))}, ${'#' + selectedPlanet.color.toString(16).padStart(6, '0')})` }} />
            <div>
              <h3 className={styles.planetName}>{selectedPlanet.name}</h3>
              <div className={styles.planetMoons}>{selectedPlanet.moons} moon{selectedPlanet.moons !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className={styles.planetStats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Diameter</span>
              <span className={styles.statVal}>{selectedPlanet.diameter}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Distance from Sun</span>
              <span className={styles.statVal}>{selectedPlanet.distanceFromSun}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Day Length</span>
              <span className={styles.statVal}>{selectedPlanet.dayLength}</span>
            </div>
          </div>
          <div className={styles.planetFacts}>
            {selectedPlanet.facts.map((f, i) => (
              <div key={i} className={styles.fact}>
                <span className={styles.factDot}>◆</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.hint}>Click any planet for details · Drag to orbit · Scroll to zoom</div>
    </div>
  )
}

// Utility: shade a hex color by amount
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.slice(1), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent))
  return `rgb(${r},${g},${b})`
}

function lightenColor(color: string): string {
  return shadeColor(color, 60)
}
