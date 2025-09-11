import LocalStorage from "@/storage/localStorage";

export async function saveImageDistributor(dataPath, dataURL) {
   const storage = new LocalStorage();
   return await storage.saveWithDataURL(dataPath, dataURL);
}