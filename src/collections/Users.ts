import { CollectionConfig } from "payload/types"
import { isAdmin } from "../access/isAdmin"
import { OTPPayload } from "../types"
import { userRoles } from "../utils/roles"
import { getToken } from "../utils/utils"

const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  labels: {
    singular: "user",
    plural: "users",
  },
  access: {
    create: () => true,
    read: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "role",
      type: "select",
      options: [
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" },
      ],
      required: true,
      defaultValue: "user",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "isVerified",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "otp",
      type: "text",
      maxLength: 4,
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        if (operation === "create") {
          // check if role is valid
          const reqUserRole = req?.user?.role
          console.log({ user: req?.user, data: data })

          if (data.role === "admin" && reqUserRole === "admin") {
            data.isVerified = true
            return data
          }

          if (reqUserRole !== "admin" && !userRoles.includes(data.role)) {
            throw new Error("Invalid Role Assigned To User")
          }

          // generate the email OTP token - max 4 Digits
          let token = getToken()
          if (data.role !== "admin") {
            data.otp = token
            return data
          }
          if (data.role === "admin" && reqUserRole !== "admin") {
            throw new Error(
              "User having role user is not allowed to create user with admin access"
            )
          }
        }
      },
    ],
    afterLogin: [
      async ({ req: { user } }) => {
        // check if account is verified
        if (Number(user.isVerified)) {
          return true
        } else {
          throw new Error("Please Verify Your Account!!")
        }
      },
    ],
  },
  endpoints: [
    {
      path: "/verify",
      method: "post",
      handler: async (req, res, next) => {
        const payload = req.payload
        const body: OTPPayload = req.body

        if (!body?.id || !body?.otp) {
          return res
            .status(400)
            .json({ message: "Please provide a valid otp and user ID" })
        }
        // get user by provided ID
        try {
          const user = await payload.findByID({
            collection: "users",
            id: body.id,
          })
          if (!user) {
            res.status(404).json("No user found with provided user ID")
          }
          // check if account is already verified
          if (Number(user.isVerified)) {
            return res
              .status(200)
              .json({ message: "User account is already verified!" })
          }
          if (user.otp === body.otp) {
            // verify the user account
            await payload.update({
              collection: "users",
              id: body.id,
              data: {
                isVerified: 1,
              },
            })
            res.status(200).json({ message: "OTP verified successfully" })
          } else {
            res.status(400).json({ message: "Invalid OTP Provided" })
          }
        } catch (err) {
          console.log({ err: err.message })
          res.status(500).json({ message: "Internal Server Error" })
        }
      },
    },
  ],
}

export default Users
