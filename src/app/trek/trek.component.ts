import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import * as opentype from 'opentype.js';

interface FontOption {
  name: string;
  value: string;
  displayName: string;
  category: string;
  filePath: string;
}

interface FontStatus {
  name: string;
  loaded: boolean;
  error?: string;
  font?: opentype.Font;
}

@Component({
  selector: 'app-trek',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trek.component.html',
  styleUrls: ['./trek.component.scss'],
})
export class TrekComponent implements OnInit, AfterViewInit {
  @ViewChild('previewCanvas', { static: false }) previewCanvas!: ElementRef<HTMLCanvasElement>;
  
  userName: string = 'TOS Title';
  selectedFont: string = 'TOSTitle';
  fontStatuses: FontStatus[] = [];
  loadedFonts: Map<string, opentype.Font> = new Map();
  private isBrowser: boolean;

  fonts: FontOption[] = [
    // Federation & Starfleet Fonts
    { name: 'Federation', value: 'Federation', displayName: 'Federation', category: 'Federation', filePath: '/fonts/Federation.ttf' },
    {
      name: 'FederationWide',
      value: 'FederationWide',
      displayName: 'Federation Wide',
      category: 'Federation',
      filePath: '/fonts/Federation_Wide.ttf'
    },
    { name: 'Starfleet1', value: 'Starfleet1', displayName: 'Starfleet 1', category: 'Federation', filePath: '/fonts/Starfleet_1.ttf' },
    { name: 'Starfleet2', value: 'Starfleet2', displayName: 'Starfleet 2', category: 'Federation', filePath: '/fonts/Starfleet_2.ttf' },

    // TNG Series Fonts
    { name: 'TNGTitle', value: 'TNGTitle', displayName: 'TNG Title', category: 'TNG', filePath: '/fonts/TNG_Title.ttf' },
    // Temporarily comment out TNGCredits due to cmap error
    // { name: 'TNGCredits', value: 'TNGCredits', displayName: 'TNG Credits', category: 'TNG', filePath: '/fonts/TNG_Credits.ttf' },
    {
      name: 'TrekTNGMonitors',
      value: 'TrekTNGMonitors',
      displayName: 'TNG Monitors',
      category: 'TNG',
      filePath: '/fonts/Trek_TNG_Monitors.ttf'
    },

    // DS9 Series Fonts
    { name: 'DS9Title', value: 'DS9Title', displayName: 'DS9 Title', category: 'DS9', filePath: '/fonts/DS9_Title.ttf' },
    { name: 'DS9Credits', value: 'DS9Credits', displayName: 'DS9 Credits', category: 'DS9', filePath: '/fonts/DS9_Credits.ttf' },

    // TOS (Original Series) Fonts
    { name: 'TOSTitle', value: 'TOSTitle', displayName: 'TOS Title', category: 'TOS', filePath: '/fonts/TOS_Title.ttf' },

    // Movie Fonts
    { name: 'TrekMovie1', value: 'TrekMovie1', displayName: 'Trek Movie 1', category: 'Movies', filePath: '/fonts/Trek_Movie_1.ttf' },
    { name: 'TrekMovie2', value: 'TrekMovie2', displayName: 'Trek Movie 2', category: 'Movies', filePath: '/fonts/Trek_Movie_2.ttf' },
    {
      name: 'FinalFrontier',
      value: 'FinalFrontier',
      displayName: 'Final Frontier',
      category: 'Movies',
      filePath: '/fonts/Final_Frontier.ttf'
    },

    // Alien Race Fonts
    { name: 'Klingon', value: 'Klingon', displayName: 'Klingon', category: 'Alien Races', filePath: '/fonts/Klingon.ttf' },
    { name: 'Vulcan', value: 'Vulcan', displayName: 'Vulcan', category: 'Alien Races', filePath: '/fonts/Vulcan.ttf' },
    { name: 'Romulan', value: 'Romulan', displayName: 'Romulan', category: 'Alien Races', filePath: '/fonts/Romulan.ttf' },
    { name: 'Cardassian', value: 'Cardassian', displayName: 'Cardassian', category: 'Alien Races', filePath: '/fonts/Cardassian.ttf' },
    { name: 'Bajoran', value: 'Bajoran', displayName: 'Bajoran', category: 'Alien Races', filePath: '/fonts/Bajoran.ttf' },
    { name: 'Ferengi', value: 'Ferengi', displayName: 'Ferengi', category: 'Alien Races', filePath: '/fonts/Ferengi.ttf' },
    { name: 'Dominion', value: 'Dominion', displayName: 'Dominion', category: 'Alien Races', filePath: '/fonts/Dominion.ttf' },
    { name: 'Tholian', value: 'Tholian', displayName: 'Tholian', category: 'Alien Races', filePath: '/fonts/Tholian.ttf' },
    { name: 'Trill', value: 'Trill', displayName: 'Trill', category: 'Alien Races', filePath: '/fonts/Trill.ttf' },

    // Special & Technical Fonts
    { name: 'Jefferies', value: 'Jefferies', displayName: 'Jefferies', category: 'Technical', filePath: '/fonts/Jefferies.ttf' },
    { name: 'Trekbats', value: 'Trekbats', displayName: 'Trekbats', category: 'Technical', filePath: '/fonts/Trekbats.ttf' },
    {
      name: 'ContextUltraCondensed',
      value: 'ContextUltraCondensed',
      displayName: 'Context Ultra Condensed',
      category: 'Technical',
      filePath: '/fonts/Context_Ultra_Condensed.ttf'
    },
    {
      name: 'ContextUltraCondensedBold',
      value: 'ContextUltraCondensedBold',
      displayName: 'Context Ultra Condensed Bold',
      category: 'Technical',
      filePath: '/fonts/Context_Ultra_Condensed_Bold.ttf'
    },

    // Additional Fonts
    { name: 'Montalban', value: 'Montalban', displayName: 'Montalban', category: 'Additional', filePath: '/fonts/Montalban.ttf' },
    { name: 'Fabrini', value: 'Fabrini', displayName: 'Fabrini', category: 'Additional', filePath: '/fonts/Fabrini.ttf' },
    { name: 'Beijing', value: 'Beijing', displayName: 'Beijing', category: 'Additional', filePath: '/fonts/Beijing.ttf' },
    {
      name: 'NovaLightUltra',
      value: 'NovaLightUltra',
      displayName: 'Nova Light Ultra',
      category: 'Additional',
      filePath: '/fonts/Nova_Light_Ultra.ttf'
    },
    {
      name: 'NovaLightUltraThin',
      value: 'NovaLightUltraThin',
      displayName: 'Nova Light Ultra Thin',
      category: 'Additional',
      filePath: '/fonts/Nova_Light_Ultra_Thin.ttf'
    },
    { name: 'FinalOld', value: 'FinalOld', displayName: 'Final Old', category: 'Additional', filePath: '/fonts/FINALOLD.TTF' },
  ];

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    // Only load fonts in the browser, not during SSR/SSG
    if (this.isBrowser) {
      this.loadAllFonts();
    }
  }

  ngAfterViewInit() {
    // Only render in the browser
    if (this.isBrowser) {
      // Initial render after view is initialized
      setTimeout(() => {
        this.renderText();
      }, 100);
    }
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

  private async loadAllFonts() {
    if (!this.isBrowser) {
      return; // Don't load fonts during SSR/SSG
    }

    this.fontStatuses = [];
    
    for (const font of this.fonts) {
      try {
        console.log(`Loading font: ${font.name} from ${font.filePath}`);
        
        // Load the font using opentype.js
        const fontData = await opentype.load(font.filePath);
        
        // Store the loaded font
        this.loadedFonts.set(font.name, fontData);
        
        this.fontStatuses.push({
          name: font.name,
          loaded: true,
          font: fontData
        });
        
        console.log(`✓ Font ${font.name} loaded successfully`);
        
        // Render text if this is the selected font
        if (font.name === this.selectedFont) {
          this.renderText();
        }
        
      } catch (error) {
        console.error(`✗ Failed to load font ${font.name}:`, error);
        
        this.fontStatuses.push({
          name: font.name,
          loaded: false,
          error: `Failed to load: ${error}`
        });
      }
    }
    
    console.log(`Font loading complete. ${this.getLoadedFontsCount()} of ${this.getTotalFontsCount()} fonts loaded.`);
  }

  renderText() {
    if (!this.isBrowser || !this.previewCanvas || !this.userName) {
      return;
    }

    const canvas = this.previewCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    // Set canvas size
    canvas.width = 600;
    canvas.height = 200;

    // Clear canvas and set white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get the selected font
    const selectedFontData = this.loadedFonts.get(this.selectedFont);
    
    if (!selectedFontData) {
      // Fallback to default font
      ctx.font = '48px monospace';
      ctx.fillStyle = '#FF9C00';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.userName, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Font ${this.selectedFont} not loaded`, canvas.width / 2, canvas.height / 2 + 60);
      return;
    }

    try {
      // Render text using opentype.js
      const fontSize = 48;
      const text = this.userName;
      
      // Get the path for the text
      const path = selectedFontData.getPath(text, 0, 0, fontSize);
      
      // Calculate text bounds
      const bbox = path.getBoundingBox();
      const textWidth = bbox.x2 - bbox.x1;
      const textHeight = bbox.y2 - bbox.y1;
      
      // Center the text
      const x = (canvas.width - textWidth) / 2;
      const y = (canvas.height + textHeight) / 2;
      
      // Draw border
      ctx.strokeStyle = '#FF9C00';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      
      // Render the text path
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#000033'; // Dark text on white background
      path.draw(ctx);
      ctx.restore();
      
      // Add font name indicator
      ctx.font = '12px monospace';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(this.selectedFont, canvas.width - 10, 10);
      
      console.log(`Text rendered successfully with font ${this.selectedFont}`);
      
    } catch (error) {
      console.error(`Error rendering text with font ${this.selectedFont}:`, error);
      
      // Fallback rendering
      ctx.font = '48px monospace';
      ctx.fillStyle = '#FF9C00';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.userName, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Rendering error`, canvas.width / 2, canvas.height / 2 + 60);
    }
  }

  onFontChange() {
    if (this.isBrowser) {
      this.renderText();
    }
  }

  onTextChange() {
    if (this.isBrowser) {
      this.renderText();
    }
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

  retestFonts() {
    if (this.isBrowser) {
      console.log('Reloading all fonts...');
      this.loadedFonts.clear();
      this.loadAllFonts();
    }
  }

  testSpecificFont(fontName: string) {
    if (!this.isBrowser) {
      return;
    }
    
    console.log(`Testing specific font: ${fontName}`);
    const fontData = this.loadedFonts.get(fontName);
    
    if (fontData) {
      console.log(`✓ Font ${fontName} is loaded and ready`);
      // Update the preview if this is the selected font
      if (fontName === this.selectedFont) {
        this.renderText();
      }
    } else {
      console.log(`✗ Font ${fontName} is not loaded`);
    }
  }
}
