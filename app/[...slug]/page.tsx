import Arcade from '@/components/arcade';
import { LocaleProvider } from '@/lib/i18n';

export default function CatchAllPage() {
  return (
    <LocaleProvider>
      <Arcade />
    </LocaleProvider>
  );
}
