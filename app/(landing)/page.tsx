import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Trophy, ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Hero Section */}
      <section className="w-full py-16">
        <div className="container max-w-screen-xl mx-auto">
          <div className="max-w-2xl mx-auto mb-16 text-center">
            <Badge className="mb-4 bg-slate-100 text-slate-800 hover:bg-slate-200">
              Nouveau
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight mb-6">
              Améliorez votre vitesse de frappe en défiant des adversaires
            </h1>

            <p className="text-slate-600 mb-8">
              Un outil simple et efficace pour mesurer et améliorer vos compétences en dactylographie.
            </p>

            <Link href="/test">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white cursor-pointer">
                Commencer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Game Preview */}
          <div className="w-full border border-slate-200 rounded-lg overflow-hidden shadow-sm mb-20">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white">Duel</Badge>
                <span className="text-sm text-slate-500">2 joueurs</span>
              </div>
              <div className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>00:58</span>
              </div>
            </div>
            <div className="p-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border border-slate-200">
                        <AvatarFallback className="bg-slate-100 text-slate-800">JD</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">Vous</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">87 MPM</Badge>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
                    <p className="text-sm font-mono text-slate-800">
                      <span className="text-emerald-600">La vitesse est une mesure</span>
                      <span> relative au temps. Elle définit le rapport entre la distance parcourue par un objet et le temps qu'il met à la...</span>
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border border-slate-200">
                        <AvatarImage src="/api/placeholder/32/32" alt="Avatar adversaire" />
                        <AvatarFallback className="bg-slate-100 text-slate-800">TS</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">Adversaire</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">82 MPM</Badge>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
                    <p className="text-sm font-mono text-slate-800">
                      <span className="text-emerald-600">La vitesse est une mesure</span>
                      <span> relative au temps. Elle définit le rapport entre la...</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="w-full py-16 bg-slate-50">
        <div className="container max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Les meilleurs dactylographes</h2>
              <p className="text-slate-600">Classement des joueurs les plus rapides</p>
            </div>
            <Button variant="outline" className="border-slate-300 text-slate-700">
              Classement complet
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="w-full overflow-hidden border border-slate-200 rounded-lg bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rang</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joueur</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">MPM</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Précision</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { rank: 1, name: "TypingMaster99", wpm: 145, precision: "99.2%" },
                  { rank: 2, name: "SpeedFingers", wpm: 137, precision: "98.7%" },
                  { rank: 3, name: "KeyboardWarrior", wpm: 132, precision: "97.5%" },
                  { rank: 4, name: "SwiftTyper", wpm: 128, precision: "99.0%" },
                  { rank: 5, name: "RapidKeys", wpm: 125, precision: "98.3%" }
                ].map((player, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {player.rank === 1 ? (
                          <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                        ) : (
                          <span className="text-slate-500 text-sm">{player.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border border-slate-200">
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                            {player.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{player.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium">{player.wpm}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium">{player.precision}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full py-16">
        <div className="container max-w-screen-xl mx-auto">
          <h2 className="text-2xl font-semibold mb-10 text-center">Questions fréquentes</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                question: "Comment calcule-t-on les mots par minute ?",
                answer: "La méthode standard considère 5 caractères comme un mot. Votre score MPM est calculé en divisant le nombre total de caractères tapés par 5, puis par le temps en minutes."
              },
              {
                question: "Le service est-il gratuit ?",
                answer: "Oui, l'utilisation de base de SpeedType est entièrement gratuite. Un abonnement premium offre des fonctionnalités supplémentaires comme des statistiques avancées."
              },
              {
                question: "Puis-je jouer sur mobile ?",
                answer: "Absolument ! SpeedType est optimisé pour tous les appareils, des ordinateurs de bureau aux smartphones, avec une expérience adaptée à chaque écran."
              },
              {
                question: "Comment fonctionnent les matchs versus ?",
                answer: "Vous et votre adversaire recevez le même texte à taper. Le gagnant est celui qui termine le plus rapidement ou qui a tapé le plus de mots avec précision."
              }
            ].map((item, index) => (
              <div key={index} className="border-b border-slate-200 pb-4">
                <h3 className="font-medium text-lg mb-3">{item.question}</h3>
                <p className="text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-16 bg-slate-50 border-t border-slate-200">
        <div className="container max-w-screen-xl mx-auto text-center">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Prêt à améliorer votre vitesse de frappe ?</h2>
            <p className="text-slate-600 mb-8">
              Rejoignez notre communauté de dactylographes et progressez en vous amusant.
            </p>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white px-8">
              Commencer gratuitement
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}