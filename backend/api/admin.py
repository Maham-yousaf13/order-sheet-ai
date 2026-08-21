from django.contrib import admin
from .models import Order, Mockup, Invoice

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'product_name', 'client_name', 'status', 'created_at']
    search_fields = ['order_id', 'product_name', 'client_name']
    list_filter = ['status', 'created_at']

@admin.register(Mockup)
class MockupAdmin(admin.ModelAdmin):
    list_display = ['order', 'is_selected', 'created_at']
    list_filter = ['is_selected']

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'order', 'grand_total', 'generated_at']