import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy
} from '@angular/core';

@Component({
  selector: 'app-habilidades',
  templateUrl: './habilidades.component.html',
  styleUrls: ['./habilidades.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HabilidadesComponent implements AfterViewInit, OnDestroy {

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    // Fuera de la zona de Angular: el scroll no dispara change detection.
    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          entry.target.classList.toggle('visible', entry.isIntersecting);
        }
      }, { threshold: 0.2 });

      this.el.nativeElement
        .querySelectorAll('.card-modern')
        .forEach(card => this.observer!.observe(card));
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
