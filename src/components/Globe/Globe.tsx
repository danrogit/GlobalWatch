'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useRouter } from 'next/navigation';
import { clusterEvents, EventCluster } from '@/lib/clustering';

interface EventDot {
    id: string;
    lat: number;
    lon: number;
    severity: 'low' | 'medium' | 'high';
    title: string;
    slug: string;
    timestamp: string;
    eventCount?: number;
    dotColor?: 'blue' | 'orange' | 'red' | 'green';
    layer?: 'incident' | 'political';
}

interface GlobeProps {
    events: EventDot[];
    onEventClick?: (event: EventDot) => void;
    focusOn?: EventDot;
    paused?: boolean;
    onPauseChange?: (paused: boolean) => void; // Callback for auto-pause
}

// Legacy country label overrides.
const DANISH_NAMES: Record<string, string> = {
    'United States of America': 'USA',
    'United Kingdom': 'Storbritannien',
    'Germany': 'Tyskland',
    'France': 'Frankrig',
    'Spain': 'Spanien',
    'Italy': 'Italien',
    'Russia': 'Rusland',
    'China': 'Kina',
    'Japan': 'Japan',
    'India': 'Indien',
    'Brazil': 'Brasilien',
    'Canada': 'Canada',
    'Australia': 'Australien',
    'Mexico': 'Mexico',
    'Argentina': 'Argentina',
    'South Africa': 'Sydafrika',
    'Egypt': 'Egypten',
    'Nigeria': 'Nigeria',
    'Saudi Arabia': 'Saudi-Arabien',
    'Turkey': 'Tyrkiet',
    'Iran': 'Iran',
    'Indonesia': 'Indonesien',
    'Poland': 'Polen',
    'Ukraine': 'Ukraine',
    'Netherlands': 'Holland',
    'Belgium': 'Belgien',
    'Sweden': 'Sverige',
    'Norway': 'Norge',
    'Denmark': 'Denmark',
    'Finland': 'Finland',
    'Switzerland': 'Schweiz',
    'Austria': 'Østrig',
    'Greece': 'Grækenland',
    'Portugal': 'Portugal',
    'Ireland': 'Irland',
    'New Zealand': 'New Zealand',
    'South Korea': 'Sydkorea',
    'North Korea': 'Nordkorea',
    'Thailand': 'Thailand',
    'Vietnam': 'Vietnam',
    'Philippines': 'Filippinerne',
    'Pakistan': 'Pakistan',
    'Bangladesh': 'Bangladesh',
    'Colombia': 'Colombia',
    'Chile': 'Chile',
    'Peru': 'Peru',
    'Venezuela': 'Venezuela',
    'Cuba': 'Cuba',
    'Morocco': 'Marokko',
    'Algeria': 'Algeriet',
    'Kenya': 'Kenya',
    'Ethiopia': 'Etiopien',
    'Democratic Republic of the Congo': 'Den Demokratiske Republik Congo',
    'Tanzania': 'Tanzania',
    'Kazakhstan': 'Kasakhstan',
    'Mongolia': 'Mongoliet',
    'Afghanistan': 'Afghanistan',
    'Iraq': 'Irak',
    'Syria': 'Syrien',
    'Israel': 'Israel',
    'Palestine': 'Palæstina',
    'Jordan': 'Jordan',
    'Lebanon': 'Libanon',
    'United Arab Emirates': 'Forenede Arabiske Emirater',
    'Qatar': 'Qatar',
    'Kuwait': 'Kuwait',
    'Oman': 'Oman',
    'Yemen': 'Yemen',
    'Malaysia': 'Malaysia',
    'Singapore': 'Singapore',
    'Myanmar': 'Myanmar',
    'Nepal': 'Nepal',
    'Sri Lanka': 'Sri Lanka',
    'Iceland': 'Island',
    'Greenland': 'Grønland',
    'Antarctica': 'Antarktis',
};

// Convert lat/lon to 3D position
function latLonToPosition(lat: number, lon: number, radius: number): [number, number, number] {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return [x, y, z];
}

