import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ANSWERS = [
  "It is certain", "It is decidedly so", "Without a doubt", "Yes definitely",
  "You may rely on it", "As I see it, yes", "Most likely", "Outlook good",
  "Yes", "Signs point to yes", "Reply hazy, try again", "Ask again later",
  "Better not tell you now", "Cannot predict now", "Concentrate and ask again",
  "Don't count on it", "My reply is no", "My sources say no", "Outlook not so good",
  "Very doubtful"
];

export const Magic8Ball: React.FC = () => {
  const [answer, setAnswer] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const handleShake = () => {
    if (isShaking) return;
    setIsShaking(true);
    setAnswer(null);

    // Shake time
    setTimeout(() => {
      const randomAnswer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
      setAnswer(randomAnswer);
      setIsShaking(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full py-8">
      <div 
        onClick={handleShake}
        className="cursor-pointer group relative"
      >
        {/* Ball Body */}
        <motion.div
          animate={isShaking ? {
            x: [-10, 10, -10, 10, -5, 5, 0],
            y: [-5, 5, -5, 5, -2, 2, 0],
            rotate: [-5, 5, -5, 5, 0]
          } : {}}
          transition={{ duration: 0.5, repeat: isShaking ? 2 : 0 }}
          className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-black border-4 border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Inner Window */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-indigo-900/50 border-4 border-gray-800 flex items-center justify-center relative shadow-inner">
            
            <AnimatePresence mode="wait">
              {!isShaking && answer && (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, scale: 0.5, rotateX: 90 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  transition={{ duration: 1, type: 'spring' }}
                  className="w-full h-full flex items-center justify-center"
                >
                    {/* Blue Triangle - Pointing Down */}
                    <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-blue-700 fill-current drop-shadow-lg filter brightness-75">
                            <polygon points="5,5 95,5 50,95" />
                        </svg>
                         {/* Text positioned in the wider top part of the inverted triangle */}
                         <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-24 flex items-center justify-center">
                             <p className="text-center text-blue-100 font-sans text-[0.6rem] sm:text-[0.65rem] font-bold leading-tight uppercase tracking-wider drop-shadow-md select-none">
                                {answer}
                            </p>
                         </div>
                    </div>
                </motion.div>
              )}
              
              {!isShaking && !answer && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-20 h-20 rounded-full bg-black flex items-center justify-center text-white/20 font-retro text-4xl"
                >
                    8
                </motion.div>
              )}
            </AnimatePresence>

            {isShaking && (
                <div className="absolute inset-0 bg-indigo-950 flex items-center justify-center rounded-full">
                    <div className="w-full h-full bg-indigo-900/40 animate-pulse rounded-full"></div>
                </div>
            )}
          </div>
        </motion.div>
      </div>
      
      <p className="mt-8 font-retro text-zest text-xs animate-bounce text-center w-full px-4">
        {isShaking ? 'CONSULTING THE VOID...' : 'CLICK THE ORB TO SEEK WISDOM'}
      </p>
    </div>
  );
}