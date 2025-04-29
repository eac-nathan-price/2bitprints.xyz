import { Injectable } from '@angular/core';

export interface PrintImage {
  url: string;
  title: string;
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
      tags: ['amiga', 'retro', 'functional', 'electronics'],
    },
    {
      url: '/images/badtz-maru-keychains.jpg',
      title: 'Badtz-Maru Keychains',
      tags: ['sanrio', 'keychain', 'mini', 'cute'],
    },
    {
      url: '/images/bear.jpg',
      title: 'Bear',
      tags: ['PLA', 'white', 'mini']
    }, {
      url: '/images/car-assembled.jpg',
      title: 'Car Assembled',
      tags: ['PLA', 'grey', 'model']
    }, {
      url: '/images/car-parts.jpg',
      title: 'Car Parts',
      tags: ['PLA', 'grey', 'model']
    }, {
      url: '/images/cars-planes.jpg',
      title: 'Cars and Planes',
      tags: ['PLA', 'multi-color', 'red', 'blue', 'light-grey', 'black']
    }, {
      url: '/images/color-keychains.jpg',
      title: 'Color Keychains',
      tags: ['PLA', 'multi-color', 'keychain', 'Marvel', 'One Piece', 'Star Wars', 'stormtrooper', 'spiderman']
    },{
      url: '/images/colorful-keychains.jpg',
      title: 'Colorful Keychains',
      tags: ['PLA', 'multi-color', 'keychain', 'Marvel', 'One Piece', 'Star Wars', 'Hello Kitty', 'Sanrio', 'Horror', 'stormtrooper', 'deadpool', 'wolverine', 'groot', 'captain america', 'knife']
    }, {
      url: '/images/console-case.jpg',
      title: 'Handheld Console Case',
      tags: ['PLA', 'multi-color', 'case', 'functional', 'purple', 'lime-green', 'white', 'black']
    }
  ];

  public readonly filters = [
    'PLA',
    'PETG',
    'multi-color',
    'keychain',
    'mini',
    'model',
    'functional'
  ];

  getImages(): Promise<PrintImage[]> {
    return Promise.resolve(this.images);
  }

  getImagesByTag(tag: string): Promise<PrintImage[]> {
    return Promise.resolve(this.images.filter(image => image.tags.includes(tag)));
  }

  getFilterTags(): string[] {
    return this.filters;
  }
}
