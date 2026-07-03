import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-result',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.css']
})
export class PaymentResultComponent implements OnInit {

  loading = true;
  /** ID de transacción que Wompi añade como ?id= a la redirect-url */
  transactionId: string | null = null;
  /** ID del producto para el botón "Volver" */
  productId: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.transactionId = this.route.snapshot.queryParamMap.get('id');
    this.productId     = this.route.snapshot.queryParamMap.get('product_id');
    this.loading = false;
  }

  goHome(): void {
    this.router.navigate(['/'], { fragment: 'proyectos' });
  }

  goProduct(): void {
    if (this.productId) {
      this.router.navigate(['/producto', this.productId]);
    } else {
      this.goHome();
    }
  }
}
