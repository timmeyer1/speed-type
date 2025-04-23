import mongoose, { Schema, Document, models } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  friends: mongoose.Types.ObjectId[];
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

export const User = models.User || mongoose.model<IUser>("User", UserSchema);
