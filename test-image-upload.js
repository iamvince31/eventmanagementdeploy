// Test script to verify image upload CORB fix
// Run this in browser console on your frontend

async function testImageUpload() {
  console.log('Testing image upload CORB fix...');
  
  // Create a test image file
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 100, 100);
  
  // Convert to blob
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const file = new File([blob], 'test-image.png', { type: 'image/png' });
  
  // Create FormData
  const formData = new FormData();
  formData.append('title', 'Test Event');
  formData.append('description', 'Testing image upload');
  formData.append('location', 'Test Location');
  formData.append('event_type', 'event');
  formData.append('date', new Date().toISOString().split('T')[0]);
  formData.append('time', '10:00');
  formData.append('school_year', '2025-2026');
  formData.append('is_urgent', '0');
  formData.append('images[]', file);
  
  try {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
        'Accept': 'application/json'
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Image upload successful!', result);
      return true;
    } else {
      console.error('❌ Image upload failed:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
}

// Run the test
testImageUpload().then(success => {
  if (success) {
    console.log('🎉 CORB issue appears to be fixed!');
  } else {
    console.log('⚠️ CORB issue may still exist. Check network tab for details.');
  }
});