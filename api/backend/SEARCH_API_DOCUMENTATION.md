# Advanced Search & Filtering API - Phase 4.2 Documentation

## Overview

The Advanced Search & Filtering API provides powerful full-text search, filtering, and suggestion capabilities for the real estate marketplace. Features include real-time search, autocomplete, faceted filtering, search history, and trending searches.

**Base URL:** `http://localhost:5000/api/search`

---

## API Endpoints

### 1. Basic Search

#### `GET /api/search`

Perform a basic full-text search with optional filters.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | No | Search query (searches title, description, location) |
| `sort` | string | No | Sort order: `relevance` (default), `price-asc`, `price-desc`, `newest`, `oldest`, `bedrooms` |
| `type` | string | No | Property type: `apartment`, `house`, `condo`, `studio` |
| `minPrice` | number | No | Minimum price filter |
| `maxPrice` | number | No | Maximum price filter |
| `minBedrooms` | number | No | Minimum number of bedrooms |
| `maxBedrooms` | number | No | Maximum number of bedrooms |
| `minBathrooms` | number | No | Minimum number of bathrooms |
| `maxBathrooms` | number | No | Maximum number of bathrooms |
| `location` | string | No | Filter by city or area |
| `amenities` | string[] | No | Filter by amenities (comma-separated or array) |
| `minSquareFeet` | number | No | Minimum square footage |
| `maxSquareFeet` | number | No | Maximum square footage |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 20, max: 100) |

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/search?q=luxury%20apartment&type=apartment&minPrice=300000&maxPrice=500000&location=New%20York&page=1&limit=20"
```

**Example Request (with JavaScript):**

```javascript
async function searchProperties(query, filters) {
  const params = new URLSearchParams({
    q: query,
    type: filters.type,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    location: filters.location,
    page: 1,
    limit: 20
  });

  const response = await fetch(`/api/search?${params}`);
  const data = await response.json();
  return data;
}

// Usage
const results = await searchProperties('luxury apartment', {
  type: 'apartment',
  minPrice: 300000,
  maxPrice: 500000,
  location: 'New York'
});
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 1,
        "title": "Luxury 3-Bedroom Apartment in Downtown",
        "description": "Beautiful apartment with modern amenities and city views",
        "type": "apartment",
        "location": "Downtown",
        "city": "New York",
        "state": "NY",
        "price": 450000,
        "bedrooms": 3,
        "bathrooms": 2,
        "squareFeet": 2200,
        "mainAmenities": ["parking", "gym", "pool"],
        "relevanceScore": 10
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "query": "luxury apartment",
    "filters": {
      "type": "apartment",
      "location": "New York"
    },
    "sort": "relevance",
    "searchTime": "245.32ms"
  },
  "timestamp": "2026-03-18T10:30:00Z"
}
```

**Error Response (500):**

```json
{
  "success": false,
  "message": "Search failed",
  "error": "Database connection error"
}
```

---

### 2. Advanced Search

#### `GET /api/search/advanced`

Perform advanced search with detailed filtering options.

**Query Parameters:**

Same as Basic Search - `GET /api/search`

**Difference:** Returns additional metadata about filters and suggestions.

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/search/advanced?q=3%20bedroom&minPrice=500000&maxPrice=1000000&minBedrooms=3&amenities=parking&amenities=gym&sort=price-asc"
```

**Example Request (with JavaScript/React):**

```javascript
async function advancedSearchProperties(criteria) {
  const params = new URLSearchParams();
  
  Object.entries(criteria).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v));
    } else if (value !== null && value !== undefined) {
      params.set(key, value);
    }
  });

  const response = await fetch(`/api/search/advanced?${params}`);
  return response.json();
}

// Usage
const results = await advancedSearchProperties({
  q: '3 bedroom',
  minPrice: 500000,
  maxPrice: 1000000,
  minBedrooms: 3,
  amenities: ['parking', 'gym'],
  sort: 'price-asc'
});
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 2,
        "title": "Cozy 2-Bedroom House with Backyard",
        "price": 650000,
        "bedrooms": 2,
        ...
      }
    ],
    "total": 45,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  },
  "appliedCriteria": {
    "q": "3 bedroom",
    "minPrice": 500000,
    "maxPrice": 1000000,
    "amenities": ["parking", "gym"],
    "sort": "price-asc"
  },
  "timestamp": "2026-03-18T10:30:00Z"
}
```

---

### 3. Autocomplete Suggestions

#### `GET /api/search/autocomplete`

Get autocomplete suggestions for search queries (minimum 2 characters).

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Partial search query (min 2 chars) |
| `limit` | number | No | Max suggestions to return (default: 10, max: 50) |

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/search/autocomplete?q=lux&limit=10"
```

**Example Request (with React):**

```javascript
import { useState, useEffect } from 'react';

