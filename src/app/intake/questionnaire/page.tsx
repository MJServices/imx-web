'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSubmissionId } from '@/hooks/useSubmissionId';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface QuestionnaireAnswer {
  question_id: string;
  selected_answer: string;
}

const vehicleQuestions: Question[] = [
  {
    id: 'q1',
    question: 'What is your primary reason for purchasing this vehicle?',
    options: ['Daily commuting', 'Family transportation', 'Business use', 'Recreation/leisure', 'Investment']
  },
  {
    id: 'q2',
    question: 'How often do you plan to drive this vehicle?',
    options: ['Daily', '3-4 times per week', '1-2 times per week', 'Occasionally', 'Rarely']
  },
  {
    id: 'q3',
    question: 'What is your typical driving distance per day?',
    options: ['Less than 10 miles', '10-25 miles', '25-50 miles', '50-100 miles', 'More than 100 miles']
  },
  {
    id: 'q4',
    question: 'Do you have experience with this vehicle make/model?',
    options: ['Yes, I\'ve owned this exact model', 'Yes, I\'ve owned this make', 'Some experience with similar vehicles', 'No previous experience', 'First-time car buyer']
  },
  {
    id: 'q5',
    question: 'What is your preferred fuel type?',
    options: ['Gasoline', 'Hybrid', 'Electric', 'Diesel', 'No preference']
  },
  {
    id: 'q6',
    question: 'How important is fuel efficiency to you?',
    options: ['Extremely important', 'Very important', 'Moderately important', 'Slightly important', 'Not important']
  },
  {
    id: 'q7',
    question: 'What is your budget range for monthly payments?',
    options: ['Under $200', '$200-$400', '$400-$600', '$600-$800', 'Over $800']
  },
  {
    id: 'q8',
    question: 'Do you plan to trade in a current vehicle?',
    options: ['Yes, I have a trade-in', 'No trade-in', 'Considering it', 'Will sell privately', 'Undecided']
  },
  {
    id: 'q9',
    question: 'What is most important to you in a vehicle?',
    options: ['Reliability', 'Safety features', 'Performance', 'Comfort', 'Technology features']
  },
  {
    id: 'q10',
    question: 'How long do you typically keep a vehicle?',
    options: ['1-2 years', '3-5 years', '6-8 years', '9-12 years', 'Until it stops working']
  },
  {
    id: 'q11',
    question: 'Do you prefer new or used vehicles?',
    options: ['Always new', 'Prefer new', 'No preference', 'Prefer used', 'Always used']
  },
  {
    id: 'q12',
    question: 'What type of warranty coverage do you prefer?',
    options: ['Extended warranty', 'Standard manufacturer warranty', 'Third-party warranty', 'No warranty needed', 'Unsure']
  },
  {
    id: 'q13',
    question: 'How do you typically maintain your vehicles?',
    options: ['Dealership service', 'Independent mechanic', 'Do it myself', 'Mix of options', 'Minimal maintenance']
  },
  {
    id: 'q14',
    question: 'What influenced your decision to choose this specific vehicle?',
    options: ['Online research', 'Friend/family recommendation', 'Previous experience', 'Dealer recommendation', 'Advertisement']
  },
  {
    id: 'q15',
    question: 'When do you need to complete this purchase?',
    options: ['Immediately', 'Within 1 week', 'Within 1 month', 'Within 3 months', 'No rush']
  }
];

export default function VehicleQuestionnaire() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { submissionId } = useSubmissionId();

  // Load existing answers on page load
  useEffect(() => {
    const loadExistingAnswers = async () => {
      if (!submissionId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('vehicle_questionnaire')
          .select('question_id, selected_answer')
          .eq('submission_id', submissionId);

        if (data && !error) {
          const existingAnswers: Record<string, string> = {};
          data.forEach(item => {
            existingAnswers[item.question_id] = item.selected_answer;
          });
          setAnswers(existingAnswers);
        }
      } catch (error) {
        console.error('Error loading existing answers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingAnswers();
  }, [submissionId]);

  // Save answer to Supabase instantly on change
  const saveAnswer = async (questionId: string, answer: string, questionText: string) => {
    if (!submissionId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('vehicle_questionnaire')
        .upsert({
          submission_id: submissionId,
          question_id: questionId,
          question_text: questionText,
          selected_answer: answer,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'submission_id,question_id'
        });

      if (error) {
        console.error('Error saving answer:', error);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle answer selection
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Find the question text
    const question = vehicleQuestions.find(q => q.id === questionId);
    if (question) {
      saveAnswer(questionId, answer, question.question);
    }
  };

  // Check if all questions are answered
  const isComplete = () => {
    return vehicleQuestions.every(q => answers[q.id]);
  };

  const handleNext = () => {
    if (isComplete()) {
      router.push('/intake/photos');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-imx-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imx-red mx-auto"></div>
            <p className="mt-4 text-imx-gray-600">Loading questionnaire...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-imx-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-imx-gray-700">Step 2 of 3</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-imx-gray-500">Vehicle Questionnaire</span>
                {isSaving && (
                  <div className="flex items-center text-xs text-imx-red">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-imx-red mr-1"></div>
                    Saving...
                  </div>
                )}
              </div>
            </div>
            <div className="w-full bg-imx-gray-200 rounded-full h-2">
              <div 
                className="bg-imx-red h-2 rounded-full transition-all duration-300"
                style={{ width: '66.67%' }}
              ></div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-imx-black mb-2">
            Vehicle Questionnaire
          </h1>
          <p className="text-imx-gray-600 mb-8">
            Please answer the following questions to help us better understand your vehicle needs.
          </p>

          {/* Progress Counter */}
          <div className="mb-6 p-4 bg-imx-gray-50 rounded-lg border border-imx-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-imx-gray-700">
                Progress: {Object.keys(answers).length} of {vehicleQuestions.length} questions answered
              </span>
              <div className="w-32 bg-imx-gray-200 rounded-full h-2">
                <div 
                  className="bg-imx-red h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(Object.keys(answers).length / vehicleQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-8">
            {vehicleQuestions.map((question, index) => (
              <div key={question.id} className="border border-imx-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-imx-black mb-4">
                  {index + 1}. {question.question}
                </h3>
                
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  className="space-y-3"
                >
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value={option} 
                        id={`${question.id}-${optionIndex}`}
                        className="border-imx-gray-300 text-imx-red focus:ring-imx-red"
                      />
                      <Label 
                        htmlFor={`${question.id}-${optionIndex}`}
                        className="text-imx-gray-700 cursor-pointer hover:text-imx-black transition-colors"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 mt-8 border-t border-imx-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/intake/questions')}
              className="border-imx-gray-300 text-imx-gray-700 hover:bg-imx-gray-50"
            >
              Back to Form
            </Button>

            <div className="flex items-center space-x-4">
              {!isComplete() && (
                <span className="text-sm text-imx-gray-500">
                  Please answer all questions to continue
                </span>
              )}
              <Button
                onClick={handleNext}
                disabled={!isComplete()}
                className="bg-imx-red text-white hover:bg-red-700 disabled:bg-imx-gray-300"
              >
                Continue to Photos
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}