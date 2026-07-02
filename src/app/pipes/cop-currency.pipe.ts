import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'copCurrency' })
export class CopCurrencyPipe implements PipeTransform {
  transform(value: number): string {
    if (value == null) return '';
    return '$ ' + value.toLocaleString('es-CO') + ' COP';
  }
}
