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
    {
      url: '/images/amiga-hdmi-mod.jpg',
      title: 'Amiga HDMI Mod',
      description: '',
      tags: ['PLA', 'desert-tan', 'functional']
    }, {
      url: '/images/badtz-keychains.jpg',
      title: 'Badtz-Maru Keychains',
      description: '',
      tags: ['PLA', 'multi-color', 'keychain']
    }
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
