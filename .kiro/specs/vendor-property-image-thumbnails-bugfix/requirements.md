# Requirements: Vendor Property Image Thumbnails Fix

## Functional Requirements

### FR1: Image Data Serialization
- **Description**: Backend must parse JSON-stringified image data before returning properties
- **Acceptance Criteria**:
  - Images field in API response is an array, not a string
  - Each image object contains: id, url, name, size, path, isUploaded
  - Parsing errors are handled gracefully (default to empty array)

### FR2: Image Thumbnail Display
- **Description**: VendorProperties component must display the first image as a thumbnail
- **Acceptance Criteria**:
  - First image from images array displays in property card
  - Thumbnail displays with h-48 height class
  - Image displays with proper aspect ratio (object-cover)
  - Fallback image displays only when no images available

### FR3: Image Persistence
- **Description**: Images must persist after property creation and page refresh
- **Acceptance Criteria**:
  - Images uploaded during property creation are saved to database
  - Images are returned when fetching property details
  - Images remain after page refresh
  - Images remain after editing property

### FR4: Multiple Image Support
- **Description**: Properties can have multiple images with first one displayed
- **Acceptance Criteria**:
  - Up to 10 images can be uploaded per property
  - First image displays as thumbnail
  - All images are stored and retrievable
  - Image order is preserved

### FR5: Image Source Support
- **Description**: Support both file uploads and URL-based images
- **Acceptance Criteria**:
  - File uploads create image objects with proper structure
  - URL inputs create image objects with proper structure
  - Both types display correctly as thumbnails
  - Mixed file and URL images work together

### FR6: Defensive Frontend Parsing
- **Description**: Frontend can handle both string and array image formats
- **Acceptance Criteria**:
  - getPropertyImage() handles images as array
  - getPropertyImage() handles images as JSON string
  - getPropertyImage() handles malformed JSON gracefully
  - No console errors when parsing images

## Non-Functional Requirements

### NFR1: Performance
- **Description**: Image display should not impact page load performance
- **Acceptance Criteria**:
  - Image parsing completes in < 10ms
  - No blocking operations during image extraction
  - Lazy loading of images in grid view

### NFR2: Reliability
- **Description**: Image display must be reliable across different scenarios
- **Acceptance Criteria**:
  - No data loss during save/retrieve cycle
  - Graceful fallback when images unavailable
  - No crashes from malformed image data

### NFR3: Maintainability
- **Description**: Code should be maintainable and well-documented
- **Acceptance Criteria**:
  - Clear comments explaining JSON parsing logic
  - Consistent error handling patterns
  - No duplicate parsing logic across handlers

## Data Requirements

### DR1: Image Object Structure
```javascript
{
  id: string | number,           // Unique identifier
  url: string,                   // Image URL (http/https)
  name: string,                  // Original filename
  size: number,                  // File size in bytes
  path: string | null,           // Storage path
  isUploaded: boolean            // Upload completion status
}
```

### DR2: Images Array
- Type: Array<ImageObject>
- Max length: 10 items
- Min length: 0 items
- Stored in database as JSON string
- Returned from API as parsed array

### DR3: Property Object
- Must include `images` field as array
- Images field must be populated from database JSON
- Images field must be accessible to frontend components

## API Requirements

### API1: Create Property Response
- **Endpoint**: POST /api/properties
- **Response Field**: `data.images`
- **Type**: Array<ImageObject>
- **Requirement**: Must be array, not string

### API2: Update Property Response
- **Endpoint**: PUT /api/properties/{id}
- **Response Field**: `data.images`
- **Type**: Array<ImageObject>
- **Requirement**: Must be array, not string

### API3: Get Property Response
- **Endpoint**: GET /api/properties/{id}
- **Response Field**: `data.images`
- **Type**: Array<ImageObject>
- **Requirement**: Must be array, not string

## Component Requirements

### CR1: VendorProperties Component
- Must display first image as thumbnail
- Must handle both string and array image formats
- Must display fallback image when no images available
- Must not throw errors on malformed image data

### CR2: PropertyImageUpload Component
- Must create image objects with correct structure
- Must pass images array to parent component
- Must support both file and URL uploads
- Must maintain image order

## Error Handling Requirements

### ER1: JSON Parsing Errors
- **Scenario**: Backend receives malformed JSON in images field
- **Handling**: Log error, default to empty array
- **Result**: Property displays without images (fallback shown)

### ER2: Missing Images Field
- **Scenario**: Property returned without images field
- **Handling**: Treat as empty array
- **Result**: Fallback image displays

### ER3: Invalid Image URLs
- **Scenario**: Image URL is broken or inaccessible
- **Handling**: Display fallback image on load error
- **Result**: User sees fallback instead of broken image

## Testing Requirements

### TR1: Unit Testing
- Test getPropertyImage() with various input formats
- Test JSON parsing logic with edge cases
- Test fallback behavior

### TR2: Integration Testing
- Test property creation with images
- Test property update with images
- Test property retrieval with images
- Test page refresh persistence

### TR3: Manual Testing
- Create property with single image
- Create property with multiple images
- Create property with URL images
- Create property with mixed images
- Edit property and add images
- Verify images persist after refresh

## Acceptance Criteria Summary

1. ✓ Images display as thumbnails in VendorProperties grid
2. ✓ First image from array displays
3. ✓ Images persist after page refresh
4. ✓ Multiple images supported (first displays)
5. ✓ Both file and URL images work
6. ✓ No console errors
7. ✓ Fallback image displays when no images
8. ✓ Frontend handles both string and array formats
