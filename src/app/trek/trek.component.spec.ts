import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TrekComponent } from './trek.component';

describe('TrekComponent', () => {
  let component: TrekComponent;
  let fixture: ComponentFixture<TrekComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrekComponent, FormsModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TrekComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.userName).toBe('');
    expect(component.selectedFont).toBe('antonio');
    expect(component.fonts.length).toBeGreaterThan(0);
  });

  it('should update preview style when font changes', () => {
    const initialStyle = component.getPreviewStyle();
    component.selectedFont = 'oswald';
    const newStyle = component.getPreviewStyle();
    expect(newStyle['font-family']).not.toBe(initialStyle['font-family']);
  });
});
