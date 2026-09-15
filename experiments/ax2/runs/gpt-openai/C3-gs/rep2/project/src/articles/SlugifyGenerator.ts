import slugify from 'slugify';
import { SlugGenerator } from './ports';

export class SlugifyGenerator implements SlugGenerator {
  /** Converts an article title into a URL-safe slug. */
  public generate(title: string): string {
    return slugify(title, { lower: true, strict: true, trim: true });
  }
}
