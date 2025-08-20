import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Theme, ThemesService } from '../../services/themes.service';
import { Product, ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-three-scene',
  templateUrl: './three-scene.component.html',
  styleUrls: ['./three-scene.component.scss'],
  standalone: true,
  providers: [ProductsService, ThemesService]
})
export class ThreeSceneComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;
  
  @Input() text: string = 'Your Name';
  @Input() selectedTheme: Theme | null = null;
  @Input() selectedProduct: Product | null = null;
  @Input() textColor: number = 0x0077ff;
  @Input() backgroundColor: number = 0x000000;
  @Input() scaleText: boolean = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private textMesh: THREE.Mesh | null = null;
  private pillMesh: THREE.Mesh | null = null;
  private holeMesh: THREE.Mesh | null = null;
  private animationId: number | null = null;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.initScene();
    }
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initScene() {
    if (!this.rendererContainer?.nativeElement) return;

    const container = this.rendererContainer.nativeElement;
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 100, 300);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Create controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(100, 200, 100);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // Start animation loop
    this.animate();

    // Initial render
    this.updateScene();
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private updateScene() {
    if (!this.selectedProduct || !this.selectedTheme) return;

    // Clear existing meshes
    if (this.textMesh) this.scene.remove(this.textMesh);
    if (this.pillMesh) this.scene.remove(this.pillMesh);
    if (this.holeMesh) this.scene.remove(this.holeMesh);

    // Load font and create text
    const loader = new FontLoader();
    loader.load(`/fonts/${this.selectedTheme.font}`, (font: any) => {
      this.createTextMesh(font);
      this.createPillMesh();
      this.createHoleMesh();
    });
  }

  private createTextMesh(font: any) {
    if (!this.selectedProduct || !this.selectedTheme) return;

    const displayText = this.selectedTheme.caps ? this.text.toUpperCase() : this.text;
    const initialTextSize = Math.min(
      this.selectedProduct.targetSize[0] / 3, 
      this.selectedProduct.targetSize[1] / 2
    );

    const textGeo = new TextGeometry(displayText, {
      font,
      size: initialTextSize,
      depth: this.selectedProduct.text.thickness + this.selectedProduct.text.overlap,
      curveSegments: 12,
      bevelEnabled: false,
    });

    textGeo.computeBoundingBox();
    textGeo.center();
    textGeo.computeVertexNormals();
    textGeo.computeBoundingSphere();

    const textMat = new THREE.MeshPhongMaterial({ 
      color: this.textColor,
      name: 'TextMaterial'
    });

    this.textMesh = new THREE.Mesh(textGeo, textMat);
    
    // Position text above background
    const backgroundThickness = this.selectedProduct.background.thickness;
    const textThickness = this.selectedProduct.text.thickness;
    const overlap = this.selectedProduct.text.overlap;
    const totalTextDepth = textThickness + overlap;
    const textStartZ = backgroundThickness - overlap;
    const textCenterZ = textStartZ + (totalTextDepth / 2);
    this.textMesh.position.z = textCenterZ;

    this.scene.add(this.textMesh);
  }

  private createPillMesh() {
    if (!this.selectedProduct || !this.textMesh) return;

    const textGeo = this.textMesh.geometry as any;
    if (!textGeo.boundingBox) return;

    const { min, max } = textGeo.boundingBox;
    const basePadding = this.selectedProduct.background.padding;
    
    // Calculate dimensions
    let leftPadding = basePadding;
    let rightPadding = basePadding;
    const leftHole = this.selectedProduct.addOns.find(addon => addon.type === "hole" && addon.position === "left");
    
    if (leftHole) {
      leftPadding = 5;
      rightPadding = basePadding;
    }
    
    const textWidth = (max.x - min.x) * this.textMesh.scale.x;
    const textHeight = (max.y - min.y) * this.textMesh.scale.y;
    const width = textWidth + leftPadding + rightPadding;
    const height = textHeight + basePadding * 2;
    const radius = height / 2;

    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    const pillGeo = new THREE.ExtrudeGeometry(shape, {
      depth: this.selectedProduct.background.thickness,
      bevelEnabled: false,
    });

    pillGeo.computeVertexNormals();
    pillGeo.computeBoundingBox();
    pillGeo.computeBoundingSphere();

    const pillMat = new THREE.MeshPhongMaterial({ 
      color: this.backgroundColor,
      name: 'BackgroundMaterial'
    });

    this.pillMesh = new THREE.Mesh(pillGeo, pillMat);
    this.pillMesh.position.set(0, 0, 0);
    
    this.scene.add(this.pillMesh);

    // Position text correctly
    if (leftHole && this.textMesh) {
      const pillLeftEdge = -width / 2;
      const textStartX = pillLeftEdge + 5;
      const textCenterX = textStartX + (textWidth / 2);
      this.textMesh.position.x = textCenterX;
    }
  }

  private createHoleMesh() {
    if (!this.selectedProduct || !this.pillMesh) return;

    const leftHole = this.selectedProduct.addOns.find(addon => addon.type === "hole" && addon.position === "left");
    if (!leftHole) return;

    // Get pill dimensions
    const pillGeo = this.pillMesh.geometry as any;
    if (!pillGeo.boundingBox) return;

    const { min, max } = pillGeo.boundingBox;
    const width = max.x - min.x;
    const height = max.y - min.y;

    // Create hole geometry
    const holeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 16);
    const holeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x666666,
      transparent: true,
      opacity: 0.7,
      name: 'HoleMaterial'
    });

    this.holeMesh = new THREE.Mesh(holeGeometry, holeMaterial);
    
    // Position hole
    const holeX = -width / 2 + 2.5;
    const holeY = 0;
    const holeZ = 1;
    
    this.holeMesh.position.set(holeX, holeY, holeZ);
    this.holeMesh.rotation.x = Math.PI / 2;
    
    this.scene.add(this.holeMesh);
  }

  // Public method to update scene when inputs change
  ngOnChanges(changes: SimpleChanges) {
    if (this.scene) {
      this.updateScene();
    }
  }

  // Method to export 3MF (placeholder for now)
  export3MF() {
    // TODO: Implement 3MF export functionality
    console.log('3MF export not yet implemented');
  }
}
