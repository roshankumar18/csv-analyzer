import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(
  "https://ccgecqlgpjjzoqqujqmn.supabase.co",
  process.env.SUPABASE_API_KEY!
);
export class BlobService {
  static async getBuckets() {
    const { data, error } = await supabase.storage
      .from(process.env.BUCKET_NAME!)
      .list();
    return data;
  }
  static async uploadFile(path: string, fileName: string) {
    const file = fs.readFileSync(path);
    const { data, error } = await supabase.storage
      .from(process.env.BUCKET_NAME!)
      .upload(fileName, file);
    console.log({ upload: data, error });
    if (error) {
      throw new Error(error.message);
    }
  }
}
