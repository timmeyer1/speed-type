export function TextDisplay({ text, typed }: { text: string; typed: string }) {
    const lines = text.split("\n");
    const charCount = typed.length;
  
    // Compte les lignes en fonction du nombre de caractères tapés
    const visibleLines = 4;
    let lineStart = 0;
    let chars = 0;
    let lineIndex = 0;
  
    while (lineIndex < lines.length && chars + lines[lineIndex].length < charCount) {
      chars += lines[lineIndex].length + 1; // +1 for the newline
      lineIndex++;
    }
  
    const display = lines.slice(lineIndex, lineIndex + visibleLines);
  
    return (
      <div className="bg-gray-100 p-4 rounded font-mono text-sm space-y-1 h-[6.5rem] overflow-hidden">
        {display.map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
    );
  }
  