import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Bot, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from './WorkspaceLayout';
import { useProjects, useQuotes } from '../utils/queries';
import { useProjects as useProjectMutations } from '../contexts/ProjectState';
import { useQuotes as useQuoteMutations } from '../contexts/QuoteContext';
import Button from './Button';
import Card from './Card';

interface Message {
  id: string;
  type: 'user' | 'ai';
  messageType: 'text' | 'project_list' | 'quote_list';
  content: string | any[];
  timestamp: Date;
}

interface PreviewContent {
  type: 'welcome' | 'project_list' | 'quote_list' | 'quote_editor' | 'project_editor';
  data?: any;
  title?: string;
  subtitle?: string;
}

const AiCopilotPage = () => {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const { data: quotes = [] } = useQuotes();
  const { addProject, updateProject } = useProjectMutations();
  const { addQuote, updateQuote } = useQuoteMutations();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Chat states
  const [sessionActive, setSessionActive] = useState(false);
  const [input, setInput] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [_userPrompt, setUserPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Live preview state
  const [previewContent, setPreviewContent] = useState<PreviewContent>({
    type: 'welcome',
    title: 'AI Workshop',
    subtitle: 'Your conversation will come to life here'  
  });

  // Utility functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // React Query automatically keeps data fresh, no manual refresh needed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // If this is the first submission (lobby), activate the workshop
    if (!sessionActive) {
      setIsLoading(true);
      setUserPrompt(input.trim());
      
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSessionActive(true);
      setIsLoading(false);
      
      // Add initial message to chat
      const initialMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        messageType: 'text',
        content: input.trim(),
        timestamp: new Date()
      };
      setMessages([initialMessage]);
      setInput('');
      
      // Process the initial message with AI
      await processAIMessage(initialMessage.content as string);
      return;
    }

    // Workshop chat mode
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      messageType: 'text',
      content: input.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await processAIMessage(userMessage.content as string);
  };

  const processAIMessage = async (userMessage: string) => {
    try {
      // Step 1: Fetch enhanced context from our RAG backend (with user query)
      const contextUrl = `http://localhost:4000/api/ai-context?query=${encodeURIComponent(userMessage)}`;
      const contextResponse = await fetch(contextUrl, {
        credentials: 'include'
      });
      
      if (!contextResponse.ok) {
        throw new Error(`Context API error: ${contextResponse.status}`);
      }
      
      const { context, sources } = await contextResponse.json();

      // Step 2: Try Gemini AI with enhanced RAG context + Function Calling
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `${context}

You are a construction planning assistant with access to project management and quote tools. You can help users create and manage both projects and quotes.

CRITICAL CONVERSATIONAL RULES:
1. If a user indicates intent to create a project or quote but has NOT provided all necessary information, DO NOT call the tool immediately.
2. Instead, respond with a friendly, natural language question asking for the specific missing information.
3. Only call createProject or addQuote functions when you have ALL required parameters from the user.
4. Use getProjects() to show the user their current projects.
5. Use getQuotes() to show the user their current quotes.
6. Use updateProject() to modify existing projects when users ask to update, modify, or change projects.
7. Use updateQuote() to modify existing quotes when users ask to update, modify, or change quotes.

For createProject, you need: name (required), and ideally: description, status, priority
For addQuote, you need: quoteName (required), and ideally: status, timeToDevelop, variancePercentage, quoteTotal, budget
For updateProject, you need: projectIdentifier (required), and any fields to update: name, description, status, priority
For updateQuote, you need: quoteIdentifier (required), and any fields to update: quoteName, status, timeToDevelop, quoteTotal, budget

EXAMPLES OF PROPER RESPONSES:
- User: "Can you create a project for me?" → Ask: "I'd be happy to create a project for you! What would you like to name the project, and can you provide a brief description, status, and priority level?"
- User: "I need a quote for kitchen renovation" → Ask: "I can create that quote for you! For the 'kitchen renovation' quote, what status should it have, what's the estimated time to develop, the quote total amount, and budget?"
- User: "Show me my projects" → Call getProjects() function
- User: "What quotes do I have?" → Call getQuotes() function
- User: "Modify the Housing Dev quote" → Call updateQuote() function with quoteIdentifier="Housing Dev"
- User: "Update the Blueprint project status to completed" → Call updateProject() function with projectIdentifier="Blueprint" and status="completed"

Please provide helpful, conversational responses. If you reference knowledge from the knowledge base, cite it appropriately.`;

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
                  timeToDevelopValue: {
                    type: "number",
                    description: "The numeric value for time to develop (e.g., 2 for '2 weeks')"
                  },
                  timeToDevelopUnit: {
                    type: "string",
                    description: "The time unit for development duration",
                    enum: ["Days", "Weeks", "Months"]
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
            },
            {
              name: "getProjects",
              description: "Fetch and display the user's current projects. Use this when the user asks to see, show, list, or view their projects.",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            },
            {
              name: "getQuotes",
              description: "Fetch and display the user's current quotes. Use this when the user asks to see, show, list, or view their quotes.",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            },
            {
              name: "updateProject",
              description: "Update an existing project. Use this when the user asks to modify, update, or change an existing project.",
              parameters: {
                type: "object",
                properties: {
                  projectIdentifier: {
                    type: "string",
                    description: "The name or identifier of the project to update"
                  },
                  name: {
                    type: "string",
                    description: "New name for the project (optional)"
                  },
                  description: {
                    type: "string",
                    description: "New description for the project (optional)"
                  },
                  status: {
                    type: "string",
                    description: "New status for the project (optional)",
                    enum: ["planning", "in-progress", "review", "completed", "on-hold"]
                  },
                  priority: {
                    type: "string",
                    description: "New priority for the project (optional)",
                    enum: ["low", "medium", "high", "urgent"]
                  }
                },
                required: ["projectIdentifier"]
              }
            },
            {
              name: "updateQuote",
              description: "Update an existing quote. Use this when the user asks to modify, update, or change an existing quote.",
              parameters: {
                type: "object",
                properties: {
                  quoteIdentifier: {
                    type: "string",
                    description: "The name or identifier of the quote to update"
                  },
                  quoteName: {
                    type: "string",
                    description: "New name for the quote (optional)"
                  },
                  status: {
                    type: "string",
                    description: "New status for the quote (optional)",
                    enum: ["Draft", "Pending", "Approved", "Rejected", "Completed"]
                  },
                  timeToDevelop: {
                    type: "string",
                    description: "New estimated time to develop (optional)"
                  },
                  timeToDevelopValue: {
                    type: "number",
                    description: "New numeric value for time to develop (optional)"
                  },
                  timeToDevelopUnit: {
                    type: "string",
                    description: "New time unit for development duration (optional)",
                    enum: ["Days", "Weeks", "Months"]
                  },
                  variancePercentage: {
                    type: "number",
                    description: "New variance percentage (optional)"
                  },
                  quoteTotal: {
                    type: "number",
                    description: "New total amount for the quote (optional)"
                  },
                  budget: {
                    type: "number",
                    description: "New budget for the quote (optional)"
                  }
                },
                required: ["quoteIdentifier"]
              }
            }
          ]
        }
      ];

      // Build conversation history for context (include recent messages)
      const buildConversationHistory = () => {
        const recentMessages = messages.slice(-6); // Get last 6 messages for context
        const conversationHistory: any[] = [];
        
        // Add system message with context and rules
        conversationHistory.push({
          role: 'user',
          parts: [{
            text: prompt
          }]
        });
        
        // Add recent conversation history
        recentMessages.forEach(msg => {
          if (msg.type === 'user') {
            conversationHistory.push({
              role: 'user',
              parts: [{
                text: typeof msg.content === 'string' ? msg.content : '[User message with structured data]'
              }]
            });
          } else if (msg.type === 'ai') {
            // For AI messages, only include text messages in conversation history
            if (msg.messageType === 'text') {
              conversationHistory.push({
                role: 'model',
                parts: [{
                  text: msg.content as string
                }]
              });
            } else {
              // For structured data messages, include a summary instead
              const summary = msg.messageType === 'project_list' 
                ? `[AI showed ${(msg.content as any[]).length} projects]`
                : msg.messageType === 'quote_list'
                ? `[AI showed ${(msg.content as any[]).length} quotes]`
                : '[AI showed structured data]';
              
              conversationHistory.push({
                role: 'model',
                parts: [{
                  text: summary
                }]
              });
            }
          }
        });
        
        // Add the current user message
        conversationHistory.push({
          role: 'user',
          parts: [{
            text: userMessage
          }]
        });
        
        return conversationHistory;
      };

      const conversationHistory = buildConversationHistory();

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: conversationHistory,
          tools: tools,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!geminiResponse.ok) {
        console.error('Gemini API error:', geminiResponse.status, await geminiResponse.text());
        
        if (geminiResponse.status === 503 || geminiResponse.status === 429) {
          // Provide a basic response using just the context we fetched
          const fallbackResponse = await generateFallbackResponse(userMessage, context, sources);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            messageType: 'text',
            content: fallbackResponse,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
        
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const data = await geminiResponse.json();
      console.log('Full Gemini Response:', JSON.stringify(data, null, 2));

      const candidate = data.candidates?.[0];
      if (!candidate) {
        throw new Error('No response from Gemini API');
      }

      let aiResponseText = '';

      // Check if there's a function call
      const functionCall = candidate.content?.parts?.find((part: any) => part.functionCall);
      
      if (functionCall) {
        console.log('Function call detected:', functionCall);
        const { name: functionName, args } = functionCall.functionCall;
        
        await handleFunctionCall(functionName, args);
      } else {
        // Regular text response
        aiResponseText = candidate.content?.parts?.[0]?.text || 'I apologize, but I couldn\'t generate a response. Please try again.';
        
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
          messageType: 'text',
          content: aiResponseText,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorContent = 'I apologize, but I encountered an error';
      if (error instanceof Error) {
        if (error.message.includes('400')) {
          errorContent = `I apologize, but I encountered an error: AI service responded with status 400: ${error.message}. Please try again.`;
        } else {
          errorContent = `I apologize, but I encountered an error: ${error.message}. Please try again.`;
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        messageType: 'text',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFunctionCall = async (functionName: string, args: any) => {
    let aiResponseText = '';
    
    if (functionName === 'createProject') {
      try {
        const projectData = {
          name: args.name || args.projectName || 'New Project',
          description: args.description || '',
          status: args.status || 'planning',
          priority: args.priority || 'medium'
        };
        
        const newProject = await addProject(projectData);
        
        // Update preview to show the newly created project
        setPreviewContent({
          type: 'project_editor',
          data: newProject,
          title: 'Project Created',
          subtitle: `Successfully created "${newProject.name}"`
        });
        
        aiResponseText = `✅ **Project Created Successfully!**

I've created a new project for you:

**Project Name:** ${newProject.name}
**Description:** ${newProject.description || 'No description provided'}
**Status:** ${newProject.status}
**Priority:** ${newProject.priority}

The project has been added to your Projects page where you can manage it further. You can update the status, priority, or add more details anytime.

Is there anything else you'd like me to help you with for this project?`;
        
      } catch (error) {
        aiResponseText = `❌ **Failed to Create Project**

I encountered an error while trying to create the project: ${error instanceof Error ? error.message : 'Unknown error'}

Please try again or create the project manually from the Projects page.`;
      }
    } else if (functionName === 'addQuote') {
      try {
        const quoteData = {
          quoteName: args.quoteName || 'New Quote',
          status: args.status || 'Draft',
          timeToDevelop: args.timeToDevelop || '',
          timeToDevelopValue: args.timeToDevelopValue || 0,
          timeToDevelopUnit: args.timeToDevelopUnit || 'Weeks',
          variancePercentage: args.variancePercentage || 0,
          quoteTotal: args.quoteTotal || 0,
          budget: args.budget || 0
        };
        
        const newQuote = await addQuote(quoteData);
        
        // Update preview to show the newly created quote
        setPreviewContent({
          type: 'quote_editor',
          data: newQuote,
          title: 'Quote Created',
          subtitle: `Successfully created "${newQuote.quoteName}"`
        });
        
        aiResponseText = `✅ **Quote Created Successfully!**

I've created a new quote for you:

**Quote Name:** ${newQuote.quoteName}
**Status:** ${newQuote.status}
**Time to Develop:** ${newQuote.timeToDevelopValue && newQuote.timeToDevelopUnit ? `${newQuote.timeToDevelopValue} ${newQuote.timeToDevelopUnit}` : (newQuote.timeToDevelop || 'Not specified')}
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
    } else if (functionName === 'getProjects') {
      try {
        // Refresh to get latest data
        // React Query will automatically refresh the data
        const currentProjects = projects || [];
        
        if (currentProjects.length === 0) {
          setPreviewContent({
            type: 'welcome',
            title: 'No Projects Yet',
            subtitle: 'Create your first project to get started'
          });
          
          aiResponseText = `📋 **Your Projects**

You don't have any projects yet. Would you like me to help you create your first project? Just tell me what you're working on!`;
        } else {
          // Update preview to show projects
          setPreviewContent({
            type: 'project_list',
            data: currentProjects,
            title: 'Your Projects',
            subtitle: `${currentProjects.length} project${currentProjects.length !== 1 ? 's' : ''} found`
          });
          
          aiResponseText = `📋 **Your Projects**

Here are your current projects (${currentProjects.length} total). You can see them displayed in the preview panel on the right.

${currentProjects.map((p, index) => `${index + 1}. **${p.name}** - ${p.status} (${p.priority} priority)`).join('\n')}

Would you like me to help you update any of these projects or create a new one?`;
        }
      } catch (error) {
        aiResponseText = `❌ **Failed to Fetch Projects**

I encountered an error while trying to retrieve your projects: ${error instanceof Error ? error.message : 'Unknown error'}

Please try refreshing the page or check the Projects page directly.`;
      }
    } else if (functionName === 'getQuotes') {
      try {
        // Refresh to get latest data
        // React Query will automatically refresh the data
        const currentQuotes = quotes || [];
        
        if (currentQuotes.length === 0) {
          setPreviewContent({
            type: 'welcome',
            title: 'No Quotes Yet',
            subtitle: 'Create your first quote to get started'
          });
          
          aiResponseText = `📄 **Your Quotes**

You don't have any quotes yet. Would you like me to help you create your first quote? Just let me know what project you need to quote for!`;
        } else {
          // Update preview to show quotes
          setPreviewContent({
            type: 'quote_list',
            data: currentQuotes,
            title: 'Your Quotes',
            subtitle: `${currentQuotes.length} quote${currentQuotes.length !== 1 ? 's' : ''} found`
          });
          
          aiResponseText = `📄 **Your Quotes**

Here are your current quotes (${currentQuotes.length} total). You can see them displayed in the preview panel on the right.

${currentQuotes.map((q, index) => `${index + 1}. **${q.quoteName}** - ${q.status} ($${q.quoteTotal.toLocaleString()})`).join('\n')}

Would you like me to help you update any of these quotes or create a new one?`;
        }
      } catch (error) {
        aiResponseText = `❌ **Failed to Fetch Quotes**

I encountered an error while trying to retrieve your quotes: ${error instanceof Error ? error.message : 'Unknown error'}

Please try refreshing the page or check the Quotes page directly.`;
      }
    } else if (functionName === 'updateProject') {
      try {
        const projectIdentifier = args.projectIdentifier;
        
        // Use current projects data from React Query
        let currentProjects = projects || [];
        
        // Find the project to update by name (case-insensitive partial match)
        const projectToUpdate = currentProjects.find(p => 
          p.name.toLowerCase().includes(projectIdentifier.toLowerCase()) ||
          projectIdentifier.toLowerCase().includes(p.name.toLowerCase())
        );
        
        if (!projectToUpdate) {
          aiResponseText = `❌ **Project Not Found**

I searched for "${projectIdentifier}" but couldn't find a matching project. Here are your current projects:

${currentProjects.map(p => `• "${p.name}"`).join('\n')}

Please specify the exact project name you'd like to update. You can use partial names - I'll find matches automatically.`;
        } else {
          // Build update data with only provided fields
          const updateData: any = {};
          if (args.name) updateData.name = args.name;
          if (args.description) updateData.description = args.description;
          if (args.status) updateData.status = args.status;
          if (args.priority) updateData.priority = args.priority;
          
          // Update the project using the context function
          await updateProject(projectToUpdate.id, updateData);
          
          // Update preview to show the updated project
          const updatedProject = { ...projectToUpdate, ...updateData };
          setPreviewContent({
            type: 'project_editor',
            data: updatedProject,
            title: 'Project Updated',
            subtitle: `Successfully updated "${updatedProject.name}"`
          });
          
          aiResponseText = `✅ **Project Updated Successfully!**

I've updated the project "${projectToUpdate.name}" with the following changes:

${args.name ? `**New Name:** ${args.name}\n` : ''}${args.description ? `**New Description:** ${args.description}\n` : ''}${args.status ? `**New Status:** ${args.status}\n` : ''}${args.priority ? `**New Priority:** ${args.priority}\n` : ''}

The changes have been saved and are now visible in your Projects page.`;
        }
      } catch (error) {
        aiResponseText = `❌ **Failed to Update Project**

I encountered an error while trying to update the project: ${error instanceof Error ? error.message : 'Unknown error'}

Please try updating the project manually from the Projects page.`;
      }
    } else if (functionName === 'updateQuote') {
      try {
        const quoteIdentifier = args.quoteIdentifier;
        
        // Use current quotes data from React Query
        let currentQuotes = quotes || [];
        
        // Enhanced fuzzy matching for quotes
        const findBestQuoteMatch = (identifier: string, quotes: any[]) => {
          const identifierLower = identifier.toLowerCase();
          
          // First try exact matches
          let match = quotes.find(q => q.quoteName.toLowerCase() === identifierLower);
          if (match) return match;
          
          // Then try partial matches (current logic)
          match = quotes.find(q => {
            const quoteLower = q.quoteName.toLowerCase();
            return quoteLower.includes(identifierLower) || identifierLower.includes(quoteLower);
          });
          if (match) return match;
          
          // Finally try word-based matching for cases like "Housing Dev" vs "2025 House Renovation"
          const identifierWords = identifierLower.split(/\s+/);
          match = quotes.find(q => {
            const quoteWords = q.quoteName.toLowerCase().split(/\s+/);
            const wordMatches = identifierWords.filter(identifierWord => 
              quoteWords.some(quoteWord => 
                quoteWord.includes(identifierWord) || identifierWord.includes(quoteWord)
              )
            );
            return wordMatches.length >= Math.min(identifierWords.length, 2); // At least 2 words match or all if less than 2
          });
          
          return match;
        };
        
        const quoteToUpdate = findBestQuoteMatch(quoteIdentifier, currentQuotes);
        
        if (!quoteToUpdate) {
          aiResponseText = `❌ **Quote Not Found**

I searched for "${quoteIdentifier}" but couldn't find a matching quote. 

**Available Quotes (${currentQuotes.length}):**
${currentQuotes.length > 0 
  ? currentQuotes.map((q, index) => `${index + 1}. "${q.quoteName}" (Status: ${q.status}, Total: $${q.quoteTotal?.toLocaleString() || '0'})`).join('\n')
  : 'No quotes found in your account.'}

**Tips for matching:**
• Use partial names (e.g., "House" for "2025 House Renovation")
• Check spelling and spacing
• Or try "show my quotes" first to see the exact names

Please specify a quote name from the list above, and I'll help you update it.`;
        } else {
          // Build update data with only provided fields
          const updateData: any = {};
          if (args.quoteName) updateData.quoteName = args.quoteName;
          if (args.status) updateData.status = args.status;
          if (args.timeToDevelop) updateData.timeToDevelop = args.timeToDevelop;
          if (args.timeToDevelopValue) updateData.timeToDevelopValue = args.timeToDevelopValue;
          if (args.timeToDevelopUnit) updateData.timeToDevelopUnit = args.timeToDevelopUnit;
          if (args.variancePercentage !== undefined) updateData.variancePercentage = args.variancePercentage;
          if (args.quoteTotal !== undefined) updateData.quoteTotal = args.quoteTotal;
          if (args.budget !== undefined) updateData.budget = args.budget;
          
          // Update the quote using the context function
          await updateQuote(quoteToUpdate.id, updateData);
          
          // Update preview to show the updated quote
          const updatedQuote = { ...quoteToUpdate, ...updateData };
          setPreviewContent({
            type: 'quote_editor',
            data: updatedQuote,
            title: 'Quote Updated',
            subtitle: `Successfully updated "${updatedQuote.quoteName}"`
          });
          
          aiResponseText = `✅ **Quote Updated Successfully!**

I've updated the quote "${quoteToUpdate.quoteName}" with the following changes:

${args.quoteName ? `**New Name:** ${args.quoteName}\n` : ''}${args.status ? `**New Status:** ${args.status}\n` : ''}${args.timeToDevelop ? `**New Time to Develop:** ${args.timeToDevelop}\n` : ''}${args.quoteTotal !== undefined ? `**New Quote Total:** $${args.quoteTotal.toLocaleString()}\n` : ''}${args.budget !== undefined ? `**New Budget:** $${args.budget.toLocaleString()}\n` : ''}

The changes have been saved and are now visible in your Quotes page.`;
        }
      } catch (error) {
        aiResponseText = `❌ **Failed to Update Quote**

I encountered an error while trying to update the quote: ${error instanceof Error ? error.message : 'Unknown error'}

Please try updating the quote manually from the Quotes page.`;
      }
    }
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      messageType: 'text',
      content: aiResponseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
  };

  // Fallback response generator when Gemini is overloaded
  const generateFallbackResponse = async (question: string, context: string, sources: any): Promise<string> => {
    const lowercaseQuestion = question.toLowerCase();
    
    // If we have knowledge base results, extract and present them
    if (sources?.knowledgeBase && context.includes('📚 Relevant Knowledge Base Information')) {
      const knowledgeSection = context.split('📚 Relevant Knowledge Base Information')[1];
      if (knowledgeSection) {
        return `🤖 **AI Service Temporarily Busy - Using Knowledge Base**

Based on your question about "${question}", here's information from our construction knowledge base:

${knowledgeSection.substring(0, 800)}...

*💡 This information comes from our construction knowledge base. For a more detailed AI-generated response, please try again in a few minutes when the service is less busy.*`;
      }
    }
    
    // If we have general context but no specific knowledge base match, use the first part
    if (context && context.length > 100) {
      return `🤖 **AI Service Temporarily Busy**

I found some relevant information from your business data about "${question}":

${context.split('📚 Relevant Knowledge Base Information')[0].substring(0, 300)}...

*💡 For a more complete AI-generated response, please try again in a few minutes when the service is less busy.*`;
    }
    
    // Basic pattern matching for common construction questions
    if (lowercaseQuestion.includes('change order')) {
      return `🤖 **AI Service Temporarily Busy - Construction Info**

Regarding change orders in construction:

A change order is a formal document that details amendments to the original construction contract. It typically includes:

• Description of the change
• Cost impact (increase or decrease)  
• Schedule impact
• Reason for the change
• Approval signatures from all parties

Change orders are essential for maintaining clear documentation and avoiding disputes.

*💡 For more specific guidance about your projects, please try again when the AI service is available.*`;
    }
    
    if (lowercaseQuestion.includes('billing') || lowercaseQuestion.includes('payment')) {
      return `🤖 **AI Service Temporarily Busy - Billing Info**

Construction billing typically follows these patterns:

• **Progress Billing**: Monthly payments based on work completed
• **Milestone Billing**: Payments tied to specific project phases  
• **Time & Materials**: Billing for actual time and materials used
• **Retention**: Percentage withheld until project completion

Most construction projects use progress billing with 5-10% retention.

*💡 For specific billing advice for your projects, please try again when the AI service is available.*`;
    }
    
    // Generic fallback
    return `🤖 **AI Service Temporarily Busy**

The main AI service is currently overloaded, but I was able to fetch your business context:

${context.substring(0, 500)}...

**Suggestion:** Try rephrasing your question: "${question}" in a few minutes when the AI service is less busy.

*💡 Our RAG system is working - it's just the final AI processing that's temporarily unavailable.*`;
  };

  // Handle chat message submission in workshop
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      messageType: 'text',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    await processAIMessage(userMessage.content as string);
  };

  // Preview Panel Content Renderer
  const renderPreviewContent = () => {
    if (!previewContent) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
            <p className="text-sm">Ask me about your projects, quotes, or construction topics</p>
          </div>
        </div>
      );
    }

    const { type, data, title, subtitle } = previewContent;

    switch (type) {
      case 'project_list':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
            </div>
            <div className="grid gap-4">
              {Array.isArray(data) && data.map((project: any) => (
                <Card key={project.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">{project.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{project.description || 'No description'}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          project.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          project.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {project.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full ${
                          project.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {project.priority} priority
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="ml-4"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'quote_list':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
            </div>
            <div className="grid gap-4">
              {Array.isArray(data) && data.map((quote: any) => (
                <Card key={quote.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">{quote.quoteName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Status: {quote.status}</span>
                        <span>Total: ${quote.quoteTotal?.toLocaleString() || '0'}</span>
                      </div>
                      {quote.timeToDevelop && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Time to Develop: {quote.timeToDevelop}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                      className="ml-4"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'project_editor':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
            </div>
            {data && (
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={data.name || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={data.description || 'No description provided'}
                      readOnly
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <input
                        type="text"
                        value={data.status || 'planning'}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      <input
                        type="text"
                        value={data.priority || 'medium'}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={() => navigate(`/projects/${data.id}`)}
                      className="w-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Projects Page
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case 'quote_editor':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
            </div>
            {data && (
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quote Name
                    </label>
                    <input
                      type="text"
                      value={data.quoteName || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <input
                        type="text"
                        value={data.status || 'Draft'}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Time to Develop
                      </label>
                      <input
                        type="text"
                        value={data.timeToDevelopValue && data.timeToDevelopUnit ? 
                          `${data.timeToDevelopValue} ${data.timeToDevelopUnit}` : 
                          (data.timeToDevelop || 'Not specified')
                        }
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quote Total
                      </label>
                      <input
                        type="text"
                        value={`$${data.quoteTotal?.toLocaleString() || '0'}`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Budget
                      </label>
                      <input
                        type="text"
                        value={`$${data.budget?.toLocaleString() || '0'}`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Variance Percentage
                    </label>
                    <input
                      type="text"
                      value={`${data.variancePercentage || 0}%`}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={() => navigate(`/quotes/${data.id}`)}
                      className="w-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Quotes Page
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case 'welcome':
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">{title || 'Blueprint AI Workshop'}</h3>
              <p className="text-sm">{subtitle || 'Your AI-powered construction assistant'}</p>
            </div>
          </div>
        );
    }
  };

  // Lobby View - Minimalist entry point
  if (!sessionActive) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900/40"></div>
        
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animation-delay-2000 animate-pulse"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animation-delay-4000 animate-pulse"></div>
        </div>

        {/* Main content - centered */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 max-w-4xl mx-auto">
          
          {/* Hero heading */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
              What should we plan today?
            </h1>
            <h2 className="text-xl md:text-2xl text-slate-300 font-light max-w-3xl mx-auto leading-relaxed">
              Create projects, generate quotes, or analyze your financial data by chatting with AI.
            </h2>
          </div>

          {/* Floating input form */}
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden hover:bg-white/15 transition-all duration-300">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me to create a project, generate a quote, or show your current work..."
                  className="w-full px-8 py-6 pr-20 bg-transparent border-none focus:outline-none text-white placeholder-slate-400 resize-none text-lg leading-relaxed"
                  rows={1}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  style={{
                    minHeight: '72px',
                    maxHeight: '200px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                  }}
                />
                
                {/* Send Button */}
                <div className="absolute right-4 bottom-4">
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 transform
                      ${!input.trim() || isLoading 
                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 cursor-pointer'
                      }
                    `}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Helper text */}
              <div className="flex items-center justify-center mt-6">
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  AI-powered construction planning assistant
                  <span className="text-slate-500 ml-4">Press Enter to send</span>
                </p>
              </div>
            </form>
          </div>

          {/* Subtle feature hints */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 w-full max-w-4xl">
            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Sparkles size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Smart Planning</h3>
              <p className="text-slate-400 text-sm">Get intelligent project insights and recommendations</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Send size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Instant Quotes</h3>
              <p className="text-slate-400 text-sm">Generate detailed quotes with cost breakdowns</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Sparkles size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Data Analysis</h3>
              <p className="text-slate-400 text-sm">Analyze your business metrics and trends</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Workshop View - Full AI interaction and live preview
  const chatPanel = (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Blueprint AI</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your construction assistant</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSessionActive(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h4 className="font-medium mb-2">Start a conversation</h4>
              <p className="text-sm">Ask me about your projects, quotes, or construction topics</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4" />
                    <span className="text-xs font-medium">Blueprint AI</span>
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">
                  {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about your projects or construction topics..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );

  const previewPanel = (
    <div className="h-full bg-gray-50 dark:bg-gray-800 flex flex-col">
      {/* Preview Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Live Preview</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Real-time AI outputs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      {renderPreviewContent()}
    </div>
  );

  return (
    <WorkspaceLayout 
      chatPanel={chatPanel} 
      previewPanel={previewPanel} 
    />
  );
};

export default AiCopilotPage;
