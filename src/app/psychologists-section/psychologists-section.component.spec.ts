import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { PsychologistsSectionComponent } from './psychologists-section.component';

describe('PsychologistsSectionComponent', () => {
  let component: PsychologistsSectionComponent;
  let fixture: ComponentFixture<PsychologistsSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PsychologistsSectionComponent],
      imports: [CommonModule, HttpClientTestingModule, NoopAnimationsModule]
    });
    fixture = TestBed.createComponent(PsychologistsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Evita que el intervalo del autoplay quede vivo entre specs.
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
