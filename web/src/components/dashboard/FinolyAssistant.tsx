"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  PieChart,
  Calendar,
  MessageSquare,
  Lightbulb,
  Clock,
} from "lucide-react";

interface FinolyAssistantProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    accountType: "individual" | "business";
    businessId?: string | null;
    businessName?: string | null;
    role?: "owner" | "member" | null;
    teams?: Array<{
      id: string;
      name: string;
      roleId: string | null;
      roleName: string | null;
      permissions: string[];
    }>;
  };
  activeTeam: string;
}

// Mock conversation history
const mockConversation = [
  {
    id: 1,
    type: "user",
    message: "What was our marketing spend last month?",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    type: "assistant",
    message:
      "Your marketing team spent $8,750 last month, which is 12.5% higher than the previous month. The main drivers were advertising campaigns ($5,200) and events ($2,100).",
    timestamp: "2 hours ago",
  },
];

// Suggested prompts
const suggestedPrompts = [
  {
    icon: TrendingUp,
    title: "Spending Trends",
    prompt: "Show me spending trends for the last 3 months",
    category: "Analytics",
  },
  {
    icon: PieChart,
    title: "Category Breakdown",
    prompt: "Break down expenses by category for this month",
    category: "Reports",
  },
  {
    icon: Calendar,
    title: "Budget Forecast",
    prompt: "What is my budget forecast for next month?",
    category: "Planning",
  },
  {
    icon: Lightbulb,
    title: "Cost Optimization",
    prompt: "Suggest ways to optimize our team expenses",
    category: "Insights",
  },
];

export function FinolyAssistant({ user, activeTeam }: FinolyAssistantProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState(mockConversation);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleSubmit = async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user" as const,
      message: message.trim(),
      timestamp: "Just now",
    };

    setConversation((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant" as const,
        message: generateMockResponse(message),
        timestamp: "Just now",
      };

      setConversation((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateMockResponse = (query: string): string => {
    const responses = [
      "Based on your recent spending patterns, I can see that your team is performing well within budget. Here are some key insights...",
      "Your expenses have increased by 8.5% this month. The main contributors are advertising and travel costs. Would you like me to break this down further?",
      "I recommend optimizing your software subscriptions. You could save approximately $450/month by consolidating tools.",
      "Your forecast for next month shows potential overspending in the marketing category. Consider reducing discretionary expenses by 15%.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    handleSubmit(prompt);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          Ask Finoly AI
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Beta
          </Badge>
        </CardTitle>
        <CardDescription>
          Get instant insights about your finances. Ask about spending, budgets,
          forecasts, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything about your finances..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit(input)}
            className="flex-1"
          />
          <Button
            onClick={() => handleSubmit(input)}
            disabled={!input.trim() || isLoading}
            size="sm"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Suggested Prompts */}
        {showSuggestions && (
          <div className="space-y-3">
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Suggested Questions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedPrompts.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto p-3"
                      onClick={() => handleSuggestionClick(suggestion.prompt)}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="text-left">
                          <div className="font-medium text-sm">
                            {suggestion.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {suggestion.category}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <div className="max-h-96 overflow-y-auto space-y-3">
              {conversation.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.type === "assistant" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.type === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      <Clock className="h-3 w-3 inline mr-1" />
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Finoly is thinking...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
