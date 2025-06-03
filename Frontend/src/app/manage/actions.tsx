"use server"

import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function uploadToPublicDirectory(formData: FormData) {
  try {
    console.log("Server action called - uploadToPublicDirectory")
    
    const file = formData.get("file") as File
    const directoryPath = formData.get("directoryPath") as string

    console.log("File:", file?.name, "Size:", file?.size)
    console.log("Directory path:", directoryPath)

    if (!file || !directoryPath) {
      console.error("Missing file or directory path")
      return { success: false, error: "File or directory path is missing" }
    }

    // Check file size (limit to 500MB)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      console.error("File too large:", file.size)
      return { success: false, error: "File size exceeds 500MB limit" }
    }

    // Create the full path to the public directory
    const publicDir = path.join(process.cwd(), "public")
    const targetDir = path.join(publicDir, directoryPath)

    console.log("Target directory:", targetDir)

    // Ensure the directory exists
    if (!existsSync(targetDir)) {
      console.log("Creating directory:", targetDir)
      await mkdir(targetDir, { recursive: true })
    }

    // Create a safe filename
    const fileName = file.name.replace(/[^a-zA-Z0-9_\-.]/g, "_")
    const filePath = path.join(targetDir, fileName)

    console.log("Writing file to:", filePath)

    // Convert the file to an ArrayBuffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Write the file to the public directory
    await writeFile(filePath, buffer)

    // Return the public URL for the file
    const publicUrl = `${directoryPath}/${fileName}`

    console.log("Upload successful, public URL:", publicUrl)

    return {
      success: true,
      url: publicUrl,
      name: fileName,
      size: file.size,
      type: file.type,
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return {
      success: false,
      error: `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
