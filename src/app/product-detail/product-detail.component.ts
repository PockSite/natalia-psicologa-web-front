import { Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ProductService } from '../services/product.service';
import { PaymentService, CheckoutAttendee } from '../services/payment.service';
import { ClientService, CountryCode, DocumentType, SexType } from '../services/client.service';
import { Product } from '../models/product.model';
import { Psychologist } from '../models/psychologist.model';
import { Appointment, Day } from '../models/agenda.model';

interface CalendarCell {
  date: Date;
  inMonth: boolean;
}

/** Estado del selector de indicativo de país. Cada persona tiene el suyo:
 *  así el combobox del titular y el del acompañante no se pisan. */
export interface DialCodePicker {
  open: boolean;
  highlight: number;
  filtered: CountryCode[];
}

/** Un acompañante: su formulario y el estado de su búsqueda por documento. */
export interface AttendeeSlot {
  form: FormGroup;
  lookup$: Subject<{ tipo: string; doc: string }>;
  loading: boolean;
  found: boolean;
  checked: boolean;
  ext: DialCodePicker;
}

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {

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
  /** Estado final del pago: null = no procesado, 'APPROVED' | 'PENDING' | 'DECLINED' | 'ERROR' */
  paymentStatus: string | null = null;

  /* ── Tipos de documento, sexo y códigos de país ── */
  documentTypes: DocumentType[] = [];
  sexTypes: SexType[] = [];
  countryCodes: CountryCode[] = [];
  readonly today = new Date();

  /* ── Indicativo de país: se puede escribir o elegir de la lista ── */
  /** Un wrapper por combobox en pantalla: titular y acompañantes. */
  @ViewChildren('extWrap') extWrapRefs?: QueryList<ElementRef<HTMLElement>>;
  /** Selector de indicativo del titular. */
  buyerExt: DialCodePicker = { open: false, highlight: -1, filtered: [] };

  /* ── Lookup de cliente por documento ── */
  /** true = buscando, false = listo */
  clientLookupLoading = false;
  /** true = cliente encontrado y campos auto-rellenados */
  clientFound = false;
  /** true = documento consultado y no existe: formulario habilitado para llenar */
  documentChecked = false;
  private docLookup$ = new Subject<{ tipo: string; doc: string }>();

  /* ── Acompañantes (terapia de pareja y similares) ──
     El titular sigue en buyerForm; aquí van solo los demás asistentes,
     cada uno con su propio formulario y su propia búsqueda por documento. */
  attendees: AttendeeSlot[] = [];
  private attendeeSubs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productService: ProductService,
    private paymentService: PaymentService,
    private clientService: ClientService
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.setupDocumentLookup();
    this.clientService.getDocumentTypes().subscribe(types => this.documentTypes = types);
    this.clientService.getSexTypes().subscribe(types => this.sexTypes = types);
    this.clientService.getCountryCodes().subscribe(codes => {
      this.countryCodes = codes;
      this.dialCodePickers.forEach(picker => picker.filtered = codes);
    });

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
          // El producto define cuántos asisten: se crean sus formularios.
          this.syncAttendees();
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
    this.buyerForm = this.newPersonForm();
  }

  /** Los asistentes piden los mismos datos que el titular: cada uno queda
   *  registrado como cliente, y eso exige documento. */
  private newPersonForm(): FormGroup {
    return this.fb.group({
      nombre:          ['', [Validators.required, Validators.minLength(2)]],
      apellido:        ['', [Validators.required, Validators.minLength(2)]],
      extensionPais:   ['+57', [Validators.required, Validators.pattern(/^\+\d{1,4}$/)]],
      celular:         ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
      correo:          ['', [Validators.required, Validators.email]],
      sexoId:          [null, Validators.required],
      fechaNacimiento: ['', Validators.required],
      tipoDocumento:   ['CC', Validators.required],
      documento:       ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  /* ── Acompañantes ───────────────────────────────────────── */

  /** Asistentes que exige el producto (1 = sesión individual). */
  get requiredAttendees(): number {
    return this.product?.attendeesCount ?? 1;
  }

  /** Ajusta el número de formularios de acompañante al que pide el producto. */
  private syncAttendees(): void {
    const needed = Math.max(0, this.requiredAttendees - 1);
    while (this.attendees.length > needed) {
      this.attendees.pop();
    }
    while (this.attendees.length < needed) {
      this.attendees.push(this.createAttendeeSlot());
    }
  }

  private createAttendeeSlot(): AttendeeSlot {
    const slot: AttendeeSlot = {
      form: this.newPersonForm(),
      lookup$: new Subject<{ tipo: string; doc: string }>(),
      loading: false,
      found: false,
      checked: false,
      ext: { open: false, highlight: -1, filtered: this.countryCodes },
    };

    // Mismo autocompletado que el titular: si ya es paciente, se rellena solo.
    const sub = slot.lookup$.pipe(
      debounceTime(600),
      distinctUntilChanged((a, b) => a.tipo === b.tipo && a.doc === b.doc),
      switchMap(({ tipo, doc }) => {
        if (doc.length < 5) { return of(null); }
        slot.loading = true;
        return this.clientService.findByDocument(tipo, doc);
      })
    ).subscribe(client => {
      slot.loading = false;
      slot.checked = true;
      if (client) {
        slot.found = true;
        const spaceIdx = client.fullName.indexOf(' ');
        slot.form.patchValue({
          nombre:          spaceIdx > -1 ? client.fullName.slice(0, spaceIdx) : client.fullName,
          apellido:        spaceIdx > -1 ? client.fullName.slice(spaceIdx + 1) : '',
          correo:          client.email            ?? '',
          extensionPais:   client.phoneCountryCode ?? '+57',
          celular:         client.whatsappNumber   ?? '',
          sexoId:          client.sexId            ?? null,
          fechaNacimiento: client.birthDate        ?? '',
        });
      } else {
        slot.found = false;
        slot.form.patchValue({
          nombre: '', apellido: '', correo: '',
          extensionPais: '+57', celular: '',
          sexoId: null, fechaNacimiento: '',
        });
      }
    });

    this.attendeeSubs.push(sub);
    return slot;
  }

  onAttendeeDocumentInput(slot: AttendeeSlot): void {
    const tipo = slot.form.get('tipoDocumento')?.value;
    const doc  = slot.form.get('documento')?.value?.trim();
    slot.checked = false;
    slot.found = false;
    if (doc && doc.length >= 5) {
      slot.lookup$.next({ tipo, doc });
    }
  }

  /** Documento repetido entre asistentes: serían la misma persona. */
  get hasDuplicateDocuments(): boolean {
    const keys = [this.buyerForm, ...this.attendees.map(a => a.form)]
      .map(f => `${f.get('tipoDocumento')?.value}|${(f.get('documento')?.value ?? '').trim()}`)
      .filter(k => !k.endsWith('|'));
    return new Set(keys).size !== keys.length;
  }

  get attendeeFormsValid(): boolean {
    return this.attendees.every(a => a.form.valid);
  }

  private setupDocumentLookup(): void {
    this.docLookup$.pipe(
      debounceTime(600),
      distinctUntilChanged((a, b) => a.tipo === b.tipo && a.doc === b.doc),
      switchMap(({ tipo, doc }) => {
        if (doc.length < 5) { return [null]; }
        this.clientLookupLoading = true;
        return this.clientService.findByDocument(tipo, doc);
      })
    ).subscribe(client => {
      this.clientLookupLoading = false;
      this.documentChecked = true;
      if (client) {
        this.clientFound = true;
        const spaceIdx = client.fullName.indexOf(' ');
        const nombre   = spaceIdx > -1 ? client.fullName.slice(0, spaceIdx) : client.fullName;
        const apellido = spaceIdx > -1 ? client.fullName.slice(spaceIdx + 1) : '';
        this.buyerForm.patchValue({
          nombre,
          apellido,
          correo:          client.email            ?? '',
          extensionPais:   client.phoneCountryCode ?? '+57',
          celular:         client.whatsappNumber   ?? '',
          sexoId:          client.sexId            ?? null,
          fechaNacimiento: client.birthDate        ?? '',
        });
      } else {
        this.clientFound = false;
        this.buyerForm.patchValue({
          nombre: '', apellido: '', correo: '',
          extensionPais: '+57', celular: '',
          sexoId: null, fechaNacimiento: '',
        });
      }
    });
  }

  onDocumentInput(): void {
    const tipo = this.buyerForm.get('tipoDocumento')?.value;
    const doc  = this.buyerForm.get('documento')?.value?.trim();
    if (doc && doc.length >= 5) {
      this.documentChecked = false;
      this.clientFound = false;
      this.docLookup$.next({ tipo, doc });
    } else {
      this.documentChecked = false;
      this.clientFound = false;
    }
  }

  /* ── Indicativo de país ─────────────────────────────────── */
  /* El titular y cada acompañante usan el mismo combobox: los métodos
     reciben su formulario y su estado, y por defecto operan sobre el
     titular para que la plantilla del comprador siga igual de simple. */

  /** Todos los selectores en pantalla: titular + acompañantes. */
  get dialCodePickers(): DialCodePicker[] {
    return [this.buyerExt, ...this.attendees.map(a => a.ext)];
  }

  openExtension(form: FormGroup = this.buyerForm, picker: DialCodePicker = this.buyerExt): void {
    // Solo una lista abierta a la vez: dos desplegables se solaparían.
    this.closeAllExtensions();
    this.filterExtension(form, picker, form.get('extensionPais')?.value ?? '');
    picker.open = true;
  }

  toggleExtension(form: FormGroup = this.buyerForm, picker: DialCodePicker = this.buyerExt): void {
    if (picker.open) {
      this.closeExtension(picker);
      return;
    }
    this.openExtension(form, picker);
  }

  closeExtension(picker: DialCodePicker = this.buyerExt): void {
    picker.open = false;
    picker.highlight = -1;
  }

  private closeAllExtensions(): void {
    this.dialCodePickers.forEach(picker => this.closeExtension(picker));
  }

  /** Al escribir solo dejamos "+" seguido de dígitos y filtramos la lista. */
  onExtensionInput(event: Event, form: FormGroup = this.buyerForm,
                   picker: DialCodePicker = this.buyerExt): void {
    const input = event.target as HTMLInputElement;
    const clean = this.sanitizeDialCode(input.value);
    if (clean !== input.value) {
      input.value = clean;
    }
    const control = form.get('extensionPais');
    if (control && control.value !== clean) {
      // emitModelToViewChange: false → el DOM ya tiene el valor, así no salta el cursor
      control.setValue(clean, { emitModelToViewChange: false });
    }
    this.filterExtension(form, picker, clean);
    picker.open = true;
  }

  selectExtension(country: CountryCode, form: FormGroup = this.buyerForm,
                  picker: DialCodePicker = this.buyerExt): void {
    const control = form.get('extensionPais');
    control?.setValue(country.dialCode);
    control?.markAsTouched();
    this.closeExtension(picker);
  }

  onExtensionKeydown(event: KeyboardEvent, form: FormGroup = this.buyerForm,
                     picker: DialCodePicker = this.buyerExt): void {
    if (event.key === 'Escape' || event.key === 'Tab') {
      this.closeExtension(picker);
      return;
    }

    if (event.key === 'Enter') {
      if (!picker.open) { return; }
      event.preventDefault();   // no enviar el formulario con la lista abierta
      if (picker.highlight > -1) {
        this.selectExtension(picker.filtered[picker.highlight], form, picker);
      } else {
        this.closeExtension(picker);
      }
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') { return; }
    event.preventDefault();
    if (!picker.open) { this.openExtension(form, picker); }
    const total = picker.filtered.length;
    if (!total) { return; }
    const step = event.key === 'ArrowDown' ? 1 : -1;
    picker.highlight = (picker.highlight + step + total) % total;
    this.scrollHighlightIntoView(event.target as HTMLElement, picker.highlight);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const wraps = this.extWrapRefs?.toArray() ?? [];
    // Un clic dentro de cualquier combobox lo maneja el propio control.
    if (wraps.some(w => w.nativeElement.contains(event.target as Node))) { return; }
    this.closeAllExtensions();
  }

  private sanitizeDialCode(raw: string): string {
    const digits = (raw ?? '').replace(/\D/g, '').slice(0, 4);
    return digits ? `+${digits}` : '';
  }

  private filterExtension(form: FormGroup, picker: DialCodePicker, term: string): void {
    const digits = (term ?? '').replace(/\D/g, '');
    picker.filtered = digits
      ? this.countryCodes.filter(c => c.dialCode.slice(1).startsWith(digits))
      : this.countryCodes;
    const current = form.get('extensionPais')?.value;
    picker.highlight = picker.filtered.findIndex(c => c.dialCode === current);
  }

  /** `origin` es el input del combobox: de ahí sale la lista a la que hay
   *  que hacer scroll, sin tener que mapear cada persona a su elemento. */
  private scrollHighlightIntoView(origin: HTMLElement, index: number): void {
    setTimeout(() => {
      const options = origin.closest('.pd-phone-ext-wrap')
        ?.querySelectorAll('.pd-phone-ext-option');
      (options?.[index] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
    });
  }

  invalid(field: string): boolean {
    const control = this.buyerForm.get(field);
    return !!control && control.invalid && (control.touched || this.submitAttempted);
  }

  /** Igual que `invalid`, pero sobre el formulario de un acompañante. */
  attendeeInvalid(slot: AttendeeSlot, field: string): boolean {
    const control = slot.form.get(field);
    return !!control && control.invalid && (control.touched || this.submitAttempted);
  }

  private buildAttendeesPayload(): CheckoutAttendee[] {
    return this.attendees.map(a => {
      const v = a.form.value;
      return {
        full_name: `${v.nombre} ${v.apellido}`,
        email: v.correo,
        phone_country_code: v.extensionPais,
        whatsapp_number: v.celular,
        document: v.documento,
        document_type: v.tipoDocumento,
        sex_id: v.sexoId,
        birth_date: v.fechaNacimiento || null,
      };
    });
  }

  onSubmit(): void {
    this.submitAttempted = true;
    this.scheduleError = this.isService && !this.selectedAppointment;

    if (this.buyerForm.invalid || !this.attendeeFormsValid || this.scheduleError) {
      this.buyerForm.markAllAsTouched();
      this.attendees.forEach(a => a.form.markAllAsTouched());
      return;
    }
    // Se comprueba antes de abrir el widget de pago: descubrirlo después, con
    // el 400 del backend, dejaría al usuario ya metido en el cobro.
    if (this.hasDuplicateDocuments) {
      return;
    }

    const buyer = this.buyerForm.value;
    this.submitting = true;

    this.paymentService.checkout({
      productId: this.product!.id,
      clientFullName: `${buyer.nombre} ${buyer.apellido}`,
      clientEmail: buyer.correo,
      clientPhoneCountryCode: buyer.extensionPais,
      clientWhatsappNumber: buyer.celular,
      document: buyer.documento,
      documentType: buyer.tipoDocumento,
      sexId: buyer.sexoId,
      birthDate: buyer.fechaNacimiento || undefined,
      startTime: this.selectedAppointmentStartTime(),
      psychologist_id: this.isService ? this.selectedPsychologist?.id : undefined,
      attendees: this.buildAttendeesPayload(),
    }).subscribe({
      next: (checkout) => {
        const redirectUrl = `${window.location.origin}/pago-resultado?product_id=${this.product!.id}`;
        this.paymentService.openWompiWidget(checkout, redirectUrl)
          .then((result) => {
            this.submitting = false;
            const status: string = result?.transaction?.status ?? 'ERROR';
            this.paymentStatus = status;
            if (status === 'APPROVED') {
              this.submitted = true;
            }
          })
          .catch((err) => {
            console.error('[PD] Wompi widget error:', err);
            this.submitting = false;
            this.paymentStatus = 'ERROR';
          });
      },
      error: (err) => {
        console.error('[PD] Payments checkout error:', err);
        this.submitting = false;
      }
    });
  }

  /** Fecha/hora real de la cita elegida (día del calendario + hora del slot).
   *  Se ancla a la hora de Colombia (UTC-5, sin DST) para que el instante sea
   *  correcto sin importar la zona horaria del navegador del usuario. */
  private selectedAppointmentStartTime(): Date | undefined {
    if (!this.isService || !this.selectedDay || !this.selectedAppointment) { return undefined; }
    const dateStr = this.toIsoDate(this.selectedDay.date);
    return new Date(`${dateStr}T${this.selectedAppointment.startTime}`);
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

  ngOnDestroy(): void {
    this.clearAttendees();
  }

  /** Descarta los acompañantes y cierra sus búsquedas pendientes. */
  private clearAttendees(): void {
    this.attendeeSubs.forEach(s => s.unsubscribe());
    this.attendeeSubs = [];
    this.attendees.forEach(a => a.lookup$.complete());
    this.attendees = [];
  }

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
    this.paymentStatus = null;
    this.clientLookupLoading = false;
    this.clientFound = false;
    this.documentChecked = false;
    // Al cambiar de producto cambia cuántos asisten: se descartan y se
    // recrean cuando llegue el producto nuevo.
    this.clearAttendees();
    this.closeAllExtensions();
    this.buyerExt.filtered = this.countryCodes;
    this.buyerForm.reset({ tipoDocumento: 'CC', extensionPais: '+57' });
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
