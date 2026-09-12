import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";

export interface ICartItem {
  productId?: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface ICart {
  _id: string;
  user: string | IUser;
  items: ICartItem[];
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        slug: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1, max: 99 },
        image: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const Cart: Model<ICart> =
  (models.Cart as Model<ICart>) || model<ICart>("Cart", CartSchema);