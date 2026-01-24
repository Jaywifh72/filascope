import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SubscribeForUpdatesProps {
  topic?: string;
  className?: string;
}

const SubscribeForUpdates = ({ topic = "this", className }: SubscribeForUpdatesProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "You're on the list!",
      description: `We'll notify you when ${topic} goes live.`,
    });
    
    setEmail("");
    setIsLoading(false);
  };

  return (
    <div className={cn(
      "bg-gray-900/30 border border-border/30 rounded-xl p-6",
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          Get Notified When This Goes Live
        </span>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="Enter your email for updates"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-transparent border-gray-700 focus:border-primary"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          variant="primary"
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? "Subscribing..." : "Notify Me"}
        </Button>
      </form>
      
      <p className="text-xs text-muted-foreground mt-3">
        We'll only email you when {topic} is ready. No spam.
      </p>
    </div>
  );
};

export default SubscribeForUpdates;
