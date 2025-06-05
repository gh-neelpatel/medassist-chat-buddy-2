
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HealthMetric {
  label: string;
  value: string;
  date: string;
  status?: 'normal' | 'warning' | 'critical';
}

const HealthSummary = () => {
  // Mock data - in a real app, this would come from an API
  const healthMetrics: HealthMetric[] = [
    { label: 'Blood Pressure', value: '120/80 mmHg', date: '2024-04-10', status: 'normal' },
    { label: 'Heart Rate', value: '72 bpm', date: '2024-04-10', status: 'normal' },
    { label: 'Blood Glucose', value: '110 mg/dL', date: '2024-04-05', status: 'normal' },
    { label: 'Cholesterol (LDL)', value: '160 mg/dL', date: '2024-03-15', status: 'warning' },
  ];

  const diagnoses = [
    { condition: 'Hypertension', diagnosedDate: '2023-12-05', status: 'Controlled' },
    { condition: 'Seasonal Allergies', diagnosedDate: '2024-02-22', status: 'Active' },
  ];

  const getStatusColor = (status?: 'normal' | 'warning' | 'critical') => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Health Summary</CardTitle>
          <CardDescription>Your latest health metrics and vital signs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <p className="text-sm font-medium">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">Last updated: {new Date(metric.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{metric.value}</p>
                  <Badge variant="outline" className={getStatusColor(metric.status)}>
                    {metric.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Conditions</CardTitle>
          <CardDescription>Your current medical diagnoses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {diagnoses.map((diagnosis, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">{diagnosis.condition}</p>
                  <p className="text-xs text-muted-foreground">
                    Diagnosed: {new Date(diagnosis.diagnosedDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={diagnosis.status === 'Controlled' ? 'outline' : 'secondary'}>
                  {diagnosis.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthSummary;
