"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trophy } from "lucide-react";

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
  const [textBuffer, setTextBuffer] = useState<string[]>([]);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const totalTypedRef = useRef(0);
  const errorCountRef = useRef(0);
  const totalKeystrokesRef = useRef(0);
  const previousInputLengthRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lineCompleteCallbackRef = useRef<(() => void) | null>(null);
  const currentCharCountRef = useRef(0);
  const resultSavedRef = useRef(false);
  const testSessionIdRef = useRef<string>(`test-${Date.now()}`);
  
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
    const maxWordsPerLine = 5;

    for (let i = 0; i < words.length; i++) {
      currentChunk.push(words[i]);
      if (currentChunk.length === maxWordsPerLine || i === words.length - 1) {
        chunkedLines.push(currentChunk.join(" ") + " ");
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

    setLines(initialLines);
    setTextBuffer(chunkedLines.slice(3));
    resetStats();

    // Précharger plus de texte en arrière-plan
    setTimeout(() => {
      prefetchTexts().then(newText => {
        setTextBuffer(prev => [...prev, ...processText(newText)]);
      });
    }, 1000);
  }, [lang, prefetchTexts, processText]);

  const resetStats = useCallback(() => {
    setUserInput("");
    setStarted(false);
    setTimeLeft(60);
    setWpm(0);
    setAccuracy(100);
    setShowResultDialog(false);
    
    totalTypedRef.current = 0;
    errorCountRef.current = 0;
    totalKeystrokesRef.current = 0;
    previousInputLengthRef.current = 0;
    currentCharCountRef.current = 0;
    startTimeRef.current = null;
    resultSavedRef.current = false;
    testSessionIdRef.current = `test-${Date.now()}`;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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

    // Mise à jour optimisée avec requestAnimationFrame pour éviter les rendus inutiles
    requestAnimationFrame(() => {
      setWpm(currentWpm);
      setAccuracy(currentAccuracy);
    });
  }, []);

  const saveResults = useCallback(() => {
    if (resultSavedRef.current || !session?.user) return;
    
    resultSavedRef.current = true;
    
    fetch('/api/text/save-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.user,
        lang,
        wpm,
        accuracy,
        keystrokes: totalKeystrokesRef.current,
        errors: errorCountRef.current,
        date: new Date().toISOString(),
        testSessionId: testSessionIdRef.current,
      }),
    })
      .then(res => res.json())
      .then(data => console.log('Résultat enregistré :', data))
      .catch(err => {
        console.error("Erreur d'enregistrement :", err);
        resultSavedRef.current = false;
      });
  }, [session, lang, wpm, accuracy]);

  const finishTest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    saveResults();
    setShowResultDialog(true);
    inputRef.current?.blur();
  }, [saveResults]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      
      const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, 60 - elapsedSeconds);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        finishTest();
      }

      updateStats();
    }, 100);
  }, [updateStats, finishTest]);

  const handleLineCompletion = useCallback(() => {
    if (lineCompleteCallbackRef.current) return;

    // Mettre à jour les statistiques
    const currentLine = lines[0]?.text || "";
    const wordCount = currentLine.trim().split(/\s+/).length;
    totalTypedRef.current += wordCount;
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
        const newLines = prevLines.filter((_, index) => index !== 0);

        // Ajouter une nouvelle ligne depuis le buffer
        if (textBuffer.length > 0) {
          newLines.push({
            id: `line-${Date.now()}`,
            text: textBuffer[0],
            completed: false
          });

          // Mettre à jour le buffer
          setTextBuffer(prev => {
            const remainingBuffer = prev.slice(1);
            // Précharger plus de texte si nécessaire
            if (remainingBuffer.length < 10) {
              prefetchTexts().then(newText => {
                const newLines = processText(newText);
                setTextBuffer(prev => [...prev, ...newLines]);
              });
            }
            return remainingBuffer;
          });
        }

        return newLines;
      });

      lineCompleteCallbackRef.current = null;
    };

    requestAnimationFrame(() => {
      if (lineCompleteCallbackRef.current) {
        lineCompleteCallbackRef.current();
      }
    });

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

    // Détection des erreurs optimisée
    if (valueLength > previousInputLengthRef.current) {
      const lastCharIndex = valueLength - 1;
      if (value[lastCharIndex] !== currentLine[lastCharIndex]) {
        errorCountRef.current++;
      }
      totalKeystrokesRef.current++;
      currentCharCountRef.current = valueLength;
      updateStats();
    } else if (valueLength < previousInputLengthRef.current) {
      currentCharCountRef.current = valueLength;
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

  const restart = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    loadInitialText();
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [loadInitialText]);

  // Préventions diverses
  const handlePaste = useCallback((e: React.ClipboardEvent) => e.preventDefault(), []);
  const handleContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);
  const handleDrop = useCallback((e: React.DragEvent) => e.preventDefault(), []);
  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  // Rendu optimisé avec useMemo
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

  const renderedUpcomingLines = useMemo(() => {
    return lines.slice(1).map((line, index) => {
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
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [lang, loadInitialText]);

  // Gestion du focus et des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquer les raccourcis de copier-coller
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'c')) {
        e.preventDefault();
        return;
      }

      // Éviter de capturer les autres raccourcis clavier
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !showResultDialog) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showResultDialog]);

  const checkDisconnected = () => {
    if (!session) {
      return (
        <p className="text-center text-sm sm:text-base text-gray-600 font-medium">
          Vous êtes <span className="font-bold">déconnecté</span>, veuillez vous reconnecter pour enregistrer vos scores.
        </p>
      );
    }
    return null;
  };

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
      
      {checkDisconnected()}

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

      {/* Input invisible mais actif */}
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

      {!showResultDialog && timeLeft === 0 && (
        <div className="space-y-2">
          <div className="text-center text-green-700 font-bold text-base sm:text-lg">
            ✅ Temps écoulé ! Résultat : {wpm} MPM, {accuracy}% précision
          </div>
          <div className="text-center text-gray-700 text-sm sm:text-base">
            Frappes totales : {totalKeystrokesRef.current} | Erreurs : {errorCountRef.current}
          </div>
          <div className="flex justify-center">
            <Button onClick={restart} className="bg-blue-600 hover:bg-blue-700">
              Recommencer
            </Button>
          </div>
        </div>
      )}
      
      {/* Modal de résultat */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center text-xl">
              <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
              Résultat du test de frappe
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-50 border border-green-200 rounded-full p-4">
                <div className="text-4xl font-bold text-green-700 text-center">{wpm}</div>
                <div className="text-sm text-green-700 text-center">MPM</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-blue-700">{accuracy}%</div>
                <div className="text-xs text-blue-700">Précision</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-purple-700">{totalKeystrokesRef.current}</div>
                <div className="text-xs text-purple-700">Frappes</div>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              {session ? (
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  Résultat enregistré !
                </div>
              ) : (
                "Connectez-vous pour enregistrer vos résultats"
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowResultDialog(false);
                restart();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Recommencer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}