# Automatic Name Capitalization

## Overview

The system now automatically capitalizes the first letter of each word in user names, ensuring consistent formatting across the application.

## Implementation

### Backend Changes

1. **AuthController** (`backend/app/Http/Controllers/AuthController.php`)
   - Added `capitalizeWords()` helper method
   - Applied to `first_name`, `last_name`, and `middle_initial` during registration
   - Converts "mark vincent" → "Mark Vincent"

2. **UserController** (`backend/app/Http/Controllers/UserController.php`)
   - Added `capitalizeWords()` helper method
   - Applied to username updates in profile
   - Ensures consistency when users update their names

### Frontend Changes

1. **Register Component** (`frontend/src/pages/Register.jsx`)
   - Added `handleNameBlur()` function
   - Automatically capitalizes names when user finishes typing (onBlur event)
   - Applied to first name, last name, and middle name fields
   - Updated `generateFullName()` to show capitalized preview

## How It Works

### Backend Logic
```php
private function capitalizeWords($text)
{
    $words = explode(' ', $text);
    $capitalizedWords = array_map(function($word) {
        return ucfirst(strtolower(trim($word)));
    }, $words);
    
    return implode(' ', array_filter($capitalizedWords));
}
```

### Frontend Logic
```javascript
const handleNameBlur = (e) => {
  const { name, value } = e.target;
  if (value.trim()) {
    const capitalizedValue = value.split(' ')
      .map(word => word.trim())
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    setFormData(prev => ({
      ...prev,
      [name]: capitalizedValue
    }));
  }
};
```

## Examples

| Input | Output |
|-------|--------|
| mark vincent | Mark Vincent |
| JOHN SMITH | John Smith |
| mary ann | Mary Ann |
| de la cruz | De La Cruz |
| o'connor | O'connor |

## User Experience

1. **During Registration:**
   - User types their name in any case
   - When they move to the next field (onBlur), the name is automatically capitalized
   - The full name preview shows the properly formatted name

2. **During Profile Update:**
   - Same behavior as registration
   - Names are capitalized on blur

3. **Backend Processing:**
   - All names are capitalized before being saved to the database
   - Ensures consistency even if frontend validation is bypassed

## Notes

- Works with multi-word names (e.g., "Mary Ann" → "Mary Ann")
- Handles extra spaces between words
- Preserves word boundaries
- Both frontend and backend apply the same logic for consistency
