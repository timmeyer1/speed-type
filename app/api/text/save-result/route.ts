// app/api/text/save-result/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ServerApiVersion } from "mongodb";

// Type pour les résultats du test de frappe
interface TypingResult {
  userId: string;
  lang: "fr" | "en" | "es";
  wpm: number;
  accuracy: number;
  keystrokes: number;
  errors: number;
  date: string;
  testSessionId?: string; // Identifiant unique pour la session de test
}

if (!process.env.MONGODB_URI) {
  throw new Error("La variable d'environnement MONGODB_URI n'est pas définie");
}

const uri = process.env.MONGODB_URI;

// Création du client MongoDB une seule fois
let clientPromise: Promise<MongoClient>;

// En production, réutiliser la connexion existante
if (process.env.NODE_ENV === 'production') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };
  
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // En développement, créer une nouvelle connexion
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  clientPromise = client.connect();
}

// Noms de la base de données et de la collection
const dbName = "speedtype";
const collectionName = "results";

// Cache pour éviter les enregistrements dupliqués
const processedRequests = new Map<string, Date>();

export async function POST(request: NextRequest) {
  try {
    // Extraire les données du corps de la requête
    const data = await request.json() as TypingResult;
    
    // Validation des données
    if (!data.userId || typeof data.wpm !== 'number' || typeof data.accuracy !== 'number') {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }
    
    // Générer une clé unique pour cette soumission
    const requestKey = data.testSessionId || `${data.userId}_${data.date}`;
    
    // Vérifier si cette soumission n'a pas déjà été traitée récemment
    const now = new Date();
    if (processedRequests.has(requestKey)) {
      // Ignorer les soumissions répétées
      console.log("Soumission dupliquée détectée:", requestKey);
      return NextResponse.json({
        success: true,
        message: "Résultat déjà enregistré"
      }, { status: 200 });
    }
    
    // Marquer cette soumission comme traitée
    processedRequests.set(requestKey, now);
    
    // Nettoyer les entrées anciennes du cache
    processedRequests.forEach((timestamp, key) => {
      if ((now.getTime() - timestamp.getTime()) > 600000) { // 10 minutes
        processedRequests.delete(key);
      }
    });

    // Se connecter à MongoDB
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Vérifier si un résultat similaire existe déjà
    const existingResult = await collection.findOne({
      userId: data.userId,
      date: { 
        $gte: new Date(new Date(data.date).getTime() - 5000),
        $lte: new Date(new Date(data.date).getTime() + 5000)
      }
    });
    
    if (existingResult) {
      console.log("Résultat similaire déjà enregistré en base de données");
      return NextResponse.json({
        success: true,
        id: existingResult._id,
        message: "Résultat déjà enregistré en base de données"
      }, { status: 200 });
    }
    
    // Créer un objet avec les données à insérer
    const resultDocument = {
      userId: data.userId,
      lang: data.lang,
      wpm: data.wpm,
      accuracy: data.accuracy,
      keystrokes: data.keystrokes,
      errors: data.errors,
      testSessionId: data.testSessionId,
      date: new Date(data.date),
      createdAt: new Date()
    };
    
    // Insérer le document dans la collection
    const result = await collection.insertOne(resultDocument);
    
    return NextResponse.json({
      success: true,
      id: result.insertedId,
      message: "Résultat enregistré avec succès"
    }, { status: 201 });
    
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du résultat:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'enregistrement des résultats" },
      { status: 500 }
    );
  }
}

// Gérer la méthode OPTIONS pour CORS
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}