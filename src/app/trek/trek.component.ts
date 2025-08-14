import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FontOption {
  name: string;
  value: string;
  displayName: string;
  category: string;
}

interface FontStatus {
  name: string;
  loaded: boolean;
  error?: string;
}

@Component({
  selector: 'app-trek',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trek.component.html',
  styleUrls: ['./trek.component.scss'],
})
export class TrekComponent implements OnInit {
  userName: string = '';
  selectedFont: string = 'Federation';
  fontStatuses: FontStatus[] = [];

  fonts: FontOption[] = [
    // Federation & Starfleet Fonts
    { name: 'Federation', value: 'Federation', displayName: 'Federation', category: 'Federation' },
    {
      name: 'FederationWide',
      value: 'FederationWide',
      displayName: 'Federation Wide',
      category: 'Federation',
    },
    { name: 'Starfleet1', value: 'Starfleet1', displayName: 'Starfleet 1', category: 'Federation' },
    { name: 'Starfleet2', value: 'Starfleet2', displayName: 'Starfleet 2', category: 'Federation' },

    // TNG Series Fonts
    { name: 'TNGTitle', value: 'TNGTitle', displayName: 'TNG Title', category: 'TNG' },
    { name: 'TNGCredits', value: 'TNGCredits', displayName: 'TNG Credits', category: 'TNG' },
    {
      name: 'TrekTNGMonitors',
      value: 'TrekTNGMonitors',
      displayName: 'TNG Monitors',
      category: 'TNG',
    },

    // DS9 Series Fonts
    { name: 'DS9Title', value: 'DS9Title', displayName: 'DS9 Title', category: 'DS9' },
    { name: 'DS9Credits', value: 'DS9Credits', displayName: 'DS9 Credits', category: 'DS9' },

    // TOS (Original Series) Fonts
    { name: 'TOSTitle', value: 'TOSTitle', displayName: 'TOS Title', category: 'TOS' },

    // Movie Fonts
    { name: 'TrekMovie1', value: 'TrekMovie1', displayName: 'Trek Movie 1', category: 'Movies' },
    { name: 'TrekMovie2', value: 'TrekMovie2', displayName: 'Trek Movie 2', category: 'Movies' },
    {
      name: 'FinalFrontier',
      value: 'FinalFrontier',
      displayName: 'Final Frontier',
      category: 'Movies',
    },

    // Alien Race Fonts
    { name: 'Klingon', value: 'Klingon', displayName: 'Klingon', category: 'Alien Races' },
    { name: 'Vulcan', value: 'Vulcan', displayName: 'Vulcan', category: 'Alien Races' },
    { name: 'Romulan', value: 'Romulan', displayName: 'Romulan', category: 'Alien Races' },
    { name: 'Cardassian', value: 'Cardassian', displayName: 'Cardassian', category: 'Alien Races' },
    { name: 'Bajoran', value: 'Bajoran', displayName: 'Bajoran', category: 'Alien Races' },
    { name: 'Ferengi', value: 'Ferengi', displayName: 'Ferengi', category: 'Alien Races' },
    { name: 'Dominion', value: 'Dominion', displayName: 'Dominion', category: 'Alien Races' },
    { name: 'Tholian', value: 'Tholian', displayName: 'Tholian', category: 'Alien Races' },
    { name: 'Trill', value: 'Trill', displayName: 'Trill', category: 'Alien Races' },

    // Special & Technical Fonts
    { name: 'Jefferies', value: 'Jefferies', displayName: 'Jefferies', category: 'Technical' },
    { name: 'Trekbats', value: 'Trekbats', displayName: 'Trekbats', category: 'Technical' },
    {
      name: 'ContextUltraCondensed',
      value: 'ContextUltraCondensed',
      displayName: 'Context Ultra Condensed',
      category: 'Technical',
    },
    {
      name: 'ContextUltraCondensedBold',
      value: 'ContextUltraCondensedBold',
      displayName: 'Context Ultra Condensed Bold',
      category: 'Technical',
    },

    // Additional Fonts
    { name: 'Montalban', value: 'Montalban', displayName: 'Montalban', category: 'Additional' },
    { name: 'Fabrini', value: 'Fabrini', displayName: 'Fabrini', category: 'Additional' },
    { name: 'Beijing', value: 'Beijing', displayName: 'Beijing', category: 'Additional' },
    {
      name: 'NovaLightUltra',
      value: 'NovaLightUltra',
      displayName: 'Nova Light Ultra',
      category: 'Additional',
    },
    {
      name: 'NovaLightUltraThin',
      value: 'NovaLightUltraThin',
      displayName: 'Nova Light Ultra Thin',
      category: 'Additional',
    },
    { name: 'FinalOld', value: 'FinalOld', displayName: 'Final Old', category: 'Additional' },
  ];

  ngOnInit() {
    this.checkFontLoading();
  }

  get groupedFonts() {
    const groups = this.fonts.reduce(
      (acc, font) => {
        if (!acc[font.category]) {
          acc[font.category] = [];
        }
        acc[font.category].push(font);
        return acc;
      },
      {} as { [key: string]: FontOption[] }
    );

    return Object.entries(groups).map(([category, fonts]) => ({
      category,
      fonts,
    }));
  }

  getPreviewStyle(): any {
    return {
      'font-family': `'${this.selectedFont}', monospace`,
      'font-size': '2rem',
      'font-weight': 'bold',
      color: '#FF9C00',
      'text-align': 'center',
      padding: '2rem',
      'background-color': '#000033',
      border: '2px solid #FF9C00',
      'border-radius': '8px',
      'min-height': '120px',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
    };
  }

  private checkFontLoading() {
    this.fontStatuses = [];

    this.fonts.forEach(font => {
      const testElement = document.createElement('span');
      testElement.style.fontFamily = `'${font.name}', monospace`;
      testElement.style.visibility = 'hidden';
      testElement.style.position = 'absolute';
      testElement.style.fontSize = '72px';
      testElement.textContent = 'Test';

      document.body.appendChild(testElement);

      // Get the computed font family
      const computedFont = window.getComputedStyle(testElement).fontFamily;
      const isLoaded = computedFont.includes(font.name);

      this.fontStatuses.push({
        name: font.name,
        loaded: isLoaded,
        error: isLoaded ? undefined : `Font not loaded - using: ${computedFont}`,
      });

      document.body.removeChild(testElement);
    });
  }

  getFontStatus(fontName: string): FontStatus | undefined {
    return this.fontStatuses.find(status => status.name === fontName);
  }

  getLoadedFontsCount(): number {
    return this.fontStatuses.filter(status => status.loaded).length;
  }

  getTotalFontsCount(): number {
    return this.fontStatuses.length;
  }
}
