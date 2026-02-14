import { useDocumentHead, type DocumentHeadOptions } from "@/hooks/useDocumentHead";

/**
 * A component wrapper around useDocumentHead so it can be used as JSX
 * inside component return statements (where hooks can't be called directly).
 */
export function DocumentHead(props: DocumentHeadOptions) {
  useDocumentHead(props);
  return null;
}
