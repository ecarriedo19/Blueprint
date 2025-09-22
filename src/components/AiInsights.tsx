import React, { useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Card from './Card';
import Button from './Button';

interface Quote {
  id: number;
  quoteName: string;
  status: string;
  quoteTotal: number;
  budget: number;
  created_at: string;
  updated_at: string;
}

interface LineItem {
  id: number;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  created_at: string;
  updated_at: string;
}

interface AiInsightsProps {
  quote: Quote;
  lineItems: LineItem[];
}

interface AnalysisResponse {
  success: boolean;
  analysis: string;
  sources: {
    privateData: boolean;
    knowledgeBase: boolean;
    quoteName: string;
  };
  error?: string;
}

const AiInsights: React.FC<AiInsightsProps> = ({ quote, lineItems }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);

    try {
      const response = await fetch('http://localhost:4000/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          quote,
          lineItems
        }),
      });

      const data: AnalysisResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate analysis');
      }

      setInsights(data.analysis);
    } catch (err) {
      console.error('Error generating AI analysis:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatInsights = (text: string) => {
    // Split the text into lines and process each one
    const lines = text.split('\n').filter(line => line.trim());
    const formattedLines: JSX.Element[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) return;

      // Check for bullet points or special formatting
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const content = trimmedLine.substring(1).trim();
        const icon = getInsightIcon(content);
        const color = getInsightColor(content);
        
        formattedLines.push(
          <div key={index} className={`flex items-start gap-3 mb-3 p-3 rounded-lg bg-white/5 border-l-4 ${color.border}`}>
            <div className={`flex-shrink-0 mt-0.5 ${color.text}`}>
              {icon}
            </div>
            <p className="text-slate-200 leading-relaxed">{content}</p>
          </div>
        );
      } else {
        // Regular text line
        formattedLines.push(
          <p key={index} className="text-slate-300 mb-2 leading-relaxed">
            {trimmedLine}
          </p>
        );
      }
    });

    return formattedLines;
  };

  const getInsightIcon = (content: string) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('🟢') || lowerContent.includes('positive') || lowerContent.includes('good') || lowerContent.includes('opportunity')) {
      return <CheckCircle className="w-5 h-5" />;
    } else if (lowerContent.includes('🟡') || lowerContent.includes('warning') || lowerContent.includes('concern') || lowerContent.includes('attention')) {
      return <AlertTriangle className="w-5 h-5" />;
    } else if (lowerContent.includes('🔴') || lowerContent.includes('risk') || lowerContent.includes('critical') || lowerContent.includes('immediate')) {
      return <XCircle className="w-5 h-5" />;
    } else if (lowerContent.includes('💡') || lowerContent.includes('recommendation') || lowerContent.includes('suggest') || lowerContent.includes('consider')) {
      return <Lightbulb className="w-5 h-5" />;
    } else {
      return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getInsightColor = (content: string) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('🟢') || lowerContent.includes('positive') || lowerContent.includes('good') || lowerContent.includes('opportunity')) {
      return { text: 'text-green-400', border: 'border-green-400' };
    } else if (lowerContent.includes('🟡') || lowerContent.includes('warning') || lowerContent.includes('concern') || lowerContent.includes('attention')) {
      return { text: 'text-yellow-400', border: 'border-yellow-400' };
    } else if (lowerContent.includes('🔴') || lowerContent.includes('risk') || lowerContent.includes('critical') || lowerContent.includes('immediate')) {
      return { text: 'text-red-400', border: 'border-red-400' };
    } else if (lowerContent.includes('💡') || lowerContent.includes('recommendation') || lowerContent.includes('suggest') || lowerContent.includes('consider')) {
      return { text: 'text-blue-400', border: 'border-blue-400' };
    } else {
      return { text: 'text-slate-400', border: 'border-slate-400' };
    }
  };

  return (
    <Card variant="glass" className="mt-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">AI Financial Insights</h3>
              <p className="text-sm text-slate-400">Expert analysis of your quote's financial health</p>
            </div>
          </div>
          
          <Button
            onClick={generateAnalysis}
            disabled={isLoading}
            variant="primary"
            size="md"
            className="min-w-[180px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Analysis
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
              <p className="text-slate-300 mb-2">Analyzing your quote data...</p>
              <p className="text-xs text-slate-500">Consulting industry knowledge base and financial metrics</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <h4 className="font-medium text-red-400">Analysis Failed</h4>
            </div>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Insights Display */}
        {insights && !isLoading && (
          <div className="space-y-4">
            <div className="border-b border-slate-700/50 pb-4 mb-6">
              <h4 className="text-lg font-medium text-white mb-2">Financial Analysis Results</h4>
              <p className="text-sm text-slate-400">
                Based on {lineItems.length} line items and industry best practices
              </p>
            </div>
            
            <div className="space-y-3">
              {formatInsights(insights)}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 text-center">
                Analysis generated using AI with construction industry knowledge base • Always verify recommendations with project stakeholders
              </p>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!insights && !isLoading && !error && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">Ready for AI Analysis</h4>
            <p className="text-slate-400 mb-4 max-w-md mx-auto">
              Get expert insights on your quote's financial health, identify risks, and discover opportunities for cost optimization.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Risk Assessment
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Profit Analysis
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Cost Optimization
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AiInsights;