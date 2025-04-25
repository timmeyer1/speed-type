import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import User from '@/models/User';
import connectToDatabase from '@/lib/mongodb';

export async function POST(request: Request) {
    const { name, email, password, confirmPassword } = await request.json();

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    if (!name || !email || !password || !confirmPassword) {
        return NextResponse.json({ message: " Tous les champs sont requis" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
        return NextResponse.json({ message: "Format de l'email invalide" }, { status: 400 });
    }
    if (confirmPassword !== password) {
        return NextResponse.json({ message: "Les mots de passe ne correspondent pas" }, { status: 400 });
    }
    if (password.length < 6) {
        return NextResponse.json({ message: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
    }

    try {
        await connectToDatabase();
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: "L'utilisateur existe déjà" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            name,
            password: hashedPassword,
        });
        await newUser.save();
        return NextResponse.json({ message: "Utilisateur créé" }, { status: 201 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Quelque chose a mal tourné" }, { status: 500 });
    }
}
