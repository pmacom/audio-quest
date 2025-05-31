# Audio WebSocket Server – React Frontend Integration Guide

This project streams real-time audio analysis data over a WebSocket using [Protocol Buffers (Protobuf)](https://developers.google.com/protocol-buffers) for maximum performance and efficiency.

This guide explains how to connect a **React frontend** to the server, decode the Protobuf messages, and use the data in your app.

---

## 1. Start the Rust WebSocket Server

From the project root:

```sh
cargo run
```

The server will prompt you to select an audio device and update rate, then start listening on:

```
ws://127.0.0.1:8765
```

---

## 2. Add Protobuf Support to Your React App

We recommend using [`protobufjs`](https://github.com/protobufjs/protobuf.js/) for decoding messages in the browser.

Install it with:

```sh
pnpm add protobufjs
# or
npm install protobufjs
```

---

## 3. Get the Protobuf Schema

Copy the `state.proto` file from this repo (`src/state.proto`) into your React project (e.g., `public/state.proto`).

---

## 4. Connect and Decode in React

Here is a minimal example using hooks:

```jsx
import React, { useEffect, useRef, useState } from 'react';
import protobuf from 'protobufjs';

export default function AudioWebSocket() {
  const [state, setState] = useState(null);
  const wsRef = useRef(null);
  const protoRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    protobuf.load('/state.proto', (err, root) => {
      if (err) throw err;
      protoRef.current = root.lookupType('PrimaryFreq530State');
      const ws = new WebSocket('ws://127.0.0.1:8765');
      ws.binaryType = 'arraybuffer';
      ws.onmessage = (event) => {
        if (!protoRef.current) return;
        const msg = protoRef.current.decode(new Uint8Array(event.data));
        if (isMounted) setState(msg);
      };
      wsRef.current = ws;
    });
    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  if (!state) return <div>Waiting for audio data...</div>;
  return (
    <div>
      <h2>Audio State</h2>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}
```

- Make sure `/state.proto` is accessible (e.g., put it in your `public/` folder).
- The `state` object will have all the fields defined in the proto schema.

---

## 5. Rendering the Data

You can now use the `state` object to render progress bars, graphs, or any visualization you want. For example:

```jsx
<progress value={state.amplitude} max={1} />
<span>{state.amplitude.toFixed(3)}</span>
```

---

## 6. Troubleshooting

- If you see connection errors, make sure the Rust server is running and accessible at `ws://127.0.0.1:8765`.
- If you see Protobuf decode errors, ensure the `.proto` file matches the server's schema exactly.
- If you change the proto schema, re-copy the file to your React project.

---

## 7. Advanced: Custom Hooks and TypeScript

For a more robust integration, consider generating TypeScript types from your `.proto` file using [`pbjs` and `pbts`](https://github.com/protobufjs/protobuf.js/#command-line).

---

## 8. References

- [protobufjs Documentation](https://github.com/protobufjs/protobuf.js/)
- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Protocol Buffers Language Guide](https://developers.google.com/protocol-buffers/docs/proto3)

---

**Happy hacking!** 