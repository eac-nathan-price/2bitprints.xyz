import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FontOption {
  name: string;
  value: string;
  displayName: string;
}

@Component({
  selector: 'app-trek',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trek.component.html',
  styleUrls: ['./trek.component.scss']
})
export class TrekComponent {
  userName: string = '';
  selectedFont: string = 'antonio';
  
  fonts: FontOption[] = [
    { name: 'Antonio', value: 'antonio', displayName: 'Antonio (LCARS Style)' },
    { name: 'Oswald', value: 'oswald', displayName: 'Oswald (LCARS Style)' },
    { name: 'Helvetica Ultra Compressed', value: 'helvetica-ultra-compressed', displayName: 'Helvetica Ultra Compressed' },
    { name: 'Star Trek TNG', value: 'star-trek-tng', displayName: 'Star Trek TNG' },
    { name: 'Star Trek DS9', value: 'star-trek-ds9', displayName: 'Star Trek DS9' },
    { name: 'Star Trek Voyager', value: 'star-trek-voyager', displayName: 'Star Trek Voyager' },
    { name: 'Star Trek Enterprise', value: 'star-trek-enterprise', displayName: 'Star Trek Enterprise' },
    { name: 'Star Trek Original', value: 'star-trek-original', displayName: 'Star Trek Original' }
  ];

  getPreviewStyle(): any {
    return {
      'font-family': this.getFontFamily(this.selectedFont),
      'font-size': '2rem',
      'font-weight': 'bold',
      'color': '#FF9C00',
      'text-align': 'center',
      'padding': '2rem',
      'background-color': '#000033',
      'border': '2px solid #FF9C00',
      'border-radius': '8px',
      'min-height': '120px',
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'center'
    };
  }

  private getFontFamily(fontValue: string): string {
    const fontMap: { [key: string]: string } = {
      'antonio': '"Antonio", sans-serif',
      'oswald': '"Oswald", sans-serif',
      'helvetica-ultra-compressed': '"Helvetica Ultra Compressed", sans-serif',
      'star-trek-tng': '"Star Trek TNG", monospace',
      'star-trek-ds9': '"Star Trek DS9", monospace',
      'star-trek-voyager': '"Star Trek Voyager", monospace',
      'star-trek-enterprise': '"Star Trek Enterprise", monospace',
      'star-trek-original': '"Star Trek Original", monospace'
    };
    return fontMap[fontValue] || 'monospace';
  }
}
