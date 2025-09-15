import { useState, useRef, useEffect } from 'react';
import { useProjects } from '../contexts/ProjectState';
import { useQuotes } from '../contexts/QuoteContext';
import PageHeader from './PageHeader';
import Card from './Card';
import Button from './Button';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const AiCopilotPage = () => {
  const { addProject } = useProjects();
  const { addQuote } = useQuotes();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '🤖 Hello! I\'m your AI-powered construction planning assistant with **action-taking capabilities**. \n\nI can:\n• 📊 Answer questions using your project data and knowledge base\n• ⚡ **Create new projects** directly through chat\n• 💰 **Create new quotes** directly through chat\n• 🎯 Provide construction planning advice\n• 📚 Access vendor information and quotes\n\nTry saying: "Create a new project for renovating the downtown office" or "Create a quote for kitchen renovation - $25,000 budget" or ask me anything about construction planning!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Step 1: Fetch enhanced context from our RAG backend (with user query)
      const contextUrl = `http://localhost:4000/api/ai-context?query=${encodeURIComponent(userMessage.content)}`;
      const contextResponse = await fetch(contextUrl, {
        credentials: 'include'
      });
      
      if (!contextResponse.ok) {
        throw new Error('Failed to fetch context data');
      }
      
      const { context, sources } = await contextResponse.json();

      // Step 2: Try Gemini AI with enhanced RAG context + Function Calling
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
      }

      const prompt = `${context}

User Question: "${userMessage.content}"

You are a construction planning assistant with access to project management and quote tools. You can help users create and manage both projects and quotes.

Please provide a helpful, detailed response. If the user is asking to create a project or mentions needing to start/track a new project, use the createProject function to help them. If the user is asking to create a quote or mentions needing to generate/prepare a quote, use the addQuote function to help them.

If you reference any knowledge from the knowledge base, please cite it appropriately.`;

      // Define available functions for the AI
      const tools = [
        {
          function_declarations: [
            {
              name: "createProject",
              description: "Create a new project for the user. Use this when the user asks to create, start, or track a new project.",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "The name of the project"
                  },
                  description: {
                    type: "string", 
                    description: "A brief description of the project"
                  },
                  status: {
                    type: "string",
                    description: "The initial status of the project",
                    enum: ["planning", "in-progress", "review", "completed", "on-hold"]
                  },
                  priority: {
                    type: "string",
                    description: "The priority level of the project",
                    enum: ["low", "medium", "high", "urgent"]
                  }
                },
                required: ["name"]
              }
            },
            {
              name: "addQuote",
              description: "Create a new quote for the user. Use this when the user asks to create, generate, prepare, or add a quote.",
              parameters: {
                type: "object",
                properties: {
                  quoteName: {
                    type: "string",
                    description: "The name or title of the quote"
                  },
                  status: {
                    type: "string",
                    description: "The status of the quote",
                    enum: ["Draft", "Pending", "Approved", "Rejected", "Completed"]
                  },
                  timeToDevelop: {
                    type: "string",
                    description: "The estimated time to develop/complete the project (e.g., '2 weeks', '1 month')"
                  },
                  variancePercentage: {
                    type: "number",
                    description: "The variance percentage for the quote (as a decimal, e.g., 0.1 for 10%)"
                  },
                  quoteTotal: {
                    type: "number",
                    description: "The total amount of the quote"
                  },
                  budget: {
                    type: "number",
                    description: "The budget for the quote"
                  }
                },
                required: ["quoteName"]
              }
            }
          ]
        }
      ];

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          tools: tools,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API Error:', geminiResponse.status, errorText);
        
        // Check if it's a rate limit or quota issue - provide fallback response
        if (geminiResponse.status === 503 || geminiResponse.status === 429) {
          // Provide a basic response using just the context we fetched
          const fallbackResponse = await generateFallbackResponse(userMessage.content, context, sources);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: fallbackResponse,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
        
        throw new Error(`AI service responded with status ${geminiResponse.status}: ${errorText}`);
      }

      const geminiData = await geminiResponse.json();
      const candidate = geminiData.candidates?.[0];
      
      if (!candidate) {
        throw new Error('No response generated from AI');
      }

      // Check if AI wants to call a function
      const functionCall = candidate.content?.parts?.find((part: any) => part.functionCall);
      let aiResponseText = '';
      
      if (functionCall) {
        // Handle function call
        const { name: functionName, args } = functionCall.functionCall;
        
        if (functionName === 'createProject') {
          try {
            // Debug: Log the function call arguments
            console.log('Function call args:', args);
            console.log('Args type:', typeof args);
            console.log('Args keys:', Object.keys(args || {}));
            
            // Create the project using our context
            const projectData = {
              name: args.name || args.projectName || 'New Project',
              description: args.description || '',
              status: args.status || 'planning',
              priority: args.priority || 'medium'
            };
            
            console.log('Project data being sent:', projectData);
            
            await addProject(projectData);
            
            // Generate response about successful creation
            aiResponseText = `✅ **Project Created Successfully!**

I've created a new project for you:

**Project Name:** ${projectData.name}
**Description:** ${projectData.description || 'No description provided'}
**Status:** ${projectData.status}
**Priority:** ${projectData.priority}

The project has been added to your Projects page where you can manage it further. You can update the status, priority, or add more details anytime.

Is there anything else you'd like me to help you with for this project?`;
            
          } catch (error) {
            aiResponseText = `❌ **Failed to Create Project**

I encountered an error while trying to create the project: ${error instanceof Error ? error.message : 'Unknown error'}

Please try again or create the project manually from the Projects page.`;
          }
        } else if (functionName === 'addQuote') {
          try {
            // Debug: Log the function call arguments
            console.log('Quote function call args:', args);
            console.log('Args type:', typeof args);
            console.log('Args keys:', Object.keys(args || {}));
            
            // Create the quote using our context
            const quoteData = {
              quoteName: args.quoteName || 'New Quote',
              status: args.status || 'Draft',
              timeToDevelop: args.timeToDevelop || '',
              variancePercentage: args.variancePercentage || 0,
              quoteTotal: args.quoteTotal || 0,
              budget: args.budget || 0
            };
            
            console.log('Quote data being sent:', quoteData);
            
            const newQuote = await addQuote(quoteData);
            
            // Generate response about successful creation
            aiResponseText = `✅ **Quote Created Successfully!**

I've created a new quote for you:

**Quote Name:** ${newQuote.quoteName}
**Status:** ${newQuote.status}
**Time to Develop:** ${newQuote.timeToDevelop || 'Not specified'}
**Variance:** ${newQuote.variancePercentage}%
**Quote Total:** $${newQuote.quoteTotal.toLocaleString()}
**Budget:** $${newQuote.budget.toLocaleString()}

The quote has been added to your Quotes page where you can manage it further. You can update the status, amounts, or add more details anytime.

Is there anything else you'd like me to help you with for this quote?`;
            
          } catch (error) {
            aiResponseText = `❌ **Failed to Create Quote**

I encountered an error while trying to create the quote: ${error instanceof Error ? error.message : 'Unknown error'}

Please try again or create the quote manually from the Quotes page.`;
          }
        }
      } else {
        // Regular text response
        aiResponseText = candidate.content?.parts?.[0]?.text || 'I apologize, but I couldn\'t generate a response. Please try again.';
      }
      
      // Add source information if knowledge base was used
      if (sources?.knowledgeBase) {
        aiResponseText += '\n\n*💡 This response included information from our construction knowledge base.*';
      }
      if (sources?.privateData) {
        aiResponseText += '\n\n*📊 This response used your specific business data.*';
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      let errorContent = '';
      
      // If it's a Gemini overload error, provide a helpful fallback
      if (error instanceof Error && (error.message.includes('overloaded') || error.message.includes('503') || error.message.includes('429'))) {
        errorContent = `🤖 **AI Service Temporarily Overloaded**

The Gemini AI service is currently experiencing high demand. However, I was still able to search our knowledge base for your question: "${userMessage.content}"

**📚 Here's what I found in our construction knowledge base:**

For questions about construction topics like change orders, billing cycles, or FP&A, I recommend checking our knowledge base directly or trying your question again in a few minutes when the AI service is less busy.

**💡 Tip:** You can also ask me about your specific project data, which doesn't require the external AI service.`;
      } else {
        errorContent = `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback response generator when Gemini is overloaded
  const generateFallbackResponse = async (question: string, context: string, sources: any): Promise<string> => {
    const lowercaseQuestion = question.toLowerCase();
    
    // If we have knowledge base results, extract and present them
    if (sources?.knowledgeBase && context.includes('📚 Relevant Knowledge Base Information')) {
      const knowledgeSection = context.split('📚 Relevant Knowledge Base Information')[1];
      if (knowledgeSection) {
        return `🤖 **AI Service Temporarily Busy - Here's What I Found**

While the main AI service is overloaded, I was able to search our construction knowledge base for your question: "${question}"

${knowledgeSection.substring(0, 800)}...

*💡 This information comes from our construction knowledge base. For a more detailed AI-generated response, please try again in a few minutes when the service is less busy.*

**Your Business Data:**
${context.split('📚 Relevant Knowledge Base Information')[0].substring(0, 300)}...`;
      }
    }
    
    // Basic pattern matching for common construction questions
    if (lowercaseQuestion.includes('change order')) {
      return `🤖 **AI Service Temporarily Busy**

Based on your question about change orders, here's what I can tell you:

A change order is a formal document that details amendments to the original construction contract. It typically includes:
- Description of the change
- Cost impact (positive or negative)
- Schedule impact
- Approval signatures

**From Your Business Data:**
${context.substring(0, 400)}...

*💡 For a more detailed AI-generated response, please try again when the AI service is less busy.*`;
    }
    
    if (lowercaseQuestion.includes('billing') || lowercaseQuestion.includes('payment')) {
      return `🤖 **AI Service Temporarily Busy**

Based on your question about billing/payments:

Construction billing typically follows progress billing cycles where you invoice based on work completed. Key components include:
- Schedule of Values
- Percentage completion
- Retainage (usually 5-10%)
- Lien waivers

**From Your Business Data:**
${context.substring(0, 400)}...

*💡 For a more detailed AI-generated response, please try again when the AI service is less busy.*`;
    }
    
    // Generic fallback
    return `🤖 **AI Service Temporarily Busy**

The main AI service is currently overloaded, but I was able to fetch your business context:

${context.substring(0, 500)}...

**Suggestion:** Try rephrasing your question: "${question}" in a few minutes when the AI service is less busy.

*💡 Our RAG system is working - it's just the final AI processing that's temporarily unavailable.*`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title="AI-Copilot" 
        subtitle="Your action-taking AI assistant with access to your project data and the ability to create projects via chat."
        size="lg"
      />
      
      <Card variant="glass" className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col h-full">
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                    : 'bg-gradient-to-r from-green-500 to-teal-500'
                }`}>
                  {message.type === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex flex-col max-w-[80%] ${
                  message.type === 'user' ? 'items-end' : 'items-start'
                }`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-slate-800/50 border border-slate-700/50 text-slate-100'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Loader2 size={16} className="animate-spin" />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t border-slate-700/50 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about your projects, budgets, vendors, or get construction planning advice..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                  rows={3}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!input.trim() || isLoading}
                className="self-end"
              >
                <Send size={16} />
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AiCopilotPage;
