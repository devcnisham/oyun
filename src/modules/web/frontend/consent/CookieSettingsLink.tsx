'use client';

import { openConsentSettings } from '@/modules/web/frontend/consent/consent';

export default function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={openConsentSettings}>
      Cookie settings
    </button>
  );
}
