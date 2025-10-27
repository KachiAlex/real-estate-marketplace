import { Helmet } from 'react-helmet-async';

/**
 * SEO Component
 * Handles meta tags, Open Graph tags, and structured data for SEO
 */
const SEO = ({
  title = 'Real Estate Marketplace',
  description = 'Find your dream property - Browse properties for sale, rent, and investment opportunities across Nigeria',
  image = '/og-image.jpg',
  url = 'https://real-estate-marketplace-37544.web.app',
  type = 'website',
  keywords = 'real estate, property, buy property, rent property, investment, Nigeria',
  property = null,
  article = null
}) => {
  const fullTitle = title === 'Real Estate Marketplace' ? title : `${title} | Real Estate Marketplace`;
  const fullImage = image.startsWith('http') ? image : `${url}${image}`;
  const fullUrl = url;

  // Property structured data
  const propertyStructuredData = property ? {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title || title,
    "description": property.description || description,
    "url": `${fullUrl}/property/${property.id}`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.location?.address || "",
      "addressLocality": property.location?.city || "",
      "addressRegion": property.location?.state || "",
      "postalCode": property.location?.zipCode || "",
      "addressCountry": "NG"
    },
    "geo": property.location?.coordinates ? {
      "@type": "GeoCoordinates",
      "latitude": property.location.coordinates.lat,
      "longitude": property.location.coordinates.lng
    } : undefined,
    "price": property.price,
    "priceCurrency": "NGN",
    "floorSize": property.sqft ? {
      "@type": "QuantitativeValue",
      "value": property.sqft,
      "unitCode": "SQM"
    } : undefined,
    "numberOfRooms": property.bedrooms,
    "amenityFeature": property.amenities?.map(amenity => ({
      "@type": "LocationFeatureSpecification",
      "name": amenity
    })),
    "image": property.images && property.images.length > 0 ? property.images : [fullImage]
  } : null;

  // Organization structured data
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Real Estate Marketplace",
    "url": fullUrl,
    "logo": `${fullUrl}/logo.png`,
    "description": description,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "NG"
    },
    "sameAs": [
      "https://facebook.com/realestatemarketplace",
      "https://twitter.com/realestatemarketplace",
      "https://instagram.com/realestatemarketplace"
    ]
  };

  // Article structured data
  const articleStructuredData = article ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title || title,
    "description": article.description || description,
    "image": article.image || fullImage,
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt,
    "author": {
      "@type": "Person",
      "name": article.author || "Real Estate Marketplace"
    }
  } : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="Real Estate Marketplace" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@realestatemarketplace" />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Real Estate Marketplace" />

      {/* Structured Data */}
      {propertyStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(propertyStructuredData)}
        </script>
      )}
      {!property && (
        <script type="application/ld+json">
          {JSON.stringify(organizationStructuredData)}
        </script>
      )}
      {articleStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(articleStructuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
