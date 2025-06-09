import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Eye, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import PersonalityOnboarding from './PersonalityOnboarding';
import { PersonalityProfile } from '../services/personalityService';

const PersonalityTestPreview: React.FC = () => {
  const [showTest, setShowTest] = useState(false);
  const [lastResult, setLastResult] = useState<PersonalityProfile | null>(null);

  const handleTestComplete = (profile: PersonalityProfile) => {
    setLastResult(profile);
    setShowTest(false);
  };

  const handleTestSkip = () => {
    setShowTest(false);
  };

  const startNewTest = () => {
    setShowTest(true);
  };

  const getPersonalityTitle = (type: string) => {
    const titles = {
      luxury_seeker: 'Lüks Arayıcısı 💎',
      adventure_lover: 'Macera Tutkunları 🗻',
      culture_explorer: 'Kültür Kaşifi 🏛️',
      romantic_dreamer: 'Romantik Rüyacı 💕'
    };
    return titles[type as keyof typeof titles] || type;
  };

  const getBudgetTitle = (budget: string) => {
    const titles = {
      budget: 'Akıllı Seçimler (15-30k₺)',
      mid_range: 'Konforlu Deneyim (30-60k₺)',
      luxury: 'Premium Kalite (60-100k₺)',
      ultra_luxury: 'Sınırsız Lüks (100k₺+)'
    };
    return titles[budget as keyof typeof titles] || budget;
  };

  if (showTest) {
    return (
      <PersonalityOnboarding 
        onComplete={handleTestComplete}
        onSkip={handleTestSkip}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 Personality Test Preview
          </h1>
          <p className="text-gray-600">
            Test the personality onboarding system
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Test Controls */}
          <Card className="glass-card border border-blue-200 shadow-lg backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600" />
                Test Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={startNewTest}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start New Test
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setLastResult(null)}
                  disabled={!lastResult}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Results
                </Button>
              </div>
              
              <div className="text-sm text-gray-600 p-4 bg-blue-50 rounded-lg">
                <p><strong>Test Features:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>6 personality assessment questions</li>
                  <li>Real-time progress tracking</li>
                  <li>Personality type analysis</li>
                  <li>Budget and preference mapping</li>
                  <li>AI personalization preview</li>
                  <li>Beautiful results screen</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Last Test Result */}
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card border border-green-200 shadow-lg backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Eye className="w-5 h-5" />
                    Last Test Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Personality Type</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {getPersonalityTitle(lastResult.personalityType)}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Budget Range</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {getBudgetTitle(lastResult.budgetRange)}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Travel Style</label>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {lastResult.travelStyle}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Duration Preference</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {lastResult.durationPreference} days
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Profile Score</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {lastResult.profileScore}/100
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Main Priority</label>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {lastResult.mainPriority.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="text-sm font-medium text-gray-600">AI Personality</label>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                      {lastResult.aiPersonality}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Instructions */}
          <Card className="glass-card border border-gray-200 shadow-lg backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="text-center text-gray-600">
                <User className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">
                  This preview lets you test the personality onboarding system without affecting real user data.
                  <br />
                  Click "Start New Test" to experience the full flow.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonalityTestPreview;