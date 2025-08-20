import { Injectable } from '@angular/core';

export interface Theme {
  name: string;
  font: string;
  color: number;        // Initial text color (can be overridden by user)
  background: number;   // Initial background color (can be overridden by user)
  text: string;
  tags: string[];
  caps: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemesService {
  private themes: Theme[] = [
    {
      name: "TOS Title",
      font: "TOS_Title.json",
      color: 0xffff00,
      background: 0x000000,
      text: "STAR TREK",
      tags: ["Star Trek"],
      caps: true
    },
    {
      name: "TNG Title",
      font: "Federation_Regular.json",
      color: 0x0077ff,
      background: 0x000000,
      text: "STAR TREK",
      tags: ["Star Trek"],
      caps: true
    },
    {
      name: "DS9 Title",
      font: "DS9_Title.json",
      color: 0xcccccc,
      background: 0x000000,
      text: "STAR TREK",
      tags: ["Star Trek"],
      caps: true
    },
    {
      name: "Nasa",
      font: "Nasalization.json",
      color: 0xff0000,
      background: 0xffffff,
      text: "NASA",
      tags: ["Misc"],
      caps: true
    },
    {
      name: "Highway",
      font: "HWYGOTH.json",
      color: 0xffffff,
      background: 0x44dd44,
      text: "Highway",
      tags: ["Misc"],
      caps: false
    },
    {
      name: "Adventure Time Title",
      font: "AdventureTimeLogo.json",
      color: 0xff0000,
      background: 0x00b5e2,
      text: "ADVENTURE TIME",
      tags: ["Misc"],
      caps: false
    },
    {
      name: "Adventure Time Credits",
      font: "Thunderman.json",
      color: 0x000000,
      background: 0x88ff88,
      text: "ADVENTURE TIME",
      tags: ["Misc"],
      caps: false
    }
  ];

  getThemes(): Theme[] {
    return this.themes;
  }

  getThemeByName(name: string): Theme | undefined {
    return this.themes.find(t => t.name === name);
  }
}
