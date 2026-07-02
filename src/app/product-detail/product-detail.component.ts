import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { PaymentService } from '../services/payment.service';
import { Product } from '../models/product.model';
import { Psychologist } from '../models/psychologist.model';
import { Appointment, Day } from '../models/agenda.model';

interface CalendarCell {
  date: Date;
  inMonth: boolean;
}

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {

  product?: Product;
  loading = true;
  notFound = false;

  /* ── Psicólogas que ofrecen el producto ──
     En servicios puede haber varias (el usuario elige con quién agendar);
     en productos digitales solo está la autora. */
  availablePsychologists: Psychologist[] = [];
  selectedPsychologist?: Psychologist;

  /* ── Agenda (solo para type === 'servicio') ── */
  agendaLoading = false;
  agendaWeekdays: Set<number> = new Set();
  /** Caché de disponibilidad por mes: clave = "YYYY-MM" */
  availabilityCache = new Map<string, Map<string, Day>>();
  /** Días del mes actual ya cargados desde el backend */
  currentMonthDays = new Map<string, Day>();
  monthLoading = false;
  monthLoadFailed = false;
  displayedMonth = new Date();
  calendarCells: CalendarCell[] = [];
  weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  selectedDay?: Day;
  selectedAppointment?: Appointment;
  scheduleError = false;

  /* ── Formulario del comprador ── */
  buyerForm!: FormGroup;
  submitAttempted = false;
  submitting = false;
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productService: ProductService,
    private paymentService: PaymentService
  ) { }

  ngOnInit(): void {
    this.buildForm();

    // paramMap (y no snapshot) para reaccionar si se navega entre productos
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('[PD] paramMap id:', id);
      this.resetState();

      if (!id) {
        this.loading = false;
        this.notFound = true;
        return;
      }

      this.productService.getProductById(id).subscribe({
        next: product => {
          console.log('[PD] getProductById OK:', product);
          this.loading = false;
          if (!product) {
            this.notFound = true;
            return;
          }
          this.product = product;
          console.log('[PD] isService:', this.isService, 'product.type:', product.type);
          this.loadPsychologists(product);
        },
        error: err => {
          console.error('[PD] getProductById ERROR:', err);
          this.loading = false;
          this.notFound = true;
        }
      });
    });
  }

  get isService(): boolean {
    return this.product?.type.code === 'consulta';
  }

  get monthLabel(): string {
    const label = this.displayedMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  get selectedSlotLabel(): string {
    if (!this.selectedDay || !this.selectedAppointment) { return ''; }
    const day = this.selectedDay.date.toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    return `${day.charAt(0).toUpperCase() + day.slice(1)} · ${this.selectedAppointment.startTime}`;
  }

  /* ── Psicólogas ─────────────────────────────────────────── */

  private loadPsychologists(product: Product): void {
    console.log('[PD] loadPsychologists for product:', product.id);
    this.productService.getPsychologistsByProduct(product.id).subscribe({
      next: psychologists => {
        console.log('[PD] getPsychologistsByProduct OK:', psychologists);
        this.availablePsychologists = psychologists;
        this.selectedPsychologist = psychologists[0];

        if (this.isService && this.selectedPsychologist) {
          console.log('[PD] Loading agenda for psychologist:', this.selectedPsychologist.id);
          this.loadAgenda(this.selectedPsychologist.id);
        } else {
          console.log('[PD] No cargar agenda. isService:', this.isService, 'selectedPsy:', this.selectedPsychologist);
        }
      },
      error: err => console.error('[PD] getPsychologistsByProduct ERROR:', err)
    });
  }

  /** Cambiar de profesional: recarga su agenda y limpia la cita elegida */
  selectPsychologist(psychologist: Psychologist): void {
    if (this.selectedPsychologist?.id === psychologist.id) { return; }
    this.selectedPsychologist = psychologist;
    this.selectedDay = undefined;
    this.selectedAppointment = undefined;
    this.scheduleError = false;
    this.availabilityCache = new Map();
    this.currentMonthDays = new Map();
    if (this.isService) {
      this.loadAgenda(psychologist.id);
    }
  }

  /* ── Calendario ─────────────────────────────────────────── */

  private loadAgenda(psychologistId: string): void {
    console.log('[PD] loadAgenda START', psychologistId);
    this.agendaLoading = true;
    this.productService.getAgendaTemplate(psychologistId).subscribe({
      next: weekdays => {
        console.log('[PD] getAgendaTemplate OK, weekdays:', Array.from(weekdays));
        this.agendaLoading = false;
        this.agendaWeekdays = weekdays;
        this.displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        this.buildCalendar();
        console.log('[PD] calendarCells built:', this.calendarCells.length);
        this.loadMonth();
      },
      error: err => {
        console.error('[PD] getAgendaTemplate ERROR:', err);
        this.agendaLoading = false;
        this.displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        this.buildCalendar();
      }
    });
  }

  private monthKey(date: Date = this.displayedMonth): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;  // mes 1-12
  }

  loadMonth(): void {
    const key = this.monthKey();
    console.log('[PD] loadMonth START key=', key);
    if (this.availabilityCache.has(key)) {
      console.log('[PD] loadMonth cache HIT');
      this.currentMonthDays = this.availabilityCache.get(key)!;
      return;
    }
    this.monthLoading = true;
    const { year, month } = { year: this.displayedMonth.getFullYear(), month: this.displayedMonth.getMonth() + 1 };
    console.log('[PD] getMonthAvailability request:', { psychologistId: this.selectedPsychologist!.id, year, month });
    this.productService.getMonthAvailability(this.selectedPsychologist!.id, year, month)
      .subscribe({
        next: days => {
          console.log('[PD] getMonthAvailability OK, days:', Array.from(days.entries()));
          this.availabilityCache.set(key, days);
          this.currentMonthDays = days;
          this.monthLoading = false;
          this.monthLoadFailed = false;
        },
        error: err => {
          console.error('[PD] getMonthAvailability ERROR:', err);
          this.monthLoading = false;
          this.monthLoadFailed = true;
        }
      });
  }

  private buildCalendar(): void {
    const year = this.displayedMonth.getFullYear();
    const month = this.displayedMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const start = new Date(firstOfMonth);
    start.setDate(firstOfMonth.getDate() - ((firstOfMonth.getDay() + 6) % 7));

    this.calendarCells = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      this.calendarCells.push({ date, inMonth: date.getMonth() === month });
    }
  }

  /** Día disponible: coincide con el horario de la agenda y no es pasado */
  dayIsAvailable(cell: CalendarCell): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return cell.inMonth
      && cell.date >= today
      && this.agendaWeekdays.has(cell.date.getDay());
  }

  /** Un día es clickeable si está en el mes, no es pasado, coincide con la
   *  agenda semanal, y (si tenemos data del backend) tiene slots disponibles. */
  dayHasSlots(cell: CalendarCell): boolean {
    if (!this.dayIsAvailable(cell)) { return false; }
    const day = this.currentMonthDays.get(this.toIsoDate(cell.date));
    return !!day && day.appointments.some(a => a.available);
  }

  isSelectedDay(cell: CalendarCell): boolean {
    return !!this.selectedDay && this.sameDate(this.selectedDay.date, cell.date);
  }

  isToday(cell: CalendarCell): boolean {
    return this.sameDate(cell.date, new Date());
  }

  selectDay(cell: CalendarCell): void {
    if (!this.dayHasSlots(cell)) { return; }
    if (this.selectedDay && this.sameDate(this.selectedDay.date, cell.date)) { return; }
    this.selectedAppointment = undefined;
    this.scheduleError = false;
    this.selectedDay = this.currentMonthDays.get(this.toIsoDate(cell.date));
  }

  private toIsoDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  selectAppointment(appointment: Appointment): void {
    if (!appointment.available) { return; }
    this.selectedAppointment = appointment;
    this.scheduleError = false;
  }

  get canGoPrevMonth(): boolean {
    const today = new Date();
    return this.monthIndex(this.displayedMonth) > this.monthIndex(today);
  }

  get canGoNextMonth(): boolean {
    const maxMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 3, 1);
    return this.monthIndex(this.displayedMonth) < this.monthIndex(maxMonth);
  }

  changeMonth(step: number): void {
    if ((step < 0 && !this.canGoPrevMonth) || (step > 0 && !this.canGoNextMonth)) { return; }
    this.displayedMonth = new Date(
      this.displayedMonth.getFullYear(),
      this.displayedMonth.getMonth() + step,
      1
    );
    this.selectedDay = undefined;
    this.selectedAppointment = undefined;
    this.monthLoadFailed = false;
    this.buildCalendar();
    this.loadMonth();
  }

  /* ── Formulario ─────────────────────────────────────────── */

  private buildForm(): void {
    this.buyerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      celular: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{7,15}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      sexo: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(14), Validators.max(99)]],
      tipoDocumento: ['CC', Validators.required],
      documento: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  invalid(field: string): boolean {
    const control = this.buyerForm.get(field);
    return !!control && control.invalid && (control.touched || this.submitAttempted);
  }

  onSubmit(): void {
    this.submitAttempted = true;
    this.scheduleError = this.isService && !this.selectedAppointment;

    if (this.buyerForm.invalid || this.scheduleError) {
      this.buyerForm.markAllAsTouched();
      return;
    }

    const buyer = this.buyerForm.value;
    this.submitting = true;

    this.paymentService.checkout({
      productId: this.product!.id,
      clientFullName: `${buyer.nombre} ${buyer.apellido}`,
      clientEmail: buyer.correo,
      clientWhatsappNumber: buyer.celular,
      document: buyer.documento,
      documentType: buyer.tipoDocumento,
      startTime: this.selectedAppointmentStartTime()
    }).subscribe({
      next: (checkout) => {
        const redirectUrl = `${window.location.origin}${this.router.url}`;
        this.paymentService.openWompiWidget(checkout, redirectUrl)
          .then((result) => {
            console.log('[PD] Wompi widget result:', result);
            this.submitting = false;
            if (result?.transaction?.status === 'APPROVED') {
              this.submitted = true;
            }
          })
          .catch((err) => {
            console.error('[PD] Wompi widget error:', err);
            this.submitting = false;
          });
      },
      error: (err) => {
        console.error('[PD] Payments checkout error:', err);
        this.submitting = false;
      }
    });
  }

  /** Fecha/hora real de la cita elegida (día del calendario + hora del slot). */
  private selectedAppointmentStartTime(): Date | undefined {
    if (!this.isService || !this.selectedDay || !this.selectedAppointment) { return undefined; }
    const [h, m] = this.selectedAppointment.startTime.split(':').map(Number);
    const date = this.selectedDay.date;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
  }

  getWhatsappConfirmLink(): string {
    if (!this.product) { return '#'; }
    const buyer = this.buyerForm.value;
    const psyName = this.selectedPsychologist?.fullName ?? '';
    const base = this.isService
      ? `Hola, soy ${buyer.nombre} ${buyer.apellido}. Acabo de agendar "${this.product.name}" con ${psyName} para el ${this.selectedSlotLabel}.`
      : `Hola, soy ${buyer.nombre} ${buyer.apellido}. Acabo de comprar "${this.product.name}".`;
    return `https://wa.me/573104671284?text=${encodeURIComponent(base)}`;
  }

  goBack(): void {
    this.router.navigate(['/'], { fragment: 'proyectos' });
  }

  /* ── Utilidades ─────────────────────────────────────────── */

  private resetState(): void {
    this.product = undefined;
    this.loading = true;
    this.notFound = false;
    this.availablePsychologists = [];
    this.selectedPsychologist = undefined;
    this.agendaLoading = false;
    this.agendaWeekdays = new Set();
    this.availabilityCache = new Map();
    this.currentMonthDays = new Map();
    this.monthLoading = false;
    this.monthLoadFailed = false;
    this.calendarCells = [];
    this.selectedDay = undefined;
    this.selectedAppointment = undefined;
    this.scheduleError = false;
    this.submitAttempted = false;
    this.submitting = false;
    this.submitted = false;
    this.buyerForm.reset();
  }

  private sameDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private monthIndex(date: Date): number {
    return date.getFullYear() * 12 + date.getMonth();
  }
}
