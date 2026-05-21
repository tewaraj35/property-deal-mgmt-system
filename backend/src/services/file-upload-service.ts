import { supabaseAdmin } from "./supabase-service";
import { supabaseService } from "./supabase-service";
import { FileUpload } from "../types";

const BUCKET_NAME = "entity-files";
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/jpeg",
  "image/png",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * File upload service - manage file storage and database records
 */
export const fileUploadService = {
  /**
   * Upload file to storage and create database record
   */
  async uploadFile(
    uploadedById: string,
    entityType: string,
    entityId: string,
    fileData: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<FileUpload> {
    // Validate input
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`MIME type ${mimeType} not allowed`);
    }

    if (fileData.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Validate entity exists
    const entityTable = entityType === "loan_client" ? "loan_clients" : `${entityType}s`;
    const { data: entity, error: entityError } = await supabaseAdmin
      .from(entityTable)
      .select("id")
      .eq("id", entityId)
      .single();

    if (entityError || !entity) {
      throw new Error(`${entityType} with ID ${entityId} not found`);
    }

    // Create storage path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${entityType}/${entityId}/${timestamp}-${sanitizedFileName}`;

    try {
      // Upload to Supabase storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileData, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error: dbError } = await supabaseAdmin
        .from("file_uploads")
        .insert([
          {
            uploaded_by_id: uploadedById,
            entity_type: entityType,
            entity_id: entityId,
            file_name: fileName,
            file_path: filePath,
            file_size_bytes: fileData.length,
            mime_type: mimeType,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // Audit log
      await supabaseService.createAuditLog(
        uploadedById,
        "CREATE",
        "file_uploads",
        data.id,
        null,
        data
      );

      return {
        id: data.id,
        uploadedById: data.uploaded_by_id,
        entityType: data.entity_type,
        entityId: data.entity_id,
        fileName: data.file_name,
        filePath: data.file_path,
        fileSizeBytes: data.file_size_bytes,
        mimeType: data.mime_type,
        createdAt: data.created_at,
      };
    } catch (error: any) {
      // Clean up uploaded file if database operation fails
      try {
        await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath]);
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded file:", cleanupError);
      }
      throw error;
    }
  },

  /**
   * Get all files for an entity
   */
  async getFilesByEntity(entityType: string, entityId: string): Promise<FileUpload[]> {
    const { data, error } = await supabaseAdmin
      .from("file_uploads")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((file: any) => ({
      id: file.id,
      uploadedById: file.uploaded_by_id,
      entityType: file.entity_type,
      entityId: file.entity_id,
      fileName: file.file_name,
      filePath: file.file_path,
      fileSizeBytes: file.file_size_bytes,
      mimeType: file.mime_type,
      createdAt: file.created_at,
    }));
  },

  /**
   * Get single file
   */
  async getFileById(fileId: string): Promise<FileUpload> {
    const { data, error } = await supabaseAdmin
      .from("file_uploads")
      .select("*")
      .eq("id", fileId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      uploadedById: data.uploaded_by_id,
      entityType: data.entity_type,
      entityId: data.entity_id,
      fileName: data.file_name,
      filePath: data.file_path,
      fileSizeBytes: data.file_size_bytes,
      mimeType: data.mime_type,
      createdAt: data.created_at,
    };
  },

  /**
   * Download file data
   */
  async downloadFile(fileId: string): Promise<{ data: Uint8Array; file: FileUpload }> {
    // Get file record
    const file = await this.getFileById(fileId);

    // Download from storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(file.filePath);

    if (error) throw error;

    return { data: new Uint8Array(await data.arrayBuffer()), file };
  },

  /**
   * Delete file
   */
  async deleteFile(fileId: string, deletedById: string): Promise<void> {
    // Get file record
    const file = await this.getFileById(fileId);

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([file.filePath]);

    if (storageError) throw storageError;

    // Delete database record
    const { error: dbError } = await supabaseAdmin
      .from("file_uploads")
      .delete()
      .eq("id", fileId);

    if (dbError) throw dbError;

    // Audit log
    await supabaseService.createAuditLog(
      deletedById,
      "DELETE",
      "file_uploads",
      fileId,
      file,
      null
    );
  },

  /**
   * Get total file count (for analytics)
   */
  async getTotalFileCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from("file_uploads")
      .select("id", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
  },
};
