import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, signal, viewChild } from '@angular/core';
import { RocuAvatarComponent } from './rocu-avatar';

interface Guide {
  id: string;
  label: string;
  title: string;
  intro: string;
  steps: string[];
}

interface PhishingChoice {
  label: string;
  steps: string[];
}

@Component({
  selector: 'ca-chatbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RocuAvatarComponent],
  templateUrl: './chatbox.html',
  styleUrl: './chatbox.css',
})
export class ChatboxComponent {
  readonly isOpen = signal(false);
  readonly showIntroduction = signal(true);
  readonly selectedGuide = signal<Guide | null>(null);
  readonly search = signal('');
  readonly phishingChoice = signal<PhishingChoice | null>(null);
  readonly completedSteps = signal<Set<number>>(new Set());
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('rocuContainer');
  private position = { x: 0, y: 0 };
  private drag: { pointerId: number; x: number; y: number; startX: number; startY: number } | null = null;

  readonly urgentGuide: Guide = {
    id: 'urgent',
    label: 'Necesito ayuda urgente',
    title: 'Ayuda urgente',
    intro: 'Elige las acciones que correspondan a tu situación. No necesitas compartir datos con Rocu.',
    steps: [
      'Si hay peligro físico inmediato, aléjate si puedes hacerlo con seguridad y contacta a los servicios de emergencia de tu localidad.',
      'Si hay dinero o datos bancarios en riesgo, contacta de inmediato a tu banco desde su aplicación oficial o el número de tu tarjeta.',
      'Si recibes amenazas o chantaje, busca a una persona de confianza, conserva las pruebas y contacta a las autoridades locales. Si eres menor de edad, pide ayuda a una persona adulta de confianza.',
      'Si se trata de un equipo de trabajo o estudio, avisa a su equipo de seguridad. Para el resto de los casos, vuelve al inicio y busca la guía más cercana a lo sucedido.',
    ],
  };

