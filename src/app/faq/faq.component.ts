import { Component } from '@angular/core';

export interface FaqItem {
  question: string;
  /** Respuesta directa de 2-3 frases, citable por buscadores y asistentes de IA. Admite HTML inline (enlaces). */
  answer: string;
}

/**
 * Preguntas frecuentes de la portada.
 *
 * Las preguntas y respuestas deben mantenerse sincronizadas con el bloque
 * FAQPage del JSON-LD de src/index.html y con src/seo/index.md.
 */
@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {

  /** Fecha de la última revisión del contenido (E-E-A-T). Formato ISO para <time datetime>. */
  readonly updatedIso = '2026-09-11';
  readonly updatedLabel = '11 de septiembre de 2026';

  faqs: FaqItem[] = [
    {
      question: '¿Cómo funciona una sesión de terapia online con Natalia Güechá?',
      answer:
        'Las sesiones son por videollamada, individuales (1 a 1) o de pareja, y duran alrededor de una hora. ' +
        'Eliges la psicóloga, el día y la hora en el calendario de disponibilidad de cada ' +
        '<a href="#proyectos">servicio</a>, y recibes el enlace de conexión al confirmar la reserva. ' +
        'Solo necesitas un dispositivo con cámara, conexión a internet y un espacio privado.'
    },
    {
      question: '¿Cuánto cuesta una sesión y cómo se paga?',
      answer:
        'El precio de cada sesión y de cada producto digital se publica en pesos colombianos (COP) en su ficha, ' +
        'dentro de la sección <a href="#proyectos">Servicios</a>. El pago se hace en línea con tarjeta de crédito ' +
        'o débito, PSE o Nequi a través de la pasarela Wompi, y si vives fuera de Colombia puedes pagar con tarjeta internacional.'
    },
    {
      question: '¿Atienden a personas que viven fuera de Colombia?',
      answer:
        'Sí. La consulta está en Bogotá, pero la atención es principalmente virtual y en español, por lo que acompañamos ' +
        'a personas de toda Latinoamérica y de España. Al agendar, el horario se muestra en hora de Bogotá (UTC-5); ' +
        'solo tienes que ajustarlo a tu zona horaria.'
    },
    {
      question: '¿Qué problemas trata una psicóloga clínica online?',
      answer:
        'Natalia Güechá Nieto es magíster en psicología clínica y especialista en intervención psicológica en situaciones de crisis. ' +
        'Las áreas de trabajo más habituales son ansiedad y estrés, ataques de pánico, autoestima, terapia de pareja, ' +
        'duelo, regulación emocional y crecimiento personal. Puedes conocer al <a href="#equipo">equipo de psicólogas</a> que la acompaña.'
    },
    {
      question: '¿Cómo agendo mi primera consulta?',
      answer:
        'Entra en <a href="#proyectos">Servicios</a>, abre la ficha de la sesión que te interesa, elige psicóloga, fecha y hora, ' +
        'y completa el pago en línea; la reserva queda confirmada al instante. Si prefieres resolver dudas antes, ' +
        'escribe por WhatsApp al <a href="https://wa.me/573104671284" target="_blank" rel="noopener">+57 310 4671284</a> o ' +
        'usa el formulario de <a href="#contacto">contacto</a>.'
    },
    {
      question: '¿La terapia online es confidencial? ¿Y si estoy en crisis?',
      answer:
        'Sí: la información de las sesiones está protegida por el secreto profesional (Ley 1090 de 2006) y por la ' +
        '<a href="/privacy">política de tratamiento de datos</a> de la consulta. Este sitio no atiende urgencias: si estás en ' +
        'riesgo vital, llama a la línea de emergencias de tu país (123 en Colombia, 112 en España) o acude a urgencias.'
    }
  ];

  trackByQuestion(_index: number, item: FaqItem): string {
    return item.question;
  }
}
