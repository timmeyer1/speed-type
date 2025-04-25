import mongoose, { Document, Model, Schema } from 'mongoose';

interface IUser extends Document {
    name: string;
    email: string;
    password?: string; // on met un "?" psq il peut se connecter avec les services
    isAdmin: boolean;
    id: string;
    userconfig_id: mongoose.Types.ObjectId;
}

const UserSchema: Schema<IUser> = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        require: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    userconfig_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserConfig',
    }
})

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;