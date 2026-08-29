import { Component, OnInit } from '@angular/core';
import { SeoService } from './services/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private seo: SeoService) { }

  ngOnInit(): void {
    // Mantiene canonical, og:url, título y descripción al día en cada ruta.
    this.seo.start();
  }
}
