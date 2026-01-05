import { useTestStore, MEDICATIONS } from '@/stores/testStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowRight, Brain, Clock, Zap, Activity, FileText, RefreshCw } from 'lucide-react';

export const ResultsScreen = () => {
  const { testResults, patientInfo, testMode, calibration, setScreen, resetAll } = useTestStore();

  if (!testResults) {
    return (
      <div className="min-h-screen gradient-clinical flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">לא נמצאו תוצאות בדיקה</p>
            <Button onClick={() => setScreen('welcome')}>
              חזרה לדף הבית
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { attentiveness, timeliness, impulsivity, hyperactivity, rawLog } = testResults;

  // Calculate scores for chart
  const chartData = [
    { 
      name: 'קשב', 
      value: Math.round(attentiveness), 
      fill: 'hsl(var(--success))',
      fullName: 'קשב (Attentiveness)'
    },
    { 
      name: 'תזמון', 
      value: timeliness > 0 ? Math.min(100, Math.round((500 / timeliness) * 100)) : 0, 
      fill: 'hsl(var(--primary))',
      fullName: 'תזמון (Timeliness)'
    },
    { 
      name: 'אימפולסיביות', 
      value: Math.round(100 - impulsivity), 
      fill: 'hsl(var(--warning))',
      fullName: 'שליטה באימפולסיביות'
    },
    { 
      name: 'היפראקטיביות', 
      value: Math.round(100 - hyperactivity), 
      fill: 'hsl(var(--accent))',
      fullName: 'שליטה בהיפראקטיביות'
    },
  ];

  // Generate Hebrew summary
  const generateSummary = () => {
    const medication = MEDICATIONS[patientInfo.medication];
    let summary = '';

    if (patientInfo.medication !== 'none') {
      summary += `הנבדק ביצע את הבדיקה תחת השפעת ${medication.hebrewName} במינון ${patientInfo.dosage} מ"ג. `;
    } else {
      summary += 'הנבדק ביצע את הבדיקה ללא תרופות (בדיקת בסיס). ';
    }

    // Attentiveness interpretation
    if (attentiveness >= 80) {
      summary += 'רמת הקשב נמצאה תקינה עד גבוהה. ';
    } else if (attentiveness >= 60) {
      summary += 'רמת הקשב נמצאה בטווח הבינוני. ';
    } else {
      summary += 'נמצאו קשיים משמעותיים בקשב. ';
    }

    // Impulsivity interpretation
    if (impulsivity <= 20) {
      summary += 'לא נצפו סימני אימפולסיביות משמעותיים. ';
    } else if (impulsivity <= 40) {
      summary += 'נצפו סימנים קלים של אימפולסיביות. ';
    } else {
      summary += 'נצפו סימני אימפולסיביות משמעותיים. ';
    }

    // Timing interpretation
    if (timeliness < 300) {
      summary += 'מהירות התגובה מצוינת. ';
    } else if (timeliness < 500) {
      summary += 'מהירות התגובה תקינה. ';
    } else {
      summary += 'מהירות התגובה איטית יחסית. ';
    }

    return summary;
  };

  const totalTrials = rawLog.length;
  const hits = rawLog.filter(r => r.responseType === 'hit').length;
  const misses = rawLog.filter(r => r.responseType === 'miss').length;
  const commissions = rawLog.filter(r => r.responseType === 'commission').length;

  return (
    <div className="min-h-screen gradient-clinical p-6">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">דוח תוצאות</h1>
              <p className="text-muted-foreground">
                סוג בדיקה: {testMode === 'kids' ? 'ילדים' : 'מבוגרים'} | 
                כיול: {calibration.averageOffset}ms
              </p>
            </div>
            <Badge variant="success" className="text-lg py-2 px-4">
              הבדיקה הושלמה
            </Badge>
          </div>

          {/* Main Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Brain className="w-8 h-8 mx-auto mb-2 text-success" />
                <p className="text-3xl font-bold text-foreground">{Math.round(attentiveness)}%</p>
                <p className="text-sm text-muted-foreground">קשב</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">{Math.round(timeliness)}ms</p>
                <p className="text-sm text-muted-foreground">זמן תגובה ממוצע</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-warning" />
                <p className="text-3xl font-bold text-foreground">{Math.round(impulsivity)}%</p>
                <p className="text-sm text-muted-foreground">אימפולסיביות</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-3xl font-bold text-foreground">{Math.round(hyperactivity)}%</p>
                <p className="text-sm text-muted-foreground">היפראקטיביות</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>סיכום ביצועים</CardTitle>
              <CardDescription>ציון גבוה יותר = ביצוע טוב יותר</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'ציון']}
                      labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName || label}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                סיכום קליני
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed text-lg">
                {generateSummary()}
              </p>
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold mb-3">נתונים גולמיים:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground">סה"כ ניסיונות</p>
                    <p className="text-xl font-bold">{totalTrials}</p>
                  </div>
                  <div className="bg-success/10 rounded-lg p-3">
                    <p className="text-muted-foreground">תגובות נכונות</p>
                    <p className="text-xl font-bold text-success">{hits}</p>
                  </div>
                  <div className="bg-destructive/10 rounded-lg p-3">
                    <p className="text-muted-foreground">החמצות</p>
                    <p className="text-xl font-bold text-destructive">{misses}</p>
                  </div>
                  <div className="bg-warning/10 rounded-lg p-3">
                    <p className="text-muted-foreground">שגיאות אימפולסיביות</p>
                    <p className="text-xl font-bold text-warning">{commissions}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={resetAll}
              className="flex-1"
            >
              <RefreshCw className="w-5 h-5 ml-2" />
              בדיקה חדשה
            </Button>
            <Button
              variant="clinical"
              size="lg"
              onClick={() => setScreen('welcome')}
              className="flex-1"
            >
              חזרה לדף הבית
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
