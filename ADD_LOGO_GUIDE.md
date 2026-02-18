# Adding CEIT Logo to Navigation Bar

## Step 1: Add Your Logo Image

1. Place your logo image file in the `frontend/public` folder
   - Recommended name: `CEIT-LOGO.png` or `CEIT-LOGO.svg`
   - Recommended size: 40-50px height for navbar
   - Supported formats: PNG, SVG, JPG, WebP

Example path: `frontend/public/CEIT-LOGO.png`

## Step 2: Update Navigation Bars

The logo needs to be added to all pages with navigation bars:

### Pages to Update:
1. `frontend/src/pages/Dashboard.jsx`
2. `frontend/src/pages/AddEvent.jsx`
3. `frontend/src/pages/AccountDashboard.jsx`
4. Any other pages with navigation

### Code Changes:

Replace the calendar icon button with an image logo:

**Before:**
```jsx
<button className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200">
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
</button>
```

**After:**
```jsx
<img 
  src="/CEIT-LOGO.png" 
  alt="CEIT Logo" 
  className="h-10 w-auto"
/>
```

Or if you want it clickable to go home:
```jsx
<button 
  onClick={() => navigate('/dashboard')}
  className="p-1 rounded-lg hover:bg-white/20 transition-colors duration-200"
>
  <img 
    src="/CEIT-LOGO.png" 
    alt="CEIT Logo" 
    className="h-10 w-auto"
  />
</button>
```

## Step 3: Styling Options

### Option 1: Logo Only
```jsx
<img 
  src="/CEIT-LOGO.png" 
  alt="CEIT Logo" 
  className="h-10 w-auto"
/>
```

### Option 2: Logo + Text
```jsx
<div className="flex items-center space-x-3">
  <img 
    src="/CEIT-LOGO.png" 
    alt="CEIT Logo" 
    className="h-10 w-auto"
  />
  <div>
    <h1 className="text-2xl font-bold text-white tracking-tight">Event Management</h1>
    <p className="text-xs text-green-200 font-medium">Dashboard</p>
  </div>
</div>
```

### Option 3: Logo with Background
```jsx
<div className="bg-white/10 rounded-lg p-2">
  <img 
    src="/CEIT-LOGO.png" 
    alt="CEIT Logo" 
    className="h-8 w-auto"
  />
</div>
```

## Step 4: Responsive Design

For mobile responsiveness:
```jsx
<img 
  src="/CEIT-LOGO.png" 
  alt="CEIT Logo" 
  className="h-8 sm:h-10 w-auto"
/>
```

## Complete Example

Here's a complete navbar with logo:

```jsx
<nav className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 shadow-lg sticky top-0 z-20">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16 gap-4">
      <div className="flex items-center space-x-3 flex-1">
        {/* Logo */}
        <img 
          src="/CEIT-LOGO.png" 
          alt="CEIT Logo" 
          className="h-10 w-auto"
        />
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Event Management</h1>
          <p className="text-xs text-green-200 font-medium">Dashboard</p>
        </div>
      </div>
      {/* Rest of navbar... */}
    </div>
  </div>
</nav>
```

## Tips

1. **SVG Format**: Use SVG for best quality at any size
2. **PNG Format**: Use PNG with transparent background
3. **Size**: Keep file size under 100KB for fast loading
4. **Dimensions**: 40-50px height works well for navbar
5. **Color**: If logo has dark colors, consider a white/light version for the green navbar

## Troubleshooting

### Logo not showing?
- Check file path: `/CEIT-LOGO.png` (must be in `frontend/public/`)
- Check file name matches exactly (case-sensitive)
- Clear browser cache (Ctrl+F5)

### Logo too big/small?
- Adjust `h-10` class (h-8, h-12, etc.)
- Use `w-auto` to maintain aspect ratio

### Logo looks blurry?
- Use higher resolution image (2x or 3x size)
- Use SVG format for perfect scaling
