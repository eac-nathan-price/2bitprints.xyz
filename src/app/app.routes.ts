import { Routes } from '@angular/router';
import { GalleryComponent } from './gallery/gallery.component';
import { TrekComponent } from './trek/trek.component';

export const routes: Routes = [
  {
    path: '',
    component: GalleryComponent,
  },
  {
    path: 'trek',
    component: TrekComponent,
  },
];
