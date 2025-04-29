import { Component, OnInit, ElementRef, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GalleryService, PrintImage } from './gallery.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class GalleryComponent implements OnInit, OnDestroy {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private world!: CANNON.World;
  private cubes: { mesh: THREE.Mesh; body: CANNON.Body; image: PrintImage }[] = [];
  private animationFrameId!: number;
  private isBrowser: boolean;
  
  public filterTags: string[] = [];
  public selectedTag: string = '';
  public isFiltering: boolean = false;

  constructor(
    private elementRef: ElementRef,
    private galleryService: GalleryService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.filterTags = this.galleryService.getFilterTags();
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.initScene();
      this.initPhysics();
      this.loadImages();
      this.animate();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.renderer) {
        this.renderer.dispose();
      }
    }
  }

  private initScene(): void {
    if (!this.isBrowser) return;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    this.elementRef.nativeElement.appendChild(this.renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private initPhysics(): void {
    if (!this.isBrowser) return;

    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0)
    });

    // Create ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);

    // Add ground mesh
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    this.scene.add(groundMesh);

    // Add walls to constrain the cubes
    const wallThickness = 0.5;
    const wallHeight = 10;
    const wallWidth = 6; // Width of the space (left to right)
    const wallDepth = 3.375; // Depth of the space (front to back) - 6 * (9/16)

    // Create walls
    const wallShapes = [
      new CANNON.Box(new CANNON.Vec3(wallWidth, wallHeight, wallThickness)), // back
      new CANNON.Box(new CANNON.Vec3(wallWidth, wallHeight, wallThickness)), // front
      new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, wallDepth)), // left
      new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, wallDepth))  // right
    ];

    const wallPositions = [
      new CANNON.Vec3(0, wallHeight/2, -wallDepth), // back
      new CANNON.Vec3(0, wallHeight/2, wallDepth),  // front
      new CANNON.Vec3(-wallWidth, wallHeight/2, 0), // left
      new CANNON.Vec3(wallWidth, wallHeight/2, 0)   // right
    ];

    wallShapes.forEach((shape, index) => {
      const wallBody = new CANNON.Body({
        mass: 0,
        shape: shape,
        position: wallPositions[index]
      });
      this.world.addBody(wallBody);

      // Add wall mesh
      const wallGeometry = new THREE.BoxGeometry(
        shape.halfExtents.x * 2,
        shape.halfExtents.y * 2,
        shape.halfExtents.z * 2
      );
      const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        transparent: true,
        opacity: 0.5
      });
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.position.copy(wallBody.position as any);
      this.scene.add(wallMesh);
    });
  }

  public onTagSelect(tag: string): void {
    this.selectedTag = tag;
    this.isFiltering = true;
    this.clearScene();
    this.loadImagesByTag(tag);
  }

  public clearFilter(): void {
    this.selectedTag = '';
    this.isFiltering = false;
    this.clearScene();
    this.loadImages();
  }

  private clearScene(): void {
    if (!this.isBrowser) return;

    // Remove all cubes from the scene and physics world
    this.cubes.forEach(cube => {
      this.scene.remove(cube.mesh);
      this.world.removeBody(cube.body);
    });
    this.cubes = [];
  }

  private async loadImagesByTag(tag: string): Promise<void> {
    const images = await this.galleryService.getImagesByTag(tag);
    this.createCubes(images);
  }

  private async loadImages(): Promise<void> {
    const images = await this.galleryService.getImages();
    this.createCubes(images);
  }

  private createCubes(images: PrintImage[]): void {
    if (!this.isBrowser) return;

    images.forEach((image: PrintImage, index: number) => {
      const texture = new THREE.TextureLoader().load(image.url);
      texture.colorSpace = THREE.SRGBColorSpace;
      
      const materials = [
        new THREE.MeshStandardMaterial({ 
          map: texture,
          toneMapped: true,
          roughness: 0.0,
          metalness: 0.0,
          emissive: 0x000000,
          emissiveIntensity: 0.0
        }), // right
        new THREE.MeshStandardMaterial({ 
          map: texture,
          toneMapped: true,
          roughness: 0.0,
          metalness: 0.0,
          emissive: 0x000000,
          emissiveIntensity: 0.0
        }), // left
        new THREE.MeshStandardMaterial({ 
          map: texture,
          toneMapped: true,
          roughness: 0.0,
          metalness: 0.0,
          emissive: 0x000000,
          emissiveIntensity: 0.0
        }), // top
        new THREE.MeshStandardMaterial({ 
          map: texture,
          toneMapped: true,
          roughness: 0.0,
          metalness: 0.0,
          emissive: 0x000000,
          emissiveIntensity: 0.0
        }), // bottom
        new THREE.MeshStandardMaterial({ 
          map: texture,
          toneMapped: true,
          roughness: 0.0,
          metalness: 0.0,
          emissive: 0x000000,
          emissiveIntensity: 0.0
        }), // front
        new THREE.MeshStandardMaterial({ 
          map: texture,
          toneMapped: true,
          roughness: 0.0,
          metalness: 0.0,
          emissive: 0x000000,
          emissiveIntensity: 0.0
        }), // back
      ];

      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const mesh = new THREE.Mesh(geometry, materials);
      
      // Position cubes higher up and spread out
      const row = Math.floor(index / 3);
      const col = index % 3;
      mesh.position.set(
        (col - 1) * 2.5,
        30 + row * 2.5, // Start much higher
        (Math.random() - 0.5) * 2
      );

      // Create physics body
      const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
      const body = new CANNON.Body({
        mass: 1, // Restored original mass
        shape: shape,
        position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z)
      });

      // Add random initial velocity with strong downward component
      body.velocity.set(
        (Math.random() - 0.5) * 3, // x
        -(10 + Math.random() * 10), // y (downward between 10 and 20)
        (Math.random() - 0.5) * 3  // z
      );
      
      body.angularVelocity.set(
        (Math.random() - 0.5) * 2, // x
        (Math.random() - 0.5) * 2, // y
        (Math.random() - 0.5) * 2  // z
      );

      this.world.addBody(body);
      this.scene.add(mesh);
      this.cubes.push({ mesh, body, image });
    });
  }

  private animate(): void {
    if (!this.isBrowser) return;

    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Update physics
    this.world.step(1/60);

    // Update cube positions
    this.cubes.forEach(cube => {
      cube.mesh.position.copy(cube.body.position as any);
      cube.mesh.quaternion.copy(cube.body.quaternion as any);
    });

    this.renderer.render(this.scene, this.camera);
  }
}
