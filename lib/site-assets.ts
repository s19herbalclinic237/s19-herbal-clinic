import { CLINIC_LOGOS, CLINIC_PHOTOS, clinicPhotoSrc } from "@/lib/image-registry";

/**
 * Legacy asset path map.
 *
 * The logo and photo paths are **derived from `lib/image-registry.ts`** rather
 * than typed out here. That matters: these strings used to be hand-written,
 * which is how they ended up as URL-encoded image-generation prompts with spaces
 * in the filenames. Now there is one place an asset is described — slug,
 * dimensions, alt text, caption — and the path is computed from the slug, so a
 * path cannot disagree with the file on disk.
 *
 * New code should prefer `resolveClinicPhoto("labBeakers", locale)` or
 * `CLINIC_LOGOS.fullLight` from the registry, which also gives the intrinsic
 * dimensions needed by `next/image`.
 */
export const S19_ASSETS = {
  logos: {
    fullLight: CLINIC_LOGOS.fullLight.src,
    fullDark: CLINIC_LOGOS.fullDark.src,
    iconLight: CLINIC_LOGOS.iconLight.src,
    iconDark: CLINIC_LOGOS.iconDark.src,
    pattern: CLINIC_LOGOS.pattern.src,
  },
  icons: {
    herbalMedicine: "/some-custom-icons/Herbal-Medicine.svg",
    naturalIngredients: "/some-custom-icons/Natural-Ingredients.svg",
    trustedCare: "/some-custom-icons/Trusted-Care.svg",
    wellnessAndCare: "/some-custom-icons/Wellness-and-Care.svg",
  },
  photos: {
    shopCounter: clinicPhotoSrc(CLINIC_PHOTOS.shopCounter),
    pipetteReading: clinicPhotoSrc(CLINIC_PHOTOS.pipetteReading),
    pipetteTransfer: clinicPhotoSrc(CLINIC_PHOTOS.pipetteTransfer),
    labBeakers: clinicPhotoSrc(CLINIC_PHOTOS.labBeakers),
    labTransfer: clinicPhotoSrc(CLINIC_PHOTOS.labTransfer),
    patientRecords: clinicPhotoSrc(CLINIC_PHOTOS.patientRecords),
    consultationAdvice: clinicPhotoSrc(CLINIC_PHOTOS.consultationAdvice),
    bloodPressure: clinicPhotoSrc(CLINIC_PHOTOS.bloodPressure),
    nutritionBasket: clinicPhotoSrc(CLINIC_PHOTOS.nutritionBasket),
    nutritionBasketOutreach: clinicPhotoSrc(CLINIC_PHOTOS.nutritionBasketOutreach),
    electrolysis: clinicPhotoSrc(CLINIC_PHOTOS.electrolysis),
    cupboardProducts: clinicPhotoSrc(CLINIC_PHOTOS.cupboardProducts),
  },
} as const;
