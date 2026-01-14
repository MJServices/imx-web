'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSubmissionId } from '@/hooks/useSubmissionId';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';

interface Question {
  id: string;
  question: string;
  options: string[];
}

const vehicleQuestions: Question[] = [
  {
    id: 'q1',
    question: 'Does the vehicle have any accidents?',
    options: ['Yes', 'No']
  },
  {
    id: 'q2',
    question: 'Does the vehicle have any frame damage?',
    options: ['Yes', 'No']
  },
  {
    id: 'q3',
    question: 'Does the vehicle have any flood damage?',
    options: ['Yes', 'No']
  },
  {
    id: 'q4',
    question: 'Has this vehicle been smoked in?',
    options: ['Yes', 'No']
  },
  {
    id: 'q5',
    question: 'Are there any mechanical issues OR warning lights displayed on the instrument panel?',
    options: ['Yes', 'No']
  },
  {
    id: 'q6',
    question: 'Has the odometer ever been altered or replaced?',
    options: ['Yes', 'No']
  },
  {
    id: 'q7',
    question: 'Are there any panels in need of paint or body work?',
    options: ['None', 'Yes, 1', 'Yes, 2', 'Yes, 3+']
  },
  {
    id: 'q8',
    question: 'Any major rust OR hail damage?',
    options: ['Yes', 'No']
  },
  {
    id: 'q9',
    question: 'Any interior items broken or not operable?',
    options: ['No', 'Yes, 1', 'Yes, 2', 'Yes, 3+']
  },
  {
    id: 'q10',
    question: 'Are there any rips, stains, or tears in the interior?',
    options: ['No', 'Yes, 1', 'Yes, 2', 'Yes, 3+']
  },
  {
    id: 'q11',
    question: 'Do any tires need replacement?',
    options: ['No', 'Yes, 1 or 2', 'Yes, 3 or 4']
  },
  {
    id: 'q12',
    question: 'Are any aftermarket modifications to this vehicle?',
    options: ['No', 'Yes']
  }
];

export default function VehicleQuestionnaire() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentMileage, setCurrentMileage] = useState('');
  const [comments, setComments] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { submissionId } = useSubmissionId();

  // Load existing answers and form data on page load
  useEffect(() => {
    const loadData = async () => {
      if (!submissionId) return;

      setIsLoading(true);
      try {
        // Load Questionnaire Answers
        const { data: qData, error: qError } = await supabase
          .from('vehicle_questionnaire')
          .select('question_id, selected_answer')
          .eq('submission_id', submissionId);

        if (qData && !qError) {
          const existingAnswers: Record<string, string> = {};
          qData.forEach(item => {
            existingAnswers[item.question_id] = item.selected_answer;
          });
          setAnswers(existingAnswers);
        }

        // Load Intake Form Data (Mileage & Comments)
        const { data: fData, error: fError } = await supabase
          .from('intake_forms')
          .select('current_mileage, comments')
          .eq('submission_id', submissionId)
          .single();

        if (fData && !fError) {
          setCurrentMileage(fData.current_mileage || '');
          setComments(fData.comments || '');
        }

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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

      if (error) console.error('Error saving answer:', error);
    } catch (error) {
      console.error('Error saving answer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save mileage or comments to Supabase
  const saveIntakeData = async (field: 'current_mileage' | 'comments', value: string) => {
    if (!submissionId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('intake_forms')
        .upsert({
          submission_id: submissionId,
          [field]: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'submission_id'
        });

      if (error) console.error(`Error saving ${field}:`, error);
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
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

    const question = vehicleQuestions.find(q => q.id === questionId);
    if (question) {
      saveAnswer(questionId, answer, question.question);
    }
  };

  // Handle mileage change
  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentMileage(value);
    saveIntakeData('current_mileage', value);
  };

  // Handle comments change
  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setComments(value);
    saveIntakeData('comments', value);
  };

  // Check if all questions are answered and mileage is entered
  const isComplete = () => {
    const questionsAnswered = vehicleQuestions.every(q => answers[q.id]);
    const mileageEntered = currentMileage.trim().length > 0;
    return questionsAnswered && mileageEntered;
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

          {/* Current Mileage Field */}
          <div className="mb-8 p-6 bg-imx-gray-50 rounded-lg border border-imx-gray-200">
            <Label htmlFor="mileage" className="text-lg font-semibold text-imx-black block mb-4">
              Current Mileage
            </Label>
            <Input
              id="mileage"
              type="text"
              placeholder="e.g. 45,000"
              value={currentMileage}
              onChange={handleMileageChange}
              className="max-w-md"
            />
          </div>

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
          <div className="space-y-6">
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

          {/* Comments Section */}
          <div className="mt-8 p-6 bg-imx-gray-50 rounded-lg border border-imx-gray-200">
            <Label htmlFor="comments" className="text-lg font-semibold text-imx-black block mb-4">
              Comments
            </Label>
            <Textarea
              id="comments"
              placeholder="Any additional details..."
              value={comments}
              onChange={handleCommentsChange}
              className="min-h-[100px]"
            />
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
                  Please answer all questions and enter mileage to continue
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