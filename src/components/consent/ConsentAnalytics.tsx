'use client';

import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Only loaded after the visitor picks "Accept all", so first-time visitors never download it
export default function ConsentAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)},{anonymize_ip:true});`}
          </Script>
        </>
      )}
    </>
  );
}
