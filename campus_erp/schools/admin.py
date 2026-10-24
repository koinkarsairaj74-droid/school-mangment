"""Operator-only admin. School staff must use tenant-scoped application views."""
from django.contrib.admin import AdminSite
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.admin import ModelAdmin
from .models import School, User, Classroom, Student, ParentLink, FacultyAssignment, TimetablePeriod, AttendanceSession, AttendanceRecord, Exam, Mark, FeeInvoice, Payment, AuditEvent

class OperatorAdminSite(AdminSite):
    site_header = "Campus ERP — Platform Operators"
    site_title = "Campus ERP operations"
    index_title = "Tenant provisioning and maintenance"

    def has_permission(self, request):
        user = request.user
        return bool(user.is_authenticated and user.is_active and user.is_superuser
                    and user.role == User.Role.PLATFORM_ADMIN and user.school_id is None)

operator_site = OperatorAdminSite(name="operator_admin")

class SchoolAdmin(ModelAdmin):
    list_display = ("name", "slug", "active")
    search_fields = ("name", "slug")

class UserAdmin(BaseUserAdmin):
    list_display = ("username", "role", "school", "is_active")
    list_filter = ("school", "role")
    fieldsets = BaseUserAdmin.fieldsets + (("School membership", {"fields": ("school", "role", "must_change_password")}),)
    add_fieldsets = BaseUserAdmin.add_fieldsets + (("School membership", {"fields": ("school", "role", "must_change_password")}),)

operator_site.register(School, SchoolAdmin)
operator_site.register(User, UserAdmin)
for model in [Classroom, Student, ParentLink, FacultyAssignment, TimetablePeriod,
              AttendanceSession, AttendanceRecord, Exam, Mark, FeeInvoice, Payment, AuditEvent]:
    operator_site.register(model)
