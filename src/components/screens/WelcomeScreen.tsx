import { Brain, Activity, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTestStore } from '@/stores/testStore';

const features = [
  { icon: Activity, label: 'מדידה מדויקת', desc: 'דיוק של אלפית שנייה' },
  { icon: Clock, label: 'מעקב תרופות', desc: 'חלון אופטימלי לבדיקה' },
  { icon: Zap, label: 'מסיחי קשב', desc: 'סימולציה אקולוגית' },
  { icon: Brain, label: '4 מדדים', desc: 'קשב, תזמון, אימפולסיביות' },
];

export const WelcomeScreen = () => {
  const setScreen = useTestStore((state) => state.setScreen);

  return (
    <div className="min-h-screen gradient-clinical flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        {/* Logo/Icon */}
        <div className="mb-8 animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="w-24 h-24 mx-auto bg-gradient-to-bl from-primary to-accent rounded-3xl flex items-center justify-center shadow-xl">
            <Brain className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          מערכת אבחון קשב
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12">
          בדיקת ביצועים רציפה מבוססת מתודולוגיית MOXO
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          {features.map((feature, index) => (
            <div
              key={feature.label}
              className="clinical-card p-4 text-center animate-fade-in"
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              <feature.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold text-foreground">{feature.label}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button
            variant="clinical"
            size="xl"
            onClick={() => setScreen('patient_info')}
            className="w-full max-w-sm"
          >
            התחל בדיקה חדשה
          </Button>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.8s' }}>
          מומלץ לבצע את הבדיקה בסביבה שקטה ללא הפרעות
        </p>
      </div>
    </div>
  );
};