  readonly guides: Guide[] = [
    {
      id: 'phishing',
      label: 'Phishing: correo o enlace falso',
      title: 'Phishing: correo o página falsa',
      intro: 'El phishing usa mensajes o páginas falsas para robar información. Lo siguiente depende de lo que compartiste.',
      steps: [
        'Cierra la página. No respondas al mensaje ni abras de nuevo el enlace.',
        'Si escribiste una contraseña, cámbiala desde la aplicación o página oficial, preferiblemente desde otro dispositivo de confianza. Cambia también las cuentas donde la reutilizaste.',
        'Si descargaste o ejecutaste un archivo, desconecta ese dispositivo de internet y busca ayuda técnica de confianza. No borres archivos ni reinstales el sistema antes de recibir orientación.',
        'Si compartiste datos bancarios o hiciste un pago, contacta de inmediato a tu banco mediante su número o aplicación oficial.',
      ],
    },
    {
      id: 'smishing',
      label: 'Smishing: mensaje de texto falso',
      title: 'Smishing: SMS o mensaje falso',
      intro: 'Es una estafa mediante mensajes de texto o mensajería que intentan que abras enlaces o compartas datos.',
      steps: [
        'No respondas ni abras enlaces o archivos del mensaje. Verifica el aviso entrando por la aplicación o sitio oficial, sin usar el enlace recibido.',
        'Si ingresaste una contraseña, cámbiala desde un dispositivo de confianza y cambia también las cuentas donde la reutilizaste.',
        'Si compartiste códigos de verificación o información bancaria, contacta al servicio o banco por su canal oficial inmediatamente.',
        'Conserva el mensaje como evidencia y repórtalo como spam desde la aplicación o a tu operador.',
      ],
    },
    {
      id: 'vishing',
      label: 'Vishing: llamada fraudulenta',
      title: 'Vishing: llamada sospechosa',
      intro: 'Una llamada puede hacerse pasar por tu banco, soporte técnico o una autoridad para pedirte información.',
      steps: [
        'Cuelga y no compartas contraseñas, códigos, datos bancarios ni permitas acceso remoto.',
        'Verifica la situación llamando al número oficial publicado por la entidad o que aparece en tu tarjeta; no uses el número proporcionado por quien llamó.',
        'Si compartiste datos o aprobaste una operación, contacta de inmediato a la entidad afectada y sigue sus instrucciones.',
        'Anota la hora, el número y lo ocurrido; conserva mensajes y comprobantes para reportarlo.',
      ],
    },
    {
      id: 'account',
      label: 'Creo que entraron a mi cuenta',
      title: 'Cuenta posiblemente comprometida',
      intro: 'Actúa desde un dispositivo de confianza y usa solo los canales oficiales del servicio.',
      steps: [
        'Cambia la contraseña de la cuenta y de cualquier otra donde la hayas reutilizado. Si no puedes entrar, usa la recuperación oficial.',
        'Cierra las sesiones y elimina los dispositivos o accesos que no reconozcas desde la configuración de seguridad.',
        'Activa la verificación en dos pasos y revisa si cambiaron el correo o teléfono de recuperación.',
        'Revisa movimientos o mensajes que no reconozcas y avisa a tus contactos si pudieron recibir mensajes fraudulentos.',
      ],
    },
    {
      id: 'malware',
      label: 'Malware: archivo sospechoso',
      title: 'Malware: archivo sospechoso',
      intro: 'Evita volver a abrirlo o compartirlo mientras investigas.',
      steps: [
        'Si lo ejecutaste, desconecta el dispositivo de internet, tanto del Wi-Fi como del cable de red.',
        'Desde otro dispositivo de confianza, cambia las contraseñas importantes que pudieran estar expuestas.',
        'Busca apoyo técnico de confianza. Si es un equipo de trabajo o estudio, avisa a su equipo de seguridad.',
        'No borres el archivo ni reinstales el sistema antes de recibir orientación: podrían necesitarse para investigar.',
      ],
    },
    {
      id: 'ransomware',
      label: 'Ransomware: archivos bloqueados',
      title: 'Ransomware: archivos bloqueados',
      intro: 'Si tus archivos aparecen cifrados o recibiste una exigencia de pago, busca ayuda antes de actuar.',
      steps: [
        'Desconecta el dispositivo de internet y de redes compartidas. Si pertenece a una organización, avisa de inmediato a su equipo de seguridad.',
        'No pagues ni contactes a los atacantes sin asesoría especializada; pagar no garantiza recuperar los archivos.',
        'No borres archivos, mensajes ni reinstales el equipo antes de recibir orientación: pueden ser útiles para la investigación.',
        'Consulta a un especialista sobre la recuperación desde copias de seguridad verificadas y cómo denunciar ante las autoridades locales.',
      ],
    },
    {
      id: 'identity',
      label: 'Suplantación de identidad',
      title: 'Suplantación de identidad',
      intro: 'Alguien podría estar usando tus datos o haciéndose pasar por ti para contactar a otras personas.',
      steps: [
        'Conserva capturas, enlaces, fechas y mensajes sin compartirlos públicamente si contienen datos sensibles.',
        'Reporta el perfil o actividad por el canal oficial de la plataforma y avisa a tus contactos sin reenviar enlaces sospechosos.',
        'Protege las cuentas relacionadas: cambia contraseñas reutilizadas, cierra sesiones desconocidas y activa la verificación en dos pasos.',
        'Si se utilizaron datos financieros o documentos, contacta a la entidad correspondiente y consulta cómo denunciar en tu localidad.',
      ],
    },
    {
      id: 'extortion',
      label: 'Extorsión o chantaje digital',
      title: 'Extorsión o chantaje digital',
      intro: 'No tienes que enfrentar esto a solas. Busca apoyo de alguien de confianza.',
      steps: [
        'No envíes dinero ni más información. No negocies bajo presión.',
        'Conserva la conversación, las amenazas, el perfil y los comprobantes como evidencia. No difundas contenido íntimo.',
        'Reporta la cuenta en la plataforma y busca orientación de las autoridades o de una organización de apoyo local.',
        'Si hay peligro físico inmediato, contacta a los servicios de emergencia de tu localidad. Si eres menor de edad, habla con una persona adulta de confianza.',
      ],
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp: cuenta o código robado',
      title: 'WhatsApp: cuenta comprometida',
      intro: 'Si alguien accedió a tu cuenta o compartiste un código, actúa desde la aplicación oficial.',
      steps: [
        'Avisa a tus contactos por otro medio: alguien podría hacerse pasar por ti y pedirles dinero o códigos.',
        'Intenta recuperar tu cuenta registrando tu número de nuevo en la aplicación oficial y usando el código que recibas. Nunca compartas ese código.',
        'Si recuperas el acceso, revisa los dispositivos vinculados y cierra los que no reconozcas. Activa la verificación en dos pasos.',
        'Si no puedes recuperar la cuenta o hay un PIN que no reconoces, consulta el centro de ayuda oficial de WhatsApp y sigue el proceso de recuperación.',
        'Si perdiste el acceso a tu número o tarjeta SIM, contacta también a tu operador desde un canal oficial.',
      ],
    },
    {
      id: 'support',
      label: 'Falso soporte técnico o acceso remoto',
      title: 'Falso soporte técnico',
      intro: 'Una persona puede fingir ser soporte para pedirte que instales programas o le des acceso al equipo.',
      steps: [
        'Corta la llamada o conversación. No aceptes nuevas conexiones ni uses números o enlaces proporcionados por esa persona.',
        'Si concediste acceso remoto, desconecta el dispositivo de internet y pide ayuda técnica de confianza. Avisa al equipo de seguridad si es un dispositivo de trabajo o estudio.',
        'Desde otro dispositivo de confianza, cambia las contraseñas que pudieran estar expuestas y revisa las sesiones activas.',
        'Si compartiste datos bancarios o realizaste un pago, contacta de inmediato a tu banco mediante su canal oficial.',
        'Conserva mensajes, comprobantes y el nombre del programa instalado para que puedan ayudarte a investigar.',
      ],
    },
    {
      id: 'bank',
      label: 'Compartí datos bancarios',
      title: 'Datos bancarios o pago sospechoso',
      intro: 'Contacta a tu banco cuanto antes; el tiempo puede ser importante.',
      steps: [
        'Llama al número que aparece en tu tarjeta o entra por la aplicación oficial. No uses números o enlaces del mensaje sospechoso.',
        'Explica qué información compartiste y pide orientación para bloquear tarjetas, cuentas o movimientos si corresponde.',
        'Cambia las contraseñas afectadas desde un dispositivo de confianza y activa las alertas de movimientos.',
        'Conserva mensajes y comprobantes. Consulta con el banco y las autoridades locales cómo reportar el fraude.',
      ],
    },
  ];

