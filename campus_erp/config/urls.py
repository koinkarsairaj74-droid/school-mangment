from django.contrib import admin
from django.urls import path
from schools import views
urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("health/", views.health, name="health"),
    path("api/v1/me/", views.me, name="me"),
    path("api/v1/schools/", views.schools, name="schools"),
    path("api/v1/students/", views.students, name="students"),
    path("api/v1/attendance/", views.attendance, name="attendance"),
    path("api/v1/fee-receipts/", views.fee_receipts, name="fee_receipts"),
]
