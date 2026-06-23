import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { ProductType } from '../models/product-type.model';
import { Psychologist } from '../models/psychologist.model';
import { Agenda, Appointment, Day } from '../models/agenda.model';

/**
 * Servicio de productos / agenda.
 *
 * Mientras el backend está en construcción, cada método devuelve datos
 * simulados (mock) con un pequeño delay para imitar la latencia de red.
 * Cuando la API esté lista, basta con descomentar la línea `http` de cada
 * método y eliminar el `return of(...)`.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {

  /** TODO: mover a environment.ts cuando se configure el backend */
  private readonly apiUrl = 'http://localhost:3000/api';

  private readonly productTypes: Record<string, ProductType> = {
    servicio: { id: 'type-servicio', name: 'servicio' },
    producto: { id: 'type-producto', name: 'producto' },
  };

  private readonly psychologists: Psychologist[] = [
    {
      id: 'psy-natalia',
      fullName: 'Natalia Güechá',
      photo: 'assets/images/fotografia1.jpeg',
      headline: 'Psicóloga clínica',
      yearsExperience: 7,
    },
    {
      id: 'psy-sofia',
      fullName: 'Sofía Ramírez',
      photo: 'assets/images/fotografia2.jpeg',
      headline: 'Psicóloga clínica',
      yearsExperience: 5,
    }
  ];

  private readonly products: Product[] = [
    {
      id: 'terapia-individual',
      psychologistId: 'psy-natalia',
      type: this.productTypes['servicio'],
      image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=600&h=400&fit=crop',
      name: 'Terapia individual - Consulta unitaria virtual',
      short: 'Sesión individual para crisis emocionales, decisiones importantes o procesos quincenales.',
      description: ' Hay momentos en que algo explota, se rompe o se estanca — y necesitás hablarlo con alguien que sepa orientarte, no solo escucharte. Esta sesión es para eso: una conversación clínica de 45 a 55 minutos donde evaluamos lo que está pasando, entiendes qué está detrás y sales con claridad sobre qué hacer. Una sesión, un punto de partida real. Adicionalmente aplica también para personas que ya llevan su proceso cada 15 días. Para quien está atravesando una crisis puntual y necesita orientación profesional rápida. Para quien tiene una decisión importante que tomar y no sabe cómo pensarla. Para quien siente que algo en sus relaciones no está funcionando y no entiende bien qué. Para quien nunca fue al psicólogo y quiere probar sin comprometerse a un proceso largo. Para quien está en un momento de quiebre laboral, personal o de pareja y necesita que alguien lo ayude a ver con claridad.',
      price: 40,
      features: [
        'Sesión individual de 45 a 55 minutos por videollamada',
        'Modalidad 100% virtual desde cualquier parte del mundo',
        'Evaluación clínica del motivo de consulta e identificación de patrones o dinamicas que estan generando el problema',
        'Escucha activa y contención emocional',
        'Orientacion concreta sobre que hacer o como pensarlo',
        'Indicación de si el caso requiere procesos mas sostenido y acompañamiento interdisciplinario'
      ],
      format: 'Sesión virtual en vivo',
      category: 'Terapia individual',
      language: 'Español',
      guarantee: 'Confirmación inmediata de tu cita'
    },
    {
      id: 'terapia-pareja',
      psychologistId: 'psy-natalia',
      type: this.productTypes['servicio'],
      image: 'https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=600&h=400&fit=crop',
      name: 'Terapia de pareja - Consulta unitaria virtual',
      short: 'Sesión profesional para resolver conflictos, crisis de comunicación o rupturas de confianza.',
      description: 'Cuando la misma pelea se repite, cuando la comunicación se rompió, cuando uno de los dos siente que ya no puede más — a veces lo que hace falta no es años de terapia sino una sesión donde alguien de afuera vea lo que los dos no pueden ver desde adentro. Esta sesión es ese espacio: un encuentro clínico donde se escucha a los dos, se identifica qué está pasando realmente en el vínculo y se da una dirección concreta de hacia dónde ir. Para la pareja que está en crisis y no sabe si seguir juntos o separarse. Para quienes repiten el mismo ciclo de conflicto sin poder salir. Para quienes sienten que se quieren, pero no saben cómo comunicarse sin que termine en pelea. Para quienes acaban de vivir una ruptura de confianza una infidelidad, una mentira, una traición  y no saben si el vínculo puede sostenerse. Para quienes quieren una mirada externa antes de tomar una decisión importante sobre su relación.',
      price: 46,
      features: [
        'Sesión de pareja de 60 a 75 minutos por videollamada',
        'Modalidad 100% virtual desde cualquier parte del mundo',
        'Incluye evaluación clínica en un espacio equitativo'
      ],
      format: 'Sesión virtual en vivo',
      category: 'Terapia de pareja',
      language: 'Español',
      guarantee: 'Confirmación inmediata de tu cita'
    },
    {
      id: 'terapia-migrantes',
      psychologistId: 'psy-natalia',
      type: this.productTypes['servicio'],
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      name: 'Terapia para migrantes individual - Sesión unitaria virtual',
      short: 'Sesión especializada para latinos viviendo en el exterior que enfrentan soledad o ansiedad.',
      description: 'Llegaste. Lograste lo que querías — o estás en camino. Pero nadie te dijo que ibas a extrañar algo que no sabes nombrar, que la soledad acá es distinta a cualquier soledad que hayas sentido antes, o que el cuerpo iba a reaccionar así. Esta sesión es para el migrante que necesita hablar con alguien que entienda lo que implica vivir entre dos países, sin tener que explicar el contexto desde cero. Una hora para nombrarlo, orientarlo y saber qué hacer con lo que estás cargando. Para el latino que está en el exterior y siente que no está bien aunque "debería estarlo". Para quien lleva meses o años afuera y nunca procesó lo que dejó. Para quien siente que no puede contárselo a la familia de allá sin preocuparlos ni a los amigos de acá sin abrumarlos. Para quien está en el primer año en un país nuevo y la adaptación está siendo más difícil de lo esperado. Para quien vive con ansiedad, insomnio o una tristeza de fondo desde que se fue y no sabe bien si es el lugar, la soledad o algo más.',
      price: 40,
      features: [
        'Sesión individual de 45 a 55 minutos por video llamada',
        'Modalidad 100% virtual para latinos en cualquier parte del mundo',
        'Idioma español, sin barreras culturales ni de contexto',
        'Evaluación del proceso de adaptación y estado emocional actual',
        'Identificación de en que etapa del duelo migratorio se encuentra',
        'Contención y validación del proceso',
        'Herramientas concretas de estabilización emocional para el contexto migrante',
        'Orientación sobre si el caso requiere acompañamiento mas sostenido e interdisciplinario'
      ],
      format: 'Sesión virtual en vivo',
      category: 'Terapia para migrantes',
      language: 'Español',
      guarantee: 'Confirmación inmediata de tu cita'
    },
    {
      id: 'plan-crisis-emocional',
      psychologistId: 'psy-natalia',
      type: this.productTypes['producto'],
      image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&h=400&fit=crop',
      name: 'De 0 a 10 en segundos: tu plan personal para frenar una crisis emocional',
      short: 'Workbook práctico para intervenir antes de explotar emocionalmente.',
      description: '¿Sabes que vas a explotar pero no puedes parar? Este workbook te ayuda a construir tu propio plan de respuesta emocional: uno que reconoce tus señales específicas, identifica tus disparadores y te da pasos concretos para intervenir antes de que la emoción tome el control. No es un libro para leer y guardar. Es una herramienta para completar y tener lista. Cuando terminas estas páginas, salís con algo que podes usar la próxima vez no con más información que olvidar. Para quién es Para el adulto que ya sabe que se desregula y quiere algo concreto para hacer con eso. Para quien explotó esta semana en el trabajo, con la pareja, con su familia y no quiere que vuelva a pasar. Para quien probó respirar hondo y contar hasta diez y no le funcionó. Para quien no tiene tiempo de leer mucho pero sí de aplicar. Para quien está en terapia y quiere herramientas entre sesiones.',
      price: 18.99,
      features: [
        'PDF con herramientas',
        'Incluye tu termómetro emocional, tu mapa de señales físicas por zona y tu plan de crisis en 5 pasos',
        'Incluye tarjeta de bolsillo para imprimir o guardar en el celular',
        'Reutilizable: tu plan funciona para cada crisis futura'
      ],
      format: 'Workbook digital (PDF)',
      category: 'Regulación emocional',
      rating: '96% de evaluaciones positivas',
      language: 'Español',
      guarantee: 'Garantía de 15 días'
    },
    {
      id: 'manual-noche-dificil',
      psychologistId: 'psy-natalia',
      type: this.productTypes['producto'],
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=400&fit=crop',
      name: 'Cuando son las 2am y la cabeza no para: Manual de la noche difícil',
      short: 'Guía práctica para calmar la ansiedad nocturna paso a paso.',
      description: 'Te acostaste hace una hora. La mente no para pensamientos que se encadenan solos, el corazón que late un poco más rápido, ese calor que no te deja quieto/a. Este manual es para ese momento exacto. No para la ansiedad en general para esa noche, para esa hora. Tiene la explicación mínima de por qué pasa (en dos minutos de lectura) y las herramientas concretas para bajar el sistema nervioso cuando ya no podés pensar con claridad: técnicas de activación vagal, ejercicio de descarga mental y un protocolo de 6 pasos en orden para aplicar ahora mismo. Y cuando pase la noche, tiene una rutina de cierre del día para que las próximas sean distintas. Para quién es Para el adulto que se acuesta y la mente empieza sola, sin razón concreta. Para quien ya probó meditación y no le funcionó y ya no sabe qué más intentar. Para el profesional que rinde perfecto de día y se desmorona de noche. Para el migrante para quien la noche es cuando cae todo el peso que durante el día logra sostener. Para quien lleva semanas durmiendo mal y nunca lo trató como algo que tiene solución.',
      price: 18.99,
      features: [
        'PDF optimizado para lectura nocturna en celular',
        'Protocolo de 6 pasos para usar esa misma noche, en orden',
        '3 técnicas de activación vagal explicadas paso a paso: agua fría, humming y respiración diafragmática',
        'Protocolo de sueño',
        'Pensado para tenerlo en el celular y abrirlo cada que necesitas'
      ],
      format: 'Manual digital (PDF)',
      category: 'Ansiedad y sueño',
      rating: '96% de evaluaciones positivas',
      language: 'Español',
      guarantee: 'Garantía de 15 días'
    },
    {
      id: 'duelo-migratorio',
      psychologistId: 'psy-natalia',
      type: this.productTypes['producto'],
      image: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=600&h=400&fit=crop',
      name: 'Todo lo que nadie te dijo que ibas a sentir cuando te fuiste: Duelo migratorio',
      short: 'Ebook para comprender, nombrar y procesar el duelo migratorio.',
      description: 'Elegiste irte. Nadie te obligó y probablemente fue la decisión correcta. Entonces, ¿por qué hay días en que duele tanto algo que elegiste? ¿Por qué extrañas algo que no sabes nombrar? ¿Por qué sonreís perfecto en el trabajo y llegas a tu casa y te sientes vacío/a? Lo que sientes tiene nombre: duelo migratorio. Y que tenga nombre no lo hace menos real lo hace más manejable. Este ebook nombra las cinco pérdidas que nadie cuenta cuando te vas, explica por qué no puedes contárselo a nadie sin sentirte culpable, y te da primeros pasos concretos para empezar a procesar sin bypasses emocionales ni optimismo forzado. No es ingratitud. No es debilidad. Es un proceso real que tiene un nombre, y este ebook te lo da. Para quién es Para el latino en el exterior que se siente culpable por no estar bien habiendo logrado lo que quería. Para quien no puede contárselo a la familia de allá porque no quiere preocuparlos. Para el migrante reciente en su primer o segundo año afuera o para quien lleva años y nunca procesó lo que dejó. Para quien busca que alguien le diga primero que lo que siente es real, antes de que le digan qué hacer con eso. También para quien quiere regalárselo a alguien que acaba de irse o que está lejos y no está bien.',
      price: 18.99,
      features: [
        'PDF narrativo y cálido',
        'Explica las 5 pérdidas del duelo migratorio que nadie nombra: identidad, pertenencia, rutina, red y versión de uno mismo',
        'Incluye un capítulo sobre por qué no puedes contárselo a tu familia ni a tus amigos de acá',
        'Incluye ejercicio de carta de duelo guiada el único punto donde el lector escribe',
        'Cierra con primeros pasos reales para empezar a procesar'
      ],
      format: 'Ebook digital (PDF)',
      category: 'Espiritualidad y migración',
      rating: '96% de evaluaciones positivas',
      language: 'Español',
      guarantee: 'Garantía de 15 días'
    }
  ];

  constructor(private http: HttpClient) { }

  /** Lista completa de productos y servicios */
  getProducts(): Observable<Product[]> {
    // return this.http.get<Product[]>(`${this.apiUrl}/products`);
    return of(this.products).pipe(delay(150));
  }

  /** Producto puntual por id (lo consume product-detail en su ngOnInit) */
  getProductById(id: string): Observable<Product | undefined> {
    // return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
    return of(this.products.find(p => p.id === id)).pipe(delay(150));
  }

  /** Todas las psicólogas registradas */
  getPsychologists(): Observable<Psychologist[]> {
    // return this.http.get<Psychologist[]>(`${this.apiUrl}/psychologists`);
    return of(this.psychologists).pipe(delay(100));
  }

  /** Psicóloga puntual por id */
  getPsychologistById(id: string): Observable<Psychologist | undefined> {
    // return this.http.get<Psychologist>(`${this.apiUrl}/psychologists/${id}`);
    return of(this.psychologists.find(p => p.id === id)).pipe(delay(100));
  }

  getPsychologistsByProduct(productId: string): Observable<Psychologist[]> {
    // return this.http.get<Psychologist[]>(`${this.apiUrl}/products/${productId}/psychologists`);
    const product = this.products.find(p => p.id === productId);
    if (!product) return of([]);
    const psychologist = this.psychologists.find(p => p.id === product.psychologistId);
    return of(psychologist ? [psychologist] : []).pipe(delay(100));
  }

  /** Agenda de disponibilidad de una psicóloga (días y citas). UML: psychologist 1 ── 1 agenda */
  getAgenda(psychologistId: string): Observable<Agenda> {
    // return this.http.get<Agenda>(`${this.apiUrl}/psychologists/${psychologistId}/agenda`);
    return of(this.buildMockAgenda(psychologistId)).pipe(delay(250));
  }

  /**
   * Registra la compra de un producto digital.
   * El backend deberá responder con la confirmación de la orden.
   */
  createOrder(payload: unknown): Observable<{ ok: boolean }> {
    // return this.http.post<{ ok: boolean }>(`${this.apiUrl}/orders`, payload);
    return of({ ok: true }).pipe(delay(800));
  }

  /** Reserva una cita (appointment) en la agenda de la psicóloga. */
  bookAppointment(payload: unknown): Observable<{ ok: boolean }> {
    // return this.http.post<{ ok: boolean }>(`${this.apiUrl}/appointments`, payload);
    return of({ ok: true }).pipe(delay(800));
  }

  /**
   * Genera la agenda simulada de una psicóloga: los próximos 28 días,
   * con cupos y disponibilidad pseudoaleatoria pero determinista para poder
   * probar la UI del calendario. Cada psicóloga tiene horarios, día de
   * descanso y patrón de ocupación distintos.
   */
  private buildMockAgenda(psychologistId: string): Agenda {
    const isSofia = psychologistId === 'psy-sofia';
    const slotStarts = isSofia
      ? ['08:00', '09:00', '11:00', '14:00', '16:00', '19:00']
      : ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '20:00'];
    const restDay = isSofia ? 6 : 0;  // Sofía no atiende sábados; Natalia, domingos
    const busyMod = isSofia ? 3 : 4;  // frecuencia de cupos ya ocupados

    const days: Day[] = [];
    const today = new Date();

    for (let offset = 1; offset <= 28; offset++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
      if (date.getDay() === restDay) { continue; }

      const appointments: Appointment[] = slotStarts.map((start, i) => {
        const [h, m] = start.split(':').map(Number);
        const end = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        return {
          id: `apt-${psychologistId}-${offset}-${i}`,
          startTime: start,
          endingTime: end,
          available: (offset + i) % busyMod !== 0
        };
      });

      days.push({ id: `day-${psychologistId}-${offset}`, date, appointments });
    }

    return { id: `agenda-${psychologistId}`, days };
  }
}
