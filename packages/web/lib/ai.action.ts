import { CLOUD_FUNCTIONS_BASE_URL } from "./constants";
import { getIdToken } from "./auth";

export interface Generate3DViewParams {
  flatId: string;
  imageUrl: string;
}

export const generate3DView = async ({ flatId, imageUrl }: Generate3DViewParams): Promise<{ renderedImageUrl: string | null }> => {
  const token = await getIdToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${CLOUD_FUNCTIONS_BASE_URL}/generate3DView`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ flatId, imageUrl }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`3D generation failed: ${error}`);
  }

  const data = await response.json();
  return { renderedImageUrl: data.renderedImageUrl || null };
};
