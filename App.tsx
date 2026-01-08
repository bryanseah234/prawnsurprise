import React, { useState } from 'react';
import { Tab } from './types';
import { DiceRoller } from './components/Dice/DiceRoller';
import { ChaosWheel } from './components/Spinner/ChaosWheel';
import { Magic8Ball } from './components/MagicBall/Magic8Ball';
import { cn } from './components/ui/RetroButton';
import { Dices, Disc, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DICE);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">

      {/* Header */}
      <header className="w-full bg-coral border-b-4 border-black p-6 shadow-retro z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <h1 className="font-retro text-xl sm:text-2xl md:text-3xl text-white drop-shadow-[4px_4px_0px_#000] text-center">
            THE PRAWN SURPRISE <span className="text-zest">?!</span>
          </h1>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="w-full max-w-4xl mx-auto mt-8 px-2">
        <div className="flex flex-nowrap justify-center gap-1">
          <TabButton
            isActive={activeTab === Tab.DICE}
            onClick={() => setActiveTab(Tab.DICE)}
            icon={<Dices className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
            label="DICE ROLL"
          />
          <TabButton
            isActive={activeTab === Tab.SPINNER}
            onClick={() => setActiveTab(Tab.SPINNER)}
            icon={<Disc className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
            label="CHAOS WHEEL"
          />
          <TabButton
            isActive={activeTab === Tab.MAGIC_BALL}
            onClick={() => setActiveTab(Tab.MAGIC_BALL)}
            icon={<Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
            label="8-BALL"
          />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 mb-12">
        <div className="bg-ocean text-white border-2 border-black p-4 sm:p-8 shadow-retro min-h-[400px] flex items-center justify-center relative backdrop-blur-sm">
          {/* Decorative Corner Pixels */}
          <div className="absolute top-0 left-0 w-4 h-4 bg-zest border-r-2 border-b-2 border-black"></div>
          <div className="absolute top-0 right-0 w-4 h-4 bg-zest border-l-2 border-b-2 border-black"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 bg-zest border-r-2 border-t-2 border-black"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-zest border-l-2 border-t-2 border-black"></div>

          {activeTab === Tab.DICE && <DiceRoller />}
          {activeTab === Tab.SPINNER && <ChaosWheel />}
          {activeTab === Tab.MAGIC_BALL && <Magic8Ball />}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-black/50 text-xs font-retro">
        <p>BUILT WITH 🦐 POWER</p>
      </footer>
    </div>
  );
};

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center px-2 sm:px-4 py-2 sm:py-3 font-retro text-[8px] sm:text-xs border-2 border-black transition-all whitespace-nowrap",
        isActive
          ? "bg-zest text-black shadow-none translate-y-1 z-10 relative"
          : "bg-white text-gray-500 shadow-retro hover:bg-gray-100 hover:translate-y-[2px] hover:shadow-retro-active"
      )}
    >
      {icon}
      {label}
    </button>
  );
};

export default App;
