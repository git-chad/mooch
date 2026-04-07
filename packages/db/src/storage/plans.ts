import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadPlanAttachment(
    supabase: SupabaseClient,
    groupId: string,
    planId: string,
    file: File | Blob,
    fileName: string
): Promise<string> {
    const filePath = `${groupId}/${planId}/${fileName}`;

    const { error, data } = await supabase.storage
        .from("plan-attachments")
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (error || !data) {
        console.error("[uploadPlanAttachment] Upload failed:", error);
        throw error;
    }

    return data.path;
}

export async function deletePlanAttachmentFile(
    supabase: SupabaseClient,
    filePath: string
): Promise<void> {
    const { error } = await supabase.storage
        .from("plan-attachments")
        .remove([filePath]);

    if (error) {
        console.error("[deletePlanAttachmentFile] Delete failed:", error);
        throw error;
    }
}

export async function getSignedPlanAttachmentUrl(
    supabase: SupabaseClient,
    filePath: string
): Promise<string | null> {
    const { data, error } = await supabase.storage
        .from("plan-attachments")
        .createSignedUrl(filePath, 3600); // 1 hour

    if (error || !data) {
        console.error("[getSignedPlanAttachmentUrl] Failed to get signed URL:", error);
        return null;
    }

    return data.signedUrl;
}
