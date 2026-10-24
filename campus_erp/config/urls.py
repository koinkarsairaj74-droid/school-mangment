from django.urls import path
from schools import views
from schools.admin import operator_site
from schools import pwa
urlpatterns = [
    path("django-admin/", operator_site.urls),
    path("", views.home, name="home"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("health/", views.health, name="health"),
    path("manifest.webmanifest", pwa.manifest, name="app_manifest"),
    path("service-worker.js", pwa.service_worker, name="service_worker"),
    path("icons/icon-192.png", pwa.icon, {"size": 192}, name="icon_192"),
    path("icons/icon-512.png", pwa.icon, {"size": 512}, name="icon_512"),
    path("api/v1/me/", views.me, name="me"),
    path("api/v1/schools/", views.schools, name="schools"),
    path("api/v1/students/", views.students, name="students"),
    path("api/v1/attendance/", views.attendance, name="attendance"),
    path("api/v1/fee-receipts/", views.fee_receipts, name="fee_receipts"),
]
