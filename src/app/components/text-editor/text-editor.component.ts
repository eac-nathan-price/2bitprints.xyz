import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Theme } from '../../services/themes.service';
import { Product, ProductsService } from '../../services/products.service';
import { ThemesService } from '../../services/themes.service';
import { ThemeGridComponent } from '../theme-grid/theme-grid.component';
import { ThreeSceneComponent } from '../three-scene/three-scene.component';

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss'],
  standalone: true,
  imports: [CommonModule, ThemeGridComponent, ThreeSceneComponent],
  providers: [ProductsService, ThemesService]
})
export class TextEditorComponent implements OnInit {
  // Text and font state
  text: string = 'Your Name';
  selectedFont: string = 'Federation_Regular.json';
  
  // Theme and color state
  selectedTheme: Theme | null = null;
  selectedProduct: Product | null = null;
  
  // Control whether to apply additional scaling beyond initial font size
  scaleText: boolean = false;
  
  // Color override states - these will override theme colors
  textColor: number = 0x0077ff; // Default blue
  backgroundColor: number = 0x000000; // Default black

  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private productsService: ProductsService,
    private themesService: ThemesService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    // Initialize with TNG Title theme
    const tngTheme = this.themesService.getThemes().find(t => t.name === "TNG Title");
    if (tngTheme) {
      this.applyTheme(tngTheme);
    }
    
    // Initialize with Keychain product
    const keychainProduct = this.productsService.getProducts().find(p => p.name === "Keychain");
    if (keychainProduct) {
      this.applyProduct(keychainProduct);
    }
  }

  // Apply theme when selected
  applyTheme(theme: Theme) {
    this.selectedFont = theme.font;
    this.selectedTheme = theme;
    // Update color overrides to match theme colors
    this.textColor = theme.color;
    this.backgroundColor = theme.background;
  }

  // Apply product when selected
  applyProduct(product: Product) {
    this.selectedProduct = product;
  }

  // Handle product selection change
  onProductChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const productName = target.value;
    if (productName) {
      const product = this.products.find(p => p.name === productName);
      if (product) {
        this.applyProduct(product);
      }
    }
  }

  // Get products for dropdown
  get products(): Product[] {
    return this.productsService.getProducts();
  }

  // Get themes for grid
  get themes(): Theme[] {
    return this.themesService.getThemes();
  }

  // Export scene to 3MF (placeholder for now)
  export3MF() {
    // TODO: Implement 3MF export functionality
    console.log('3MF export not yet implemented');
  }

  // Check if debug mode is enabled via query parameter
  isDebugMode(): boolean {
    if (!this.isBrowser) return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('debug') === 'true';
  }
}
