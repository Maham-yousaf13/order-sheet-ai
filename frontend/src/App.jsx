import React, { useState } from 'react';
import axios from 'axios';
import SimpleEditor from './components/SimpleEditor';

// ============================================
// API BASE URL — Production + Development
// ============================================
const API_BASE = window.API_BASE || 'http://localhost:8000/api';

function App() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [prompt, setPrompt] = useState('');
  const [logo, setLogo] = useState(null);
  const [mockupImage, setMockupImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageSource, setImageSource] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [finalImage, setFinalImage] = useState(null);
  const [generatedOrder, setGeneratedOrder] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [orderError, setOrderError] = useState(null);
  
  // Order form state
  const [orderData, setOrderData] = useState({
    product_name: '',
    product_description: '',
    fabric_type: '',
    fabric_composition: '',
    size_breakdown: { S: 0, M: 0, L: 0, XL: 0 },
    colors: [{ name: '', pantone: '' }],
    unit_price: 0,
    discount_percentage: 0,
    tax_percentage: 18,
    shipping_terms: 'FOB',
    delivery_days: 30,
    client_name: '',
    client_company: '',
    client_email: '',
  });

  // ============================================
  // GENERATE MOCKUP
  // ============================================
  const generateMockup = async () => {
    if (!prompt) {
      alert('Please enter a product description!');
      return;
    }
    
    setLoading(true);
    setMockupImage(null);
    setFinalImage(null);
    setShowEditor(false);
    setImageSource('');
    setPdfData(null);
    setGeneratedOrder(null);
    setOrderError(null);
    
    try {
      const response = await axios.post(`${API_BASE}/generate-mockup/`, {
        prompt: prompt
      });
      
      if (response.data.success) {
        setMockupImage(response.data.image);
        setImageSource(response.data.source || 'unknown');
        console.log('Image source:', response.data.source);
        setShowEditor(true);
      } else {
        alert('Failed to generate mockup. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error generating mockup. Please make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLE FINAL IMAGE FROM EDITOR
  // ============================================
  const handleFinalImage = (dataURL) => {
    setFinalImage(dataURL);
    setMockupImage(dataURL);
    setShowEditor(false);
    alert('✅ Embroidery added successfully! Your mockup is ready.');
  };

  // ============================================
  // DOWNLOAD MOCKUP
  // ============================================
  const downloadMockup = () => {
    const imageToDownload = finalImage || mockupImage;
    if (imageToDownload) {
      const link = document.createElement('a');
      link.download = 'mockup.png';
      link.href = imageToDownload;
      link.click();
    }
  };

  // ============================================
  // DOWNLOAD ORDER SHEET AS PDF (WITH LOGO)
  // ============================================
  const downloadOrderSheet = () => {
    try {
      const order = pdfData?.order || generatedOrder;
      
      if (!order) {
        alert('Please generate order sheet first!');
        return;
      }

      // Calculate totals safely
      const sizeBreakdown = order.size_breakdown || {};
      const totalQty = Object.values(sizeBreakdown).reduce((a, b) => (a || 0) + (b || 0), 0);
      const unitPrice = parseFloat(order.unit_price) || 0;
      const discountPct = parseFloat(order.discount_percentage) || 0;
      const taxPct = parseFloat(order.tax_percentage) || 18;
      
      const subtotal = unitPrice * totalQty;
      const discountAmount = subtotal * (discountPct / 100);
      const taxAmount = (subtotal - discountAmount) * (taxPct / 100);
      const grandTotal = subtotal - discountAmount + taxAmount;

      // ==========================================
      // LOGO HTML (Text-based - Always Works)
      // ==========================================
      const logoHtml = `
        <div style="text-align: center;">
          <div style="font-size: 34px; font-weight: 900; color: #1a1a2e; letter-spacing: 5px; font-family: 'Arial Black', Arial, sans-serif;">
            ORDERSHEETAI
          </div>
          <div style="font-size: 12px; color: #7f8c8d; letter-spacing: 3px; margin-top: 4px; font-weight: 600;">
            SMART AUTOMATION · EFFICIENCY · CONTROL
          </div>
          <div style="width: 120px; height: 3px; background: linear-gradient(to right, #3498db, #2ecc71); margin: 10px auto 0; border-radius: 2px;"></div>
        </div>
      `;

      // Create printable HTML content
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order Sheet - ${order.order_id || 'Draft'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              background: white;
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #2c3e50; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .order-id { 
              background: #ecf0f1; 
              padding: 8px 16px; 
              border-radius: 4px; 
              display: inline-block;
              margin-top: 15px;
            }
            .section { 
              margin: 25px 0; 
              border: 1px solid #ecf0f1; 
              padding: 20px; 
              border-radius: 8px;
            }
            .section h3 { 
              color: #2c3e50; 
              border-bottom: 2px solid #3498db; 
              padding-bottom: 10px; 
              margin-bottom: 15px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th, td { 
              border: 1px solid #bdc3c7; 
              padding: 10px; 
              text-align: left; 
            }
            th { 
              background: #ecf0f1; 
              font-weight: bold; 
            }
            .total-row { 
              background: #f8f9fa; 
              font-weight: bold; 
            }
            .grand-total {
              font-size: 20px;
              color: #27ae60;
              text-align: right;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 2px solid #27ae60;
            }
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              color: #95a5a6; 
              font-size: 12px; 
              border-top: 1px solid #ecf0f1; 
              padding-top: 20px;
            }
            .badge {
              background: #27ae60;
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              display: inline-block;
            }
            .two-col { display: flex; gap: 40px; flex-wrap: wrap; }
            .two-col > div { flex: 1; min-width: 200px; }
            .label { font-weight: bold; color: #7f8c8d; }
            .value { color: #2c3e50; }
          </style>
        </head>
        <body>
          <!-- HEADER WITH LOGO -->
          <div class="header">
            ${logoHtml}
            <div style="margin-top: 15px;">
              <div class="order-id">
                <span class="label">Order ID:</span> 
                <span class="value">${order.order_id || 'Draft'}</span>
                <span class="badge" style="margin-left:10px;">${order.status || 'Draft'}</span>
              </div>
              <div style="margin-top:8px; font-size:14px; color:#7f8c8d;">
                Date: ${new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div class="section">
            <h3>📦 Product Details</h3>
            <div class="two-col">
              <div>
                <div><span class="label">Product Name:</span> <span class="value">${order.product_name || 'N/A'}</span></div>
                <div><span class="label">Description:</span> <span class="value">${order.product_description || 'N/A'}</span></div>
              </div>
              <div>
                <div><span class="label">Fabric Type:</span> <span class="value">${order.fabric_type || 'N/A'}</span></div>
                <div><span class="label">Composition:</span> <span class="value">${order.fabric_composition || 'N/A'}</span></div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>📏 Size Breakdown</h3>
            <table>
              <tr><th>Size</th><th>Quantity</th></tr>
              ${Object.entries(sizeBreakdown).map(([size, qty]) => `
                <tr><td>${size}</td><td>${qty || 0}</td></tr>
              `).join('')}
              <tr class="total-row"><td><strong>Total</strong></td><td><strong>${totalQty}</strong></td></tr>
            </table>
          </div>

          <div class="section">
            <h3>🎨 Colors</h3>
            <table>
              <tr><th>Color Name</th><th>Pantone Code</th></tr>
              ${(order.colors || []).map(color => `
                <tr><td>${color.name || 'N/A'}</td><td>${color.pantone || 'N/A'}</td></tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h3>💰 Invoice</h3>
            <table>
              <tr><td>Subtotal</td><td>${subtotal.toFixed(2)} PKR</td></tr>
              <tr><td>Discount (${discountPct}%)</td><td>-${discountAmount.toFixed(2)} PKR</td></tr>
              <tr><td>Tax (${taxPct}%)</td><td>${taxAmount.toFixed(2)} PKR</td></tr>
              <tr style="background:#f8f9fa; font-weight:bold; border-top:2px solid #27ae60;">
                <td>Grand Total</td>
                <td>${grandTotal.toFixed(2)} PKR</td>
              </tr>
            </table>
            <div class="grand-total">
              Total Payable: ${grandTotal.toFixed(2)} PKR
            </div>
          </div>

          <div class="section">
            <h3>🚚 Shipping</h3>
            <div class="two-col">
              <div><span class="label">Terms:</span> <span class="value">${order.shipping_terms || 'FOB'}</span></div>
              <div><span class="label">Delivery:</span> <span class="value">${order.delivery_days || 30} days</span></div>
            </div>
          </div>

          <div class="section">
            <h3>👤 Client Information</h3>
            <div class="two-col">
              <div>
                <div><span class="label">Name:</span> <span class="value">${order.client_name || 'N/A'}</span></div>
                <div><span class="label">Company:</span> <span class="value">${order.client_company || 'N/A'}</span></div>
              </div>
              <div>
                <div><span class="label">Email:</span> <span class="value">${order.client_email || 'N/A'}</span></div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Generated by <strong>Order Sheet AI</strong> — ${new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p style="font-size:11px;">© ${new Date().getFullYear()} Order Sheet AI. All rights reserved.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
      } else {
        alert('Please allow popups for this site to download PDF.');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // ============================================
  // CREATE ORDER
  // ============================================
  const createOrder = async () => {
    setOrderError(null);
    setPdfData(null);
    
    if (!orderData.product_name) {
      alert('Please enter product name!');
      return;
    }
    
    const totalQty = Object.values(orderData.size_breakdown).reduce((a, b) => a + b, 0);
    if (totalQty === 0) {
      alert('Please add at least one size quantity!');
      return;
    }

    const imageToSave = finalImage || mockupImage;
    if (!imageToSave) {
      alert('Please generate a mockup first!');
      return;
    }

    try {
      const payload = {
        product_name: orderData.product_name,
        product_description: orderData.product_description || '',
        fabric_type: orderData.fabric_type || '',
        fabric_composition: orderData.fabric_composition || '',
        size_breakdown: orderData.size_breakdown,
        colors: orderData.colors,
        unit_price: parseFloat(orderData.unit_price) || 0,
        discount_percentage: parseFloat(orderData.discount_percentage) || 0,
        tax_percentage: parseFloat(orderData.tax_percentage) || 18,
        shipping_terms: orderData.shipping_terms || 'FOB',
        delivery_days: parseInt(orderData.delivery_days) || 30,
        client_name: orderData.client_name || '',
        client_company: orderData.client_company || '',
        client_email: orderData.client_email || '',
        mockup_image: imageToSave,
      };

      console.log('📦 Sending order data...');
      
      const response = await axios.post(`${API_BASE}/orders/create/`, payload);
      
      console.log('✅ Order response:', response.data);
      
      if (response.data.status === 'success') {
        const orderDataResponse = response.data.data;
        setGeneratedOrder(orderDataResponse);
        alert('✅ Order created successfully!');
        
        try {
          await generateInvoice(orderDataResponse.id);
        } catch (invoiceError) {
          console.error('Invoice error:', invoiceError);
          setPdfData({ order: orderDataResponse });
        }
      } else {
        setOrderError(response.data.errors || 'Unknown error');
        alert('❌ Error: ' + (response.data.errors || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Create order error:', error);
      setOrderError(error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        alert('Error: ' + JSON.stringify(error.response.data.errors || error.response.data));
      } else {
        alert('Error creating order. Please check console for details.');
      }
    }
  };

  // ============================================
  // GENERATE INVOICE
  // ============================================
  const generateInvoice = async (orderId) => {
    try {
      const response = await axios.post(`${API_BASE}/orders/${orderId}/invoice/`);
      if (response.data.status === 'success') {
        console.log('✅ Invoice generated!');
        await fetchPdfData(orderId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Invoice error:', error);
      return false;
    }
  };

  // ============================================
  // FETCH PDF DATA
  // ============================================
  const fetchPdfData = async (orderId) => {
    try {
      const response = await axios.get(`${API_BASE}/orders/${orderId}/export/`);
      if (response.data.status === 'success') {
        setPdfData(response.data);
      } else {
        setPdfData({ order: generatedOrder });
      }
    } catch (error) {
      console.error('Export error:', error);
      setPdfData({ order: generatedOrder });
    }
  };

  // ============================================
  // HANDLE FORM CHANGES
  // ============================================
  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSizeChange = (size, value) => {
    setOrderData(prev => ({
      ...prev,
      size_breakdown: {
        ...prev.size_breakdown,
        [size]: parseInt(value) || 0
      }
    }));
  };

  const handleColorChange = (index, field, value) => {
    const updatedColors = [...orderData.colors];
    updatedColors[index][field] = value;
    setOrderData(prev => ({
      ...prev,
      colors: updatedColors
    }));
  };

  const addColor = () => {
    setOrderData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: '', pantone: '' }]
    }));
  };

  const removeColor = (index) => {
    if (orderData.colors.length > 1) {
      setOrderData(prev => ({
        ...prev,
        colors: prev.colors.filter((_, i) => i !== index)
      }));
    }
  };

  const getCurrentImage = () => {
    return finalImage || mockupImage;
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* ==========================================
          CLEAN HEADER — NO LOGO
          ========================================== */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🚀 Order Sheet AI — Demo
            </h1>
            <p className="text-sm text-gray-500">
              AI-Powered Mockup + Tech Pack + Invoicing Platform
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ==========================================
              LEFT COLUMN: Mockup Generator
              ========================================== */}
          <div className="space-y-6">
            
            {/* Mockup Generator Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🎨 AI Mockup Generator
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Description
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Black hoodie with white embroidery on chest, premium quality"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Logo (Optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setLogo(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    accept="image/*"
                  />
                </div>
                
                <button
                  onClick={generateMockup}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Generating...' : '🎯 Generate Mockup'}
                </button>
              </div>
            </div>

            {/* ==========================================
                MOCKUP PREVIEW WITH EDIT OPTION
                ========================================== */}
            {getCurrentImage() && !showEditor && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  📸 Final Mockup
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 flex justify-center">
                  <img 
                    src={getCurrentImage()} 
                    alt="Mockup" 
                    className="max-w-full h-auto rounded-lg shadow"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x400?text=Image+Error';
                    }}
                  />
                </div>
                
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {imageSource === 'replicate' && '✅ AI Generated (Replicate)'}
                  {imageSource === 'sdxl' && '✅ AI Generated (SDXL)'}
                  {imageSource === 'placeholder_fallback' && '🔄 Placeholder (Fallback)'}
                  {!imageSource && '✅ AI Generated'}
                  {finalImage && ' ✨ + Embroidery Added'}
                </p>
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowEditor(true)}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    🎨 Edit Embroidery
                  </button>
                  <button
                    onClick={downloadMockup}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    ⬇️ Download
                  </button>
                  <button
                    onClick={() => {
                      setMockupImage(null);
                      setFinalImage(null);
                      setShowEditor(false);
                      setImageSource('');
                      setPdfData(null);
                      setGeneratedOrder(null);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* ==========================================
                SIMPLE EDITOR
                ========================================== */}
            {showEditor && getCurrentImage() && (
              <SimpleEditor 
                imageUrl={getCurrentImage()}
                onSave={handleFinalImage}
                onCancel={() => setShowEditor(false)}
              />
            )}
          </div>

          {/* ==========================================
              RIGHT COLUMN: Tech Pack Form
              ========================================== */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Tech Pack & Order Details
              </h2>
              
              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="product_name"
                    value={orderData.product_name}
                    onChange={handleOrderChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Premium Cotton Hoodie"
                  />
                </div>

                {/* Product Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Description
                  </label>
                  <input
                    type="text"
                    name="product_description"
                    value={orderData.product_description}
                    onChange={handleOrderChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 100% combed cotton, 240 GSM"
                  />
                </div>

                {/* Fabric Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fabric Type
                    </label>
                    <input
                      type="text"
                      name="fabric_type"
                      value={orderData.fabric_type}
                      onChange={handleOrderChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Cotton"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fabric Composition
                    </label>
                    <input
                      type="text"
                      name="fabric_composition"
                      value={orderData.fabric_composition}
                      onChange={handleOrderChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 100% Cotton"
                    />
                  </div>
                </div>

                {/* Size Breakdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size Breakdown (Quantity)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['S', 'M', 'L', 'XL'].map(size => (
                      <div key={size}>
                        <label className="block text-xs text-gray-500 text-center">{size}</label>
                        <input
                          type="number"
                          min="0"
                          value={orderData.size_breakdown[size] || 0}
                          onChange={(e) => handleSizeChange(size, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colors (Pantone)
                  </label>
                  {orderData.colors.map((color, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Color name"
                        value={color.name}
                        onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Pantone"
                        value={color.pantone}
                        onChange={(e) => handleColorChange(index, 'pantone', e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {orderData.colors.length > 1 && (
                        <button
                          onClick={() => removeColor(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addColor}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Color
                  </button>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price (PKR)
                    </label>
                    <input
                      type="number"
                      name="unit_price"
                      value={orderData.unit_price}
                      onChange={handleOrderChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount %
                    </label>
                    <input
                      type="number"
                      name="discount_percentage"
                      value={orderData.discount_percentage}
                      onChange={handleOrderChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax %
                    </label>
                    <input
                      type="number"
                      name="tax_percentage"
                      value={orderData.tax_percentage}
                      onChange={handleOrderChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>
                </div>

                {/* Shipping */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Terms
                    </label>
                    <select
                      name="shipping_terms"
                      value={orderData.shipping_terms}
                      onChange={handleOrderChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="FOB">FOB</option>
                      <option value="EXW">EXW</option>
                      <option value="CIF">CIF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery (Days)
                    </label>
                    <input
                      type="number"
                      name="delivery_days"
                      value={orderData.delivery_days}
                      onChange={handleOrderChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>

                {/* Client Info */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Client Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        name="client_name"
                        placeholder="Client Name"
                        value={orderData.client_name}
                        onChange={handleOrderChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="client_company"
                        placeholder="Company"
                        value={orderData.client_company}
                        onChange={handleOrderChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="email"
                      name="client_email"
                      placeholder="Client Email"
                      value={orderData.client_email}
                      onChange={handleOrderChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={createOrder}
                  disabled={!getCurrentImage()}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!getCurrentImage() ? '⏳ Generate Mockup First' : '📄 Generate Order Sheet'}
                </button>
              </div>
            </div>

            {/* ==========================================
                PDF PREVIEW SECTION
                ========================================== */}
            {(pdfData || generatedOrder) && (
              <div className="bg-white rounded-lg shadow p-6 border-2 border-green-500">
                <h3 className="text-sm font-medium text-green-700 mb-3">
                  ✅ Order Sheet Ready!
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Order ID:</strong> {pdfData?.order?.order_id || generatedOrder?.order_id || 'N/A'}</p>
                  <p><strong>Product:</strong> {pdfData?.order?.product_name || generatedOrder?.product_name || orderData.product_name}</p>
                  <p><strong>Total Quantity:</strong> {
                    (() => {
                      try {
                        const invoiceQty = pdfData?.invoice?.total_quantity;
                        if (invoiceQty !== undefined && invoiceQty !== null) {
                          return invoiceQty;
                        }
                        const order = pdfData?.order || generatedOrder;
                        if (order && order.size_breakdown) {
                          return Object.values(order.size_breakdown).reduce((a, b) => (a || 0) + (b || 0), 0);
                        }
                        return 'N/A';
                      } catch (error) {
                        return 'N/A';
                      }
                    })()
                  }</p>
                  <p><strong>Grand Total:</strong> {
                    (() => {
                      try {
                        if (pdfData?.invoice?.grand_total !== undefined && pdfData?.invoice?.grand_total !== null) {
                          return Number(pdfData.invoice.grand_total).toFixed(2) + ' PKR';
                        }
                        const order = pdfData?.order || generatedOrder;
                        if (order) {
                          const sizeBreakdown = order.size_breakdown || {};
                          const totalQty = Object.values(sizeBreakdown).reduce((a, b) => (a || 0) + (b || 0), 0);
                          const unitPrice = parseFloat(order.unit_price) || 0;
                          const discountPct = parseFloat(order.discount_percentage) || 0;
                          const taxPct = parseFloat(order.tax_percentage) || 18;
                          const subtotal = unitPrice * totalQty;
                          const discountAmount = subtotal * (discountPct / 100);
                          const taxAmount = (subtotal - discountAmount) * (taxPct / 100);
                          const grandTotal = subtotal - discountAmount + taxAmount;
                          return grandTotal.toFixed(2) + ' PKR';
                        }
                        return 'N/A';
                      } catch (error) {
                        console.error('Grand total calculation error:', error);
                        return 'N/A';
                      }
                    })()
                  }</p>
                </div>
                
                {/* DOWNLOAD BUTTONS */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={downloadOrderSheet}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    ⬇️ Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;