  readonly filteredGuides = computed(() => {
    const query = this.normalize(this.search().trim());
    if (!query) return this.guides;
    const terms: Record<string, string> = {
      phishing: 'correo email enlace contrasena pagina', smishing: 'sms whatsapp mensaje celular',
      vishing: 'llamada telefono voz', account: 'cuenta contrasena acceso correo',
      malware: 'virus archivo descargar ejecutable', ransomware: 'archivos cifrado rescate bloqueo',
      identity: 'perfil identidad redes suplantacion', extortion: 'amenaza chantaje ayuda urgente',
      whatsapp: 'whatsapp celular telefono codigo sim cuenta', support: 'soporte tecnico llamada remoto acceso',
      bank: 'banco tarjeta dinero pago transferencia fraude',
    };
    return this.guides.filter(guide =>
      query.split(/\s+/).every(word =>
        this.normalize(`${guide.label} ${guide.title} ${terms[guide.id] ?? ''}`).includes(word)
      )
    );
  });

  readonly phishingChoices: PhishingChoice[] = [
    {
      label: 'Solo abrí el enlace',
      steps: [
        'Cierra la página y no descargues archivos ni ingreses información. No vuelvas a abrir el enlace.',
        'Revisa si el navegador descargó algún archivo sin que lo pidieras; no lo abras. Si ejecutaste algo o notas actividad extraña, busca ayuda técnica de confianza.',
        'Verifica cualquier aviso entrando por tu cuenta a la página o aplicación oficial, no desde el mensaje.',
      ],
    },
    {
      label: 'Escribí una contraseña o un código',
      steps: [
        'Desde un dispositivo de confianza, cambia la contraseña mediante el sitio o la aplicación oficial. Cambia también las cuentas donde la reutilizaste.',
        'Cierra sesiones que no reconozcas, revisa los datos de recuperación y activa la verificación en dos pasos.',
        'Si compartiste un código de verificación, contacta al servicio por su canal oficial y revisa si hubo accesos o cambios no autorizados.',
      ],
    },
    {
      label: 'Descargué o ejecuté un archivo',
      steps: [
        'No vuelvas a abrir ni compartas el archivo. Si lo ejecutaste, desconecta el dispositivo de internet.',
        'Pide ayuda técnica de confianza; si es un equipo de trabajo o estudio, avisa a su equipo de seguridad. Conserva el archivo y los mensajes para investigar.',
        'Desde otro dispositivo de confianza, cambia las contraseñas importantes que pudieran estar expuestas.',
      ],
    },
    {
      label: 'Compartí datos bancarios o pagué',
      steps: [
        'Contacta de inmediato a tu banco desde su aplicación oficial o el número de tu tarjeta. Explica qué datos compartiste o qué pago realizaste.',
        'Sigue sus instrucciones para proteger tus tarjetas o cuentas y revisar movimientos sospechosos.',
        'Conserva mensajes y comprobantes, y consulta cómo reportar el fraude a las autoridades locales.',
      ],
    },
    {
      label: 'No estoy seguro o hice varias cosas',
      steps: [
        'Cierra la página y no compartas más información. Si ejecutaste un archivo, desconecta ese dispositivo de internet.',
        'Desde otro dispositivo de confianza, cambia las contraseñas que pudieran estar expuestas y revisa las sesiones activas.',
        'Si pudiste compartir información bancaria o hacer un pago, contacta a tu banco por su canal oficial cuanto antes.',
        'Busca ayuda técnica de confianza y conserva el mensaje y los comprobantes. Puedes volver atrás y revisar las otras opciones.',
      ],
    },
  ];

