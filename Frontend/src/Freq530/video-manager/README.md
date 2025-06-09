# Video Manager Save System

This system provides a comprehensive way to manage video segments, masks, and their settings with proper persistence to the original JSON files.

## How It Works

### 1. Data Flow
- **Load**: Data is loaded from `segments.json`, `masks.json`, and `tags.json` files
- **Edit**: Users can modify settings like enabled state, bounce mode, speed ranges, etc.
- **Save**: Changes are temporarily stored in localStorage while the save button appears
- **Persist**: When save is clicked, changes are written back to the original JSON files and localStorage is cleared

### 2. Save Button Behavior
The save button in the MediaManager header:
- **50% opacity**: No changes detected (everything is saved)
- **100% opacity**: Changes detected (unsaved changes exist)
- **Loading state**: Shows spinner while saving to API
- **Success state**: Briefly shows "Saved" before returning to normal

### 3. API Endpoints
Three API endpoints handle file persistence:
- `POST /api/save-segments` - Updates `public/data/segments.json`
- `POST /api/save-masks` - Updates `public/data/masks.json`  
- `POST /api/save-tags` - Updates `public/data/tags.json`

### 4. Change Detection
The system compares:
- Current state (with user modifications)
- Original JSON file data (loaded on page mount)
- Only saves files that have actual changes

## Usage

### In the Manage Section
The system is integrated into the existing manage section:
- Visit `/manage` or `/manage/segments` for video segments with save functionality
- Visit `/manage/masks` for video masks with save functionality  
- Visit `/manage/tags` for tag management

### Basic Usage
```tsx
import { MediaManager } from "@/Freq530/video-manager/media-manager"

export default function Page() {
  return <MediaManager />
}
```

### Accessing Individual Managers
You can still use the individual managers if needed:
```tsx
import { SegmentsManager } from "@/Freq530/video-manager/segments-manager"
import { MasksManager } from "@/Freq530/video-manager/masks-manager"

// Use without props for standalone operation (localStorage persistence)
<SegmentsManager />
<MasksManager />

// Use with props for controlled operation (parent state management)
<SegmentsManager 
  segments={segments} 
  onSegmentsChange={setSegments} 
/>
```

## Benefits

1. **Portability**: Settings can be backed up and transported between machines
2. **Version Control**: JSON files can be committed to git for proper versioning
3. **Reliability**: No loss of settings due to localStorage clearing
4. **Flexibility**: System falls back to localStorage for temporary changes until next save

## File Structure

```
public/data/
├── segments.json    # Video segment definitions and settings
├── masks.json       # Video mask definitions and settings
└── tags.json        # Tag definitions and colors
```

Each JSON file contains an array of objects with both static metadata (dimensions, duration) and user-configurable settings (enabled state, speed ranges, bounce mode).

## Error Handling

- API failures show alert messages to the user
- Individual file saves are attempted independently (partial success possible)
- LocalStorage is only cleared after ALL saves succeed
- System gracefully falls back to localStorage if API endpoints are unavailable 