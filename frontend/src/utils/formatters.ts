/**
 * Formats a date string or Date object to "DD/MM/YYYY"
 * Examples:
 * - "2026-07-20" -> "20/07/2026"
 * - ISO string -> "20/07/2026"
 */
export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '-';

  if (typeof dateStr === 'string') {
    const cleanStr = dateStr.trim();
    if (!cleanStr) return '-';

    // If already in DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
      return cleanStr;
    }

    // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    const ymdMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      return `${day}/${month}/${year}`;
    }
  }

  const dateObj = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(dateObj.getTime())) return '-';

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date string or Date object to "DD/MM/YYYY - HH:MM:SS"
 */
export function formatDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return '-';

  if (typeof dateStr === 'string') {
    const cleanStr = dateStr.trim();
    if (!cleanStr) return '-';

    // Check if it's YYYY-MM-DD without time
    const ymdMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      return `${day}/${month}/${year} - 00:00:00`;
    }

    // Check if DD/MM/YYYY format without time
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
      return `${cleanStr} - 00:00:00`;
    }

    // If string contains time T or space
    const dateObj = new Date(cleanStr);
    if (!isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
    }
  } else if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return '-';
    const day = String(dateStr.getDate()).padStart(2, '0');
    const month = String(dateStr.getMonth() + 1).padStart(2, '0');
    const year = dateStr.getFullYear();
    const hours = String(dateStr.getHours()).padStart(2, '0');
    const minutes = String(dateStr.getMinutes()).padStart(2, '0');
    const seconds = String(dateStr.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
  }

  return '-';
}

/**
 * Currency formatter
 */
export function formatCurrency(val?: number | null): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

/**
 * Applies telephone/cellular mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export function maskPhoneInput(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : '';
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Formats phone string for display
 */
export function formatPhone(value?: string | null): string {
  if (!value) return '-';
  return maskPhoneInput(value) || '-';
}

/**
 * Applies CNPJ mask: XX.XXX.XXX/XXXX-XX
 */
export function maskCNPJInput(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Formats CNPJ string for display
 */
export function formatCNPJ(value?: string | null): string {
  if (!value) return '-';
  return maskCNPJInput(value) || '-';
}

/**
 * Formats full date with weekday, month name, year and time
 * Example: "segunda-feira, 13 de julho de 2026 às 14:30"
 */
export function formatFullDateWithWeekday(dateStr?: string | Date | null): string {
  let validDate: Date;
  if (!dateStr) {
    validDate = new Date();
  } else if (typeof dateStr === 'string') {
    // If string YYYY-MM-DD
    const ymdMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      validDate = new Date(Number(y), Number(m) - 1, Number(d));
    } else {
      validDate = new Date(dateStr);
    }
  } else {
    validDate = dateStr;
  }

  if (isNaN(validDate.getTime())) validDate = new Date();

  const dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  const diaSemana = dias[validDate.getDay()];
  const diaMes = validDate.getDate();
  const mes = meses[validDate.getMonth()];
  const ano = validDate.getFullYear();
  const horas = String(validDate.getHours()).padStart(2, '0');
  const minutos = String(validDate.getMinutes()).padStart(2, '0');

  return `${diaSemana}, ${diaMes} de ${mes} de ${ano} às ${horas}:${minutos}`;
}

/**
 * Converts a numeric monetary value to Brazilian Portuguese words
 * Example: 17100 -> "Dezessete mil e cem reais"
 */
export function numeroPorExtenso(valor: number): string {
  if (!valor || isNaN(valor)) return 'Zero reais';

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezenasEspeciais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function converterGrupo(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    let res = '';
    if (c > 0) res += centenas[c];

    if (d === 1) {
      if (res) res += ' e ';
      res += dezenasEspeciais[u];
    } else {
      if (d > 1) {
        if (res) res += ' e ';
        res += dezenas[d];
      }
      if (u > 0) {
        if (res) res += ' e ';
        res += unidades[u];
      }
    }
    return res;
  }

  const inteiro = Math.floor(Math.abs(valor));
  const centavos = Math.round((Math.abs(valor) - inteiro) * 100);

  const partesInteiras: string[] = [];

  if (inteiro === 0) {
    // zero
  } else if (inteiro < 1000) {
    partesInteiras.push(converterGrupo(inteiro));
  } else if (inteiro < 1000000) {
    const mil = Math.floor(inteiro / 1000);
    const resto = inteiro % 1000;
    const txtMil = mil === 1 ? 'mil' : `${converterGrupo(mil)} mil`;
    partesInteiras.push(txtMil);
    if (resto > 0) {
      const txtResto = converterGrupo(resto);
      partesInteiras.push(resto < 100 || resto % 100 === 0 ? `e ${txtResto}` : txtResto);
    }
  } else {
    const milhao = Math.floor(inteiro / 1000000);
    const restoMilhao = inteiro % 1000000;
    const txtMilhao = milhao === 1 ? 'um milhão' : `${converterGrupo(milhao)} milhões`;
    partesInteiras.push(txtMilhao);
    if (restoMilhao > 0) {
      if (restoMilhao < 1000) {
        partesInteiras.push(converterGrupo(restoMilhao));
      } else {
        const mil = Math.floor(restoMilhao / 1000);
        const resto = restoMilhao % 1000;
        partesInteiras.push(mil === 1 ? 'mil' : `${converterGrupo(mil)} mil`);
        if (resto > 0) partesInteiras.push(converterGrupo(resto));
      }
    }
  }

  const textoInteiro = partesInteiras.join(' ');
  let resultadoFinal = '';

  if (inteiro > 0) {
    const moeda = inteiro === 1 ? 'real' : 'reais';
    resultadoFinal = `${textoInteiro} ${moeda}`;
  }

  if (centavos > 0) {
    const txtCentavos = converterGrupo(centavos);
    const moedaCentavos = centavos === 1 ? 'centavo' : 'centavos';
    if (resultadoFinal) {
      resultadoFinal += ` e ${txtCentavos} ${moedaCentavos}`;
    } else {
      resultadoFinal = `${txtCentavos} ${moedaCentavos}`;
    }
  }

  if (!resultadoFinal) return 'Zero reais';

  return resultadoFinal.charAt(0).toUpperCase() + resultadoFinal.slice(1);
}

