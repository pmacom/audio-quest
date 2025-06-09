import { NextResponse } from 'next/server'

export async function GET() {
  // Return a JavaScript response that clears localStorage
  const script = `
    try {
      localStorage.removeItem('videoSourceSettings');
      console.log('Cleared videoSourceSettings from localStorage');
      alert('Browser storage cleared! Please refresh the page.');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      alert('Error clearing browser storage');
    }
  `
  
  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
    },
  })
} 