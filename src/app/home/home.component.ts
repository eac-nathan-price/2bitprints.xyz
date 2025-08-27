import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LogoComponent } from './logo.component';
import { TextEditorComponent } from '../components/text-editor/text-editor.component';

interface CarouselImage {
  src: string;
  alt: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent, TextEditorComponent],
})
export class HomeComponent implements OnInit, OnDestroy {
  private isBrowser: boolean;
  private colorIntervalId: any;
  private carouselIntervalId: any;
  public titleColor: string = 'hsl(180, 75%, 75%)';
  private currentHue: number = 180;
  public rotationX: number = 0;
  public rotationY: number = 0;
  
  // Carousel properties
  public carouselImages: CarouselImage[] = [];
  public currentSlide: number = 0;
  public carouselOffset: number = 0;
  private readonly slideWidth: number = 300; // Width of each carousel item
  public originalImages: CarouselImage[] = []; // Store original images for infinite loop
  public isPaused: boolean = false; // Track if carousel is paused

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.startColorAnimation();
      this.initMouseTracking();
      this.initCarousel();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.colorIntervalId) {
        clearInterval(this.colorIntervalId);
      }
      if (this.carouselIntervalId) {
        clearInterval(this.carouselIntervalId);
      }
      window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    }
  }

  private initCarousel(): void {
    // Initialize images in the specified order
    this.originalImages = [
      { src: '/media/optimized/PXL_20250616_142127703.webp', alt: '3D Print Sample 1' },
      { src: '/media/optimized/PXL_20250719_055833751.webp', alt: '3D Print Sample 2' },
      { src: '/media/optimized/PXL_20250630_233919983.webp', alt: '3D Print Sample 3' },
      { src: '/media/optimized/PXL_20250825_082740395.webp', alt: '3D Print Sample 4' },
      { src: '/media/optimized/PXL_20250708_203727235.MP.webp', alt: '3D Print Sample 5' },
      { src: '/media/optimized/PXL_20250708_222213802.webp', alt: '3D Print Sample 6' },
      { src: '/media/optimized/PXL_20250813_224411311.MP.webp', alt: '3D Print Sample 7' },
      { src: '/media/optimized/PXL_20250801_155518412.webp', alt: '3D Print Sample 8' },
      { src: '/media/optimized/PXL_20250730_155518346.webp', alt: '3D Print Sample 9' },
      { src: '/media/optimized/PXL_20250725_051054564.webp', alt: '3D Print Sample 10' },
      { src: '/media/optimized/PXL_20250610_041201163.webp', alt: '3D Print Sample 11' },
      { src: '/media/optimized/PXL_20250613_004404545.MP.webp', alt: '3D Print Sample 12' },
      { src: '/media/optimized/PXL_20250621_162801843~2.webp', alt: '3D Print Sample 13' },
      { src: '/media/optimized/PXL_20250531_003143156.webp', alt: '3D Print Sample 14' },
      { src: '/media/optimized/PXL_20250611_063603131.webp', alt: '3D Print Sample 15' },
      { src: '/media/optimized/PXL_20250609_143907443.webp', alt: '3D Print Sample 16' },
      { src: '/media/optimized/PXL_20250601_225238850.MP.webp', alt: '3D Print Sample 17' },
      { src: '/media/optimized/PXL_20250601_183942594.MP.webp', alt: '3D Print Sample 18' }
    ];
    
    // Use the original images directly - no complex duplication
    this.carouselImages = [...this.originalImages];
    
    // Start at the first image
    this.currentSlide = 0;
    
    // Start auto-rotation
    this.startCarouselAutoRotation();
  }

  private startCarouselAutoRotation(): void {
    this.carouselIntervalId = setInterval(() => {
      if (!this.isPaused) {
        this.nextSlide();
      }
    }, 4000); // Change slide every 4 seconds
  }

  public pauseCarousel(): void {
    this.isPaused = true;
  }

  public resumeCarousel(): void {
    this.isPaused = false;
  }

  public nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.carouselImages.length;
    this.updateCarouselOffset();
  }

  public previousSlide(): void {
    this.currentSlide = this.currentSlide === 0 
      ? this.carouselImages.length - 1 
      : this.currentSlide - 1;
    this.updateCarouselOffset();
  }

  public goToSlide(index: number): void {
    this.currentSlide = index;
    this.updateCarouselOffset();
  }

  private updateCarouselOffset(): void {
    this.carouselOffset = -this.currentSlide * this.slideWidth;
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
  }

  private handleMouseMove(event: MouseEvent): void {
    // Calculate mouse position as a percentage of window size
    const xPercent = (event.clientX / window.innerWidth) * 2 - 1; // -1 to 1
    const yPercent = (event.clientY / window.innerHeight) * 2 - 1; // -1 to 1

    // Calculate rotation (clamped to 5 degrees)
    this.rotationY = xPercent * 5;
    this.rotationX = -yPercent * 5;
  }
}
