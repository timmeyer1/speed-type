"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

type Langue = "fr" | "en" | "es";

interface TextLine {
  id: string;
  text: string;
  completed: boolean;
}

export default function TypingTest() {
  const [lang, setLang] = useState<Langue>("fr");
  const [lines, setLines] = useState<TextLine[]>([]);
  const [userInput, setUserInput] = useState("");
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);
  const totalTypedRef = useRef(0);
  const errorCountRef = useRef(0);
  const totalKeystrokesRef = useRef(0);
  const previousInputLengthRef = useRef(0);
  const [textBuffer, setTextBuffer] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lineCompleteCallbackRef = useRef<(() => void) | null>(null);
  const currentCharCountRef = useRef(0);
  const { data: session } = useSession();

  // Précharger des textes pour éviter les délais d'API
  const prefetchTexts = useCallback(async () => {
    try {
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(fetch(`/api/text/${lang}`).then(res => res.json()));
      }
      const results = await Promise.all(promises);
      const texts = results.map(data => data.text || "");
      return texts.join(" ");
    } catch (error) {
      console.error("Erreur lors du préchargement des textes:", error);
      return "";
    }
  }, [lang]);

  // Ajuster le traitement du texte pour avoir des lignes plus uniformes
  const processText = useCallback((text: string) => {
    const words = text.split(" ");
    const chunkedLines: string[] = [];
    let currentChunk = [];
    const maxWordsPerLine = 6;

    for (let i = 0; i < words.length; i++) {
      currentChunk.push(words[i]);

      if (currentChunk.length === maxWordsPerLine || i === words.length - 1) {
        // Ajouter un espace à la fin de chaque ligne et normaliser la longueur
        let lineText = currentChunk.join(" ") + " ";
        chunkedLines.push(lineText);
        currentChunk = [];
      }
    }

    return chunkedLines;
  }, []);

  const loadInitialText = useCallback(async () => {
    const combinedText = await prefetchTexts();
    const chunkedLines = processText(combinedText);

    // Préparer les 3 premières lignes pour l'affichage
    const initialLines = chunkedLines.slice(0, 3).map((text, index) => ({
      id: `line-${Date.now()}-${index}`,
      text,
      completed: false
    }));

    const remainingLines = chunkedLines.slice(3);

    setLines(initialLines);
    setTextBuffer(remainingLines);
    resetStats();

    // Précharger plus de texte en arrière-plan
    setTimeout(() => {
      prefetchTexts().then(newText => {
        const newLines = processText(newText);
        setTextBuffer(prev => [...prev, ...newLines]);
      });
    }, 1000);
  }, [lang, prefetchTexts, processText]);

  const resetStats = useCallback(() => {
    setUserInput("");
    setStarted(false);
    setTimeLeft(60);
    setWpm(0);
    setAccuracy(100);
    totalTypedRef.current = 0;
    errorCountRef.current = 0;
    totalKeystrokesRef.current = 0;
    previousInputLengthRef.current = 0;
    currentCharCountRef.current = 0;
    startTimeRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
      const remaining = Math.max(0, 60 - elapsedSeconds);
      setTimeLeft(remaining);

      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        inputRef.current?.blur();
      }

      // Mettre à jour les statistiques en temps réel
      updateStats();
    }, 100);
  }, []);

  const updateStats = useCallback(() => {
    if (!startTimeRef.current) return;

    const charCount = totalTypedRef.current * 5 + currentCharCountRef.current;
    const words = charCount / 5;
    const minutes = (Date.now() - startTimeRef.current) / 60000;
    const currentWpm = Math.round(words / (minutes || 0.01));

    // Calcul de la précision
    const totalStrokes = totalKeystrokesRef.current || 1;
    const currentAccuracy = Math.round(((totalStrokes - errorCountRef.current) / totalStrokes) * 100);

    // Mettre à jour l'état de manière optimisée
    requestAnimationFrame(() => {
      setWpm(currentWpm);
      setAccuracy(currentAccuracy);
    });
  }, []);

  const handleLineCompletion = useCallback(() => {
    // Éviter les traitements redondants
    if (lineCompleteCallbackRef.current) {
      return;
    }

    // Mettre à jour les statistiques
    const currentLine = lines[0]?.text || "";
    const wordCount = currentLine.trim().split(/\s+/).length;
    totalTypedRef.current += wordCount;

    // Réinitialiser le compteur de caractères pour la nouvelle ligne
    currentCharCountRef.current = 0;

    // Marquer la ligne comme terminée
    setLines(prevLines => {
      const updatedLines = [...prevLines];
      if (updatedLines.length > 0) {
        updatedLines[0] = { ...updatedLines[0], completed: true };
      }
      return updatedLines;
    });

    // Réinitialiser l'entrée utilisateur
    setUserInput("");
    previousInputLengthRef.current = 0;

    // Utiliser un callback pour éviter les mises à jour multiples
    lineCompleteCallbackRef.current = () => {
      setLines(prevLines => {
        // Supprimer la première ligne (celle qui est complétée)
        const newLines = prevLines.filter((_, index) => index !== 0);

        // Ajouter une nouvelle ligne depuis le buffer
        if (textBuffer.length > 0) {
          const nextLine = textBuffer[0];
          const remainingBuffer = textBuffer.slice(1);

          // Ajouter cette ligne aux lignes actives
          newLines.push({
            id: `line-${Date.now()}`,
            text: nextLine,
            completed: false
          });

          // Mettre à jour le buffer
          setTextBuffer(remainingBuffer);

          // Vérifier si on doit charger plus de texte en arrière-plan
          if (remainingBuffer.length < 10) {
            prefetchTexts().then(newText => {
              const newLines = processText(newText);
              setTextBuffer(prev => [...prev, ...newLines]);
            });
          }
        }

        return newLines;
      });

      // Réinitialiser le callback
      lineCompleteCallbackRef.current = null;
    };

    // Exécuter le callback après un délai minimal
    requestAnimationFrame(() => {
      if (lineCompleteCallbackRef.current) {
        lineCompleteCallbackRef.current();
      }
    });

    // Mettre à jour les statistiques après avoir complété la ligne
    updateStats();
  }, [lines, textBuffer, prefetchTexts, processText, updateStats]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const valueLength = value.length;

    if (!started && valueLength > 0) {
      setStarted(true);
      startTimer();
    }

    if (lines.length === 0) return;

    const currentLine = lines[0]?.text || "";

    // Détecter les erreurs - optimisé pour la performance
    if (valueLength > previousInputLengthRef.current) {
      const lastCharIndex = valueLength - 1;
      if (value[lastCharIndex] !== currentLine[lastCharIndex]) {
        errorCountRef.current++;
      }
      totalKeystrokesRef.current++;

      // Mettre à jour le compteur de caractères pour le calcul des WPM en temps réel
      currentCharCountRef.current = valueLength;

      // Mettre à jour les statistiques à chaque frappe
      updateStats();
    } else if (valueLength < previousInputLengthRef.current) {
      // Si l'utilisateur efface des caractères, mettre à jour le compteur
      currentCharCountRef.current = valueLength;
      // Mettre également à jour les statistiques
      updateStats();
    }

    previousInputLengthRef.current = valueLength;

    // Vérifier si la ligne est terminée
    if (valueLength === currentLine.length) {
      handleLineCompletion();
      return;
    }

    setUserInput(value);
  }, [started, lines, startTimer, handleLineCompletion, updateStats]);

  // Gestionnaire pour bloquer le copier-coller
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    // Optionnel: afficher un message d'avertissement
    console.log("Le copier-coller n'est pas autorisé dans ce test de frappe!");
  }, []);

  // Gestionnaire pour bloquer le clic droit (menu contextuel)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Empêcher le glisser-déposer de texte
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Empêcher le glissement de texte
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const restart = useCallback(() => {
    loadInitialText();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [loadInitialText]);

  // Utiliser useMemo pour optimiser le rendu
  const renderedActiveLine = useMemo(() => {
    if (lines.length === 0) return null;

    const currentLine = lines[0];

    return (
      <div className="mb-2 md:mb-4 font-mono text-lg sm:text-xl font-medium h-6 sm:h-8 flex items-center justify-center" style={{ transition: 'none' }}>
        <div className="w-full text-center">
          {currentLine.text.split("").map((char, i) => {
            let className = "text-gray-500";
            if (i < userInput.length) {
              className = userInput[i] === char ? "text-green-700 font-bold" : "text-red-600 font-bold";
            } else if (i === userInput.length) {
              className += " relative after:absolute after:left-0 after:bottom-0 after:w-[2px] after:h-5 sm:after:h-6 after:bg-black after:animate-pulse";
            }

            return (
              <span key={i} className={className} style={{ transition: 'none' }}>
                {char}
              </span>
            );
          })}
        </div>
      </div>
    );
  }, [lines, userInput]);

  // Calculer le dégradé pour les lignes à venir
  const renderedUpcomingLines = useMemo(() => {
    return lines.slice(1).map((line, index) => {
      // Calculer l'opacité pour l'effet de dégradé - plus foncée pour la première ligne, puis s'estompe
      const opacity = 0.9 - (index * 0.2);

      return (
        <motion.div
          key={line.id}
          initial={{ opacity: opacity, y: 10 }}
          animate={{ opacity: opacity, y: 0 }}
          transition={{ duration: 0.1 }}
          className="text-gray-500 mb-1 sm:mb-2 font-mono text-base sm:text-lg h-6 sm:h-8 flex items-center justify-center"
          style={{ transition: 'none' }}
        >
          <div className="w-full text-center">
            {line.text}
          </div>
        </motion.div>
      );
    });
  }, [lines]);

  // Initialiser les données au chargement du composant
  useEffect(() => {
    loadInitialText();
    // Nettoyer les timers à la destruction du composant
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [lang, loadInitialText]);

  // Assurer le focus sur l'input et gérer les raccourcis
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquer les raccourcis de copier-coller
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'c')) {
        e.preventDefault();
        return;
      }

      // Éviter de capturer les autres raccourcis clavier
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Modifier la section useEffect pour l'enregistrement des résultats
  useEffect(() => {
    if (timeLeft === 0) {
      // Ne sauvegarder le résultat que si l'utilisateur est connecté
      if (session?.user?.id) {
        fetch('/api/text/save-result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: session.user.id,
            lang,
            wpm,
            accuracy,
            keystrokes: totalKeystrokesRef.current,
            errors: errorCountRef.current,
            date: new Date().toISOString(),
          }),
        })
          .then(res => res.json())
          .then(data => {
            console.log('Résultat enregistré :', data);
          })
          .catch(err => {
            console.error("Erreur d'enregistrement :", err);
          });
      } else {
        console.log('Utilisateur non connecté, résultat non sauvegardé');
      }
    }
  }, [timeLeft, session, lang, wpm, accuracy]);

  return (
    <div className="w-full max-w-xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6" style={{ userSelect: 'none' }}>
      <div className="flex justify-between items-center">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Langue)}
          className="border rounded px-2 py-1 font-medium text-sm sm:text-base"
          disabled={started && timeLeft > 0}
        >
          <option value="fr">🇫🇷 Français</option>
          <option value="en">🇬🇧 English</option>
          <option value="es">🇪🇸 Español</option>
        </select>
        <div className="text-sm sm:text-base text-gray-600 font-medium">⏳ {timeLeft}s</div>
      </div>
      {!session?.user?.id && (
        <div className="text-red-500 font-medium text-sm sm:text-base">
          Vous n'êtes pas connecté. Veuillez vous connecter pour sauvegarder vos résultats.
        </div>
      )}

      <div
        className="bg-gray-100 p-3 sm:p-4 rounded-lg leading-relaxed min-h-[100px] sm:min-h-[120px] max-h-[140px] sm:max-h-[160px] flex flex-col justify-center items-center overflow-hidden cursor-text shadow-sm"
        onClick={() => inputRef.current?.focus()}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ transition: 'none' }}
      >
        <AnimatePresence mode="popLayout">
          {lines.length > 0 && (
            <motion.div
              key={lines[0].id}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.15 }}
              style={{ transition: 'none' }}
              className="w-full"
            >
              {renderedActiveLine}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full">
          {renderedUpcomingLines}
        </div>
      </div>

      {/* Input invisible mais actif avec prévention du copier-coller */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute"
        value={userInput}
        onChange={handleInput}
        onPaste={handlePaste}
        onCut={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        autoCapitalize="off"
        autoFocus
        disabled={timeLeft <= 0}
      />

      <div className="grid grid-cols-3 text-center text-sm sm:text-base text-gray-700 font-medium">
        <div>
          <strong>MPM :</strong> {wpm}
        </div>
        <div>
          <strong>Précision :</strong> {accuracy}%
        </div>
        <div>
          <strong>Temps :</strong> {timeLeft}s
        </div>
      </div>

      {timeLeft === 0 && (
        <div className="space-y-2">
          <div className="text-center text-green-700 font-bold text-base sm:text-lg">
            ✅ Temps écoulé ! Résultat : {wpm} MPM, {accuracy}% précision
          </div>
          <div className="text-center text-gray-700 text-sm sm:text-base">
            Frappes totales : {totalKeystrokesRef.current} | Erreurs : {errorCountRef.current}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={restart}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 sm:py-2 px-4 sm:px-6 rounded-md transition-colors shadow-sm text-sm sm:text-base"
        >
          Recommencer
        </button>
      </div>
    </div>
  );
}