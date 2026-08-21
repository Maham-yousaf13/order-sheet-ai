import React, { useState, useRef, useEffect } from 'react';
import { Canvas, Image as FabricImage, Text } from 'fabric';

const EmbroideryEditor = ({ imageUrl, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState('star');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const designs = {
    star: '⭐',
    circle: '●',
    flower: '🌸',
    text: 'ABC',
    logo: '🏷️',
    heart: '❤️'
  };

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    setLoading(true);
    setError(null);

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: '#ffffff'
    });

    // Load image with cross-origin
    FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous'
    }).then((img) => {
      // Calculate fit
      const maxWidth = 480;
      const maxHeight = 480;
      let scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      
      img.scale(scale);
      img.set({
        left: (500 - img.width * scale) / 2,
        top: (500 - img.height * scale) / 2,
        selectable: false,
        evented: false
      });

      fabricCanvas.add(img);
      fabricCanvas.renderAll();
      setLoading(false);
      setCanvas(fabricCanvas);
    }).catch((err) => {
      console.error('Error:', err);
      setError('Failed to load image');
      setLoading(false);
      // Show placeholder
      const errorText = new Text('⚠️ Image Load Failed', {
        left: 150,
        top: 200,
        fontSize: 24,
        fill: 'red'
      });
      fabricCanvas.add(errorText);
      fabricCanvas.renderAll();
      setCanvas(fabricCanvas);
    });

    return () => fabricCanvas.dispose();
  }, [imageUrl]);

  const addDesign = () => {
    if (!canvas) return;

    const design = new Text(designs[selectedDesign], {
      left: 250,
      top: 200,
      fontSize: 80,
      fill: 'white',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      stroke: 'black',
      strokeWidth: 3,
      hasControls: true,
      hasBorders: true,
      selectable: true,
      originX: 'center',
      originY: 'center'
    });

    canvas.add(design);
    canvas.setActiveObject(design);
    canvas.renderAll();
  };

  const saveImage = () => {
    if (canvas) {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
      });
      onSave(dataURL);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">🎨 Embroidery Editor</h3>
      <p className="text-sm text-gray-500 mb-3">
        Add embroidery/logo on the mockup. Drag to position.
      </p>
      
      <div className="flex gap-2 mb-4 flex-wrap">
        {Object.keys(designs).map((key) => (
          <button
            key={key}
            onClick={() => setSelectedDesign(key)}
            className={`px-4 py-2 text-2xl rounded-md ${
              selectedDesign === key 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {designs[key]}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={addDesign}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          ➕ Add Design
        </button>
        <button
          onClick={saveImage}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          💾 Save & Continue
        </button>
        <button
          onClick={() => {
            if (canvas) {
              const active = canvas.getActiveObject();
              if (active) canvas.remove(active);
              canvas.renderAll();
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          🗑️ Delete Selected
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          ✕ Cancel
        </button>
      </div>

      <div className="border-2 border-gray-300 rounded-lg overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading image...</p>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} />
      </div>

      <p className="text-xs text-gray-400 mt-2">
        💡 Click design → drag to chest → resize using corners
      </p>
    </div>
  );
};

export default EmbroideryEditor;