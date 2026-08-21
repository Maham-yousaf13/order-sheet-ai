from django.db import models
from django.contrib.auth.models import User

class Order(models.Model):
    """
    Main Order model — Tech Pack + Invoice data store karega
    """
    # Basic Info
    order_id = models.CharField(max_length=50, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Product Details
    product_name = models.CharField(max_length=200)
    product_description = models.TextField(blank=True)
    
    # Fabric & Materials
    fabric_type = models.CharField(max_length=100, blank=True)
    fabric_composition = models.CharField(max_length=100, blank=True)
    
    # Mockup Image - CHANGED to TextField for base64 storage
    mockup_image = models.TextField(blank=True, null=True)  # <-- FIXED
    
    # Sizes & Quantities (stored as JSON)
    size_breakdown = models.JSONField(default=dict, help_text='{"S": 50, "M": 80, "L": 70}')
    
    # Colors (Pantone codes)
    colors = models.JSONField(default=list, help_text='[{"name": "Black", "pantone": "19-0303"}]')
    
    # Pricing
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    
    # Shipping
    shipping_terms = models.CharField(max_length=20, default='FOB', choices=[
        ('FOB', 'FOB (Free on Board)'),
        ('EXW', 'EXW (Ex Works)'),
        ('CIF', 'CIF (Cost, Insurance, Freight)'),
    ])
    delivery_days = models.IntegerField(default=30)
    
    # Client Info
    client_name = models.CharField(max_length=200, blank=True)
    client_company = models.CharField(max_length=200, blank=True)
    client_email = models.EmailField(blank=True)
    
    # Status
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Client Approval'),
        ('confirmed', 'Confirmed'),
        ('in_production', 'In Production'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    def __str__(self):
        return f"Order {self.order_id or 'Draft'} - {self.product_name}"
    
    def save(self, *args, **kwargs):
        if not self.order_id:
            import uuid
            self.order_id = f"ORD-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)


class Mockup(models.Model):
    """
    Store AI-generated mockup variations
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='mockups')
    prompt = models.TextField()
    image = models.TextField(blank=True, null=True)  # <-- FIXED: Store base64
    is_selected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Mockup for {self.order.product_name} - {'Selected' if self.is_selected else 'Alternative'}"


class Invoice(models.Model):
    """
    Store invoice data separately (for reporting)
    """
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=50, unique=True)
    total_quantity = models.IntegerField(default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    generated_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.order.product_name}"