function SearchBox() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const response = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=10`
      );
      const data = await response.json();
      setSuggestions(data.data.suggestions);
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div>
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search properties..."
      />
      <ul>
        {suggestions.map((suggestion, index) => (
          <li key={index} onClick={() => setQuery(suggestion.text)}>
            {suggestion.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "luxury apartment",
        "type": "general"
      },
      {
        "text": "Luxury 3-Bedroom Apartment in Downtown",
        "type": "general"
      },
      {
        "text": "apartment",
        "type": "type"
      }
    ],
    "query": "lux"
  },
  "timestamp": "2026-03-18T10:30:00Z"
}
```

**Error Response (400):**

```json
{
  "success": true,
  "data": {
    "suggestions": [],
    "message": "Enter at least 2 characters"
  }
}
```

---

### 4. Filter Facets

#### `GET /api/search/facets`

Get available filter facets and their options for UI rendering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filters` | JSON string | No | Currently applied filters |

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/search/facets"
```

**Example Request with Current Filters:**

```bash
curl -X GET "http://localhost:5000/api/search/facets?filters=%7B%22type%22:%22apartment%22%7D"
```

**Example Request (with React):**

```javascript
function FilterPanel() {
  const [facets, setFacets] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});

  useEffect(() => {
    const fetchFacets = async () => {
      const params = new URLSearchParams();
      if (Object.keys(selectedFilters).length > 0) {
        params.set('filters', JSON.stringify(selectedFilters));
      }
      
      const response = await fetch(`/api/search/facets?${params}`);
      const data = await response.json();
      setFacets(data.data);
    };

    fetchFacets();
  }, [selectedFilters]);

  if (!facets) return <div>Loading filters...</div>;

  return (
    <div className="filters">
      <div className="filter-group">
        <h3>Property Type</h3>
        {facets.facets.propertyType.map(type => (
          <label key={type.value}>
            <input 
              type="checkbox"
              onChange={(e) => {
                setSelectedFilters({
                  ...selectedFilters,
                  type: e.target.checked ? type.value : null
                });
              }}
            />
            {type.label} ({type.count})
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h3>Price Range</h3>
        <input 
          type="range" 
          min={facets.facets.priceRange.min}
          max={facets.facets.priceRange.max}
        />
      </div>
    </div>
  );
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "facets": {
      "propertyType": [
        {
          "value": "apartment",
          "label": "Apartment",
          "count": 156
        },
        {
          "value": "house",
          "label": "House",
          "count": 289
        },
        {
          "value": "condo",
          "label": "Condo",
          "count": 142
        },
        {
          "value": "studio",
          "label": "Studio",
          "count": 78
        }
      ],
      "priceRange": {
        "min": 100000,
        "max": 2500000,
        "currentMin": null,
        "currentMax": null
      },
      "bedroomRange": [
        {
          "value": 0,
          "label": "Studio",
          "count": 78
        },
        {
          "value": 1,
          "label": "1 bedroom",
          "count": 234
        },
        {
          "value": 2,
          "label": "2 bedrooms",
          "count": 312
        },
        {
          "value": 3,
          "label": "3 bedrooms",
          "count": 289
        },
        {
          "value": 4,
          "label": "4 bedrooms",
          "count": 145
        },
        {
          "value": 5,
          "label": "5 bedrooms",
          "count": 89
        }
      ],
      "locations": [
        {
          "value": "New York",
          "label": "New York",
          "count": 456
        },
        {
          "value": "San Francisco",
          "label": "San Francisco",
          "count": 234
        },
        {
          "value": "San Diego",
          "label": "San Diego",
          "count": 189
        },
        {
          "value": "Boston",
          "label": "Boston",
          "count": 167
        },
        {
          "value": "Austin",
          "label": "Austin",
          "count": 145
        }
      ],
      "amenities": [
        {
          "value": "parking",
          "label": "Parking",
          "count": 678
        },
        {
          "value": "gym",
          "label": "Gym",
          "count": 423
        },
        {
          "value": "pool",
          "label": "Pool",
          "count": 234
        },
        {
          "value": "doorman",
          "label": "Doorman",
          "count": 156
        }
      ]
    },
    "filterableFields": [
      "type",
      "priceRange",
      "bedrooms",
      "bathrooms",
      "location",
      "amenities",
      "squareFeetRange"
    ],
    "appliedFilters": {}
  },
  "timestamp": "2026-03-18T10:30:00Z"
}
```

---

### 5. Search Suggestions & Refinements

#### `GET /api/search/suggestions`

Get search suggestions and refinement options based on results.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `filters` | JSON string | No | Currently applied filters |

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/search/suggestions?q=apartment&filters=%7B%22location%22:%22New%20York%22%7D"
```

**Example Request (with React):**

```javascript
async function getSuggestions(query, filters) {
  const params = new URLSearchParams({ q: query });
  
  if (filters && Object.keys(filters).length > 0) {
    params.set('filters', JSON.stringify(filters));
  }

  const response = await fetch(`/api/search/suggestions?${params}`);
  const data = await response.json();
  
  return data.data;
}

