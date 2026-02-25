import { useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const palette = [
  "#4FD1C5", // primary
  "#A3BEFF", // secondary
  "#BEE3F8", // soft blue
  "#F8FAFC", // soft white
  "#C4F1F9", // light cyan tint
  "#E9D8FD", // light lavender tint
];

const GRID_SIZE = 10;

export default function ColorGame() {
  const navigate = useNavigate();

  const [selectedColor, setSelectedColor] = useState(palette[0]);
  const [grid, setGrid] = useState<string[]>(
    Array(GRID_SIZE * GRID_SIZE).fill("")
  );

  const paintTile = (index: number) => {
    const updated = [...grid];
    updated[index] = selectedColor;
    setGrid(updated);
  };

  const resetGrid = () => {
    setGrid(Array(GRID_SIZE * GRID_SIZE).fill(""));
  };

  const filledTiles = grid.filter((cell) => cell !== "").length;

  return (
    <div className="p-6 lg:p-10 space-y-10 h-full overflow-y-auto relative">

      {/* Back */}
      <button
        onClick={() => navigate("/games")}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-primary hover:opacity-80"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-cyan-lavender">
          Color Therapy
        </h1>
        <p className="text-sm text-caption">
          Paint freely and express yourself through calming colors 🎨
        </p>
      </div>

      {/* Stats */}
      <div className="glass rounded-3xl p-6 text-center text-sm max-w-sm mx-auto">
        <span className="text-caption">Tiles Filled:</span>{" "}
        <span className="text-primary font-semibold">{filledTiles}</span>
      </div>

      {/* Color Palette */}
      <div className="flex justify-center gap-4 flex-wrap">
        {palette.map((color, index) => (
          <button
            key={index}
            onClick={() => setSelectedColor(color)}
            className={`w-10 h-10 rounded-full border-2 transition ${
              selectedColor === color
                ? "border-primary scale-110"
                : "border-border"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-10 gap-2 max-w-lg mx-auto mt-6">
        {grid.map((cell, index) => (
          <div
            key={index}
            onClick={() => paintTile(index)}
            className="w-8 h-8 rounded-md cursor-pointer transition border border-border"
            style={{
              backgroundColor: cell || "transparent",
            }}
          />
        ))}
      </div>

      {/* Reset */}
      <div className="flex justify-center pt-6">
        <button
          onClick={resetGrid}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-xl flex items-center gap-2 hover:opacity-90"
        >
          <RotateCcw className="w-4 h-4" />
          Clear Canvas
        </button>
      </div>
    </div>
  );
}