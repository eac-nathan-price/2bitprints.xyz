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
  public isLoading: boolean = true;
  
  public filterTags: string[] = [];
  public selectedTag: string = '';
  public isFiltering: boolean = false;
  public titleColor: string = 'hsl(180, 75%, 75%)';
  private currentHue: number = 180;
  public rotationX: number = 0;
  public rotationY: number = 0;
  private cubeSpacing: any;
  private textureCache: Map<string, THREE.Texture> = new Map();
  private spawnQueue: { image: PrintImage, spawnIndex: number }[] = [];
  private isSpawning: boolean = false;
  private lastSpawnTime: number = 0;

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
      await this.startLoadingAndSpawning();
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

  private async startLoadingAndSpawning(): Promise<void> {
    const images = await this.galleryService.getImages();
    console.log('Starting to load', images.length, 'images');
    
    // Randomize the order of images
    const shuffledImages = [...images].sort(() => Math.random() - 0.5);
    
    let loadedImages = 0;
    const totalImages = shuffledImages.length;
    
    // Start loading all images and queue spawns as they load
    shuffledImages.forEach((image, index) => {
      if (!this.textureCache.has(image.url)) {
        const loader = new THREE.TextureLoader();
        loader.load(
          image.url,
          (texture) => {
            const now = performance.now();
            const timeSinceLastSpawn = this.lastSpawnTime ? now - this.lastSpawnTime : 0;
            console.log(`Image loaded: ${image.url} (${timeSinceLastSpawn.toFixed(1)}ms since last spawn)`);
            texture.colorSpace = THREE.SRGBColorSpace;
            this.textureCache.set(image.url, texture);
            
            loadedImages++;
            
            // If this is the first image to load, spawn it immediately
            if (this.isLoading) {
              console.log('First image loaded, spawning immediately');
              this.isLoading = false;
              this.lastSpawnTime = now;
              this.createCube(image, index).catch(error => {
                console.error('Error spawning first cube:', error);
              });
            } else {
              // Add to spawn queue for subsequent images
              this.spawnQueue.push({ image, spawnIndex: index });
              console.log(`Added to queue, current queue length: ${this.spawnQueue.length} (${timeSinceLastSpawn.toFixed(1)}ms since last spawn)`);
              
              // Check if we can spawn the next cube
              if (timeSinceLastSpawn >= 100) {
                this.processSpawnQueue();
              }
            }
            
            // If all images are loaded, start continuous spawning
            if (loadedImages === totalImages) {
              console.log('All images loaded, starting continuous spawning');
              this.continueSpawning();
            }
          },
          undefined,
          (error) => {
            console.error('Error loading image:', image.url, error);
            loadedImages++; // Count failed loads to ensure we don't get stuck
            if (loadedImages === totalImages) {
              this.continueSpawning();
            }
          }
        );
      } else {
        const now = performance.now();
        const timeSinceLastSpawn = this.lastSpawnTime ? now - this.lastSpawnTime : 0;
        
        loadedImages++;
        
        // If texture is already cached
        if (this.isLoading) {
          // If this is the first cached image, spawn it immediately
          console.log(`First cached image found, spawning immediately (${timeSinceLastSpawn.toFixed(1)}ms since last spawn)`);
          this.isLoading = false;
          this.lastSpawnTime = now;
          this.createCube(image, index).catch(error => {
            console.error('Error spawning first cube:', error);
          });
        } else {
          // Add to spawn queue for subsequent cached images
          this.spawnQueue.push({ image, spawnIndex: index });
          console.log(`Added cached image to queue, current queue length: ${this.spawnQueue.length} (${timeSinceLastSpawn.toFixed(1)}ms since last spawn)`);
          
          // Check if we can spawn the next cube
          if (timeSinceLastSpawn >= 100) {
            this.processSpawnQueue();
          }
        }
        
        // If all images are loaded, start continuous spawning
        if (loadedImages === totalImages) {
          console.log('All images loaded, starting continuous spawning');
          this.continueSpawning();
        }
      }
    });
  }

  private continueSpawning(): void {
    if (this.spawnQueue.length === 0) {
      console.log('Spawn queue is empty');
      return;
    }
    
    const now = performance.now();
    const timeSinceLastSpawn = this.lastSpawnTime ? now - this.lastSpawnTime : 0;
    
    if (timeSinceLastSpawn >= 100) {
      this.processSpawnQueue();
    }
    
    // Schedule next check
    setTimeout(() => this.continueSpawning(), 100);
  }

  private processSpawnQueue(): void {
    if (this.isSpawning || this.spawnQueue.length === 0) return;
    
    const now = performance.now();
    const timeSinceLastSpawn = this.lastSpawnTime ? now - this.lastSpawnTime : 0;
    
    // Only spawn if it's been at least 100ms since last spawn
    if (timeSinceLastSpawn < 100) return;
    
    this.isSpawning = true;
    const { image, spawnIndex } = this.spawnQueue.shift()!;
    console.log(`Processing spawn for image: ${image.url}, queue length: ${this.spawnQueue.length} (${timeSinceLastSpawn.toFixed(1)}ms since last spawn)`);
    
    this.createCube(image, spawnIndex).finally(() => {
      this.isSpawning = false;
      this.lastSpawnTime = now;
    });
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

    console.log('Starting to process', filteredImages.length, 'images');

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

    console.log('Queueing', imagesToAdd.length, 'new cubes');

    // Clear existing spawn queue
    this.spawnQueue = [];

    // Add cubes to spawn queue
    imagesToAdd.forEach((image, index) => {
      this.spawnQueue.push({ image, spawnIndex: index });
    });

    // Start continuous spawning process
    this.continueSpawning();
  }

  private async createCube(image: PrintImage, spawnIndex: number): Promise<void> {
    if (!this.isBrowser) return;

    const {
      wallWidth,
      wallDepth,
      wallHeight,
      totalCubeSize,
      cubesPerColumn,
      cubesPerLayer
    } = this.cubeSpacing;

    // Get texture from cache or create new one
    let texture = this.textureCache.get(image.url);
    if (!texture) {
      console.log('Texture not found in cache, loading:', image.url);
      texture = await new Promise<THREE.Texture>((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.load(
          image.url,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            this.textureCache.set(image.url, texture);
            resolve(texture);
          },
          undefined,
          (error) => {
            console.error('Error loading image:', image.url, error);
            reject(error);
          }
        );
      });
    }
      
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
    
    // Find a safe spawn position
    const baseSpawnHeight = wallHeight - 25; // Base spawn height for first cube
    const minSpawnHeight = 25; // Minimum height to ensure cubes aren't visible when spawning
    const safetyMargin = 2.5; // Half of cube size plus some margin
    
    let position = new THREE.Vector3(0, baseSpawnHeight, 0); // Initialize with base position
    let attempts = 0;
    const maxAttempts = 20; // Increased attempts to find a good position
    
    do {
      // Try different positions within the wall boundaries, ensuring we stay inside the walls
      const startX = -wallWidth/2 + totalCubeSize;
      const endX = wallWidth/2 - totalCubeSize;
      const startZ = -wallDepth/2 + totalCubeSize;
      const endZ = wallDepth/2 - totalCubeSize;
      
      // Find the lowest possible height that doesn't collide
      let spawnHeight = baseSpawnHeight;
      let foundHeight = false;
      
      while (!foundHeight && spawnHeight >= minSpawnHeight) {
        position.set(
          startX + (Math.random() * (endX - startX)),
          spawnHeight,
          startZ + (Math.random() * (endZ - startZ))
        );
        
        if (!this.isPositionOccupied(position)) {
          foundHeight = true;
        } else {
          spawnHeight -= 0.5; // Try a bit lower
        }
      }
      
      attempts++;
      
      // If we've tried too many times, just use the base height
      if (attempts >= maxAttempts) {
        position.set(
          startX + (Math.random() * (endX - startX)),
          Math.max(baseSpawnHeight, minSpawnHeight),
          startZ + (Math.random() * (endZ - startZ))
        );
        break;
      }
      
    } while (this.isPositionOccupied(position));
    
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

    // Add initial velocity
    body.velocity.set(
      (Math.random() - 0.5) * 2,
      -(5 + Math.random() * 3),
      (Math.random() - 0.5) * 2
    );
    
    // Add random angular velocity
    body.angularVelocity.set(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );

    this.world.addBody(body);
    this.scene.add(mesh);
    this.cubes.push({ mesh, body, image });

    console.log('Cube spawned for image:', image.url, 'at height:', position.y);
  }

  private isPositionOccupied(position: THREE.Vector3): boolean {
    const safetyMargin = 2.5; // Half of cube size plus some margin
    return this.cubes.some(cube => {
      const cubePos = cube.body.position;
      return Math.abs(cubePos.x - position.x) < safetyMargin &&
             Math.abs(cubePos.y - position.y) < safetyMargin &&
             Math.abs(cubePos.z - position.z) < safetyMargin;
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
    
    // Scale the acceleration to reasonable values and reverse the direction
    const scale = 0.2; // Reduced from 0.5 to make the effect less dramatic
    const acceleration = new THREE.Vector3(
      -(x || 0) * scale, // Reverse X direction
      -(y || 0) * scale, // Reverse Y direction
      -(z || 0) * scale  // Reverse Z direction
    );

    // Apply acceleration to all cubes
    this.cubes.forEach(cube => {
      // Add acceleration to velocity
      cube.body.velocity.x += acceleration.x;
      cube.body.velocity.y += acceleration.y;
      cube.body.velocity.z += acceleration.z;
      
      // Add some rotation based on acceleration (also reversed)
      cube.body.angularVelocity.x += -acceleration.x * 0.5;
      cube.body.angularVelocity.y += -acceleration.y * 0.5;
      cube.body.angularVelocity.z += -acceleration.z * 0.5;
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

  public respawnCubes(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!this.isBrowser || !this.cubes.length) return;

    // Get current cube positions and shuffle them
    const currentCubes = [...this.cubes];
    const shuffledCubes = currentCubes.sort(() => Math.random() - 0.5);
    
    // Calculate spawn height
    const spawnHeight = this.cubeSpacing.wallHeight - 10;
    
    // Respawn each cube with a delay
    shuffledCubes.forEach((cube, index) => {
      setTimeout(() => {
        // Remove from scene and world
        this.scene.remove(cube.mesh);
        this.world.removeBody(cube.body);
        
        // Create new cube at random position
        const startX = -this.cubeSpacing.wallWidth/2 + this.cubeSpacing.totalCubeSize/2;
        const startZ = -this.cubeSpacing.wallDepth/2 + this.cubeSpacing.totalCubeSize/2;
        
        const position = new THREE.Vector3(
          startX + (Math.random() * (this.cubeSpacing.wallWidth - this.cubeSpacing.totalCubeSize)),
          spawnHeight,
          startZ + (Math.random() * (this.cubeSpacing.wallDepth - this.cubeSpacing.totalCubeSize))
        );
        
        cube.mesh.position.copy(position);
        cube.body.position.copy(position as any);
        
        // Add random initial rotation
        cube.mesh.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        cube.body.quaternion.setFromEuler(
          cube.mesh.rotation.x,
          cube.mesh.rotation.y,
          cube.mesh.rotation.z
        );
        
        // Add initial velocity
        cube.body.velocity.set(
          (Math.random() - 0.5) * 2,
          -(5 + Math.random() * 3),
          (Math.random() - 0.5) * 2
        );
        
        // Add random angular velocity
        cube.body.angularVelocity.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        );
        
        // Add back to scene and world
        this.scene.add(cube.mesh);
        this.world.addBody(cube.body);
      }, (index * 2000) / shuffledCubes.length); // Stagger over 2 seconds
    });
  }
}
