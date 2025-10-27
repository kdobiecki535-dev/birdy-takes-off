import { BirdSkin, BIRD_SKINS } from "@/types/game";

interface BirdSkinSelectorProps {
  selected: BirdSkin;
  onSelect: (skin: BirdSkin) => void;
}

export const BirdSkinSelector = ({ selected, onSelect }: BirdSkinSelectorProps) => {
  const skins: BirdSkin[] = ["yellow", "blue", "red", "green", "pink"];

  return (
    <div className="flex flex-col gap-2 mb-4">
      <p className="pixel-text text-white text-xs mb-2">Bird Skin:</p>
      <div className="flex gap-3 justify-center">
        {skins.map((skin) => {
          const colors = BIRD_SKINS[skin];
          return (
            <button
              key={skin}
              onClick={() => onSelect(skin)}
              className={`w-12 h-12 border-4 transition-all ${
                selected === skin ? "border-white scale-110" : "border-black"
              }`}
              style={{ backgroundColor: colors.body }}
            >
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: colors.body }}
              >
                <div
                  className="w-4 h-4 border-2 border-black"
                  style={{ backgroundColor: colors.accent }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
