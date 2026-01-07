import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["700"],
});

export const metadata: Metadata = {
  title: {
    default: "DSP-MDS | Técnico Sacabollos City Bell",
    template: "%s | DSP-MDS"
  },
  description: "Especialista en Desabollado Sin Pintura (DSP/PDR) en City Bell, La Plata. Reparación de granizo y bollos de estacionamiento manteniendo la pintura original. Técnico certificado.",
  keywords: ["sacabollos", "city bell", "la plata", "granizo", "desabollado sin pintura", "PDR", "chapista", "automotor", "bollos", "estética vehicular", "DSP-MDS"],
  authors: [{ name: "Matías Da Silva" }],
  creator: "Matías Da Silva",
  metadataBase: new URL('https://desabolladosinpinturamds.com.ar'), // Replace with actual domain if different later
  openGraph: {
    title: "DSP-MDS | Técnico Sacabollos - Calidad Original",
    description: "Recuperamos la estética de tu vehículo sin repintar. Especialistas en granizo y bollos de estacionamiento en City Bell.",
    url: 'https://desabolladosinpinturamds.com.ar',
    siteName: 'DSP-MDS',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: '/assets/logoHeader.png', // Or a better OG image if available
        width: 800,
        height: 600,
        alt: 'DSP-MDS Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "DSP-MDS | Sacabollos City Bell",
    description: "Técnico certificado en desabollado sin pintura. Tu auto como nuevo, manteniendo su valor original.",
    images: ['/assets/logoHeader.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body
        className={`${montserrat.variable} ${playfair.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AutoRepair",
              "name": "DSP-MDS Técnico Sacabollos",
              "image": "https://desabolladosinpinturamds.com.ar/assets/logoHeader.png",
              "@id": "https://desabolladosinpinturamds.com.ar",
              "url": "https://desabolladosinpinturamds.com.ar",
              "telephone": "+5492215222729",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Calle 461 B e/ 21 y 21 A",
                "addressLocality": "City Bell",
                "addressRegion": "Buenos Aires",
                "postalCode": "1896",
                "addressCountry": "AR"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -34.8753842,
                "longitude": -58.0616247
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday"
                ],
                "opens": "09:00",
                "closes": "18:00"
              },
              "priceRange": "$$",
              "sameAs": [
                "https://www.instagram.com/dspmds.arg/",
                "https://maps.app.goo.gl/xEx31qHu9ckUGTpB8"
              ]
            })
          }}
        />
        {children}
      </body>
    </html>
  );
}
