'use client';

import dynamic from 'next/dynamic';

// The offer only appears a few seconds after load, so its code is not part of the first bundle
const PopupAd = dynamic(() => import('./PopupAd'), { ssr: false });
export default PopupAd;
