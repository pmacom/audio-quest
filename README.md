# Audio Quest

This project combines a Rust audio processor with a Next.js frontend. The audio processor streams analysis data over WebSockets, while the frontend provides a management interface and visualizations.

## Prerequisites
- **Node.js** and **pnpm** for the frontend
- **Rust** toolchain for the audio processor
- **ffmpeg** for generating video thumbnails (the script also uses `ffmpeg-static` if available)

## Setup
1. Install Node dependencies:
   ```bash
   cd Frontend
   pnpm install
   ```
2. Generate video metadata and thumbnails:
   ```bash
   pnpm run generate-video-data
   ```
3. Build the Rust application:
   ```bash
   cd ../AudioProcessor
   cargo build
   ```

## Development
- Start the frontend with:
  ```bash
  pnpm dev
  ```
- Run the Rust server separately:
  ```bash
  cargo run
  ```
