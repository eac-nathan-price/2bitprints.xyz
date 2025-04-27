import { Injectable } from '@angular/core';

export interface PrintImage {
  url: string;
  title: string;
  description: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  private images: PrintImage[] = [
    // Add your 3D print images here
    // Example:
    // {
    //   url: '/images/print1.jpg',
    //   title: 'My First Print',
    //   description: 'A beautiful 3D printed object',
    //   tags: ['PLA', 'functional', 'vase']
    // }
  ];

  getImages(): Promise<PrintImage[]> {
    return Promise.resolve(this.images);
  }

  addImage(image: PrintImage): void {
    this.images.push(image);
  }

  getImagesByTag(tag: string): Promise<PrintImage[]> {
    return Promise.resolve(this.images.filter(image => image.tags.includes(tag)));
  }

  getAllTags(): string[] {
    const allTags = new Set<string>();
    this.images.forEach(image => {
      image.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags);
  }
}
