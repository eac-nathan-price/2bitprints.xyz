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
  private colorIntervalId: any;
  private lastWindowPosition: { x: number; y: number } = { x: 0, y: 0 };
  private windowMoveCheckInterval: any;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  public selectedImage: PrintImage | null = null;
  
  public filterTags: string[] = [];
  public selectedTag: string = '';
  public isFiltering: boolean = false;
  public titleColor: string = 'hsl(180, 75%, 75%)';
  private currentHue: number = 180;
  public rotationX: number = 0;
  public rotationY: number = 0;
  private cubeSpacing: any;

  constructor(
    private elementRef: ElementRef,
    private galleryService: GalleryService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.lastWindowPosition = { x: window.screenX, y: window.screenY };
    }
  }

  async ngOnInit(): Promise<void> {
    if (this.isBrowser) {
      this.initScene();
      await this.initWalls();
      await this.updateFilteredCubes();
      this.animate();
      this.startColorAnimation();
      this.initMouseTracking();
    }
    this.filterTags = this.galleryService.getFilterTags();
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.colorIntervalId) {
        clearInterval(this.colorIntervalId);
      }
      if (this.windowMoveCheckInterval) {
        clearInterval(this.windowMoveCheckInterval);
      }
      if (this.renderer) {
        this.renderer.dispose();
      }
      window.removeEventListener('mousemove', this.handleMouseMove);
      window.removeEventListener('resize', this.handleWindowResize);
      window.removeEventListener('devicemotion', this.handleDeviceMotion);
      window.removeEventListener('click', this.handleClick);
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
    this.camera.position.set(0, 7, 9);
    this.camera.lookAt(0, 4, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 2.0;
    this.elementRef.nativeElement.appendChild(this.renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private async initWalls(): Promise<void> {
    if (!this.isBrowser) return;

    // Initialize physics world if not already done
    if (!this.world) {
      this.world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0)
      });
    }

    // Define cube size constants
    const cubeSize = 2;
    const cubeGap = 1.0;
    const totalCubeSize = cubeSize + cubeGap;

    // Calculate dimensions
    const wallWidth = 16;
    const wallDepth = 8;
    const cubesPerRow = Math.floor(wallWidth / totalCubeSize);
    const cubesPerColumn = Math.floor(wallDepth / totalCubeSize);
    const cubesPerLayer = cubesPerRow * cubesPerColumn;
    
    const images = await this.galleryService.getImages();
    const totalImages = images.length;
    const layersNeeded = Math.ceil(totalImages / cubesPerLayer);
    const wallHeight = Math.max(30, layersNeeded * totalCubeSize + 20);

    this.cubeSpacing = {
      wallWidth,
      wallDepth,
      wallHeight,
      cubeSize,
      cubeGap,
      totalCubeSize,
      cubesPerRow,
      cubesPerColumn,
      cubesPerLayer
    };

    const wallThickness = 0.5;
    const visualMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });

    // Create physics materials
    const wallPhysicsMaterial = new CANNON.Material({
      friction: 0.1,
      restitution: 0.2
    });

    const stepPhysicsMaterial = new CANNON.Material({
      friction: 0.1,
      restitution: 0.3
    });

    // Create walls
    const walls = [
      // Left wall
      new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, wallDepth + 2),
        visualMaterial
      ),
      // Right wall
      new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, wallDepth + 2),
        visualMaterial
      ),
      // Front wall
      new THREE.Mesh(
        new THREE.BoxGeometry(wallWidth, wallHeight, wallThickness),
        visualMaterial
      ),
      // Back wall
      new THREE.Mesh(
        new THREE.BoxGeometry(wallWidth, wallHeight, wallThickness),
        visualMaterial
      ),
      // Floor
      new THREE.Mesh(
        new THREE.BoxGeometry(wallWidth, wallThickness, wallDepth + 2),
        visualMaterial
      ),
      // Roof
      new THREE.Mesh(
        new THREE.BoxGeometry(wallWidth, wallThickness, wallDepth + 2),
        visualMaterial
      )
    ];

    // Position walls
    walls[0].position.set(-wallWidth/2 - wallThickness/2, wallHeight/2, 0);
    walls[1].position.set(wallWidth/2 + wallThickness/2, wallHeight/2, 0);
    walls[2].position.set(0, wallHeight/2, -wallDepth/2 - 1 - wallThickness/2);
    walls[3].position.set(0, wallHeight/2, wallDepth/2 + 1 + wallThickness/2);
    walls[4].position.set(0, -wallThickness/2, 0);
    walls[5].position.set(0, wallHeight + wallThickness/2, 0);

    walls.forEach(wall => this.scene.add(wall));

    // Create physics bodies for walls
    const wallShape = new CANNON.Box(new CANNON.Vec3(wallThickness/2, wallHeight/2, (wallDepth + 2)/2));
    const wallBody = new CANNON.Body({ mass: 0, material: wallPhysicsMaterial });
    wallBody.addShape(wallShape);
    wallBody.position.set(-wallWidth/2 - wallThickness/2, wallHeight/2, 0);
    this.world.addBody(wallBody);

    const rightWallBody = new CANNON.Body({ mass: 0, material: wallPhysicsMaterial });
    rightWallBody.addShape(wallShape);
    rightWallBody.position.set(wallWidth/2 + wallThickness/2, wallHeight/2, 0);
    this.world.addBody(rightWallBody);

    const frontWallBody = new CANNON.Body({ mass: 0, material: wallPhysicsMaterial });
    frontWallBody.addShape(new CANNON.Box(new CANNON.Vec3(wallWidth/2, wallHeight/2, wallThickness/2)));
    frontWallBody.position.set(0, wallHeight/2, -wallDepth/2 - 1 - wallThickness/2);
    this.world.addBody(frontWallBody);

    const backWallBody = new CANNON.Body({ mass: 0, material: wallPhysicsMaterial });
    backWallBody.addShape(new CANNON.Box(new CANNON.Vec3(wallWidth/2, wallHeight/2, wallThickness/2)));
    backWallBody.position.set(0, wallHeight/2, wallDepth/2 + 1 + wallThickness/2);
    this.world.addBody(backWallBody);

    const floorBody = new CANNON.Body({ mass: 0, material: wallPhysicsMaterial });
    floorBody.addShape(new CANNON.Box(new CANNON.Vec3(wallWidth/2, wallThickness/2, (wallDepth + 2)/2)));
    floorBody.position.set(0, -wallThickness/2, 0);
    this.world.addBody(floorBody);

    const roofBody = new CANNON.Body({ mass: 0, material: wallPhysicsMaterial });
    roofBody.addShape(new CANNON.Box(new CANNON.Vec3(wallWidth/2, wallThickness/2, (wallDepth + 2)/2)));
    roofBody.position.set(0, wallHeight + wallThickness/2, 0);
    this.world.addBody(roofBody);

    // Create staircase
    const stepWidth = cubeSize;
    const stepHeight = cubeSize;
    const stepDepth = wallDepth;

    // First step (higher step at back wall)
    const firstStepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, stepHeight * 2, stepWidth),
      visualMaterial
    );
    firstStepMesh.position.set(0, stepHeight, -wallDepth/2 + stepWidth/2);
    this.scene.add(firstStepMesh);

    const firstStepBody = new CANNON.Body({ mass: 0, material: stepPhysicsMaterial });
    firstStepBody.addShape(new CANNON.Box(new CANNON.Vec3(wallWidth/2, stepHeight, stepWidth/2)));
    firstStepBody.position.set(0, stepHeight, -wallDepth/2 + stepWidth/2);
    this.world.addBody(firstStepBody);

    // Second step (lower step in front of first step)
    const secondStepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, stepHeight, stepWidth),
      visualMaterial
    );
    secondStepMesh.position.set(0, stepHeight/2, -wallDepth/2 + stepWidth * 1.5);
    this.scene.add(secondStepMesh);

    const secondStepBody = new CANNON.Body({ mass: 0, material: stepPhysicsMaterial });
    secondStepBody.addShape(new CANNON.Box(new CANNON.Vec3(wallWidth/2, stepHeight/2, stepWidth/2)));
    secondStepBody.position.set(0, stepHeight/2, -wallDepth/2 + stepWidth * 1.5);
    this.world.addBody(secondStepBody);

    // Add walls to seal the steps
    const stepWallThickness = wallThickness;
    
    // Front wall of first step
    const firstStepFrontWallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, stepHeight * 2, stepWallThickness),
      visualMaterial
    );
    firstStepFrontWallMesh.position.set(0, stepHeight, -wallDepth/2 + stepWidth);
    this.scene.add(firstStepFrontWallMesh);

    const firstStepFrontWallBody = new CANNON.Body({ mass: 0, material: stepPhysicsMaterial });
    firstStepFrontWallBody.addShape(new CANNON.Box(new CANNON.Vec3(wallWidth/2, stepHeight, stepWallThickness/2)));
    firstStepFrontWallBody.position.set(0, stepHeight, -wallDepth/2 + stepWidth);
    this.world.addBody(firstStepFrontWallBody);

    // Front wall of second step
    const secondStepFrontWallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, stepHeight, stepWallThickness),
      visualMaterial
    );
    secondStepFrontWallMesh.position.set(0, stepHeight/2, -wallDepth/2 + stepWidth * 2);
    this.scene.add(secondStepFrontWallMesh);

    const secondStepFrontWallBody = new CANNON.Body({ mass: 0, material: stepPhysicsMaterial });
    secondStepFrontWallBody.addShape(new CANNON.Box(new CANNON.Vec3(wallWidth/2, stepHeight/2, stepWallThickness/2)));
    secondStepFrontWallBody.position.set(0, stepHeight/2, -wallDepth/2 + stepWidth * 2);
    this.world.addBody(secondStepFrontWallBody);
  }

  public onTagSelect(tag: string): void {
    this.selectedTag = tag;
    this.isFiltering = true;
    this.updateFilteredCubes();
  }

  public clearFilter(): void {
    this.selectedTag = '';
    this.isFiltering = false;
    this.updateFilteredCubes();
  }

  private async updateFilteredCubes(): Promise<void> {
    if (!this.cubeSpacing) {
      await this.initWalls();
    }

    const currentImages = this.cubes.map(cube => cube.image);
    const filteredImages = this.isFiltering 
      ? await this.galleryService.getImagesByTag(this.selectedTag)
      : await this.galleryService.getImages();

    // Remove cubes that are no longer in the filtered set
    const cubesToRemove = this.cubes.filter(cube => 
      !filteredImages.some(img => img.url === cube.image.url)
    );
    
    cubesToRemove.forEach(cube => {
      this.scene.remove(cube.mesh);
      this.world.removeBody(cube.body);
      const index = this.cubes.indexOf(cube);
      if (index > -1) {
        this.cubes.splice(index, 1);
      }
    });

    // Add new cubes that aren't already in the scene
    const imagesToAdd = filteredImages.filter(img => 
      !currentImages.some(current => current.url === img.url)
    );

    // Create cubes asynchronously as images load
    for (const image of imagesToAdd) {
      await this.createCube(image);
    }
  }

  private async createCube(image: PrintImage): Promise<void> {
    if (!this.isBrowser) return;

    const {
      wallWidth,
      wallDepth,
      wallHeight,
      totalCubeSize,
      cubesPerColumn,
      cubesPerLayer
    } = this.cubeSpacing;

    const texture = await new Promise<THREE.Texture>((resolve) => {
      new THREE.TextureLoader().load(image.url, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
      });
    });
      
    const materials = Array(6).fill(new THREE.MeshStandardMaterial({ 
      map: texture,
      toneMapped: true,
      roughness: 0.0,
      metalness: 0.0,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      color: 0xffffff
    }));

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const mesh = new THREE.Mesh(geometry, materials);
    
    const index = this.cubes.length;
    const layerIndex = Math.floor(index / cubesPerLayer);
    const positionInLayer = index % cubesPerLayer;
    const row = Math.floor(positionInLayer / cubesPerColumn);
    const column = positionInLayer % cubesPerColumn;
    
    const startX = -wallWidth/2 + totalCubeSize/2;
    const startZ = -wallDepth/2 + totalCubeSize/2;
    
    // Increase spawn height by 10 units
    const spawnHeight = wallHeight - 10;
    const position = new THREE.Vector3(
      startX + (row * totalCubeSize),
      spawnHeight - (layerIndex * totalCubeSize) - totalCubeSize/2,
      startZ + (column * totalCubeSize)
    );
    
    mesh.position.copy(position);

    // Add random initial rotation
    mesh.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    const body = new CANNON.Body({
      mass: 1,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z)
    });

    // Set initial quaternion to match mesh rotation
    body.quaternion.setFromEuler(
      mesh.rotation.x,
      mesh.rotation.y,
      mesh.rotation.z
    );

    // Increase initial downward velocity to make cubes fall faster
    body.velocity.set(
      (Math.random() - 0.5) * 2, // Increased from 0.5 to 2 for more horizontal movement
      -(5 + Math.random() * 3),
      (Math.random() - 0.5) * 2 // Increased from 0.5 to 2 for more horizontal movement
    );
    
    // Increase angular velocity for more rotation
    body.angularVelocity.set(
      (Math.random() - 0.5) * 2, // Increased from 0.5 to 2
      (Math.random() - 0.5) * 2, // Increased from 0.5 to 2
      (Math.random() - 0.5) * 2  // Increased from 0.5 to 2
    );

    this.world.addBody(body);
    this.scene.add(mesh);
    this.cubes.push({ mesh, body, image });
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

  private startColorAnimation(): void {
    this.colorIntervalId = setInterval(() => {
      // Calculate new hue (at least 60 degrees different)
      const hueChange = 60 + Math.random() * 240; // Random between 60 and 300
      this.currentHue = (this.currentHue + hueChange) % 360;
      
      // Random saturation between 70 and 80
      const saturation = 70 + Math.random() * 10;
      
      // Random lightness between 60 and 90
      const lightness = 60 + Math.random() * 30;
      
      this.titleColor = `hsl(${this.currentHue}, ${saturation}%, ${lightness}%)`;
    }, 1000);
  }

  private initMouseTracking(): void {
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('resize', this.handleWindowResize.bind(this));
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this));
    }
    window.addEventListener('click', this.handleClick.bind(this));
    
    // Start checking for window movement
    this.windowMoveCheckInterval = setInterval(() => this.checkWindowMovement(), 50);
  }

  private handleMouseMove(event: MouseEvent): void {
    // Calculate mouse position as a percentage of window size
    const xPercent = (event.clientX / window.innerWidth) * 2 - 1; // -1 to 1
    const yPercent = (event.clientY / window.innerHeight) * 2 - 1; // -1 to 1
    
    // Calculate rotation (clamped to 5 degrees)
    this.rotationY = xPercent * 5;
    this.rotationX = -yPercent * 5;
  }

  private handleWindowResize(): void {
    // When window is resized, add some random velocity to all cubes
    this.cubes.forEach(cube => {
      // Add random horizontal velocity
      cube.body.velocity.x += (Math.random() - 0.5) * 4;
      cube.body.velocity.z += (Math.random() - 0.5) * 4;
      
      // Add some upward velocity
      cube.body.velocity.y += Math.random() * 2;
      
      // Add some random rotation
      cube.body.angularVelocity.x += (Math.random() - 0.5) * 2;
      cube.body.angularVelocity.y += (Math.random() - 0.5) * 2;
      cube.body.angularVelocity.z += (Math.random() - 0.5) * 2;
    });
  }

  private handleDeviceMotion(event: DeviceMotionEvent): void {
    if (!event.accelerationIncludingGravity) return;

    const { x, y, z } = event.accelerationIncludingGravity;
    
    // Scale the acceleration to reasonable values
    const scale = 0.5;
    const acceleration = new THREE.Vector3(
      (x || 0) * scale,
      (y || 0) * scale,
      (z || 0) * scale
    );

    // Apply acceleration to all cubes
    this.cubes.forEach(cube => {
      // Add acceleration to velocity
      cube.body.velocity.x += acceleration.x;
      cube.body.velocity.y += acceleration.y;
      cube.body.velocity.z += acceleration.z;
      
      // Add some rotation based on acceleration
      cube.body.angularVelocity.x += acceleration.x * 0.5;
      cube.body.angularVelocity.y += acceleration.y * 0.5;
      cube.body.angularVelocity.z += acceleration.z * 0.5;
    });
  }

  private checkWindowMovement(): void {
    const currentX = window.screenX;
    const currentY = window.screenY;
    
    const deltaX = currentX - this.lastWindowPosition.x;
    const deltaY = currentY - this.lastWindowPosition.y;
    
    // Only apply velocity if there was significant movement
    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
      // Scale the movement to reasonable velocity values
      const scale = 0.1;
      const velocityX = deltaX * scale;
      const velocityY = deltaY * scale;
      
      // Apply velocity to all cubes
      this.cubes.forEach(cube => {
        // Add velocity in the direction of window movement
        cube.body.velocity.x += velocityX;
        cube.body.velocity.y += velocityY;
        
        // Add some rotation based on movement
        cube.body.angularVelocity.x += velocityY * 0.2;
        cube.body.angularVelocity.y += velocityX * 0.2;
      });
    }
    
    // Update last position
    this.lastWindowPosition = { x: currentX, y: currentY };
  }

  private handleClick(event: MouseEvent): void {
    if (!this.isBrowser) return;

    // Calculate mouse position in normalized device coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(
      this.cubes.map(cube => cube.mesh)
    );

    if (intersects.length > 0) {
      // Find the clicked cube
      const clickedCube = this.cubes.find(cube => cube.mesh === intersects[0].object);
      if (clickedCube) {
        this.selectedImage = clickedCube.image;
      }
    }
  }

  public closeImage(): void {
    this.selectedImage = null;
  }
}
