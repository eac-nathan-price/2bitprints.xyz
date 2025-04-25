import { Component } from '@angular/core';
import { GalleryComponent } from './gallery/gallery.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [GalleryComponent],
    standalone: true
})
export class AppComponent {
  title = '2bitprints.xyz';
}
