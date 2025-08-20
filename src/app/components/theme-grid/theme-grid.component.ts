import { Component, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Theme, ThemesService } from '../../services/themes.service';
import { Product } from '../../services/products.service';

interface ThemePreview {
  theme: Theme;
  canvas: HTMLCanvasElement;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  group: THREE.Group | null;
  textMesh: THREE.Mesh | null;
  pillMesh: THREE.Mesh | null;
  animationTime: number;
}

@Component({
  selector: 'app-theme-grid',
  templateUrl: './theme-grid.component.html',
  styleUrls: ['./theme-grid.component.scss'],
  standalone: true,
  imports: [CommonModule],
  providers: [ThemesService]
})
export class ThemeGridComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedTheme: Theme | null = null;
  @Input() selectedProduct: Product | null = null;
  @Input() userText: string = 'Your Name';
  @Output() themeSelect = new EventEmitter<Theme>();

  previews: ThemePreview[] = [];
  hoveredTheme: string | null = null;
  private animationId: number | null = null;
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private themesService: ThemesService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.initializePreviews();
    }
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.cleanupPreviews();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isBrowser && this.previews.length > 0 && this.selectedProduct) {
      if (changes['userText'] || changes['selectedProduct']) {
        this.previews.forEach((preview) => {
          if (preview.scene && preview.theme) {
            const loader = new FontLoader();
            loader.load(`/fonts/${preview.theme.font}`, (font: any) => {
              this.createPreviewMesh(preview, font);
            });
          }
        });
      }
    }
  }

  private initializePreviews() {
    if (!this.selectedProduct) {
      console.warn('No selected product, skipping preview initialization');
      return;
    }

    console.log('Initializing previews for product:', this.selectedProduct.name);
    const themes = this.themesService.getThemes();
    console.log('Available themes:', themes.length);

    // Create preview objects for each theme
    this.previews = themes.map((theme, index) => ({
      theme,
      canvas: document.createElement('canvas'),
      scene: null,
      camera: null,
      renderer: null,
      group: null,
      textMesh: null,
      pillMesh: null,
      animationTime: 0
    }));

    console.log('Created preview objects:', this.previews.length);

    // Initialize 3D scenes for each preview after a brief delay to ensure DOM is ready
    setTimeout(() => {
      console.log('Starting scene initialization...');
      this.previews.forEach((preview, index) => {
        this.initializePreviewScene(preview, index);
      });

      // Start animation loop
      this.startAnimation();
    }, 500); // Increased delay to ensure DOM is ready
  }

  private initializePreviewScene(preview: ThemePreview, index: number) {
    if (!this.selectedProduct) return;

    console.log(`Initializing scene for theme ${index}: ${preview.theme.name}`);

    // Find the canvas container for this preview
    const canvasContainer = document.querySelector(`[data-theme-index="${index}"]`) as HTMLElement;
    if (!canvasContainer) {
      console.warn(`Canvas container not found for index ${index}`);
      console.log('Available containers:', document.querySelectorAll('[data-theme-index]'));
      return;
    }

    console.log(`Found container for theme ${index}:`, canvasContainer);

    const canvas = preview.canvas;
    canvas.width = 200;
    canvas.height = 150;
    canvas.style.width = '200px';
    canvas.style.height = '150px';
    canvas.style.borderRadius = '8px';
    canvas.style.border = '2px solid #1a252f';

    // Append the canvas to the container
    canvasContainer.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true, 
      alpha: true 
    });

    renderer.setSize(200, 150);
    renderer.setClearColor(0x000000, 0);

    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(50, 100, 50);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // Create a group to hold both text and pill
    const group = new THREE.Group();
    scene.add(group);

    // Store references
    preview.scene = scene;
    preview.camera = camera;
    preview.renderer = renderer;
    preview.group = group;

    // Load font and create preview
    const loader = new FontLoader();
    loader.load(
      `/fonts/${preview.theme.font}`, 
      (font: any) => {
        console.log(`Font loaded for theme: ${preview.theme.name}`);
        this.createPreviewMesh(preview, font);
      },
      (progress: any) => {
        console.log(`Loading font for ${preview.theme.name}:`, progress);
      },
      (error: any) => {
        console.error(`Error loading font for ${preview.theme.name}:`, error);
      }
    );
  }

  private createPreviewMesh(preview: ThemePreview, font: any) {
    if (!preview.scene || !preview.group || !this.selectedProduct) return;

    // Clear existing meshes
    if (preview.textMesh) preview.group.remove(preview.textMesh);
    if (preview.pillMesh) preview.group.remove(preview.pillMesh);

    // Apply caps transformation if theme requires it
    const displayText = preview.theme.caps ? this.userText.toUpperCase() : this.userText;

    // Create text geometry
    const textGeo = new TextGeometry(displayText, {
      font,
      size: 8, // Fixed size for preview
      depth: this.selectedProduct.text.thickness + this.selectedProduct.text.overlap,
      curveSegments: 8,
      bevelEnabled: false,
    });

    textGeo.computeBoundingBox();
    textGeo.center();

    // Create text material with theme colors
    const textMat = new THREE.MeshPhongMaterial({ 
      color: preview.theme.color,
      name: 'TextMaterial'
    });

    const textMesh = new THREE.Mesh(textGeo, textMat);
    preview.textMesh = textMesh;
    preview.group.add(textMesh);

    // Create pill background
    if (textGeo.boundingBox) {
      const { min, max } = textGeo.boundingBox;
      const textWidth = max.x - min.x;
      const textHeight = max.y - min.y;
      const padding = this.selectedProduct.background.padding;
      const width = textWidth + padding * 2;
      const height = textHeight + padding * 2;
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

      const pillMat = new THREE.MeshPhongMaterial({ 
        color: preview.theme.background,
        name: 'BackgroundMaterial'
      });

      const pillMesh = new THREE.Mesh(pillGeo, pillMat);
      preview.pillMesh = pillMesh;
      preview.group.add(pillMesh);

      // Position text above pill
      const textZ = this.selectedProduct.background.thickness - this.selectedProduct.text.overlap + 
                    (this.selectedProduct.text.thickness + this.selectedProduct.text.overlap) / 2;
      textMesh.position.z = textZ;
    }

    // Render the preview
    if (preview.renderer && preview.camera) {
      preview.renderer.render(preview.scene, preview.camera);
    }
  }

  private startAnimation() {
    const animate = () => {
      this.previews.forEach(preview => {
        if (preview.scene && preview.camera && preview.renderer && preview.group) {
          
          // Update animation time
          preview.animationTime += 0.01;
          
          // Oscillate between -60 and +60 degrees using a sine wave
          const rotationAngle = Math.sin(preview.animationTime) * (Math.PI / 3);
          preview.group.rotation.y = rotationAngle;
          
          preview.renderer.render(preview.scene, preview.camera);
        }
      });
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  private cleanupPreviews() {
    this.previews.forEach(preview => {
      if (preview.renderer) {
        preview.renderer.dispose();
      }
    });
  }

  onThemeSelect(theme: Theme) {
    this.themeSelect.emit(theme);
  }

  onThemeHover(themeName: string | null) {
    this.hoveredTheme = themeName;
  }

  // Get themes from service
  get themes(): Theme[] {
    return this.themesService.getThemes();
  }
}