// Usage
const suggestions = await getSuggestions('apartment', { location: 'New York' });
console.log(suggestions.message); // "234 results found. Refine your search:"
console.log(suggestions.suggestions); // Array of refinement options
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "field": "priceRange",
        "suggestion": "Narrow by price range ($220,000 - $1,200,000)",
        "type": "price"
      },
      {
        "field": "type",
        "suggestion": "Filter by property type: apartment, condo, studio",
        "type": "type"
      }
    ],
    "resultsFound": 234,
    "message": "234 results found. Refine your search:"
  },
  "timestamp": "2026-03-18T10:30:00Z"
}
```

**No Results Response (200):**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "luxury apartment",
        "type": "did-you-mean"
      }
    ],
    "message": "No results found. Did you mean:"
  },
  "timestamp": "2026-03-18T10:30:00Z"
}
```

---

### 6. Search History

#### `GET /api/search/history`

Get authenticated user's search history. **Requires authentication.**

**Authentication:** Bearer token required in `Authorization` header

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Max items to return (default: 10, max: 50) |

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/search/history?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Request (with React):**

```javascript
async function getSearchHistory(token, limit = 10) {
  const response = await fetch(`/api/search/history?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch search history');
  }
  
  return response.json();
}

function SearchHistoryPanel({ authToken }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getSearchHistory(authToken).then(data => {
      setHistory(data.data.history);
    });
  }, [authToken]);

  return (
    <div className="search-history">
      <h3>Recent Searches</h3>
      <ul>
        {history.map((item, index) => (
          <li key={index} onClick={() => performSearch(item.query)}>
            <span>{item.query}</span>
            <span>{item.resultsCount} results</span>
            <span>{new Date(item.searchedAt).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "query": "luxury apartment",
        "filters": { "location": "New York" },
        "resultsCount": 45,
        "searchedAt": "2026-03-18T10:15:00Z"
      },
      {
        "query": "3 bedroom house",
        "filters": { "minPrice": 500000 },
        "resultsCount": 89,
        "searchedAt": "2026-03-18T09:30:00Z"
      }
    ],
    "totalSearches": 45
  },
  "timestamp": "2026-03-18T10:30:00Z"
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Unauthorized - Token required"
}
```

---

### 7. Popular Searches

#### `GET /api/search/popular`

Get trending/popular searches on the platform.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Max items to return (default: 10, max: 50) |

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/search/popular?limit=10"
```

**Example Request (with React):**

```javascript
import { useState, useEffect } from 'react';

function TrendingSearches() {
  const [trendingSearches, setTrendingSearches] = useState([]);

  useEffect(() => {
    const fetchPopularSearches = async () => {
      const response = await fetch('/api/search/popular?limit=10');
      const data = await response.json();
      setTrendingSearches(data.data.popular);
    };

    fetchPopularSearches();
  }, []);

  return (
    <div className="trending">
      <h3>Trending Searches</h3>
      <ul>
        {trendingSearches.map((search, index) => (
          <li key={index} className={search.trending ? 'trending' : ''}>
            <span>{search.query}</span>
            <span className="count">{search.searchCount} searches</span>
            {search.trending && <span className="badge">Trending</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "popular": [
      {
        "query": "luxury apartment",
        "searchCount": 256,
        "trending": true
      },
      {
        "query": "3 bedroom house",
        "searchCount": 189,
        "trending": true
      },
      {
        "query": "waterfront property",
        "searchCount": 145,
        "trending": true
      },
      {
        "query": "studio apartment",
        "searchCount": 78,
        "trending": false
      }
    ],
    "totalUniqueSearches": 234
  },
  "timestamp": "2026-03-18T10:30:00Z"
}
```

---

## Search Scoring Algorithm

### Relevance Score Calculation

The search engine calculates a relevance score for each property based on where the search terms appear:

| Location | Weight | Points |
|----------|--------|--------|
| Title (exact match) | Highest | 10 |
| Location/City/State | High | 8 |
| Description | Medium | 5 |
| Amenities | Low | 3 |

**Example:**
- Query: "luxury apartment downtown"
- Property title includes "Luxury Apartment": +10
- Property location is "Downtown": +8
- Total relevance score: 18

Results are sorted by relevance score (highest first) by default.

---

## Sorting Options

| Sort Value | Description |
|-----------|-------------|
| `relevance` | Sorted by search relevance score (default) |
| `price-asc` | Lowest to highest price |
| `price-desc` | Highest to lowest price |
| `newest` | Most recently listed |
| `oldest` | Originally listed first |
| `bedrooms` | Most bedrooms first |

---

## Filter Examples

### Example 1: 3-Bedroom House Under $800k in California

```bash
curl -X GET "http://localhost:5000/api/search?type=house&minBedrooms=3&maxPrice=800000&location=California"
```

### Example 2: Apartments with Gym in New York, Sorted by Price

```bash
curl -X GET "http://localhost:5000/api/search?q=apartment&type=apartment&amenities=gym&location=New%20York&sort=price-asc"
```

### Example 3: Advanced Search with Multiple Amenities

```bash
curl -X GET "http://localhost:5000/api/search/advanced?q=luxury&type=condo&minPrice=500000&amenities=pool&amenities=gym&amenities=doorman&sort=price-asc&limit=20"
```

### Example 4: Large Properties (4000+ sq ft)

```bash
curl -X GET "http://localhost:5000/api/search?minSquareFeet=4000&minBedrooms=4&sort=price-asc"
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid filter parameters"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Search failed",
  "error": "Database connection error"
}
```

---

## Rate Limiting

- **Public endpoints**: 100 requests per 15 minutes per IP
- **Authenticated endpoints**: 500 requests per 15 minutes per user
- Search history and popular searches: 10 requests per 15 minutes

---

## Frontend Integration Examples

### React Search Component

```javascript
import { useState, useEffect } from 'react';

function PropertySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSearch = async (page = 1) => {
    setLoading(true);
    
    const params = new URLSearchParams({ q: query, page, limit: 20 });
    
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else if (value !== null && value !== undefined) {
        params.set(key, value);
      }
    });

    try {
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      setResults(data.data.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-bar">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search properties..."
        />
        <button onClick={() => handleSearch()}>Search</button>
      </div>

      <div className="filters">
        <select onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="condo">Condo</option>
          <option value="studio">Studio</option>
        </select>

        <input 
          type="number"
          placeholder="Min Price"
          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
        />

        <input 
          type="number"
          placeholder="Max Price"
          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
        />
      </div>

      <div className="results">
        {loading && <div>Loading...</div>}
        {!loading && results.length === 0 && <div>No results found</div>}
        {!loading && results.map(property => (
          <div key={property.id} className="property-card">
            <h3>{property.title}</h3>
            <p>{property.description}</p>
            <p>${property.price.toLocaleString()}</p>
            <p>{property.bedrooms} bed | {property.bathrooms} bath | {property.squareFeet} sqft</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PropertySearch;
```

---

## Best Practices

1. **Debounce Autocomplete Requests**: Implement 300-500ms debounce for autocomplete queries
2. **Cache Facets**: Cache filter facets for 5-10 minutes to reduce server load
3. **Pagination**: Always implement pagination for large result sets
4. **Mobile Optimization**: Use touch-friendly dropdown filters on mobile
5. **Accessibility**: Ensure search inputs have proper labels and ARIA attributes
6. **Analytics**: Track popular searches and refine the search algorithm

---

## Future Enhancements

1. **Elastic Search Integration** - For large datasets and advanced text search
2. **Map-based Search** - Filter by geographic radius
3. **Saved Searches** - Allow users to save favorite search criteria
4. **Search Alerts** - Notify users when new properties match their saved searches
5. **AI Recommendations** - Suggest properties based on search history
6. **Search Analytics Dashboard** - Track popular searches and user behavior
7. **Faceted Search UI** - Advanced filter UI component library
8. **Natural Language Processing** - Understand natural language search queries

---

## Testing

### Test Autocomplete

```bash
curl -X GET "http://localhost:5000/api/search/autocomplete?q=lux"
```

### Test Basic Search

```bash
curl -X GET "http://localhost:5000/api/search?q=apartment&type=apartment&minPrice=300000"
```

### Test Advanced Search with Multiple Filters

```bash
curl -X GET "http://localhost:5000/api/search/advanced?q=3%20bedroom&type=house&minPrice=500000&maxPrice=1000000&minBedrooms=3&amenities=garage&sort=price-asc"
```

### Test Facets

```bash
curl -X GET "http://localhost:5000/api/search/facets"
```

### Test Popular Searches

```bash
curl -X GET "http://localhost:5000/api/search/popular?limit=10"
```

---

## Troubleshooting

### No Search Results

**Problem:** Searching returns 0 results
**Solution:** Check if property data is populated. Verify search terms match property titles/descriptions.

### Slow Search Performance

**Problem:** Search queries are taking >2 seconds
**Solution:** For large datasets, implement Elasticsearch integration for better performance.

### Pagination Issues

**Problem:** Results don't match pagination parameters
**Solution:** Ensure page parameter is >= 1 and limit parameter is <= 100.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-18 | Initial release with 7 endpoints |

---

**Last Updated:** March 18, 2026
**Status:** Production Ready ✅
