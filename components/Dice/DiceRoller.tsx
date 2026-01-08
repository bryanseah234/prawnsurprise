import React, { useState } from 'react';
import { DieType } from '../../types';
import { RetroButton } from '../ui/RetroButton';
import { Die3D } from './Die3D';

export const DiceRoller: React.FC = () => {
  const [selectedDie, setSelectedDie] = useState<DieType>(DieType.D6);
  const [result, setResult] = useState<number | null>(1);
  const [isRolling, setIsRolling] = useState(false);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    setResult(null);

    setTimeout(() => {
      const newResult = Math.floor(Math.random() * selectedDie) + 1;
      setResult(newResult);
      setIsRolling(false);
    }, 800); 
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-4 gap-6">
      
      {/* Dice Display Area (Clickable) */}
      <div 
        onClick={rollDice}
        className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 bg-white/10 border-2 border-black rounded-xl shadow-retro overflow-hidden cursor-pointer hover:bg-white/20 transition-colors active:scale-95 duration-100"
      >
        <div className="w-full h-full pointer-events-none">
             <Die3D type={selectedDie} value={result} isRolling={isRolling} />
        </div>
      </div>

      {/* Die Selection - Below dice, no wrap */}
      <div className="flex flex-nowrap justify-center gap-2 shrink-0">
        {[DieType.D4, DieType.D6, DieType.D8, DieType.D10].map((type) => (
          <RetroButton 
            key={type}
            variant={selectedDie === type ? 'accent' : 'neutral'}
            onClick={(e) => {
                e.stopPropagation();
                setSelectedDie(type);
                setResult(1);
                setIsRolling(false);
            }}
            className="px-3 py-2 text-[10px] sm:text-xs whitespace-nowrap"
          >
            d{type}
          </RetroButton>
        ))}
      </div>

      {/* Instruction Text */}
      <p className="font-retro text-zest text-xs animate-pulse text-center">
        {isRolling ? 'ROLLING...' : 'CLICK THE DICE TO ROLL'}
      </p>
    </div>
  );
};
