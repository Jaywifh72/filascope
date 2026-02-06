import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

/**
 * Radix ScrollArea injects a <style> tag via dangerouslySetInnerHTML inside the Viewport.
 * In some rendering scenarios this <style> tag can leak as visible text content.
 * We clean up any stray text nodes containing the CSS string on mount.
 * The actual CSS is applied globally via index.css as a reliable fallback.
 */
function useCleanRadixStyleLeak(rootRef: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Walk immediate children and remove text nodes that contain the Radix CSS string
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const toRemove: Node[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (
        node.textContent &&
        node.textContent.includes("data-radix-scroll-area-viewport")
      ) {
        toRemove.push(node);
      }
    }
    toRemove.forEach((n) => n.parentNode?.removeChild(n));
  }, [rootRef]);
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  const internalRef = React.useRef<HTMLDivElement>(null);
  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  useCleanRadixStyleLeak(internalRef);

  return (
    <ScrollAreaPrimitive.Root
      ref={composedRef}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