export default function Globe({ events, onEventClick, focusOn, paused = false, onPauseChange }: GlobeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const sceneDataRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        controls: OrbitControls;
        globeGroup: THREE.Group;
        markersHigh: THREE.InstancedMesh | null;
        markersMed: THREE.InstancedMesh | null;
        markersLow: THREE.InstancedMesh | null;
        blinkingIndices: { meshType: 'high' | 'med' | 'low'; index: number }[];
        animFrame: number;
        raycaster: THREE.Raycaster;
        mouse: THREE.Vector2;
    } | null>(null);
    const eventsRef = useRef<EventDot[]>([]);
    const pausedRef = useRef(paused);
    const router = useRouter();

    useEffect(() => {
        eventsRef.current = events;
    }, [events]);

    // Handle rotation pause
    useEffect(() => {
        pausedRef.current = paused;
        if (sceneDataRef.current) {
            sceneDataRef.current.controls.autoRotate = !paused;
            sceneDataRef.current.controls.update();
        }
    }, [paused]);

    // Initialize scene
    useEffect(() => {
        if (!containerRef.current || sceneDataRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        if (focusOn) {
            const [x, y, z] = latLonToPosition(focusOn.lat, focusOn.lon, 2.5);
            camera.position.set(x, y, z);
        } else {
            camera.position.set(0, 0, 2.8);
        }

        // Raycaster for click detection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        controls.minDistance = 1.3;
        controls.maxDistance = 5;
        controls.autoRotate = !paused;
        controls.autoRotateSpeed = 0.5;

        // AUTO-PAUSE: Stop rotation when user starts dragging
        controls.addEventListener('start', () => {
            if (onPauseChange) {
                onPauseChange(true); // Tell parent to pause
            } else {
                controls.autoRotate = false; // Fallback: just stop locally
            }
        });

        // Globe group
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // 1. Base Sphere (Occluder)
        const earthGeo = new THREE.SphereGeometry(1, 64, 64);
        const earthMat = new THREE.MeshBasicMaterial({
            color: 0x050510,
            side: THREE.FrontSide
        });
        const earth = new THREE.Mesh(earthGeo, earthMat);
        globeGroup.add(earth);

        // 2. Vector Map (Country Borders) with Labels
        fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(data => {
                const points: number[] = [];

                const createLabel = (text: string) => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return null;
                    const fontSize = 24;
                    ctx.font = `600 ${fontSize}px sans-serif`;
                    const textWidth = ctx.measureText(text).width;

                    canvas.width = textWidth + 8;
                    canvas.height = fontSize * 1.5;

                    ctx.font = `600 ${fontSize}px sans-serif`;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(text, 4, canvas.height - 4);

                    const texture = new THREE.CanvasTexture(canvas);
                    texture.minFilter = THREE.LinearFilter;

                    const material = new THREE.MeshBasicMaterial({
                        map: texture,
                        transparent: true,
                        opacity: 0.8,
                        depthTest: true,
                        depthWrite: false,
                        side: THREE.DoubleSide
                    });

                    const aspect = canvas.width / canvas.height;
                    const geometry = new THREE.PlaneGeometry(aspect, 1);
                    const mesh = new THREE.Mesh(geometry, material);

                    // 50% smaller size
                    const scale = 0.00125 * fontSize;
                    mesh.scale.set(scale, scale, 1);
                    return mesh;
                };

                // Parse GeoJSON
                data.features.forEach((feature: any) => {
                    const geometry = feature.geometry;
                    if (!geometry) return;

                    // Label Logic
                    const englishName = feature.properties?.NAME;
                    if (englishName && (feature.properties?.scalerank < 2 || !feature.properties?.scalerank)) {
                        let ringToUse: number[][] | null = null;
                        if (geometry.type === 'Polygon') {
                            ringToUse = geometry.coordinates[0];
                        } else if (geometry.type === 'MultiPolygon') {
                            let maxLen = 0;
                            geometry.coordinates.forEach((poly: any) => {
                                if (poly[0].length > maxLen) {
                                    maxLen = poly[0].length;
                                    ringToUse = poly[0];
                                }
                            });
                        }

                        if (ringToUse) {
                            let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
                            ringToUse.forEach(([lon, lat]) => {
                                if (lat < minLat) minLat = lat;
                                if (lat > maxLat) maxLat = lat;
                                if (lon < minLon) minLon = lon;
                                if (lon > maxLon) maxLon = lon;
                            });
                            const centerLat = (minLat + maxLat) / 2;
                            const centerLon = (minLon + maxLon) / 2;

                            const labelMesh = createLabel(englishName);
                            if (labelMesh) {
                                const [x, y, z] = latLonToPosition(centerLat, centerLon, 1.005);
                                labelMesh.position.set(x, y, z);
                                // Orient flat to surface, then flip to face outward
                                labelMesh.lookAt(new THREE.Vector3(0, 0, 0));
                                labelMesh.rotateY(Math.PI); // Fix mirroring
                                globeGroup.add(labelMesh);
                            }
                        }
                    }

                    const addRing = (ring: number[][]) => {
                        for (let i = 0; i < ring.length - 1; i++) {
                            const [lon1, lat1] = ring[i];
                            const [lon2, lat2] = ring[i + 1];

                            const p1 = latLonToPosition(lat1, lon1, 1.001);
                            const p2 = latLonToPosition(lat2, lon2, 1.001);

                            points.push(...p1, ...p2);
                        }
                    };

                    if (geometry.type === 'Polygon') {
                        geometry.coordinates.forEach(addRing);
                    } else if (geometry.type === 'MultiPolygon') {
                        geometry.coordinates.forEach((polygon: number[][][]) => {
                            polygon.forEach(addRing);
                        });
                    }
                });

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

                const material = new THREE.LineBasicMaterial({
                    color: 0x3b82f6,
                    transparent: true,
                    opacity: 0.6,
                    depthTest: true,
                    depthWrite: false
                });

                const mesh = new THREE.LineSegments(geometry, material);
                globeGroup.add(mesh);
            })
            .catch(err => console.error("Failed to load map data", err));

        // 3. Atmosphere Glow
        const atmosGeo = new THREE.SphereGeometry(1.0, 64, 64);
        const atmosMat = new THREE.ShaderMaterial({
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
          float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 1.5;
        }
      `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false,
        });
        const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 64), atmosMat);
        globeGroup.add(atmosphere);

        // Store ref
        sceneDataRef.current = {
            scene,
            camera,
            renderer,
            controls,
            globeGroup,
            markersHigh: null,
            markersMed: null,
            markersLow: null,
            blinkingIndices: [],
            animFrame: 0,
            raycaster,
            mouse,
        };

        setMounted(true);

        // Click handler for event dots
        const onClick = (event: MouseEvent) => {
            const data = sceneDataRef.current;
            if (!data) return;

            const rect = container.getBoundingClientRect();
            data.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            data.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            data.raycaster.setFromCamera(data.mouse, data.camera);

            const meshes = [data.markersHigh, data.markersMed, data.markersLow].filter(Boolean) as THREE.InstancedMesh[];

            for (const mesh of meshes) {
                const intersects = data.raycaster.intersectObject(mesh);
                if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
                    const instanceId = intersects[0].instanceId;

                    if (mesh === data.markersHigh) {
                        const highEvents = eventsRef.current.filter(e => e.dotColor === 'red' || (!e.dotColor && e.severity === 'high'));
                        if (highEvents[instanceId]) {
                            router.push(`/event/${highEvents[instanceId].slug}`);
                            return;
                        }
                    } else if (mesh === data.markersMed) {
                        const medEvents = eventsRef.current.filter(e => e.dotColor === 'orange' || (!e.dotColor && e.severity === 'medium'));
                        if (medEvents[instanceId]) {
                            router.push(`/event/${medEvents[instanceId].slug}`);
                            return;
                        }
                    } else if (mesh === data.markersLow) {
                        const lowEvents = eventsRef.current.filter(e => e.dotColor === 'green' || e.dotColor === 'blue' || (!e.dotColor && e.severity === 'low'));
                        if (lowEvents[instanceId]) {
                            router.push(`/event/${lowEvents[instanceId].slug}`);
                            return;
                        }
                    }
                }
            }
        };

        container.addEventListener('click', onClick);

        // Animation
        const animate = () => {
            const data = sceneDataRef.current;
            if (!data) return;
            data.animFrame = requestAnimationFrame(animate);
            data.controls.autoRotate = !pausedRef.current;
            data.controls.update();

            // Blinking logic
            const time = Date.now() * 0.004;
            const scaleBase = 1.0;
            const scalePulse = Math.sin(time) * 0.4;
            const finalScale = scaleBase + scalePulse;

            const matrix = new THREE.Matrix4();
            const position = new THREE.Vector3();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();

            data.blinkingIndices.forEach(({ meshType, index }) => {
                const mesh = meshType === 'high' ? data.markersHigh :
                    meshType === 'med' ? data.markersMed : data.markersLow;

                if (mesh) {
                    mesh.getMatrixAt(index, matrix);
                    matrix.decompose(position, quaternion, scale);

                    matrix.compose(position, quaternion, new THREE.Vector3(finalScale, finalScale, finalScale));
                    mesh.setMatrixAt(index, matrix);
                    mesh.instanceMatrix.needsUpdate = true;
                }
            });

            data.renderer.render(data.scene, data.camera);
        };
        animate();

        const onResize = () => {
            const d = sceneDataRef.current;
            if (!d) return;
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            d.camera.aspect = w / h;
            d.camera.updateProjectionMatrix();
            d.renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        return () => {
            const d = sceneDataRef.current;
            if (d) {
                cancelAnimationFrame(d.animFrame);
                d.renderer.dispose();
                if (container.contains(d.renderer.domElement)) {
                    container.removeChild(d.renderer.domElement);
                }
            }
            container.removeEventListener('click', onClick);
            window.removeEventListener('resize', onResize);
            sceneDataRef.current = null;
        };
    }, [focusOn, router]);

    // State for tooltip
    const [hoveredEvent, setHoveredEvent] = useState<{ x: number, y: number, event: EventDot } | null>(null);

    // Cluster events for globe view (grid size 5 degrees for world view)
    const clusteredEvents = useMemo(() => {
        return clusterEvents(events as any, 5);
    }, [events]);

    // Update Markers
    useEffect(() => {
        if (!mounted || !sceneDataRef.current) return;
        const data = sceneDataRef.current;

        // Cleanup previous markers
        [data.markersHigh, data.markersMed, data.markersLow].forEach(mesh => {
            if (mesh) {
                data.globeGroup.remove(mesh);
                mesh.geometry.dispose();
                (mesh.material as THREE.Material).dispose();
            }
        });

        if (!clusteredEvents.length) return;

        // Sorting for blinking status - Only VERIFIED (Green) clusters blink
        const greenClusters = clusteredEvents.filter(e => e.dotColor === 'green');
        const sortedClusters = [...greenClusters].sort((a, b) =>
            (b.events[0]?.timestamp ? new Date(b.events[0].timestamp).getTime() : 0) -
            (a.events[0]?.timestamp ? new Date(a.events[0].timestamp).getTime() : 0)
        );
        const newestIds = new Set(sortedClusters.map(e => e.id));
        data.blinkingIndices = [];

        // Group by dotColor (Red=Unverified, Orange=Reported, Green=Verified)
        const redClusters = clusteredEvents.filter(e => e.dotColor === 'red');
        const orangeClusters = clusteredEvents.filter(e => e.dotColor === 'orange');
        const greenClustersFinal = clusteredEvents.filter(e => e.dotColor === 'green' || e.dotColor === 'blue');

        // Base dot size - clusters get larger based on event count
        const baseDotSize = 0.003;
        const dotGeo = new THREE.SphereGeometry(baseDotSize, 8, 8);

        const createInstanced = (list: EventCluster[], color: number, type: 'high' | 'med' | 'low') => {
            if (!list.length) return null;
            const mat = new THREE.MeshBasicMaterial({ color });
            const mesh = new THREE.InstancedMesh(dotGeo, mat, list.length);
            const matrix = new THREE.Matrix4();
            const pos = new THREE.Vector3();
            const scale = new THREE.Vector3();

            list.forEach((cluster, i) => {
                const [x, y, z] = latLonToPosition(cluster.lat, cluster.lon, 1.02);
                pos.set(x, y, z);

                // Scale based on event count - clusters appear larger
                const sizeMultiplier = cluster.isCluster ? Math.min(3, 1 + Math.log2(cluster.eventCount)) : 1;
                scale.set(sizeMultiplier, sizeMultiplier, sizeMultiplier);

                matrix.identity();
                matrix.setPosition(pos);
                matrix.scale(scale);
                mesh.setMatrixAt(i, matrix);

                if (newestIds.has(cluster.id)) {
                    data.blinkingIndices.push({ meshType: type, index: i });
                }
            });
            mesh.instanceMatrix.needsUpdate = true;
            return mesh;
        };

        // Red (Unverified), Orange (Reported), Green (Verified)
        data.markersHigh = createInstanced(redClusters, 0xef4444, 'high');    // Red
        data.markersMed = createInstanced(orangeClusters, 0xf97316, 'med');  // Orange
        data.markersLow = createInstanced(greenClustersFinal, 0x22c55e, 'low');    // Green

        // Render order: Red first (bottom), then Orange, then Green (top)
        // This ensures Verified (Green) are always visible on top
        if (data.markersHigh) data.globeGroup.add(data.markersHigh); // Red - bottom
        if (data.markersMed) data.globeGroup.add(data.markersMed);  // Orange - middle
        if (data.markersLow) data.globeGroup.add(data.markersLow);   // Green - TOP
    }, [clusteredEvents, mounted]);

    // Handle Mouse Move for Tooltips
    useEffect(() => {
        if (!mounted || !sceneDataRef.current) return;
        const container = containerRef.current;
        if (!container) return;

        const onMouseMove = (event: MouseEvent) => {
            const data = sceneDataRef.current;
            if (!data) return;

            const rect = container.getBoundingClientRect();
            // Calculate mouse position in normalized device coordinates
            // (-1 to +1) for both components
            data.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            data.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            data.raycaster.setFromCamera(data.mouse, data.camera);

            const meshes = [data.markersHigh, data.markersMed, data.markersLow].filter(Boolean) as THREE.InstancedMesh[];
            let found = false;

            for (const mesh of meshes) {
                const intersects = data.raycaster.intersectObject(mesh);
                if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
                    const instanceId = intersects[0].instanceId;
                    let list: EventDot[] = [];

                    // Identify which list this mesh corresponds to
                    // Note: This relies on the recreation logic order, which is consistent
                    if (mesh === data.markersHigh) {
                        list = events.filter(e => e.dotColor === 'red' || (!e.dotColor && e.severity === 'high'));
                    } else if (mesh === data.markersMed) {
                        list = events.filter(e => e.dotColor === 'orange' || (!e.dotColor && e.severity === 'medium'));
                    } else if (mesh === data.markersLow) {
                        list = events.filter(e => e.dotColor === 'green' || e.dotColor === 'blue' || (!e.dotColor && e.severity === 'low'));
                    }

                    if (list[instanceId]) {
                        setHoveredEvent({
                            x: event.clientX,
                            y: event.clientY,
                            event: list[instanceId]
                        });
                        found = true;
                        container.style.cursor = 'pointer';
                        break;
                    }
                }
            }

            if (!found) {
                setHoveredEvent(null);
                container.style.cursor = 'grab';
            }
        };

        container.addEventListener('mousemove', onMouseMove);
        return () => container.removeEventListener('mousemove', onMouseMove);
    }, [mounted, events]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                background: '#050508',
                cursor: 'grab',
            }}
        >
            {/* Tooltip Portal could be used, but absolute div works for simple case */}
            {hoveredEvent && (
                <div
                    style={{
                        position: 'fixed',
                        left: hoveredEvent.x + 15,
                        top: hoveredEvent.y + 15,
                        zIndex: 1000,
                        pointerEvents: 'none',
                        minWidth: '180px',
                        maxWidth: '280px'
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)'
                    }}>
                        {/* Status Badge */}
                        <div style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px',
                            background: hoveredEvent.event.dotColor === 'green'
                                ? 'rgba(34, 197, 94, 0.2)'
                                : hoveredEvent.event.dotColor === 'orange'
                                    ? 'rgba(249, 115, 22, 0.2)'
                                    : 'rgba(239, 68, 68, 0.2)',
                            color: hoveredEvent.event.dotColor === 'green'
                                ? '#22c55e'
                                : hoveredEvent.event.dotColor === 'orange'
                                    ? '#f97316'
                                    : '#ef4444',
                            border: `1px solid ${hoveredEvent.event.dotColor === 'green'
                                ? 'rgba(34, 197, 94, 0.3)'
                                : hoveredEvent.event.dotColor === 'orange'
                                    ? 'rgba(249, 115, 22, 0.3)'
                                    : 'rgba(239, 68, 68, 0.3)'
                                }`
                        }}>
                            {hoveredEvent.event.dotColor === 'green' ? 'Verified' :
                                hoveredEvent.event.dotColor === 'orange' ? 'Reported' : 'Unverified'}
                        </div>

                        {/* Title */}
                        <p style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#f1f5f9',
                            lineHeight: 1.4,
                            margin: 0,
                            marginTop: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {hoveredEvent.event.title}
                        </p>

                        {/* Timestamp */}
                        <p style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            marginTop: '6px',
                            marginBottom: 0
                        }} suppressHydrationWarning>
                            {new Date(hoveredEvent.event.timestamp).toLocaleString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
