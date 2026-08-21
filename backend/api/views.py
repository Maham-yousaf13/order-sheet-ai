from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Order, Mockup, Invoice
from .serializers import OrderSerializer, MockupSerializer, InvoiceSerializer
import json
import uuid
from datetime import datetime
import requests
import base64
from io import BytesIO
from PIL import Image
import os
import replicate
import traceback

# ============================================
# ORDER CRUD API
# ============================================

@api_view(['GET'])
def get_orders(request):
    """Get all orders"""
    orders = Order.objects.all().order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def create_order(request):
    """
    Create a new order with full error handling
    """
    try:
        print("=" * 60)
        print("📦 CREATE ORDER - DEBUG")
        print("=" * 60)
        
        # Get data
        data = request.data.copy()
        
        # Log incoming data (hide base64 for readability)
        print("📥 Request data:")
        for key, value in data.items():
            if key == 'mockup_image':
                print(f"  {key}: [BASE64 IMAGE - {len(value)} chars]")
            else:
                print(f"  {key}: {value}")
        
        # Ensure size_breakdown is a dict
        if 'size_breakdown' in data:
            if isinstance(data['size_breakdown'], str):
                try:
                    data['size_breakdown'] = json.loads(data['size_breakdown'])
                except:
                    data['size_breakdown'] = {'S': 0, 'M': 0, 'L': 0, 'XL': 0}
        else:
            data['size_breakdown'] = {'S': 0, 'M': 0, 'L': 0, 'XL': 0}
        
        # Ensure colors is a list
        if 'colors' in data:
            if isinstance(data['colors'], str):
                try:
                    data['colors'] = json.loads(data['colors'])
                except:
                    data['colors'] = [{'name': '', 'pantone': ''}]
        else:
            data['colors'] = [{'name': '', 'pantone': ''}]
        
        # Validate required fields
        if not data.get('product_name'):
            return Response({
                'status': 'error',
                'message': 'Product name is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create serializer
        serializer = OrderSerializer(data=data)
        
        if serializer.is_valid():
            order = serializer.save()
            print(f"✅ ORDER CREATED: ID {order.id}")
            print("=" * 60)
            
            return Response({
                'status': 'success',
                'message': 'Order created successfully',
                'data': OrderSerializer(order).data
            }, status=status.HTTP_201_CREATED)
        else:
            print("❌ SERIALIZER ERRORS:")
            for field, errors in serializer.errors.items():
                print(f"  {field}: {errors}")
            print("=" * 60)
            
            return Response({
                'status': 'error',
                'message': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        print("=" * 60)
        
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_order(request, pk):
    """Get single order details"""
    order = get_object_or_404(Order, pk=pk)
    serializer = OrderSerializer(order)
    return Response(serializer.data)


@api_view(['PUT'])
def update_order(request, pk):
    """Update order"""
    order = get_object_or_404(Order, pk=pk)
    serializer = OrderSerializer(order, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'status': 'success',
            'message': 'Order updated successfully',
            'data': serializer.data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
def delete_order(request, pk):
    """Delete order"""
    order = get_object_or_404(Order, pk=pk)
    order.delete()
    return Response({
        'status': 'success',
        'message': 'Order deleted successfully'
    }, status=status.HTTP_204_NO_CONTENT)


# ============================================
# AI MOCKUP GENERATION API
# ============================================

@api_view(['POST'])
def generate_mockup(request):
    """
    Generate AI mockup using Replicate API
    Fallbacks: Hugging Face -> Placeholder
    """
    
    # FORCE SET TOKEN (Emergency Fix)
   os.environ['REPLICATE_API_TOKEN'] = os.getenv('REPLICATE_API_TOKEN', '')
    
    try:
        # Get the prompt from request
        prompt = request.data.get('prompt', '')
        if not prompt:
            return Response({
                'error': 'Prompt is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ==========================================
        # HYPER-SPECIFIC PROMPT FOR EMBROIDERY
        # This prompt is specifically designed to show clear embroidery on chest
        # ==========================================
        enhanced_prompt = f"""A realistic full-body photo of a {prompt}. 
        The garment is a black hoodie worn on a mannequin, front view.
        On the left chest area, there is a clear white embroidery design.
        The embroidery is stitched with white thread, visible on the black fabric.
        Studio lighting, pure white background, fashion catalog photography.
        8k resolution, highly detailed fabric texture, professional product photo.
        The embroidery is crisp, clear, and centered on the chest."""
        
        # ==========================================
        # TRY 1: Replicate API (Primary)
        # ==========================================
        try:
            print("🔄 Trying Replicate API with hyper-specific prompt...")
            
            # Run Stable Diffusion model on Replicate
            output = replicate.run(
                "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
                input={
                    "prompt": enhanced_prompt,
                    # Negative prompt tells AI what NOT to generate
                    "negative_prompt": "blurry, bad quality, distorted, deformed, ugly, abstract, painting, cartoon, sketch, lowres, bad anatomy, no embroidery, missing embroidery, embroidery not visible, plain hoodie, no design, text, watermark, signature, people, faces, hands, skin, body, person, human, extra limbs, bad proportions, dark background, busy background, multiple subjects, accessories, jewelry, bags, background objects, props, duplicate, mutilated, bad body, bad proportions, disfigured, malformed, mutated, poorly drawn, bad anatomy, missing limbs, floating limbs, disconnected limbs, mutation, mutated, ugly, disgusting",
                    "num_outputs": 1,  # Generate 1 image
                    "guidance_scale": 12.0,  # Higher = more faithful to prompt
                    "num_inference_steps": 50,  # More steps = better quality
                    "width": 1024,
                    "height": 1024,
                    "scheduler": "DPMSolverMultistep"
                }
            )
            
            # Replicate returns a list of image URLs
            if output and len(output) > 0:
                image_url = output[0]
                print(f"✅ Replicate Success: {image_url}")
                
                # Download the image from URL
                response = requests.get(image_url)
                if response.status_code == 200:
                    # Convert image to base64 for frontend display
                    image = Image.open(BytesIO(response.content))
                    buffered = BytesIO()
                    image.save(buffered, format="PNG")
                    img_str = base64.b64encode(buffered.getvalue()).decode()
                    
                    return Response({
                        'success': True,
                        'image': f"data:image/png;base64,{img_str}",
                        'source': 'replicate'
                    })
                    
        except Exception as e:
            print(f"❌ Replicate API Error: {e}")
            print(traceback.format_exc())
        
        # ==========================================
        # TRY 2: SDXL Model (Better Quality)
        # SDXL is more advanced and may generate better embroidery
        # ==========================================
        try:
            print("🔄 Trying SDXL model (better quality)...")
            
            output = replicate.run(
                "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                input={
                    "prompt": enhanced_prompt,
                    "negative_prompt": "blurry, bad quality, distorted, deformed, ugly, abstract, painting, cartoon, sketch, lowres, bad anatomy, no embroidery, text, watermark, people, faces, hands, skin, body, person, human",
                    "width": 1024,
                    "height": 1024,
                    "num_outputs": 1,
                    "guidance_scale": 7.5,
                    "num_inference_steps": 30
                }
            )
            
            if output and len(output) > 0:
                image_url = output[0]
                print(f"✅ SDXL Success: {image_url}")
                
                response = requests.get(image_url)
                if response.status_code == 200:
                    image = Image.open(BytesIO(response.content))
                    buffered = BytesIO()
                    image.save(buffered, format="PNG")
                    img_str = base64.b64encode(buffered.getvalue()).decode()
                    
                    return Response({
                        'success': True,
                        'image': f"data:image/png;base64,{img_str}",
                        'source': 'sdxl'
                    })
                    
        except Exception as e:
            print(f"❌ SDXL Error: {e}")
            print(traceback.format_exc())
        
        # ==========================================
        # TRY 3: Hugging Face (Fallback 1)
        # Free alternative if Replicate fails
        # ==========================================
        try:
            print("🔄 Trying Hugging Face (fallback)...")
            image_data = generate_with_huggingface(prompt)
            if image_data:
                return Response({
                    'success': True,
                    'image': image_data,
                    'source': 'huggingface_fallback'
                })
        except Exception as e:
            print(f"❌ Hugging Face Error: {e}")
            print(traceback.format_exc())
        
        # ==========================================
        # TRY 4: Placeholder (Ultimate Fallback)
        # This always works if everything else fails
        # ==========================================
        print("🔄 Using placeholder (ultimate fallback)...")
        placeholder_image = generate_placeholder(prompt)
        return Response({
            'success': True,
            'image': placeholder_image,
            'source': 'placeholder_fallback'
        })
        
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        print(traceback.format_exc())
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# HUGGING FACE FALLBACK
# Free AI image generation (slower but free)
# ============================================

def generate_with_huggingface(prompt):
    """Generate image using Hugging Face ZeroGPU (Free)"""
    try:
        # Better prompt for apparel
        improved_prompt = f"""A realistic photo of a {prompt}, 
        worn on a mannequin, studio lighting, white background, 
        fashion photography, high quality, 4k, detailed fabric texture,
        professional product photo, commercial use"""
        
        API_URL = "https://api-inference.huggingface.co/models/SG161222/Realistic_Vision_V5.1_noVAE"
        headers = {
            "Authorization": f"Bearer {os.getenv('HUGGINGFACE_TOKEN', '')}",
            "Content-Type": "application/json"
        }
        payload = {
            "inputs": improved_prompt,
            "parameters": {
                "negative_prompt": "blurry, bad quality, distorted, deformed, ugly, abstract, painting, cartoon, sketch, lowres, bad anatomy, bad hands, extra fingers",
                "num_inference_steps": 30,
                "guidance_scale": 7.5
            }
        }
        
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        
        if response.status_code == 200:
            image = Image.open(BytesIO(response.content))
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            return f"data:image/png;base64,{img_str}"
        
        print(f"HF API Status: {response.status_code}")
        print(f"HF API Response: {response.text}")
        return None
    except Exception as e:
        print(f"HF API Error: {e}")
        return None


# ============================================
# PLACEHOLDER GENERATOR (Ultimate Fallback)
# Generates a professional-looking placeholder image
# ============================================

def generate_placeholder(prompt):
    """Generate a professional placeholder image using PIL"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Create a blank image
        img = Image.new('RGB', (800, 600), color='#f0f4f8')
        draw = ImageDraw.Draw(img)
        
        # Background gradient effect
        for i in range(600):
            color = 240 - (i // 3)
            draw.rectangle([(0, i), (800, i+1)], fill=(color, color-10, color-5))
        
        # Draw a hoodie shape (placeholder)
        draw.rectangle([(200, 100), (600, 500)], outline='#2c3e50', width=3, fill='#34495e')
        draw.rectangle([(220, 120), (580, 480)], outline='#2c3e50', width=1, fill='#2c3e50')
        draw.arc([(300, 80), (500, 200)], start=0, end=180, fill='#2c3e50', width=3)
        
        # Draw text on mockup
        try:
            font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        
        draw.text((300, 250), "AI MOCKUP", fill='#ecf0f1', font=font)
        draw.text((250, 300), "Generated by", fill='#bdc3c7', font=font)
        draw.text((280, 330), "Order Sheet AI", fill='#3498db', font=font)
        
        # Draw prompt text at bottom
        draw.text((50, 520), f"Prompt: {prompt[:60]}...", fill='#7f8c8d', font=font)
        
        # Convert to base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        print(f"Placeholder Error: {e}")
        # Ultra fallback - SVG base64
        return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmNGY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjMzQ5OGRiIj5PcmRlciBTaGVldCBBSTwvdGV4dD48L3N2Zz4="


# ============================================
# INVOICE GENERATION API
# ============================================

@api_view(['POST'])
def generate_invoice(request, order_id):
    """Generate invoice for an order"""
    try:
        order = get_object_or_404(Order, pk=order_id)
        
        # Calculate totals
        total_quantity = sum(order.size_breakdown.values()) if order.size_breakdown else 0
        subtotal = float(order.unit_price) * total_quantity
        discount_amount = subtotal * (float(order.discount_percentage) / 100)
        tax_amount = (subtotal - discount_amount) * (float(order.tax_percentage) / 100)
        grand_total = subtotal - discount_amount + tax_amount
        
        # Generate invoice number
        invoice_number = f"INV-{datetime.now().strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}"
        
        # Create or update invoice
        invoice, created = Invoice.objects.get_or_create(order=order)
        invoice.invoice_number = invoice_number
        invoice.total_quantity = total_quantity
        invoice.subtotal = subtotal
        invoice.discount_amount = discount_amount
        invoice.tax_amount = tax_amount
        invoice.grand_total = grand_total
        invoice.save()
        
        return Response({
            'status': 'success',
            'message': 'Invoice generated successfully',
            'data': InvoiceSerializer(invoice).data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Invoice Error: {e}")
        traceback.print_exc()
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# EXPORT TO PDF (Dashboard)
# ============================================

@api_view(['GET'])
def export_pdf(request, order_id):
    """Generate PDF URL for order"""
    try:
        order = get_object_or_404(Order, pk=order_id)
        
        # Return order data - frontend will handle PDF rendering
        order_data = OrderSerializer(order).data
        
        # Get invoice if exists
        try:
            invoice = Invoice.objects.get(order=order)
            invoice_data = InvoiceSerializer(invoice).data
        except Invoice.DoesNotExist:
            invoice_data = None
        
        return Response({
            'status': 'success',
            'order': order_data,
            'invoice': invoice_data
        })
        
    except Exception as e:
        print(f"❌ Export Error: {e}")
        traceback.print_exc()
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)