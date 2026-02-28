import { onRequest } from "firebase-functions/v2/https";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { VertexAI } from "@google-cloud/vertexai";
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.VERTEX_AI_PROJECT_ID || "";

const GEMMAHAM_RENDER_PROMPT = `
TASK: Convert the input 2D floor plan into a **photorealistic, top‑down 3D architectural render**.

STRICT REQUIREMENTS (do not violate):
1) **REMOVE ALL TEXT**: Do not render any letters, numbers, labels, dimensions, or annotations. Floors must be continuous where text used to be.
2) **GEOMETRY MUST MATCH**: Walls, rooms, doors, and windows must follow the exact lines and positions in the plan. Do not shift or resize.
3) **TOP‑DOWN ONLY**: Orthographic top‑down view. No perspective tilt.
4) **CLEAN, REALISTIC OUTPUT**: Crisp edges, balanced lighting, and realistic materials. No sketch/hand‑drawn look.
5) **NO EXTRA CONTENT**: Do not add rooms, furniture, or objects that are not clearly indicated by the plan.

STRUCTURE & DETAILS:
- **Walls**: Extrude precisely from the plan lines. Consistent wall height and thickness.
- **Doors**: Convert door swing arcs into open doors, aligned to the plan.
- **Windows**: Convert thin perimeter lines into realistic glass windows.

FURNITURE & ROOM MAPPING (only where icons/fixtures are clearly shown):
- Bed icon → realistic bed with duvet and pillows.
- Sofa icon → modern sectional or sofa.
- Dining table icon → table with chairs.
- Kitchen icon → counters with sink and stove.
- Bathroom icon → toilet, sink, and tub/shower.
- Office/study icon → desk, chair, and minimal shelving.
- Porch/patio/balcony icon → outdoor seating or simple furniture (keep minimal).
- Utility/laundry icon → washer/dryer and minimal cabinetry.

STYLE & LIGHTING:
- Lighting: bright, neutral daylight. High clarity and balanced contrast.
- Materials: realistic wood/tile floors, clean walls, subtle shadows.
- Finish: professional architectural visualization; no text, no watermarks, no logos.`.trim();
const LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";

const MAX_RENDERS_PER_DAY = 10;

export const generate3DView = onRequest(
  {
    cors: [/gemmaham\.web\.app$/, /localhost:\d+$/],
    timeoutSeconds: 120,
    memory: "1GiB",
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { getAuth } = await import("firebase-admin/auth");
    const token = authHeader.split("Bearer ")[1];
    let uid: string;
    try {
      const decoded = await getAuth().verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const { flatId, imageUrl } = req.body as { flatId: string; imageUrl: string };
    if (!flatId || !imageUrl) {
      res.status(400).json({ error: "flatId and imageUrl are required" });
      return;
    }

    // Rate limiting: max renders per user per day
    const db = getFirestore();
    const today = new Date().toISOString().split("T")[0];
    const rateLimitRef = db.collection("rateLimits").doc(`render_${uid}_${today}`);
    const rateLimitSnap = await rateLimitRef.get();
    const currentCount = rateLimitSnap.exists ? (rateLimitSnap.data()?.count ?? 0) : 0;

    if (currentCount >= MAX_RENDERS_PER_DAY) {
      res.status(429).json({ error: `Daily render limit (${MAX_RENDERS_PER_DAY}) reached. Try again tomorrow.` });
      return;
    }

    await rateLimitRef.set({ count: currentCount + 1, uid, date: today }, { merge: true });

    try {
      // Download the floor plan image
      let imageBuffer: Buffer;
      let mimeType: string;
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          res.status(400).json({ error: `Failed to download floor plan image (HTTP ${imageResponse.status})` });
          return;
        }
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        mimeType = imageResponse.headers.get("content-type") || "image/png";
      } catch (downloadErr) {
        console.error("Image download failed:", downloadErr);
        res.status(400).json({ error: "Could not download floor plan image. Check the URL." });
        return;
      }

      // Call Vertex AI
      const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
      const model = vertexAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: GEMMAHAM_RENDER_PROMPT },
              {
                inlineData: {
                  mimeType,
                  data: imageBuffer.toString("base64"),
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        } as any,
      });

      const response = result.response;
      const candidate = response.candidates?.[0];

      // Check for safety filter or other blocking reasons
      if (!candidate) {
        const blockReason = (response as any).promptFeedback?.blockReason;
        console.error("No candidates returned. Block reason:", blockReason);
        res.status(422).json({
          error: blockReason === "SAFETY"
            ? "Image was blocked by safety filters. Try a different floor plan."
            : "AI could not process the image. Please try again.",
        });
        return;
      }

      if (candidate.finishReason === "SAFETY") {
        res.status(422).json({ error: "Generated image was blocked by safety filters. Try a different floor plan." });
        return;
      }

      const parts = candidate.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));

      if (!imagePart || !("inlineData" in imagePart) || !imagePart.inlineData?.data) {
        res.status(500).json({ error: "AI did not return an image. Please try again." });
        return;
      }

      // Upload rendered image to Firebase Storage
      const bucket = getStorage().bucket();
      const filePath = `renders/${flatId}/rendered.png`;
      const file = bucket.file(filePath);
      const renderBuffer = Buffer.from(imagePart.inlineData.data, "base64");

      await file.save(renderBuffer, {
        metadata: { contentType: "image/png" },
      });

      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      const renderedImageUrl = signedUrl;

      // Update flat document in Firestore — rollback uploaded file on failure
      try {
        const db = getFirestore();
        await db.collection("flats").doc(flatId).update({
          renderedImageUrl,
          updatedAt: new Date(),
        });
      } catch (dbErr) {
        console.error("Firestore update failed, deleting orphaned render:", dbErr);
        await file.delete().catch(() => {});
        res.status(500).json({ error: "Failed to save render. Please try again." });
        return;
      }

      res.json({ renderedImageUrl });
    } catch (error: any) {
      console.error("3D generation failed:", error);
      // Check for rate limiting
      if (error?.status === 429 || error?.code === 429) {
        res.status(429).json({ error: "AI rate limit reached. Please wait a moment and try again." });
        return;
      }
      res.status(500).json({ error: "Generation failed. Please try again." });
    }
  }
);
