import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "./firebase";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOCUMENT_TYPES = ["application/pdf", ...IMAGE_TYPES];

function validateFile(file: File, maxSizeMB: number, allowedTypes: string[]): void {
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File is too large. Maximum size is ${maxSizeMB} MB.`);
  }
  if (!allowedTypes.includes(file.type)) {
    const readable = allowedTypes.map((t) => t.split("/")[1]).join(", ");
    throw new Error(`Invalid file type. Allowed: ${readable}.`);
  }
}

export const uploadFloorPlan = async (
  companyId: string,
  flatId: string,
  file: File,
): Promise<string> => {
  validateFile(file, 10, IMAGE_TYPES);
  const storageRef = ref(storage, `flats/${companyId}/${flatId}/floor-plan.${getExtension(file)}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
};

export const uploadRenderedImage = async (
  flatId: string,
  blob: Blob,
): Promise<string> => {
  const storageRef = ref(storage, `renders/${flatId}/rendered.png`);
  await uploadBytes(storageRef, blob, { contentType: "image/png" });
  return getDownloadURL(storageRef);
};

export const uploadCompanyLogo = async (
  companyId: string,
  file: File,
): Promise<string> => {
  validateFile(file, 10, IMAGE_TYPES);
  const storageRef = ref(storage, `companies/${companyId}/logo.${getExtension(file)}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
};

export const uploadProfilePhoto = async (
  userId: string,
  file: File,
): Promise<string> => {
  validateFile(file, 5, IMAGE_TYPES);
  const storageRef = ref(storage, `users/${userId}/profile-photo.${getExtension(file)}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
};

export const uploadUserDocument = async (
  userId: string,
  file: File,
  docName: string,
): Promise<string> => {
  validateFile(file, 5, DOCUMENT_TYPES);
  const safeName = docName.replace(/[^a-z0-9-_]/gi, "_");
  const storageRef = ref(storage, `users/${userId}/documents/${safeName}.${getExtension(file)}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
};

export const uploadBuildingCover = async (
  companyId: string,
  buildingId: string,
  file: File,
): Promise<string> => {
  validateFile(file, 10, IMAGE_TYPES);
  const storageRef = ref(storage, `buildings/${companyId}/${buildingId}/cover.${getExtension(file)}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
};

export const uploadConstructionPhoto = async (
  companyId: string,
  buildingId: string,
  file: File,
): Promise<string> => {
  validateFile(file, 10, IMAGE_TYPES);
  const name = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `buildings/${companyId}/${buildingId}/updates/${name}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
};

export const uploadContractorLogo = async (
  companyId: string,
  buildingId: string,
  file: File,
): Promise<string> => {
  validateFile(file, 10, IMAGE_TYPES);
  const name = `${Date.now()}.${getExtension(file)}`;
  const storageRef = ref(storage, `buildings/${companyId}/${buildingId}/contractors/${name}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
};

export const uploadContractorProfileLogo = async (
  contractorId: string,
  file: File,
): Promise<string> => {
  validateFile(file, 5, IMAGE_TYPES);
  const storageRef = ref(storage, `contractors/${contractorId}/logo.${getExtension(file)}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
};

export const uploadHouseCover = async (
  companyId: string,
  houseId: string,
  file: File,
): Promise<string> => {
  validateFile(file, 10, IMAGE_TYPES);
  const storageRef = ref(storage, `houses/${companyId}/${houseId}/cover.${getExtension(file)}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
};

export const uploadHouseFloorPlan = async (
  companyId: string,
  houseId: string,
  file: File,
): Promise<string> => {
  validateFile(file, 10, IMAGE_TYPES);
  const storageRef = ref(storage, `houses/${companyId}/${houseId}/floor-plan.${getExtension(file)}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
};

export const uploadPropertyPhoto = async (
  storagePath: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  validateFile(file, 10, IMAGE_TYPES);
  const name = `${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, "_")}`;
  const storageRef = ref(storage, `${storagePath}/${name}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  onProgress?.(100);
  return getDownloadURL(storageRef);
};

function getExtension(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "png";
}
