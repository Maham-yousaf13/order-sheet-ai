from rest_framework import serializers
from .models import Order, Mockup, Invoice

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['order_id', 'created_at', 'updated_at']

class MockupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mockup
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'