  private normalize(value: string): string {
    return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  open(): void {
    this.showIntroduction.set(false);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.completedSteps.set(new Set());
    this.drag = null;
    this.position = { x: 0, y: 0 };
    this.container().nativeElement.style.transform = '';
  }

  selectGuide(guide: Guide): void {
    this.phishingChoice.set(null);
    this.completedSteps.set(new Set());
    this.selectedGuide.set(guide);
  }

  reset(): void {
    this.selectedGuide.set(null);
    this.phishingChoice.set(null);
    this.completedSteps.set(new Set());
  }

  selectPhishingChoice(choice: PhishingChoice | null): void {
    this.phishingChoice.set(choice);
    this.completedSteps.set(new Set());
  }

  toggleStep(index: number, checked: boolean): void {
    this.completedSteps.update(current => {
      const next = new Set(current);
      if (checked) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  startDrag(event: PointerEvent): void {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    this.drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: this.position.x, startY: this.position.y };
  }

  moveDrag(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    this.moveTo(this.drag.startX + event.clientX - this.drag.x, this.drag.startY + event.clientY - this.drag.y);
  }

  endDrag(event: PointerEvent): void {
    if (this.drag?.pointerId === event.pointerId) this.drag = null;
  }

  moveWithKeyboard(event: KeyboardEvent): void {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const distance = event.shiftKey ? 40 : 10;
    this.moveTo(this.position.x + direction[0] * distance, this.position.y + direction[1] * distance);
  }

  @HostListener('window:resize')
  keepInViewport(): void {
    if (this.isOpen()) this.moveTo(this.position.x, this.position.y);
  }

  private moveTo(x: number, y: number): void {
    const element = this.container().nativeElement;
    const rect = element.getBoundingClientRect();
    const baseLeft = rect.left - this.position.x;
    const baseTop = rect.top - this.position.y;
    const margin = 8;
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));
    this.position = {
      x: clamp(x, margin - baseLeft, window.innerWidth - margin - rect.width - baseLeft),
      y: clamp(y, margin - baseTop, window.innerHeight - margin - rect.height - baseTop),
    };
    element.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
  }
}
