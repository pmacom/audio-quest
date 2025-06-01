const WebSocket = require('ws');
const protobuf = require('protobufjs');
const fs = require('fs');

console.log('Loading protobuf schema...');

protobuf.load('./src/state.proto', (err, root) => {
  if (err) {
    console.error('Failed to load protobuf schema:', err);
    return;
  }

  const ProtoType = root.lookupType('PrimaryFreq530State');
  console.log('Protobuf schema loaded successfully');

  const ws = new WebSocket('ws://127.0.0.1:8765');
  ws.binaryType = 'arraybuffer';

  ws.on('open', () => {
    console.log('Connected to WebSocket server');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  let messageCount = 0;
  ws.on('message', (data) => {
    try {
      messageCount++;
      const msg = ProtoType.decode(new Uint8Array(data));
      const obj = ProtoType.toObject(msg, { defaults: true });
      
      // Log every 10th message to avoid spam
      if (messageCount % 10 === 0) {
        console.log(`\n--- Message ${messageCount} ---`);
        console.log('Object keys:', Object.keys(obj));
        
        // Check for frequency_grid_map variants
        console.log('frequency_grid_map (snake_case):', obj.frequency_grid_map?.length || 'not found');
        console.log('frequencyGridMap (camelCase):', obj.frequencyGridMap?.length || 'not found');
        
        // Check quantized_bands for comparison (should work)
        console.log('quantized_bands:', obj.quantized_bands?.length || 'not found');
        console.log('quantizedBands:', obj.quantizedBands?.length || 'not found');
        
        // Show first few values if available
        if (obj.frequency_grid_map && obj.frequency_grid_map.length > 0) {
          console.log('frequency_grid_map sample:', obj.frequency_grid_map.slice(0, 5));
        }
        if (obj.frequencyGridMap && obj.frequencyGridMap.length > 0) {
          console.log('frequencyGridMap sample:', obj.frequencyGridMap.slice(0, 5));
        }
        
        // Show other basic fields for comparison
        console.log('time:', obj.time);
        console.log('amplitude:', obj.amplitude);
      }
    } catch (error) {
      console.error('Error decoding message:', error);
    }
  });
}); 