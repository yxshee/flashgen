import { GoogleGenAI } from '@google/genai';
import { useState } from 'react';

interface Flashcard {
  term: string;
  definition: string;
}

function App() {
  const [errorMessage, setErrorMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  
  const handleGenerate = async (topic: string) => {
    if (!topic) {
      setErrorMessage('Please enter a topic or some terms and definitions.');
      setFlashcards([]);
      return;
    }

    setErrorMessage('Generating flashcards...');
    setIsGenerating(true);
    
    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const prompt = `Generate a list of flashcards for the topic of "${topic}". Each flashcard should have a term and a concise definition. Format the output as a list of "Term: Definition" pairs, with each pair on a new line.`;
      
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });
      
      const responseText = result?.text ?? '';

      if (responseText) {
        const cards = responseText
          .split('\n')
          .map((line) => {
            const parts = line.split(':');
            if (parts.length >= 2 && parts[0].trim()) {
              const term = parts[0].trim();
              const definition = parts.slice(1).join(':').trim();
              if (definition) {
                return { term, definition };
              }
            }
            return null;
          })
          .filter((card): card is Flashcard => card !== null);

        if (cards.length > 0) {
          setErrorMessage('');
          setFlashcards(cards);
        } else {
          setErrorMessage('No valid flashcards could be generated from the response.');
        }
      }
    } catch (error: unknown) {
      console.error('Error generating content:', error);
      const detailedError = (error as Error)?.message || 'An unknown error occurred';
      setErrorMessage(`An error occurred: ${detailedError}`);
      setFlashcards([]);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="container">
      <h1>Flashcard Generator</h1>
      <p>
        Enter a topic or a list of terms and definitions to generate flashcards using the Gemini API.
      </p>
      <textarea
        id="topicInput"
        placeholder="Enter topic (e.g., Ancient Rome) or 'Term: Definition' pairs (one per line)"
      ></textarea>
      <button 
        id="generateButton"
        disabled={isGenerating}
        onClick={() => {
          const topicInput = document.getElementById('topicInput') as HTMLTextAreaElement;
          handleGenerate(topicInput.value.trim());
        }}
      >
        Generate Flashcards
      </button>
      <div id="errorMessage" className="error-message">
        {errorMessage}
      </div>
      <div id="flashcardsContainer" className="flashcards-container">
        {flashcards.map((card, index) => (
          <div key={index} className="flashcard" data-index={index}>
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <div className="term">{card.term}</div>
              </div>
              <div className="flashcard-back">
                <div className="definition">{card.definition}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;