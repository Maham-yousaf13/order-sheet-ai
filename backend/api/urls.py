from django.urls import path
from . import views

urlpatterns = [
    # Order CRUD
    path('orders/', views.get_orders, name='get_orders'),
    path('orders/create/', views.create_order, name='create_order'),
    path('orders/<int:pk>/', views.get_order, name='get_order'),
    path('orders/<int:pk>/update/', views.update_order, name='update_order'),
    path('orders/<int:pk>/delete/', views.delete_order, name='delete_order'),
    
    # AI Generation
    path('generate-mockup/', views.generate_mockup, name='generate_mockup'),
    
    # Invoice
    path('orders/<int:order_id>/invoice/', views.generate_invoice, name='generate_invoice'),
    
    # Export
    path('orders/<int:order_id>/export/', views.export_pdf, name='export_pdf'),
]