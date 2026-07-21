import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-payment-result',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.css']
})
export class PaymentResultComponent implements OnInit {

  loading = true;
  transactionId: string | null = null;
  productId: string | null = null;
  status: 'success' | 'rejected' | 'pending' | 'unknown' = 'unknown';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
  ) {}

  ngOnInit(): void {
    this.transactionId = this.route.snapshot.queryParamMap.get('id');
    this.productId     = this.route.snapshot.queryParamMap.get('product_id');

    if (!this.transactionId) {
      this.loading = false;
      this.status = 'unknown';
      return;
    }

    this.paymentService.getTransaction(this.transactionId).subscribe({
      next: (res) => {
        this.loading = false;
        const txStatus: string = res?.data?.transaction?.status ?? res?.data?.status ?? res?.status ?? '';
        this.status = this.mapStatus(txStatus);
      },
      error: () => {
        this.loading = false;
        this.status = 'unknown';
      },
    });
  }

  private mapStatus(txStatus: string): 'success' | 'rejected' | 'pending' | 'unknown' {
    switch (txStatus) {
      case 'APPROVED':     return 'success';
      case 'DECLINED':
      case 'REJECTED':
      case 'VOIDED':
      case 'ERROR':        return 'rejected';
      case 'PENDING':      return 'pending';
      default:             return 'unknown';
    }
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
