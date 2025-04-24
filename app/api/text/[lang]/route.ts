import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(request: Request, context: { params: { lang: string } }) {
  // Attendre params avant de l'utiliser
  const params = await Promise.resolve(context.params);
  const { lang } = params;
  
  const allowed = ["fr", "en", "es"];
  if (!allowed.includes(lang)) {
    return NextResponse.json({ error: "Langue invalide" }, { status: 400 });
  }

  // Récupérer le texte précédent s'il est fourni dans l'URL
  const url = new URL(request.url);
  const prevText = url.searchParams.get("prev") || "";

  const filePath = path.join(process.cwd(), "data", "texts", `${lang}.txt`);

  try {
    const raw = await readFile(filePath, "utf-8");

    // Séparer les blocs par ===
    const blocs = raw.split(/^===+$/m).map(b => b.trim()).filter(Boolean);

    if (blocs.length === 0) {
      return NextResponse.json({ error: "Aucun bloc trouvé" }, { status: 404 });
    }

    // Filtrer le texte précédent s'il est fourni
    const disponibleBlocs = prevText 
      ? blocs.filter(bloc => bloc !== prevText) 
      : blocs;
    
    // Si tous les blocs ont été utilisés, revenir à la liste complète
    const selectableBlocs = disponibleBlocs.length > 0 ? disponibleBlocs : blocs;

    // Sélectionner un texte aléatoire parmi les blocs disponibles
    const randomText = selectableBlocs[Math.floor(Math.random() * selectableBlocs.length)];

    return NextResponse.json({ text: randomText });
  } catch (err) {
    console.error("Erreur lecture fichier:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}