'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import gsap from 'gsap'
import { useZenithStore } from '@/store/zenith'
import styles from './Globe.module.css'

// High-fidelity Earth textures (8k equivalent looks)
const EARTH_DAY_URL    = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
const EARTH_WATER_URL  = 'https://unpkg.com/three-globe/example/img/earth-water.png'
const EARTH_CLOUDS_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
const EARTH_NIGHT_URL  = 'https://unpkg.com/three-globe/example/img/earth-night.jpg'

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (lng - 90) * (Math.PI / 180)
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function getSunPosition(date: Date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0).getTime()
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000)
  // Declination varies from -23.44 to +23.44 degrees
  const declination = -23.44 * Math.cos((360 / 365.24) * (dayOfYear + 10) * (Math.PI / 180))
  // Earth rotates 15 degrees per hour. 12:00 UTC is sun over 0 longitude.
  const hoursUTC = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  let sunLng = (12 - hoursUTC) * 15
  if (sunLng > 180) sunLng -= 360
  if (sunLng < -180) sunLng += 360
  return { lat: declination, lng: sunLng }
}

export default function Globe() {
  const mountRef  = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<() => void>(() => {})

  const { location, satellites, setLocation } = useZenithStore()

  const locationRef   = useRef(location)
  const satellitesRef = useRef(satellites)
  useEffect(() => { locationRef.current   = location   }, [location])
  useEffect(() => { satellitesRef.current = satellites }, [satellites])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Scene ────────────────────────────────────────────────────────────
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    // Start camera far away for cinematic fly-in
    camera.position.z = 20.0

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    mount.appendChild(renderer.domElement)

    // ── Controls (Handles Pinch/Zoom/Smooth Drag) ────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enablePan = false
    controls.minDistance = 1.5
    controls.maxDistance = 6.0
    // Prevent user from going "inside" or too far
    controls.zoomSpeed = 0.8
    controls.rotateSpeed = 0.6
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.5

    // Stop auto-rotate when user interacts
    const stopRotation = () => { controls.autoRotate = false }
    controls.addEventListener('start', stopRotation)

    // ── Lighting ─────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.05)) // Very low ambient so night side is dark but visible
    
    // Real-time Sun with glowing mesh
    const sun = new THREE.DirectionalLight(0xffffff, 5.0)
    const currentSunPos = getSunPosition()
    const sunVec = latLngToVec3(currentSunPos.lat, currentSunPos.lng, 20)
    sun.position.copy(sunVec)
    scene.add(sun)

    // Cinematic glowing sun mesh
    const sunGlowGeo = new THREE.SphereGeometry(0.5, 32, 32)
    const sunGlowMat = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color(5.0, 4.8, 4.5), // HDR values for intense bloom
      transparent: true,
      opacity: 1.0
    })
    const sunMesh = new THREE.Mesh(sunGlowGeo, sunGlowMat)
    scene.add(sunMesh)

    // ── Background stars ─────────────────────────────────────────────────
    const starVerts: number[] = []
    for (let i = 0; i < 6000; i++) {
      starVerts.push(
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 600,
      )
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))
    scene.add(new THREE.Points(starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.7 }),
    ))

    // ── Texture loader ───────────────────────────────────────────────────
    const tl = new THREE.TextureLoader()

    // ── Earth mesh ───────────────────────────────────────────────────────
    const earthGeo = new THREE.SphereGeometry(1, 128, 128) // Higher poly for smoothness
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x111111,
      shininess: 15,
    })
    const earth = new THREE.Mesh(earthGeo, earthMat)
    scene.add(earth)

    // High fidelity blue marble map
    tl.load(EARTH_DAY_URL, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
      earthMat.map = tex
      earthMat.color.setHex(0xffffff)
      earthMat.needsUpdate = true
    })
    
    // Specular map for oceans reflecting sunlight
    tl.load(EARTH_WATER_URL, (tex) => {
      earthMat.specularMap = tex
      earthMat.specular = new THREE.Color(0x333333)
      earthMat.needsUpdate = true
    })

    // ── Night City Lights Shader ─────────────────────────────────────────
    const nightGeo = new THREE.SphereGeometry(1.001, 128, 128)
    const nightMat = new THREE.ShaderMaterial({
      uniforms: {
        nightTexture: { value: null },
        sunDirectionWorld: { value: new THREE.Vector3(1, 0, 0) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        void main() {
          vUv = uv;
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D nightTexture;
        uniform vec3 sunDirectionWorld;
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        void main() {
          vec4 nightColor = texture2D(nightTexture, vUv);
          float sunDot = dot(vWorldNormal, sunDirectionWorld);
          float nightIntensity = 1.0 - smoothstep(-0.2, 0.1, sunDot);
          gl_FragColor = vec4(nightColor.rgb * nightIntensity * 2.0, 1.0);
        }`,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    })
    const nightMesh = new THREE.Mesh(nightGeo, nightMat)
    earth.add(nightMesh)

    tl.load(EARTH_NIGHT_URL, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      nightMat.uniforms.nightTexture.value = tex
      nightMat.needsUpdate = true
    })

    // ── Cloud layer ──────────────────────────────────────────────────────
    const cloudGeo = new THREE.SphereGeometry(1.006, 128, 128)
    const cloudMat = new THREE.MeshPhongMaterial({ 
      transparent: true, 
      opacity: 0.4, 
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat)
    scene.add(cloudMesh)
    tl.load(EARTH_CLOUDS_URL, (tex) => {
      cloudMat.map = tex
      cloudMat.needsUpdate = true
    })

    // ── Premium Atmosphere Shader (Fresnel) ──────────────────────────────
    const atmGeo = new THREE.SphereGeometry(1.025, 128, 128)
    const atmMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
          gl_FragColor = vec4(0.2, 0.6, 1.0, 1.0) * intensity;
        }`,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(atmGeo, atmMat))

    // Inner glow
    const innerAtmGeo = new THREE.SphereGeometry(1.001, 128, 128)
    const innerAtmMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.1, 0.4, 0.8, 1.0) * intensity * 0.4;
        }`,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(innerAtmGeo, innerAtmMat))

    // ── Location pin ──────────────────────────────────────────────────────
    const pinGeo = new THREE.SphereGeometry(0.015, 16, 16)
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xff4444 })
    const pinMesh = new THREE.Mesh(pinGeo, pinMat)
    earth.add(pinMesh) // Add to earth so it rotates with it

    // Pin glow
    const pinGlowGeo = new THREE.SphereGeometry(0.03, 16, 16)
    const pinGlowMat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.3 })
    const pinGlow = new THREE.Mesh(pinGlowGeo, pinGlowMat)
    earth.add(pinGlow)

    // ── Satellite points ─────────────────────────────────────────────────
    const MAX_SATS = 1000
    const satPositions = new Float32Array(MAX_SATS * 3)
    const satColors = new Float32Array(MAX_SATS * 3)
    const satGeo = new THREE.BufferGeometry()
    satGeo.setAttribute('position', new THREE.BufferAttribute(satPositions, 3))
    satGeo.setAttribute('color', new THREE.BufferAttribute(satColors, 3))
    satGeo.setDrawRange(0, 0)
    
    const satMat = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
      map: createCircleTexture(),
    })
    const satPoints = new THREE.Points(satGeo, satMat)
    earth.add(satPoints)

    // ── Helpers ──────────────────────────────────────────────────────────
    function createCircleTexture() {
      const canvas = document.createElement('canvas')
      canvas.width = 32; canvas.height = 32
      const ctx = canvas.getContext('2d')!
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      gradient.addColorStop(0, 'rgba(255,255,255,1)')
      gradient.addColorStop(0.2, 'rgba(0,245,255,0.8)')
      gradient.addColorStop(1, 'rgba(0,245,255,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 32, 32)
      return new THREE.CanvasTexture(canvas)
    }

    // Click to pick location (with drag protection)
    const raycaster = new THREE.Raycaster()
    const mouse2    = new THREE.Vector2()
    let mouseDownPos = { x: 0, y: 0 }
    
    renderer.domElement.addEventListener('mousedown', (e) => {
      mouseDownPos = { x: e.clientX, y: e.clientY }
    })

    const onClick   = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y)
      if (dist > 5) return // Ignore if user dragged the globe

      // Don't trigger if they dragged (OrbitControls handles drag, but we check if mouse moved slightly)
      const r = mount.getBoundingClientRect()
      mouse2.x = ((e.clientX - r.left) / r.width)  * 2 - 1
      mouse2.y = -((e.clientY - r.top)  / r.height) * 2 + 1
      raycaster.setFromCamera(mouse2, camera)
      const hits = raycaster.intersectObject(earth)
      if (hits.length > 0) {
        // Point is in world space, we need local space relative to Earth
        const localPoint = earth.worldToLocal(hits[0].point.clone()).normalize()
        const lat = 90 - Math.acos(localPoint.y) * (180 / Math.PI)
        const theta = Math.atan2(localPoint.z, localPoint.x) * (180 / Math.PI)
        let lng = theta + 90
        if (lng > 180) lng -= 360
        if (lng < -180) lng += 360
        setLocation({ lat, lng, name: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°` })
      }
    }

    renderer.domElement.addEventListener('click', onClick)

    // ── Resize ────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Post-Processing (Cinematic Bloom) ─────────────────────────────────
    const renderScene = new RenderPass(scene, camera)
    // Resolution, strength, radius, threshold
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 1.2, 0.5, 0.8)
    const composer = new EffectComposer(renderer)
    composer.addPass(renderScene)
    composer.addPass(bloomPass)

    // ── GSAP Intro Animation ──────────────────────────────────────────────
    gsap.to(camera.position, {
      z: 3.5,
      duration: 3.5,
      ease: 'power3.out',
      onUpdate: () => controls.update()
    })

    // ── Animation loop ────────────────────────────────────────────────────
    let frameId = 0

    const animate = () => {
      frameId = requestAnimationFrame(animate)

      controls.update() // Update damping/auto-rotate

      // Update sun position in real time
      const sunP = getSunPosition()
      const sunWorldVec = latLngToVec3(sunP.lat, sunP.lng, 20)
      sun.position.copy(sunWorldVec)
      sunMesh.position.copy(sunWorldVec)

      // Update night lights shader with normalized sun vector
      nightMat.uniforms.sunDirectionWorld.value.copy(sunWorldVec).normalize()

      cloudMesh.rotation.y = earth.rotation.y + 0.002

      // Update location pin (local to earth)
      const pinPos = latLngToVec3(locationRef.current.lat, locationRef.current.lng, 1.01)
      pinMesh.position.copy(pinPos)
      pinGlow.position.copy(pinPos)

      // Update satellite points (local to earth)
      const sats = satellitesRef.current.slice(0, MAX_SATS)
      sats.forEach((s, i) => {
        const v = latLngToVec3(s.lat, s.lng, 1 + s.alt / 6371)
        satPositions[i * 3]     = v.x
        satPositions[i * 3 + 1] = v.y
        satPositions[i * 3 + 2] = v.z
        
        // Color based on type
        let r=0, g=0.96, b=1 // default cyan
        if (s.type === 'iss') { r=1; g=0; b=0 }
        else if (s.type === 'debris') { r=1; g=0.6; b=0 }
        satColors[i * 3] = r
        satColors[i * 3 + 1] = g
        satColors[i * 3 + 2] = b
      })
      
      if (sats.length > 0) {
        satGeo.attributes.position.needsUpdate = true
        satGeo.attributes.color.needsUpdate = true
        satGeo.setDrawRange(0, sats.length)
      }

      // Render via composer for post-processing bloom
      composer.render()
    }
    animate()

    // ── Cleanup ───────────────────────────────────────────────────────────
    const cleanup = () => {
      cancelAnimationFrame(frameId)
      controls.dispose()
      controls.removeEventListener('start', stopRotation)
      renderer.domElement.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
    cleanupRef.current = cleanup
    return cleanup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.globeWrapper} id="globe-canvas-wrapper">
      <div ref={mountRef} className={styles.globeMount} />
      <div className={styles.globeOverlay}>
        <div className={styles.globeStats}>
          <span className="live-dot" />
          <span className={styles.globeStatText}>
            {location.name} · {location.lat.toFixed(2)}° {location.lat >= 0 ? 'N' : 'S'}, {Math.abs(location.lng).toFixed(2)}° {location.lng >= 0 ? 'E' : 'W'}
          </span>
        </div>
        <div className={styles.satCount}>
          🛰️ {satellites.filter(s => s.elevation > 0).length} overhead
        </div>
      </div>
      <div className={styles.globeHint}>
        🖱️ Drag to rotate · Pinch to zoom · Click to set location
      </div>
    </div>
  )
}
