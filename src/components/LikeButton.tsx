import { CollectionPicker } from "./wishlist/CollectionPicker";

interface LikeButtonProps {
  filamentId: string;
  size?: "default" | "sm" | "lg";
  currentPrice?: number | null;
}

export const LikeButton = ({ filamentId, size = "default", currentPrice }: LikeButtonProps) => {
  return (
    <CollectionPicker
      filamentId={filamentId}
      currentPrice={currentPrice}
      size={size}
    />
  );
};
