import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  template: `
<div class="logo-container">
  <div class="cube-corner">
    <div class="red face"></div>
    <div class="green face"></div>
    <div class="blue face"></div>
  </div>
</div>
  `,
  styles: `
@keyframes red-loop {
  0%, 100% {
    transform: rotateZ(90deg) translateX(-4px) translateY(4px);
  }
  50% {
    transform: rotateZ(90deg) translateX(-4px) translateY(4px) translateZ(64px);
  }
}

@keyframes green-loop {
  0%, 100% {
    transform: rotateX(90deg) translateZ(-62px) translateX(-62px);
  }
  50% {
    transform: rotateX(90deg) translateZ(-62px) translateX(-62px) translateZ(64px);
  }
}

@keyframes blue-loop {
  0%, 100% {
    transform: rotateY(-90deg) translateY(-4px) translateX(2px);
  }
  50% {
    transform: rotateY(-90deg) translateY(-4px) translateX(2px) translateZ(64px);
  }
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  cursor: pointer;
  transition: transform 0.5s ease;
  width: 120px;
  height: 120px;
  perspective: 1000px;

  &:hover {
    .red {
      transform: rotateZ(90deg) translateX(-4px) translateY(4px) translateZ(32px);
      transition: transform 0.5s ease;
    }
    
    .green {
      transform: rotateX(90deg) translateZ(-62px) translateX(-62px) translateZ(32px);
      transition: transform 0.5s ease;
    }
    
    .blue {
      transform: rotateY(-90deg) translateY(-4px) translateX(2px) translateZ(32px);
      transition: transform 0.5s ease;
    }
  }

  &:not(:hover) {
    .red {
      animation: red-loop 6s ease-in-out infinite;
    }

    .green {
      animation: green-loop 6s ease-in-out infinite 1s;
    }

    .blue {
      animation: blue-loop 6s ease-in-out infinite 2s;
    }
  }
}

.cube-corner {
  position: relative;
  width: 80px;
  height: 80px;
  transform-style: preserve-3d;
  transform: rotateX(-135deg) rotateY(45deg) rotateZ(-90deg) translateZ(32px) translateY(-24px);
  transition: transform 0.5s ease;
}

.face {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  transition: transform 0.5s ease;
}

.red {
  background: #f008;
  transform: rotateZ(90deg) translateX(-4px) translateY(4px);
  transform-origin: 0 0 0;
  transition: transform 0.5s ease;
}

.green {
  background: #0f08;
  transform: rotateX(90deg) translateZ(-62px) translateX(-62px);
  transform-origin: 0 0 0;
  transition: transform 0.5s ease;
}

.blue {
  background: #00f8;
  transform: rotateY(-90deg) translateY(-4px) translateX(2px);
  transform-origin: 0 0 0;
  transition: transform 0.5s ease;
}
  `,
  standalone: true,
  imports: [CommonModule],
})
export class LogoComponent {
  // Simple component - all styling is handled by CSS
}
