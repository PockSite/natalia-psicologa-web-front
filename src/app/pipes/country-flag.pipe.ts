import { Pipe, PipeTransform } from '@angular/core';
import { CountryCode } from '../services/client.service';

@Pipe({ name: 'countryFlag' })
export class CountryFlagPipe implements PipeTransform {
  transform(countries: CountryCode[], dialCode: string): string {
    if (!countries?.length || !dialCode) { return '🌍'; }
    return countries.find(c => c.dialCode === dialCode)?.flag ?? '🌍';
  }
}
