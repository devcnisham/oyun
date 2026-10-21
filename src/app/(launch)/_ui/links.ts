import { hostFor } from '@/lib/hosts';

// Where the buttons go. The booking site is closed until launch; until then app.oyun.co.in sends visitors to the countdown page.
export const APP_URL = `https://${hostFor('app')}/`;
export const HELP_URL = `https://${hostFor('help')}/help`;
