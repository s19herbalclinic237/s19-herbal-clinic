import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Ready for Pickup"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface IOrderItem {
  productId?: string;
  productSlug: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IOrder {
  _id: string;
  orderReference: string;
  user?: string | IUser;
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  shipping: {
    mode: "Pickup" | "Cameroon Delivery" | "Worldwide Delivery";
    city?: string;
    address: string;
    notes?: string;
  };
  payment: {
    method: string;
    status: "Unpaid" | "Paid";
    reference?: string;
  };
  status: OrderStatus;
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderReference: { type: String, required: true, unique: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        productSlug: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    customer: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    shipping: {
      mode: {
        type: String,
        enum: ["Pickup", "Cameroon Delivery", "Worldwide Delivery"],
        required: true,
      },
      city: { type: String, trim: true },
      address: { type: String, required: true, trim: true },
      notes: { type: String, trim: true },
    },
    payment: {
      method: { type: String, required: true },
      status: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
      reference: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Ready for Pickup",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },
  },
  { timestamps: true }
);

OrderSchema.index({ "customer.email": 1, orderReference: 1 });
OrderSchema.index({ user: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  (models.Order as Model<IOrder>) || model<IOrder>("Order", OrderSchema);