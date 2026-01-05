import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Pill, Clock, CheckCircle, AlertCircle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTestStore, MEDICATIONS, type MedicationType } from '@/stores/testStore';

export const MedicationScreen = () => {
  const { 
    patientInfo, 
    setPatientInfo, 
    setScreen, 
    isOptimalWindow, 
    minutesToOptimal,
    calculateMedicationStatus 
  } = useTestStore();
  
  const [medicationTime, setMedicationTime] = useState('');

  useEffect(() => {
    if (patientInfo.medicationTime) {
      const time = new Date(patientInfo.medicationTime);
      setMedicationTime(time.toTimeString().slice(0, 5));
    }
  }, [patientInfo.medicationTime]);

  useEffect(() => {
    calculateMedicationStatus();
    const interval = setInterval(calculateMedicationStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [patientInfo.medication, patientInfo.medicationTime, calculateMedicationStatus]);

  const handleMedicationSelect = (medication: MedicationType) => {
    setPatientInfo({ medication });
    if (medication === 'none') {
      setPatientInfo({ dosage: 0, medicationTime: null });
    }
  };

  const handleTimeChange = (value: string) => {
    setMedicationTime(value);
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      setPatientInfo({ medicationTime: date });
    }
  };

  const formatMinutes = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours > 0) {
      return `${hours} שעות ו-${minutes} דקות`;
    }
    return `${minutes} דקות`;
  };

  const selectedMedication = MEDICATIONS[patientInfo.medication];

  return (
    <div className="min-h-screen gradient-clinical p-6">
      <div className="max-w-xl mx-auto pt-12">
        <div className="animate-fade-in">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreen('patient_info')}
            className="mb-6"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Pill className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">פרטי תרופות</h1>
            <p className="text-muted-foreground">בחר את התרופה והזמן שנלקחה לחישוב חלון אופטימלי</p>
          </div>

          {/* Medication Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>בחר תרופה</CardTitle>
              <CardDescription>או בחר "ללא תרופה" לבדיקת בסיס</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(MEDICATIONS) as [MedicationType, typeof MEDICATIONS.ritalin_ir][]).map(([key, med]) => (
                  <Button
                    key={key}
                    variant={patientInfo.medication === key ? 'default' : 'outline'}
                    onClick={() => handleMedicationSelect(key)}
                    className="h-14 flex flex-col items-center justify-center"
                  >
                    <span className="font-medium">{med.hebrewName}</span>
                    {key !== 'none' && (
                      <span className="text-xs opacity-80">
                        שיא: {med.peakStartHours}-{med.peakEndHours} שעות
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dosage & Time (only if medication selected) */}
          {patientInfo.medication !== 'none' && (
            <div className="animate-fade-in">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    זמן נטילה ומינון
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      שעת נטילת התרופה
                    </label>
                    <Input
                      type="time"
                      value={medicationTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      מינון (מ"ג)
                    </label>
                    <Input
                      type="number"
                      value={patientInfo.dosage || ''}
                      onChange={(e) => setPatientInfo({ dosage: Number(e.target.value) })}
                      placeholder="למשל: 20"
                      min={0}
                      dir="ltr"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Status Indicator */}
              {patientInfo.medicationTime && (
                <div className="mb-6 animate-scale-in">
                  <Card className={`border-2 ${isOptimalWindow ? 'border-success/50' : 'border-warning/50'}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                          isOptimalWindow ? 'bg-success/10' : 'bg-warning/10'
                        }`}>
                          {isOptimalWindow ? (
                            <CheckCircle className="w-7 h-7 text-success" />
                          ) : (
                            <Timer className="w-7 h-7 text-warning" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Badge variant={isOptimalWindow ? 'success' : 'warning'} className="mb-2">
                            {isOptimalWindow ? 'חלון אופטימלי' : 'יש להמתין'}
                          </Badge>
                          <p className="text-foreground font-medium">
                            {isOptimalWindow 
                              ? `${selectedMedication.hebrewName} בזמן השיא - מומלץ לבצע את הבדיקה כעת`
                              : `נותרו ${formatMinutes(minutesToOptimal)} עד לחלון האופטימלי`
                            }
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            חלון שיא: {selectedMedication.peakStartHours}-{selectedMedication.peakEndHours} שעות מנטילת התרופה
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Continue Button */}
          <Button
            variant="clinical"
            size="xl"
            onClick={() => setScreen('calibration')}
            className="w-full"
          >
            המשך לכיול מערכת
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Button>

          {!isOptimalWindow && patientInfo.medication !== 'none' && patientInfo.medicationTime && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              <AlertCircle className="w-4 h-4 inline ml-1" />
              ניתן להמשיך גם מחוץ לחלון האופטימלי
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
