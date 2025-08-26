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
  public isJumping: boolean = false; // Track when jumping between ends
  private readonly slideWidth: number = 300; // Width of each carousel item
  public originalImages: CarouselImage[] = []; // Store original images for infinite loop
  public readonly loopOffset: number = 5; // Number of duplicate images to add for seamless looping

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
    // Initialize original images
    this.originalImages = [
      { src: '/media/optimized/PXL_20250428_221122962.MP.webp', alt: '3D Print Sample 1' },
      { src: '/media/optimized/PXL_20250529_063442357.webp', alt: '3D Print Sample 2' },
      { src: '/media/optimized/PXL_20250601_181746146.webp', alt: '3D Print Sample 3' },
      { src: '/media/optimized/PXL_20250609_143907443.webp', alt: '3D Print Sample 4' },
      { src: '/media/optimized/PXL_20250611_063603131.webp', alt: '3D Print Sample 5' },
      { src: '/media/optimized/PXL_20250616_142127703.webp', alt: '3D Print Sample 6' },
      { src: '/media/optimized/PXL_20250621_162801843~2.webp', alt: '3D Print Sample 7' },
      { src: '/media/optimized/PXL_20250630_233919983.webp', alt: '3D Print Sample 8' },
      { src: '/media/optimized/PXL_20250708_203727235.MP.webp', alt: '3D Print Sample 9' },
      { src: '/media/optimized/PXL_20250719_055833751.webp', alt: '3D Print Sample 10' },
      { src: '/media/optimized/PXL_20250725_051054564.webp', alt: '3D Print Sample 11' },
      { src: '/media/optimized/PXL_20250730_155518346.webp', alt: '3D Print Sample 12' },
      { src: '/media/optimized/PXL_20250801_155518412.webp', alt: '3D Print Sample 13' },
      { src: '/media/optimized/PXL_20250813_224411311.MP.webp', alt: '3D Print Sample 14' },
      { src: '/media/optimized/PXL_20250825_082740395.webp', alt: '3D Print Sample 15' }
    ];
    
    // Create infinite loop by duplicating images at the beginning and end
    this.carouselImages = [
      ...this.originalImages.slice(-this.loopOffset), // Add last 5 images at the beginning
      ...this.originalImages, // Add all original images
      ...this.originalImages.slice(0, this.loopOffset) // Add first 5 images at the end
    ];
    
    // Start at the first original image (after the duplicated ones at the beginning)
    this.currentSlide = this.loopOffset;
    
    // Start auto-rotation
    this.startCarouselAutoRotation();
  }

  private startCarouselAutoRotation(): void {
    this.carouselIntervalId = setInterval(() => {
      this.nextSlide();
    }, 4000); // Change slide every 4 seconds
  }

  public nextSlide(): void {
    this.currentSlide++;
    
    // If we've reached the end of the duplicated images, jump to the beginning
    if (this.currentSlide >= this.carouselImages.length - this.loopOffset) {
      // Wait for transition to complete, then jump to the beginning
      setTimeout(() => {
        this.isJumping = true;
        this.currentSlide = this.loopOffset;
        this.updateCarouselOffset();
        // Re-enable transitions after a brief moment
        setTimeout(() => {
          this.isJumping = false;
        }, 50);
      }, 500);
    }
    
    this.updateCarouselOffset();
  }

  public previousSlide(): void {
    this.currentSlide--;
    
    // If we've reached the beginning of the duplicated images, jump to the end
    if (this.currentSlide < this.loopOffset) {
      // Wait for transition to complete, then jump to the end
      setTimeout(() => {
        this.isJumping = true;
        this.currentSlide = this.carouselImages.length - this.loopOffset - 1;
        this.updateCarouselOffset();
        // Re-enable transitions after a brief moment
        setTimeout(() => {
          this.isJumping = false;
        }, 50);
      }, 500);
    }
    
    this.updateCarouselOffset();
  }

  public goToSlide(index: number): void {
    // Adjust index to account for the duplicated images at the beginning
    this.currentSlide = index + this.loopOffset;
    this.updateCarouselOffset();
  }

  private updateCarouselOffset(): void {
    // Calculate offset based on current slide position
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
