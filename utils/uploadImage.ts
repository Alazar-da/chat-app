import imageCompression from "browser-image-compression";

/**
 * Compresses and uploads an image to Cloudinary with:
 *  - Validation (image only)
 *  - Duplicate prevention (based on file hash)
 *  - Compression (~300 KB)
 */
export async function compressAndUploadImage(
  file: File,
  folderPath?: string
): Promise<string> {
  try {
    // ✅ Step 1: Validate file type (only images)
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }

    // ✅ Step 2: Generate a hash to detect duplicate uploads
    const fileHash = await generateFileHash(file);

    // Check if this hash exists in localStorage (or you can check Firestore)
    const existingUrl = localStorage.getItem(`uploaded_${fileHash}`);
    if (existingUrl) {
      console.log("Duplicate detected — using cached URL:", existingUrl);
      return existingUrl; // prevent re-upload
    }

    // ✅ Step 3: Compress the image
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.3, // ~300 KB
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    });

    // ✅ Step 4: Get Cloudinary signature from your API route
const res = await fetch("/api/sign-cloudinary", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ folder: folderPath }),
});

console.log('Response status:', res.status);
console.log('Response ok:', res.ok);

if (!res.ok) {
  const errorText = await res.text();
  console.log('Error response:', errorText);
  throw new Error("Failed to fetch Cloudinary signature");
}

    const { signature, timestamp } = await res.json();

    // ✅ Step 5: Prepare upload form data
    const formData = new FormData();
    formData.append("file", compressedFile);
    formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    if (folderPath) formData.append("folder", folderPath);

    // ✅ Step 6: Upload to Cloudinary
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(data.error?.message || "Cloudinary upload failed");

    // ✅ Step 7: Store the hash and URL to prevent future duplicates
    localStorage.setItem(`uploaded_${fileHash}`, data.secure_url);

    return data.secure_url;
  } catch (error) {
    console.error("Error compressing or uploading image:", error);
    throw error;
  }
}

/**
 * Utility: Generate a hash of the file for duplication checks
 */
async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
