import { Injectable } from '@angular/core';

export interface PrintImage {
  url: string;
  title: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  private images: PrintImage[] = [
    {
      url: '/images/amiga-hdmi-mod.jpg',
      title: 'Amiga HDMI Mod',
      tags: ['PLA', 'desert-tan', 'functional', 'case'],
    },
    {
      url: '/images/badtz-keychains.jpg',
      title: 'Badtz-Maru Keychains',
      tags: [
        'PLA',
        'sanrio',
        'keychain',
        'multi-color',
        'black',
        'white',
        'yellow',
        'red',
        'design',
      ],
    },
    {
      url: '/images/bear.jpg',
      title: 'Bear',
      tags: ['PLA', 'white', 'mini'],
    },
    {
      url: '/images/car-assembled.jpg',
      title: 'Car Assembled',
      tags: ['PLA', 'grey', 'model', 'design'],
    },
    {
      url: '/images/car-parts.jpg',
      title: 'Car Parts',
      tags: ['PLA', 'grey', 'model', 'design'],
    },
    {
      url: '/images/cars-planes.jpg',
      title: 'Cars and Planes',
      tags: ['PLA', 'multi-color', 'red', 'blue', 'light-grey', 'black', 'design'],
    },
    {
      url: '/images/color-keychains.jpg',
      title: 'Color Keychains',
      tags: [
        'PLA',
        'multi-color',
        'keychain',
        'Marvel',
        'One Piece',
        'Star Wars',
        'stormtrooper',
        'spiderman',
      ],
    },
    {
      url: '/images/colorful-keychains.jpg',
      title: 'Colorful Keychains',
      tags: [
        'PLA',
        'multi-color',
        'keychain',
        'Marvel',
        'One Piece',
        'Star Wars',
        'Hello Kitty',
        'Sanrio',
        'Horror',
        'stormtrooper',
        'deadpool',
        'wolverine',
        'groot',
        'captain america',
        'knife',
      ],
    },
    {
      url: '/images/console-case.jpg',
      title: 'Handheld Console Case',
      tags: [
        'PLA',
        'multi-color',
        'case',
        'functional',
        'purple',
        'lime-green',
        'white',
        'black',
        'design',
      ],
    },
    {
      url: '/images/cubone-hairpin.jpg',
      title: 'Cubone Hairpin',
      tags: ['PLA', 'white', 'model', 'functional'],
    },
    {
      url: '/images/disneyland-map.jpg',
      title: 'Disneyland Map',
      tags: ['PLA', 'multi-color', 'model', 'white', 'black', 'cyan', 'disney', 'disneyland'],
    },
    {
      url: '/images/elephants.jpg',
      title: 'Elephant Collection',
      tags: ['PLA', 'multi-color', 'mini', 'grey', 'black', 'purple'],
    },
    {
      url: '/images/filament1.jpg',
      title: 'Filament Collection 1',
      tags: ['PLA', 'filament'],
    },
    {
      url: '/images/filament2.jpg',
      title: 'Filament Collection 2',
      tags: ['PLA', 'filament'],
    },
    {
      url: '/images/filamnet3.jpg',
      title: 'Filament Collection 3',
      tags: ['PLA', 'filament'],
    },
    {
      url: '/images/filament4.jpg',
      title: 'Filament Collection 4',
      tags: ['PLA', 'filament'],
    },
    {
      url: '/images/filament5.jpg',
      title: 'Filament Collection 5',
      tags: ['PLA', 'filament'],
    },
    {
      url: '/images/frogchairs.jpg',
      title: 'Frog Chairs',
      tags: ['PLA', 'multi-color', 'model', 'green', 'lime-green', 'magenta', 'cyan', 'design'],
    },
    {
      url: '/images/hauntedmansion-busts.jpg',
      title: 'Haunted Mansion Inverted Busts',
      tags: ['PLA', 'multi-color', 'model', 'white', 'black', 'disney', 'disneyland'],
    },
    {
      url: '/images/headphone-things.jpg',
      title: 'Headphone Accessories',
      tags: ['PLA', 'black', 'functional'],
    },
    {
      url: '/images/hellokitty-keychains.jpg',
      title: 'Hello Kitty Keychains',
      tags: [
        'PLA',
        'multi-color',
        'keychain',
        'Hello Kitty',
        'Sanrio',
        'white',
        'black',
        'red',
        'pink',
        'cyan',
      ],
    },
    {
      url: '/images/horgahn.jpg',
      title: 'Horgahn',
      tags: ['PLA', 'blue-purple', 'purple-blue', 'star trek', 'model'],
    },
    {
      url: '/images/ipod-case.jpg',
      title: 'iPod Case',
      tags: ['PETG', 'clear', 'functional', 'case', 'translucent'],
    },
    {
      url: '/images/keychains.jpg',
      title: 'Keychain Collection',
      tags: ['PLA', 'multi-color', 'keychain', 'black', 'white', 'red', 'cyan'],
    },
    {
      url: '/images/lens-holder.jpg',
      title: 'Lens Holder',
      tags: ['PLA', 'natural', 'translucent', 'functional'],
    },
    {
      url: '/images/lens-organizer.jpg',
      title: 'Lens Organizer',
      tags: ['PLA', 'black', 'natural', 'functional', 'translucent'],
    },
    {
      url: '/images/marvel-keychains.jpg',
      title: 'Marvel Keychains',
      tags: ['PLA', 'multi-color', 'keychain', 'Marvel', 'captain america', 'groot', 'sanrio'],
    },
    {
      url: '/images/more-keychains.jpg',
      title: 'More Keychains',
      tags: [
        'PLA',
        'multi-color',
        'keychain',
        'Marvel',
        'captain america',
        'groot',
        'sanrio',
        'deadpool',
        'wolverine',
      ],
    },
    {
      url: '/images/otter-keychain.jpg',
      title: 'Otter Keychain',
      tags: ['PLA', 'multi-color', 'keychain', 'white', 'black'],
    },
    {
      url: '/images/relief-sculpture.jpg',
      title: 'Relief Sculpture',
      tags: ['PLA', 'photo', 'ornament', 'light-grey', 'design'],
    },
    {
      url: '/images/snoopy.jpg',
      title: 'Snoopy',
      tags: ['PLA', 'multi-color', 'white', 'black', 'red', 'peanuts', 'mini'],
    },
    {
      url: '/images/trek-badges.jpg',
      title: 'Star Trek Badges',
      tags: ['PLA', 'multi-color', 'cosplay', 'gold', 'silver', 'black', 'star trek'],
    },
    {
      url: '/images/trek-models.jpg',
      title: 'Star Trek Models',
      tags: ['PLA', 'white', 'model', 'star trek'],
    },
    {
      url: '/images/fridge-handle.png',
      title: 'Fridge Handle',
      tags: ['design', 'functional'],
    },
    {
      url: '/images/hdmi-board.png',
      title: 'HDMI Board',
      tags: ['design', 'functional'],
    },
    {
      url: '/images/wall-organizer.jpg',
      title: 'Wall Organizer',
      tags: ['design', 'PLA', 'black', 'functional'],
    },
    {
      url: '/images/trek-pride.jpg',
      title: 'Star Trek Comm Badge',
      tags: [
        'design',
        'PLA',
        'black',
        'cosplay',
        'star trek',
        'gold',
        'red',
        'orange',
        'yellow',
        'green',
        'blue',
        'purple',
      ],
    },
    {
      url: '/images/keys.jpg',
      title: 'Keys',
      tags: ['PLA', 'model', 'red', 'green'],
    },
    {
      url: '/images/knife.jpg',
      title: 'Knife',
      tags: ['PLA', 'model', 'red', 'black', 'gold'],
    },
    {
      url: '/images/mooshroom.jpg',
      title: 'Minecraft Mooshroom',
      tags: ['PLA', 'keychain', 'red', 'black', 'white', 'grey', 'minecraft'],
    },
    {
      url: '/images/name-keychains.jpg',
      title: 'Name Keychains',
      tags: ['PLA', 'keychain', 'design', 'name', 'marvel', 'groot', 'sanrio'],
    },
    {
      url: '/images/retro-keychains.jpg',
      title: 'Retro Keychains',
      tags: [
        'PLA',
        'keychain',
        'red',
        'white',
        'black',
        'design',
        'desert-tan',
        'minecraft',
        'mario',
      ],
    },
  ];

  public readonly filters = [
    'PLA',
    'PETG',
    'multi-color',
    'keychain',
    'mini',
    'model',
    'functional',
    'filament',
    'design',
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
