import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LogoComponent } from './logo.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent],
})
export class HomeComponent implements OnInit, OnDestroy {
  private isBrowser: boolean;
  private colorIntervalId: any;
  public titleColor: string = 'hsl(180, 75%, 75%)';
  private currentHue: number = 180;
  public rotationX: number = 0;
  public rotationY: number = 0;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.startColorAnimation();
      this.initMouseTracking();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.colorIntervalId) {
        clearInterval(this.colorIntervalId);
      }
      window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    }
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
