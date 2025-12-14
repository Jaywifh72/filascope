import { History, Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useComparisonHistory } from "@/hooks/useComparisonHistory";
import { cn } from "@/lib/utils";

interface HistoryDropdownProps {
  onRestore: (filamentIds: string[]) => void;
}

export function HistoryDropdown({ onRestore }: HistoryDropdownProps) {
  const { history, clearHistory } = useComparisonHistory();

  if (history.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5">
          <History className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Recent</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          Recent Comparisons
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {history.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={() => onRestore(item.filamentIds)}
            className="flex flex-col items-start gap-1 cursor-pointer"
          >
            <span className="text-sm font-medium truncate w-full">
              {item.filamentNames.slice(0, 2).join(" vs ")}
              {item.filamentNames.length > 2 && (
                <span className="text-muted-foreground"> +{item.filamentNames.length - 2}</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={clearHistory}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Clear History
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
