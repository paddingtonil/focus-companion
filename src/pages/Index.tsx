import { useTestStore } from '@/stores/testStore';
import { WelcomeScreen } from '@/components/screens/WelcomeScreen';
import { PatientInfoScreen } from '@/components/screens/PatientInfoScreen';
import { MedicationScreen } from '@/components/screens/MedicationScreen';
import { CalibrationScreen } from '@/components/screens/CalibrationScreen';
import { TestScreen } from '@/components/screens/TestScreen';
import { ResultsScreen } from '@/components/screens/ResultsScreen';

const Index = () => {
  const currentScreen = useTestStore((state) => state.currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'patient_info':
        return <PatientInfoScreen />;
      case 'medication':
        return <MedicationScreen />;
      case 'calibration':
        return <CalibrationScreen />;
      case 'test':
        return <TestScreen />;
      case 'results':
        return <ResultsScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderScreen()}
    </div>
  );
};

export default Index;
