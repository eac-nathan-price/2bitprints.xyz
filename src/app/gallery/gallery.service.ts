import { Injectable } from '@angular/core';

export interface PrintImage {
  url: string;
  title: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  private images: PrintImage[] = [
    // Add your 3D print images here
    // Example:
    // {
    //   url: 'assets/images/print1.jpg',
    //   title: 'My First Print',
    //   description: 'A beautiful 3D printed object'
    // }
  ];

  getImages(): Promise<PrintImage[]> {
    return Promise.resolve(this.images);
  }

  addImage(image: PrintImage): void {
    this.images.push(image);
  }
}
