import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, FileText, AlertTriangle, Lightbulb, User, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface HistorySummary {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskFactors: string[];
  generatedAt: string;
}

export function PatientHistorySummary() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<HistorySummary | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setSummary(null); // Clear previous summary
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setSummary(null);
  };

  const handleGenerateSummary = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('historyFile', selectedFile);

      const response = await fetch('http://localhost:5000/api/ai/patient-history-summary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      
      if (data.success) {
        setSummary(data.data);
        toast.success('Patient history summary generated successfully!');
      } else {
        throw new Error(data.error?.message || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Patient History Summary
          </h1>
          <p className="text-lg text-gray-600">
            Upload patient history files and get AI-powered comprehensive summaries
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Upload Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Upload Patient History</span>
                </CardTitle>
                <CardDescription>
                  Upload a text file containing patient medical history for AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  file={selectedFile}
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  accept=".txt"
                  maxSize={10}
                  disabled={isProcessing}
                />

                <Button
                  onClick={handleGenerateSummary}
                  disabled={!selectedFile || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Brain className="animate-spin h-4 w-4 mr-2" />
                      Generating Summary...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate AI Summary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Sample Data Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sample Patient History</CardTitle>
                <CardDescription>
                  Example of the type of content you can upload
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40 w-full rounded border p-3 text-sm">
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Patient:</strong> John Smith, 45-year-old male</p>
                    <p><strong>Chief Complaint:</strong> Chest pain and shortness of breath</p>
                    <p><strong>History:</strong> Patient reports intermittent chest pain for the past 3 months...</p>
                    <p><strong>Past Medical History:</strong> Hypertension, Type 2 Diabetes, Hyperlipidemia</p>
                    <p><strong>Medications:</strong> Metformin 1000mg BID, Lisinopril 10mg daily, Atorvastatin 20mg daily</p>
                    <p><strong>Allergies:</strong> Penicillin (rash)</p>
                    <p><strong>Social History:</strong> Former smoker (quit 2 years ago), occasional alcohol use</p>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Summary Results Section */}
          <div className="space-y-6">
            {summary ? (
              <>
                {/* AI Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-green-600" />
                      <span>AI-Generated Summary</span>
                      <Badge variant="secondary" className="ml-auto">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(summary.generatedAt).toLocaleString()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96 pr-4">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-gray-800">
                          {summary.summary}
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Key Findings */}
                {summary.keyFindings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <span>Key Findings</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {summary.keyFindings.map((finding, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-gray-800">{finding}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Risk Factors */}
                {summary.riskFactors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <span>Risk Factors</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {summary.riskFactors.map((risk, index) => (
                          <Alert key={index} className="border-orange-200">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              {risk}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {summary.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                        <span>Recommendations</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {summary.recommendations.map((recommendation, index) => (
                          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <p className="text-yellow-800">{recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <CardContent className="text-center">
                  <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Summary Generated Yet
                  </h3>
                  <p className="text-gray-500">
                    Upload a patient history file and click "Generate AI Summary" to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 