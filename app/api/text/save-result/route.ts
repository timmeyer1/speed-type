// /pages/api/save-result.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const client = new MongoClient(uri);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  try {
    const { lang, wpm, accuracy, keystrokes, errors, date, user_id } = req.body;

    if (!lang || wpm == null || accuracy == null || !date || !user_id) {
      return res.status(400).json({ message: 'Champs manquants' });
    }

    await client.connect();
    const db = client.db('speedtype');
    const collection = db.collection('results');

    const result = await collection.insertOne({
      user_id,
      lang,
      wpm,
      accuracy,
      keystrokes,
      errors,
      date: new Date(date),
    });

    res.status(200).json({ message: 'Résultat sauvegardé', id: result.insertedId });
  } catch (error) {
    console.error('Erreur de sauvegarde :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}