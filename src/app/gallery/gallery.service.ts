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
      tags: ['PLA', 'multi-color', 'keychain', 'black', 'white', 'yellow', 'red']
    }, {
      url: '/images/bear.jpg',
      title: 'Bear',
      description: '',
      tags: ['PLA', 'white', 'mini']
    }, {
      url: '/images/car-assembled.jpg',
      title: 'Car Assembled',
      description: '',
      tags: ['PLA', 'grey', 'model']
    }, {
      url: '/images/car-parts.jpg',
      title: 'Car Parts',
      description: '',
      tags: ['PLA', 'grey', 'model']
    }, {
      url: '/images/cars-planes.jpg',
      title: 'Cars and Planes',
      description: '',
      tags: ['PLA', 'multi-color', 'red', 'blue', 'light-grey', 'black']
    }, {
      url: '/images/color-keychains.jpg',
      title: 'Color Keychains',
      description: '',
      tags: ['PLA', 'multi-color', 'keychain', 'Marvel', 'One Piece', 'Star Wars', 'stormtrooper', 'spiderman']
    },{
      url: '/images/colorful-keychains.jpg',
      title: 'Colorful Keychains',
      description: '',
      tags: ['PLA', 'multi-color', 'keychain', 'Marvel', 'One Piece', 'Star Wars', 'Hello Kitty', 'Sanrio', 'Horror', 'stormtrooper', 'deadpool', 'wolverine', 'groot', 'captain america', 'knife']
    }, {
      url: '/images/console-case.jpg',
      title: 'Handheld Console Case',
      description: '',
      tags: ['PLA', 'multi-color', 'case', 'functional', 'purple', 'lime-green', 'white', 'black']
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
