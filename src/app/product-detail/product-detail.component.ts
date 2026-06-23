import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.model';
import { Psychologist } from '../models/psychologist.model';
import { Appointment, Day } from '../models/agenda.model';

interface CalendarCell {
  date: Date;
  inMonth: boolean;
  day?: Day;
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
  agendaDays: Day[] = [];
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
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.buildForm();

    // paramMap (y no snapshot) para reaccionar si se navega entre productos
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.resetState();

      if (!id) {
        this.loading = false;
        this.notFound = true;
        return;
      }

      this.productService.getProductById(id).subscribe(product => {
        this.loading = false;
        if (!product) {
          this.notFound = true;
          return;
        }
        this.product = product;
        this.loadPsychologists(product);
      });
    });
  }

  get isService(): boolean {
    return this.product?.type.name === 'servicio';
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
    this.productService.getPsychologistsByProduct(product.id).subscribe(psychologists => {
      this.availablePsychologists = psychologists;
      // Por defecto se selecciona la dueña / creadora del producto
      this.selectedPsychologist = psychologists[0];

      if (product.type.name === 'servicio' && this.selectedPsychologist) {
        this.loadAgenda(this.selectedPsychologist.id);
      }
    });
  }

  /** Cambiar de profesional: recarga su agenda y limpia la cita elegida */
  selectPsychologist(psychologist: Psychologist): void {
    if (this.selectedPsychologist?.id === psychologist.id) { return; }
    this.selectedPsychologist = psychologist;
    this.selectedDay = undefined;
    this.selectedAppointment = undefined;
    this.scheduleError = false;
    if (this.isService) {
      this.loadAgenda(psychologist.id);
    }
  }

  /* ── Calendario ─────────────────────────────────────────── */

  private loadAgenda(psychologistId: string): void {
    this.agendaLoading = true;
    this.productService.getAgenda(psychologistId).subscribe(agenda => {
      this.agendaLoading = false;
      this.agendaDays = agenda.days;
      const firstAvailable = agenda.days.find(d => this.dayHasAvailability(d));
      this.displayedMonth = new Date(
        (firstAvailable ?? agenda.days[0]).date.getFullYear(),
        (firstAvailable ?? agenda.days[0]).date.getMonth(),
        1
      );
      this.buildCalendar();
    });
  }

  private buildCalendar(): void {
    const year = this.displayedMonth.getFullYear();
    const month = this.displayedMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const start = new Date(firstOfMonth);
    start.setDate(firstOfMonth.getDate() - ((firstOfMonth.getDay() + 6) % 7)); // lunes previo

    this.calendarCells = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      this.calendarCells.push({
        date,
        inMonth: date.getMonth() === month,
        day: this.agendaDays.find(d => this.sameDate(d.date, date))
      });
    }
  }

  dayHasAvailability(day?: Day): boolean {
    return !!day && day.appointments.some(a => a.available);
  }

  isSelectedDay(cell: CalendarCell): boolean {
    return !!this.selectedDay && !!cell.day && cell.day.id === this.selectedDay.id;
  }

  isToday(cell: CalendarCell): boolean {
    return this.sameDate(cell.date, new Date());
  }

  selectDay(cell: CalendarCell): void {
    if (!cell.day || !this.dayHasAvailability(cell.day)) { return; }
    this.selectedDay = cell.day;
    this.selectedAppointment = undefined;
    this.scheduleError = false;
  }

  selectAppointment(appointment: Appointment): void {
    if (!appointment.available) { return; }
    this.selectedAppointment = appointment;
    this.scheduleError = false;
  }

  get canGoPrevMonth(): boolean {
    if (!this.agendaDays.length) { return false; }
    const first = this.agendaDays[0].date;
    return this.monthIndex(this.displayedMonth) > this.monthIndex(first);
  }

  get canGoNextMonth(): boolean {
    if (!this.agendaDays.length) { return false; }
    const last = this.agendaDays[this.agendaDays.length - 1].date;
    return this.monthIndex(this.displayedMonth) < this.monthIndex(last);
  }

  changeMonth(step: number): void {
    if ((step < 0 && !this.canGoPrevMonth) || (step > 0 && !this.canGoNextMonth)) { return; }
    this.displayedMonth = new Date(
      this.displayedMonth.getFullYear(),
      this.displayedMonth.getMonth() + step,
      1
    );
    this.buildCalendar();
  }

  /* ── Formulario ─────────────────────────────────────────── */

  private buildForm(): void {
    this.buyerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      celular: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{7,15}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      sexo: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(14), Validators.max(99)]]
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

    const payload = {
      productId: this.product!.id,
      psychologistId: this.selectedPsychologist?.id,
      buyer: this.buyerForm.value,
      appointment: this.selectedAppointment
        ? { dayId: this.selectedDay!.id, appointmentId: this.selectedAppointment.id }
        : null
    };

    this.submitting = true;
    const request$ = this.isService
      ? this.productService.bookAppointment(payload)
      : this.productService.createOrder(payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
      },
      error: () => {
        this.submitting = false;
      }
    });
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
    this.agendaDays = [];
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
