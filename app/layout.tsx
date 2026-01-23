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
  metadataBase: new URL('https://www.desabolladosinpinturamds.com.ar'),

  openGraph: {
    title: "DSP-MDS | Técnico Sacabollos - Calidad Original",
    description: "Recuperamos la estética de tu vehículo sin repintar. Especialistas en granizo y bollos de estacionamiento en City Bell.",
    url: 'https://www.desabolladosinpinturamds.com.ar',
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
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KKH8B2MK');`,
          }}
        />
        {/* End Google Tag Manager */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body
        className={`${montserrat.variable} ${playfair.variable} antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KKH8B2MK"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {/* Datos estructurados - Negocio Local */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AutoBodyShop",
              "name": "DSP-MDS Técnico Sacabollos",
              "alternateName": "Desabollado Sin Pintura MDS",
              "description": "Taller especializado en desabollado sin pintura (PDR) en City Bell. Reparación profesional de daños por granizo, golpes de estacionamiento y portazos manteniendo la pintura original del vehículo.",
              "image": [
                "https://www.desabolladosinpinturamds.com.ar/assets/logoHeader.png",
                "https://www.desabolladosinpinturamds.com.ar/assets/taller-sacabollos-city-bell.jpg"
              ],
              "@id": "https://www.desabolladosinpinturamds.com.ar",
              "url": "https://www.desabolladosinpinturamds.com.ar",
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
              "areaServed": [
                { "@type": "City", "name": "City Bell" },
                { "@type": "City", "name": "Gonnet" },
                { "@type": "City", "name": "Villa Elisa" },
                { "@type": "City", "name": "La Plata" },
                { "@type": "City", "name": "Ringuelet" }
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Servicios de Desabollado Sin Pintura",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Reparación de daños por granizo",
                      "description": "Eliminación de abolladuras causadas por tormentas de granizo sin afectar la pintura original"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Reparación de golpes de estacionamiento",
                      "description": "Reparación de bollos y hundimientos por golpes en estacionamientos"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Reparación de portazos",
                      "description": "Eliminación de marcas y abolladuras causadas por puertas de otros vehículos"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Desabollado de capó y techo",
                      "description": "Reparación de abolladuras en superficies amplias manteniendo la pintura de fábrica"
                    }
                  }
                ]
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
              "paymentAccepted": "Efectivo, Transferencia bancaria, Mercado Pago",
              "currenciesAccepted": "ARS",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "30",
                "bestRating": "5"
              },
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
