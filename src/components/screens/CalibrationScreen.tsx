import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Settings, Zap, BatteryCharging, BellOff, CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTestStore } from '@/stores/testStore';

export const CalibrationScreen = () => {
  const { calibration, setCalibration, addCalibrationReaction, setScreen } = useTestStore();
  const [showReactionTest, setShowReactionTest] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);
  const [waitingForTarget, setWaitingForTarget] = useState(false);
  const [tooEarly, setTooEarly] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<number | null>(null);
  
  const targetTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startReactionTest = useCallback(() => {
    setShowReactionTest(true);
    setTargetVisible(false);
    setWaitingForTarget(true);
    setTooEarly(false);
    setCurrentReaction(null);

    // Random delay between 1-3 seconds
    const delay = 1000 + Math.random() * 2000;
    
    timeoutRef.current = setTimeout(() => {
      targetTimeRef.current = performance.now();
      setTargetVisible(true);
      setWaitingForTarget(false);
    }, delay);
  }, []);

  const handleSpacePress = useCallback(() => {
    if (waitingForTarget) {
      // Too early!
      setTooEarly(true);
      setWaitingForTarget(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    if (targetVisible) {
      const reactionTime = performance.now() - targetTimeRef.current;
      setCurrentReaction(reactionTime);
      addCalibrationReaction(reactionTime);
      setTargetVisible(false);
    }
  }, [waitingForTarget, targetVisible, addCalibrationReaction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && showReactionTest) {
        e.preventDefault();
        handleSpacePress();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showReactionTest, handleSpacePress]);

  const canProceed = calibration.powerConfirmed && calibration.focusModeConfirmed && calibration.isCalibrated;

  return (
    <div className="min-h-screen gradient-clinical p-6">
      <div className="max-w-xl mx-auto pt-12">
        <div className="animate-fade-in">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreen('medication')}
            className="mb-6"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">כיול מערכת</h1>
            <p className="text-muted-foreground">יש לבצע את הבדיקות הבאות לפני תחילת המבחן</p>
          </div>

          {/* Checklist */}
          <div className="space-y-4 mb-8">
            {/* Power Check */}
            <Card 
              className={`cursor-pointer transition-all ${calibration.powerConfirmed ? 'border-success/50 bg-success/5' : ''}`}
              onClick={() => setCalibration({ powerConfirmed: !calibration.powerConfirmed })}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    calibration.powerConfirmed ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    <BatteryCharging className={`w-6 h-6 ${calibration.powerConfirmed ? 'text-success' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">המכשיר מחובר לחשמל</h3>
                    <p className="text-sm text-muted-foreground">מונע האטות עקב חיסכון בסוללה</p>
                  </div>
                  {calibration.powerConfirmed ? (
                    <CheckCircle className="w-6 h-6 text-success" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Focus Mode Check */}
            <Card 
              className={`cursor-pointer transition-all ${calibration.focusModeConfirmed ? 'border-success/50 bg-success/5' : ''}`}
              onClick={() => setCalibration({ focusModeConfirmed: !calibration.focusModeConfirmed })}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    calibration.focusModeConfirmed ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    <BellOff className={`w-6 h-6 ${calibration.focusModeConfirmed ? 'text-success' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">מצב "נא לא להפריע" פעיל</h3>
                    <p className="text-sm text-muted-foreground">מונע הפרעות והתראות במהלך הבדיקה</p>
                  </div>
                  {calibration.focusModeConfirmed ? (
                    <CheckCircle className="w-6 h-6 text-success" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reaction Time Calibration */}
            <Card className={`transition-all ${calibration.isCalibrated ? 'border-success/50 bg-success/5' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    calibration.isCalibrated ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    <Zap className={`w-6 h-6 ${calibration.isCalibrated ? 'text-success' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">כיול זמן תגובה</CardTitle>
                    <CardDescription>
                      {calibration.isCalibrated 
                        ? `ממוצע: ${calibration.averageOffset}ms` 
                        : `${calibration.reactionTimes.length}/5 מדידות`
                      }
                    </CardDescription>
                  </div>
                  {calibration.isCalibrated ? (
                    <CheckCircle className="w-6 h-6 text-success" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!showReactionTest ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={startReactionTest}
                    disabled={calibration.isCalibrated}
                  >
                    {calibration.isCalibrated ? 'כיול הושלם' : 'התחל כיול'}
                  </Button>
                ) : (
                  <div className="text-center py-6">
                    {waitingForTarget && (
                      <p className="text-lg text-muted-foreground animate-pulse">
                        המתן למטרה...
                      </p>
                    )}
                    {targetVisible && (
                      <div className="w-20 h-20 mx-auto bg-success rounded-full flex items-center justify-center animate-scale-in">
                        <span className="text-3xl">🎯</span>
                      </div>
                    )}
                    {tooEarly && (
                      <p className="text-lg text-destructive">
                        מוקדם מדי! נסה שוב
                      </p>
                    )}
                    {currentReaction !== null && !targetVisible && (
                      <div className="animate-fade-in">
                        <p className="text-2xl font-bold text-success mb-2">
                          {Math.round(currentReaction)}ms
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {calibration.reactionTimes.length}/5 מדידות
                        </p>
                      </div>
                    )}

                    {(!targetVisible && !waitingForTarget && !calibration.isCalibrated) && (
                      <Button
                        variant="secondary"
                        className="mt-4"
                        onClick={startReactionTest}
                      >
                        {tooEarly ? 'נסה שוב' : 'מדידה הבאה'}
                      </Button>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-4">
                      לחץ על מקש רווח כשהמטרה מופיעה
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Continue Button */}
          <Button
            variant="clinical"
            size="xl"
            onClick={() => setScreen('test')}
            disabled={!canProceed}
            className="w-full"
          >
            התחל בדיקה
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Button>

          {!canProceed && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              יש להשלים את כל הבדיקות לפני המשך
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
