// Script to clear video settings from localStorage
// Run this in browser console to reset all video settings

console.log('Clearing video settings from localStorage...');

// Clear the video source settings
localStorage.removeItem('videoSourceSettings');

console.log('✅ Video settings cleared!');
console.log('Refresh the page to load fresh settings from JSON files.'); 