import { Component, OnInit, OnDestroy, ElementRef, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class LogoComponent implements OnInit, OnDestroy {
  private isBrowser: boolean;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private cube!: THREE.Group;
  private animationFrameId: number | null = null;
  private isHovered: boolean = false;
  private animationProgress: number = 0;
  private animationSpeed: number = 0.05;

  // Cube dimensions
  private readonly cubeSize: number = 1.2;
  private readonly containerSize: number = 120;

  constructor(
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.initThreeJS();
      this.animate();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThreeJS(): void {
    const container = this.elementRef.nativeElement.querySelector('.logo-container');
    if (!container) return;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent background

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.containerSize / this.containerSize,
      0.1,
      1000
    );
    this.camera.position.set(2.5, 2, 2.5);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.containerSize, this.containerSize);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Add renderer to container
    container.appendChild(this.renderer.domElement);

    // Add event listeners
    this.renderer.domElement.addEventListener('mouseenter', () => this.onMouseEnter());
    this.renderer.domElement.addEventListener('mouseleave', () => this.onMouseLeave());

    // Create cube
    this.createCube();

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  private createCube(): void {
    this.cube = new THREE.Group();

    // Create materials for each face
    const redMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.9,
      side: THREE.FrontSide
    });

    const greenMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.9,
      side: THREE.FrontSide
    });

    const blueMaterial = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0.9,
      side: THREE.FrontSide
    });

    // Create the three faces with gaps like the favicon
    const redFace = new THREE.Mesh(
      new THREE.PlaneGeometry(this.cubeSize, this.cubeSize),
      redMaterial
    );
    redFace.position.set(0, this.cubeSize / 2 + 0.3, 0);
    redFace.rotation.x = -Math.PI / 2; // Top face

    const greenFace = new THREE.Mesh(
      new THREE.PlaneGeometry(this.cubeSize, this.cubeSize),
      greenMaterial
    );
    greenFace.position.set(0, 0, this.cubeSize / 2 + 0.3); // Front face

    const blueFace = new THREE.Mesh(
      new THREE.PlaneGeometry(this.cubeSize, this.cubeSize),
      blueMaterial
    );
    blueFace.position.set(this.cubeSize / 2 + 0.3, 0, 0);
    blueFace.rotation.y = Math.PI / 2; // Right face

    // Add faces to cube group
    this.cube.add(redFace);
    this.cube.add(greenFace);
    this.cube.add(blueFace);

    // Set rotation to match favicon perspective (isometric view)
    this.cube.rotation.set(-Math.PI / 6, Math.PI / 4, 0);

    this.scene.add(this.cube);
  }

  private onMouseEnter(): void {
    this.isHovered = true;
  }

  private onMouseLeave(): void {
    this.isHovered = false;
  }

  private animate(): void {
    if (this.isHovered && this.animationProgress < 1) {
      this.animationProgress += this.animationSpeed;
    } else if (!this.isHovered && this.animationProgress > 0) {
      this.animationProgress -= this.animationSpeed;
    }

    this.animationProgress = Math.max(0, Math.min(1, this.animationProgress));
    this.updateCubeAnimation();
    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  private updateCubeAnimation(): void {
    if (!this.cube) return;

    // Calculate animation offset
    const offset = this.animationProgress * 0.3; // 0.3 units movement to close gaps

    // Update face positions to create intersection effect
    const redFace = this.cube.children[0] as THREE.Mesh;
    const greenFace = this.cube.children[1] as THREE.Mesh;
    const blueFace = this.cube.children[2] as THREE.Mesh;

    // Move faces inward on hover to close the gaps
    redFace.position.y = this.cubeSize / 2 + 0.3 - offset;
    greenFace.position.z = this.cubeSize / 2 + 0.3 - offset;
    blueFace.position.x = this.cubeSize / 2 + 0.3 - offset;
  }
}
