import { CollectionConfig } from "payload/types"
export const Media: CollectionConfig = {
  slug: "media",
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  access: {
    read: () => true,
  },
  upload: {
    disableLocalStorage: true,
    staticURL: "/media",
    staticDir: "media",
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: null,
        position: "centre",
      },
      {
        name: "card",
        width: 768,
        height: null,
        position: "centre",
      },
      {
        name: "desktop",
        width: 1440,
        height: null,
        position: "centre",
      },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*"],
  },
}
