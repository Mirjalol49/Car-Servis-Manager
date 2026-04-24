import { supabaseAdmin } from "./supabase"
import { randomBytes } from "crypto"

export async function uploadFile(
  file: File,
  bucket: string,
  folder: string
): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const timestamp = Date.now()
  const randomId = randomBytes(4).toString("hex")
  const extension = file.name.split(".").pop()
  const fileName = `${folder}/${timestamp}-${randomId}.${extension}`

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error("Supabase upload error:", error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return publicUrlData.publicUrl
}

export async function deleteFile(url: string, bucket: string): Promise<void> {
  try {
    // Extract the file path from the public URL
    // Format is usually: https://[project].supabase.co/storage/v1/object/public/[bucket]/[folder]/[filename]
    const urlParts = url.split(`/public/${bucket}/`)
    if (urlParts.length !== 2) {
      console.warn(`Could not extract path from URL: ${url}`)
      return
    }

    const filePath = urlParts[1]

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error("Supabase delete error:", error)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  } catch (error) {
    console.error("Error deleting file:", error)
    // We don't throw here to prevent failing a cascading delete operation if the file is already gone
  }
}
