import { useState, useEffect, useCallback, useRef } from 'react';
import { useTestStore, type ResponseType, type TestResponse } from '@/stores/testStore';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

// Test configuration
const STIMULUS_DURATION = 500; // ms
const INTER_STIMULUS_INTERVAL = 1500; // ms
const TRIALS_PER_BLOCK = 10;
const TOTAL_BLOCKS = 8;
const RESPONSE_WINDOW = 1000; // ms after stimulus disappears

// Block distractor configuration
const BLOCK_CONFIG = [
  { visual: false, auditory: false }, // Block 1: Clean
  { visual: true, auditory: false },  // Block 2: Visual
  { visual: false, auditory: true },  // Block 3: Auditory
  { visual: true, auditory: true },   // Block 4: Combo
  { visual: true, auditory: false },  // Block 5: Visual
  { visual: false, auditory: true },  // Block 6: Auditory
  { visual: true, auditory: true },   // Block 7: Combo
  { visual: false, auditory: false }, // Block 8: Clean (fatigue check)
];

export const TestScreen = () => {
  const { 
    testMode, 
    currentBlock, 
    currentTrial,
    calibration,
    setCurrentBlock,
    setCurrentTrial,
    addResponse,
    setScreen,
    endTest,
    calculateResults
  } = useTestStore();

  const [phase, setPhase] = useState<'intro' | 'countdown' | 'running' | 'break' | 'complete'>('intro');
  const [countdown, setCountdown] = useState(3);
  const [showStimulus, setShowStimulus] = useState(false);
  const [isTarget, setIsTarget] = useState(false);
  const [showDistractor, setShowDistractor] = useState<'none' | 'visual' | 'bird' | 'ball'>('none');
  const [responded, setResponded] = useState(false);
  const [blockProgress, setBlockProgress] = useState(0);
  
  const stimulusTimeRef = useRef<number>(0);
  const trialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  const recordResponse = useCallback((type: ResponseType, reactionTime: number | null) => {
    const config = BLOCK_CONFIG[currentBlock - 1];
    const response: TestResponse = {
      blockNumber: currentBlock,
      trialNumber: currentTrial,
      stimulusType: isTarget ? 'target' : 'non_target',
      timestampStimulusShown: stimulusTimeRef.current,
      timestampResponse: reactionTime ? stimulusTimeRef.current + reactionTime : null,
      responseType: type,
      reactionTime: reactionTime ? reactionTime - calibration.averageOffset : null,
      hasVisualDistractor: config.visual,
      hasAuditoryDistractor: config.auditory,
    };
    addResponse(response);
  }, [currentBlock, currentTrial, isTarget, calibration.averageOffset, addResponse]);

  const runTrial = useCallback(() => {
    if (!isRunningRef.current) return;

    // Determine if this is a target (70% chance)
    const target = Math.random() < 0.7;
    setIsTarget(target);
    setShowStimulus(true);
    setResponded(false);
    stimulusTimeRef.current = performance.now();

    // Show visual distractor if configured
    const config = BLOCK_CONFIG[currentBlock - 1];
    if (config.visual && Math.random() < 0.3) {
      const distractors: ('bird' | 'ball')[] = ['bird', 'ball'];
      setShowDistractor(distractors[Math.floor(Math.random() * distractors.length)]);
    }

    // Hide stimulus after duration
    trialTimeoutRef.current = setTimeout(() => {
      setShowStimulus(false);
      setShowDistractor('none');

      // Wait for response window
      trialTimeoutRef.current = setTimeout(() => {
        // If no response, record miss for target or correct rejection for non-target
        if (!responded && isRunningRef.current) {
          if (target) {
            recordResponse('miss', null);
          }
          // For non-targets, no response is correct (no need to record)
        }

        // Move to next trial
        const nextTrial = currentTrial + 1;
        if (nextTrial >= TRIALS_PER_BLOCK) {
          // Block complete
          if (currentBlock >= TOTAL_BLOCKS) {
            // Test complete
            isRunningRef.current = false;
            setPhase('complete');
            endTest();
            calculateResults();
          } else {
            // Show break screen
            setPhase('break');
            setCurrentBlock(currentBlock + 1);
            setCurrentTrial(0);
          }
        } else {
          setCurrentTrial(nextTrial);
          setBlockProgress((nextTrial / TRIALS_PER_BLOCK) * 100);
          
          // Short delay before next trial
          trialTimeoutRef.current = setTimeout(() => {
            runTrial();
          }, INTER_STIMULUS_INTERVAL);
        }
      }, RESPONSE_WINDOW);
    }, STIMULUS_DURATION);
  }, [currentBlock, currentTrial, recordResponse, responded, setCurrentBlock, setCurrentTrial, endTest, calculateResults]);

  const handleSpacePress = useCallback(() => {
    if (phase !== 'running' || !isRunningRef.current) return;

    const responseTime = performance.now() - stimulusTimeRef.current;
    
    if (showStimulus) {
      // Stimulus is still visible
      if (isTarget) {
        recordResponse('hit', responseTime);
      } else {
        recordResponse('commission', responseTime);
      }
      setResponded(true);
    } else if (!responded) {
      // Stimulus gone but still in response window
      if (responseTime <= STIMULUS_DURATION + RESPONSE_WINDOW) {
        if (isTarget) {
          recordResponse('hit', responseTime);
        } else {
          recordResponse('commission', responseTime);
        }
        setResponded(true);
      } else {
        // Too late or random press
        recordResponse('timing_error', responseTime);
      }
    }
  }, [phase, showStimulus, isTarget, responded, recordResponse]);

  const startTest = useCallback(() => {
    setPhase('countdown');
    setCountdown(3);
  }, []);

  const continueFromBreak = useCallback(() => {
    setPhase('countdown');
    setCountdown(3);
    setBlockProgress(0);
  }, []);

  // Countdown effect
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      isRunningRef.current = true;
      setPhase('running');
      runTrial();
    }
  }, [phase, countdown, runTrial]);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleSpacePress();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSpacePress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (trialTimeoutRef.current) {
        clearTimeout(trialTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleExit = () => {
    isRunningRef.current = false;
    if (trialTimeoutRef.current) {
      clearTimeout(trialTimeoutRef.current);
    }
    endTest();
    setScreen('calibration');
  };

  return (
    <div className="test-mode flex flex-col items-center justify-center">
      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Progress bar */}
      {phase === 'running' && (
        <div className="absolute top-4 left-4 right-16 flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            בלוק {currentBlock}/{TOTAL_BLOCKS}
          </span>
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${blockProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Intro Phase */}
      {phase === 'intro' && (
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-primary-foreground mb-6">
            הוראות הבדיקה
          </h1>
          <div className="max-w-md mx-auto text-right space-y-4 mb-8">
            <p className="text-lg text-muted-foreground">
              1. לחץ על מקש <span className="text-primary-foreground font-bold">רווח</span> רק כאשר מופיע הסמיילי המחייך 😊
            </p>
            <p className="text-lg text-muted-foreground">
              2. <span className="text-destructive font-bold">אל תלחץ</span> כאשר מופיעים סמיילים אחרים
            </p>
            <p className="text-lg text-muted-foreground">
              3. נסה להגיב מהר ככל האפשר
            </p>
            <p className="text-lg text-muted-foreground">
              4. התעלם ממסיחי הקשב שיופיעו
            </p>
          </div>
          <Button
            variant="clinical"
            size="xl"
            onClick={startTest}
          >
            התחל בדיקה
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            משך הבדיקה: {testMode === 'kids' ? '14.5' : '18.5'} דקות
          </p>
        </div>
      )}

      {/* Countdown Phase */}
      {phase === 'countdown' && (
        <div className="text-center">
          <p className="text-2xl text-muted-foreground mb-4">מתכונן...</p>
          <div className="text-9xl font-bold text-primary animate-pulse-ring">
            {countdown}
          </div>
        </div>
      )}

      {/* Running Phase */}
      {phase === 'running' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Stimulus */}
          {showStimulus && (
            <div className="text-[120px] animate-stimulus-appear">
              {isTarget ? '😊' : '😐'}
            </div>
          )}

          {/* Visual Distractors */}
          {showDistractor === 'bird' && (
            <div className="absolute top-20 left-10 text-6xl animate-float">
              🐦
            </div>
          )}
          {showDistractor === 'ball' && (
            <div className="absolute bottom-20 right-10 text-6xl animate-float">
              ⚽
            </div>
          )}

          {/* Fixation cross when no stimulus */}
          {!showStimulus && (
            <div className="text-6xl text-muted-foreground">
              +
            </div>
          )}
        </div>
      )}

      {/* Break Phase */}
      {phase === 'break' && (
        <div className="text-center animate-fade-in">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            הפסקה קצרה
          </h2>
          <p className="text-xl text-muted-foreground mb-6">
            סיימת בלוק {currentBlock - 1} מתוך {TOTAL_BLOCKS}
          </p>
          <p className="text-lg text-muted-foreground mb-8">
            קח נשימה עמוקה ולחץ להמשך
          </p>
          <Button
            variant="clinical"
            size="xl"
            onClick={continueFromBreak}
          >
            המשך לבלוק הבא
          </Button>
        </div>
      )}

      {/* Complete Phase */}
      {phase === 'complete' && (
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            הבדיקה הושלמה!
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            כל הכבוד! המשך לצפייה בתוצאות
          </p>
          <Button
            variant="clinical"
            size="xl"
            onClick={() => setScreen('results')}
          >
            צפה בתוצאות
          </Button>
        </div>
      )}
    </div>
  );
};
