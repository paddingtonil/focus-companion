import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, User, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTestStore, type Gender } from '@/stores/testStore';

export const PatientInfoScreen = () => {
  const { patientInfo, setPatientInfo, setScreen, setTestMode } = useTestStore();
  const [birthDateInput, setBirthDateInput] = useState('');

  useEffect(() => {
    if (patientInfo.birthDate) {
      const date = new Date(patientInfo.birthDate);
      setBirthDateInput(date.toISOString().split('T')[0]);
    }
  }, [patientInfo.birthDate]);

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleBirthDateChange = (value: string) => {
    setBirthDateInput(value);
    if (value) {
      const date = new Date(value);
      setPatientInfo({ birthDate: date });
      
      // Auto-set test mode based on age
      const age = calculateAge(date);
      setTestMode(age >= 6 && age <= 12 ? 'kids' : 'adult');
    }
  };

  const handleGenderSelect = (gender: Gender) => {
    setPatientInfo({ gender });
  };

  const canProceed = patientInfo.birthDate && patientInfo.gender;

  const age = patientInfo.birthDate ? calculateAge(patientInfo.birthDate) : null;

  return (
    <div className="min-h-screen gradient-clinical p-6">
      <div className="max-w-xl mx-auto pt-12">
        <div className="animate-fade-in">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreen('welcome')}
            className="mb-6"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">פרטי הנבדק</h1>
            <p className="text-muted-foreground">הזן את פרטי הנבדק לפני תחילת הבדיקה</p>
          </div>

          {/* Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                תאריך לידה
              </CardTitle>
              <CardDescription>גיל הנבדק משפיע על סוג הבדיקה</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={birthDateInput}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                className="text-right"
                dir="ltr"
              />
              {age !== null && (
                <p className="mt-3 text-sm text-muted-foreground animate-fade-in">
                  גיל: <span className="font-semibold text-foreground">{age} שנים</span>
                  {age >= 6 && age <= 12 && (
                    <span className="mr-2 text-primary">• מצב ילדים (14.5 דקות)</span>
                  )}
                  {age > 12 && (
                    <span className="mr-2 text-primary">• מצב מבוגרים (18.5 דקות)</span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                מין
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={patientInfo.gender === 'male' ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleGenderSelect('male')}
                  className="h-16"
                >
                  זכר
                </Button>
                <Button
                  variant={patientInfo.gender === 'female' ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleGenderSelect('female')}
                  className="h-16"
                >
                  נקבה
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <Button
            variant="clinical"
            size="xl"
            onClick={() => setScreen('medication')}
            disabled={!canProceed}
            className="w-full"
          >
            המשך לפרטי תרופות
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
