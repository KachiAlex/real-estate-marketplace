# Global Search Feature

## Overview
The PropertyArk application now includes a comprehensive global search functionality that allows users to search across properties, investments, and users from anywhere in the application.

## Features

### 1. **Multi-Category Search**
- Search across three main categories: Properties, Investments, and Users
- Real-time filtering with debounced search (300ms delay)
- Tab-based navigation to filter results by category

### 2. **Search Capabilities**

#### Properties Search
- Searches through: title, description, location/address
- Returns up to 5 results per search
- Displays: property image, title, location, and price

#### Investments Search
- Searches through: title, description, city, address, sponsor name
- Returns up to 5 results per search
- Displays: investment image, title, location, expected ROI, and minimum investment

#### Users Search (Mock Data)
- Searches through: name and email
- Returns up to 5 results per search
- Displays: user avatar, name, email, and role

### 3. **Keyboard Shortcuts**
- **Ctrl+K** (Windows/Linux) or **Cmd+K** (Mac): Open global search
- **Esc**: Close search modal
- Quick access from the header search bar

### 4. **User Interface**
- Clean modal overlay with backdrop
- Responsive design for mobile and desktop
- Visual indicators for different result types (icons and colors)
- Empty state messages for no results or initial state
- Result count display in footer

### 5. **Navigation**
- Click any result to navigate to its detail page:
  - Properties â†’ `/property/:id`
  - Investments â†’ `/investment/:id`
  - Users â†’ `/profile/:id`
- Automatic modal closure on result selection

## Technical Implementation

### Components

#### `src/components/GlobalSearch.js`
Main search modal component with:
- Real-time search with debouncing
- Tab-based filtering
- Result display with formatting
- Click-outside-to-close functionality
- Keyboard event handling for ESC key

#### `src/hooks/useGlobalSearch.js`
Custom hook for managing global search state:
- `isSearchOpen`: Boolean state for modal visibility
- `openSearch()`: Function to open the search modal
- `closeSearch()`: Function to close the search modal
- `handleResultClick(type, item)`: Navigation handler for search results

### Context Methods

#### PropertyContext
- `searchProperties(query, filters)`: Enhanced method for client-side property search
  - Supports search by: title, description, location, address
  - Supports filters: minPrice, maxPrice, bedrooms, bathrooms, minArea, maxArea, features

#### InvestmentContext
- `searchInvestments(query, filters)`: New method for investment search
  - Supports search by: title, description, city, address, sponsor name
  - Supports filters: type, status, minAmount, maxAmount, minROI, maxROI, duration, location, riskLevel

### Integration

The global search is integrated into the header (`src/components/layout/Header.js`):
1. Search input in the header opens the global search modal
2. Keyboard shortcut (Ctrl+K / Cmd+K) registered globally
3. Modal renders conditionally when `isSearchOpen` is true

## Usage

### For Users
1. Click the search bar in the header or press **Ctrl+K** / **Cmd+K**
2. Type your search query
3. Use tabs to filter by category (All, Properties, Investments, Users)
4. Click on any result to navigate to its detail page
5. Press **Esc** or click outside to close the search

### For Developers
To use the global search in a custom component:

```javascript
import { useGlobalSearch } from '../hooks/useGlobalSearch';

function MyComponent() {
  const { openSearch, isSearchOpen, closeSearch, handleResultClick } = useGlobalSearch();
  
  return (
    <>
      <button onClick={openSearch}>Open Search</button>
      {isSearchOpen && (
        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={closeSearch}
          onResultClick={handleResultClick}
        />
      )}
    </>
  );
}
```

## Future Enhancements

Potential improvements for the global search feature:

1. **Backend Integration**
   - Connect to real API endpoints for property and investment search
   - Implement server-side pagination for large result sets
   - Add full-text search with relevance scoring

2. **Advanced Filters**
   - Add quick filter chips in the search modal
   - Save recent searches
   - Search suggestions based on user history

3. **Search Analytics**
   - Track popular search terms
   - Implement autocomplete suggestions
   - Show trending searches

4. **Performance Optimization**
   - Implement virtual scrolling for large result sets
   - Add result caching to reduce API calls
   - Optimize search debouncing based on user typing patterns

5. **Accessibility**
   - Add ARIA labels and roles
   - Improve keyboard navigation within results
   - Support screen readers

6. **Mobile Experience**
   - Full-screen search on mobile devices
   - Voice search capability
   - Optimize touch interactions

## Files Modified/Created

### Created
- `src/components/GlobalSearch.js` - Main search component
- `src/hooks/useGlobalSearch.js` - Search state management hook
- `GLOBAL_SEARCH_FEATURE.md` - This documentation file

### Modified
- `src/components/layout/Header.js` - Added search integration and keyboard shortcuts
- `src/contexts/InvestmentContext.js` - Added search and filter methods
- `src/contexts/PropertyContext.js` - Enhanced search and filter methods

## Testing

To test the global search feature:

1. **Basic Search**
   - Open the app and press Ctrl+K / Cmd+K
   - Type a property name or location
   - Verify results appear in the "Properties" tab

2. **Investment Search**
   - Search for investment terms like "commercial" or "residential"
   - Switch to "Investments" tab
   - Verify investment opportunities are displayed

3. **Tab Filtering**
   - Perform a search that matches multiple categories
   - Switch between tabs (All, Properties, Investments, Users)
   - Verify result counts update correctly

4. **Navigation**
   - Click on a search result
   - Verify navigation to the correct detail page
   - Verify modal closes after navigation

5. **Keyboard Shortcuts**
   - Test Ctrl+K / Cmd+K to open search
   - Test ESC to close search
   - Verify keyboard shortcuts work from any page

6. **Empty States**
   - Search for a term with no results
   - Verify empty state message appears
   - Clear search and verify initial state message

## Conclusion

The global search feature provides a powerful and intuitive way for users to find properties, investments, and users across the PropertyArk platform. With its clean interface, keyboard shortcuts, and real-time filtering, it significantly enhances the user experience and makes navigation more efficient.


