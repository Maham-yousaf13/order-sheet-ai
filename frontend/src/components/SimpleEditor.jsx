import React, { useState, useRef } from 'react';

const SimpleEditor = ({ imageUrl, onSave, onCancel }) => {
  const [designs, setDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState('⭐');
  const containerRef = useRef(null);

  const designOptions = ['⭐', '❤️', '🌸', '🏷️', 'ABC', '👕', '🎯', '✏️'];

  const addDesign = () => {
    // Random position on chest area
    const x = 200 + Math.random() * 200;
    const y = 150 + Math.random() * 150;
    setDesigns([...designs, { 
      id: Date.now(), 
      text: selectedDesign, 
      x: x, 
      y: y 
    }]);
  };

  const removeDesign = (id) => {
    setDesigns(designs.filter(d => d.id !== id));
  };

  const saveImage = () => {
    // Create canvas with all elements
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Draw background image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      // ==========================================
      // FIX: Properly fit image to canvas
      // ==========================================
      const canvasWidth = 600;
      const canvasHeight = 600;
      const imgRatio = img.width / img.height;
      const canvasRatio = canvasWidth / canvasHeight;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgRatio > canvasRatio) {
        // Image wider than canvas
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgRatio;
        offsetX = 0;
        offsetY = (canvasHeight - drawHeight) / 2;
      } else {
        // Image taller than canvas
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imgRatio;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
      }

      // Draw image centered with proper aspect ratio
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      // Draw all designs
      designs.forEach(d => {
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(d.text, d.x, d.y);
        ctx.fillText(d.text, d.x, d.y);
      });

      const dataURL = canvas.toDataURL('image/png');
      onSave(dataURL);
    };
    img.onerror = () => {
      alert('Error loading image. Please regenerate mockup.');
    };
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-2">🎨 Embroidery Editor</h3>
      <p className="text-sm text-gray-500 mb-3">
        Add designs on the mockup. Drag to position.
      </p>
      
      {/* Design Selection */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {designOptions.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDesign(d)}
            className={`px-3 py-1 text-xl rounded-md ${
              selectedDesign === d ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-3 flex-wrap">
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
            if (designs.length > 0) {
              const removed = designs.slice(0, -1);
              setDesigns(removed);
            }
          }}
          className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
        >
          ↩️ Undo Last
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          ✕ Cancel
        </button>
      </div>

      {/* Image Preview with Designs Overlay */}
      <div 
        ref={containerRef}
        className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50"
        style={{ maxWidth: '500px', margin: '0 auto' }}
      >
        <img 
          src={imageUrl} 
          alt="Background" 
          className="w-full h-auto"
          style={{ display: 'block' }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/500x500?text=Image+Load+Error';
          }}
        />
        
        {/* Overlay Designs */}
        {designs.map(d => (
          <div
            key={d.id}
            className="absolute text-5xl cursor-move select-none"
            style={{
              left: d.x,
              top: d.y,
              transform: 'translate(-50%, -50%)',
              textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
              color: 'white'
            }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', d.id);
            }}
            onDragEnd={(e) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const updated = designs.map(item => 
                  item.id === d.id ? { ...item, x, y } : item
                );
                setDesigns(updated);
              }
            }}
          >
            {d.text}
            <button
              onClick={() => removeDesign(d.id)}
              className="absolute -top-2 -right-2 text-xs bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        💡 Click "Add Design" → Drag to chest position → Use Undo to remove last
      </p>
    </div>
  );
};

export default SimpleEditor;