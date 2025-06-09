The "sort.js" script will look for new video files in either the "../unsorted/masks" or "../unsorted/segment" directories. Each video that is found will then be processed in such a way that it results in this kind of data object that will get inserted into it's corresponding json array. (../data/masks.json or ../data/segments.json)

{
  clipType: "mask" | "segment"
  length: number
  frames: number
  mode: "loop" | "bounce"
  orientation: "landscape" | "portrait" | "square"
  width: number
  height: number
  ratio: [number, number]
  speedMin: number
  speedMax: number
  thumbnailSrc: string
  clipSrc: string
}

a reasonably sized thumbnail image (png) will be generated for each "mask" or "segment" with the same name as the source video filename. The height or width of the thumbnails should never exceed 500px. Generated thumbnails should always be reized with their initial proportions in mind.

length should be in milliseconds

frames should be the amount of frames in the video

The default value for mode should always be "loop" an enum

The orientation should be determined by the initial height and width

speedMin will default to 1
speedMax will default to 1.5

the ratio should contain both the width and height adjusted so that the larger of the two is set to 1, and the other value is adjusted based on the value mapping that takes place, where the other value is always below 1. One of the values should always be 1. Either the height or the width.

with the above knowledge of the video, we should be able to determine the thumbnailSrc and clipSrc before we move the file to the correct location.

video files that are "masks" will be placed in the "Sorter/files/videos/masks" directory
video files that are "segments" will be placed in the "Sorter/files/videos/segments" directory
thumbnails that are "masks" will be placed in the "Sorter/files/thumbnails/masks" directory
thumbnails that are "segments" will be placed in the "Sorter/files/thumbnails/segments" directory

We will set the thumbnail path to be relative to the files directory.  (example: Sorter/files/thumbnails/segments/vid1.png will have the thumbnailSrc path of "thumbnails/segments/vid1.png")

We will set the clipSrc path to be relative to the files directory. (example: Sorter/files/videos/masks/mask1.mp4 will have the clipSrc path of "videos/masks/mask1.mp4")

After the files are moved to the correct directory, we can add the entry into the correct corresponding data file. Either "Sorter/data/masks.json" or "Sorter/data/segments.json"