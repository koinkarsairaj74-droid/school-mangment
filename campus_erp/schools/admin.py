from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import School, User, Classroom, Student, ParentLink, FacultyAssignment, TimetablePeriod, AttendanceSession, AttendanceRecord, Exam, Mark, FeeInvoice, Payment, AuditEvent

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "active")
    search_fields = ("name", "slug")

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "role", "school", "is_active")
    list_filter = ("school", "role")
    fieldsets = BaseUserAdmin.fieldsets + (("School membership", {"fields": ("school", "role", "must_change_password")}),)
    add_fieldsets = BaseUserAdmin.add_fieldsets + (("School membership", {"fields": ("school", "role")}),)

for model in [Classroom, Student, ParentLink, FacultyAssignment, TimetablePeriod,
              AttendanceSession, AttendanceRecord, Exam, Mark, FeeInvoice, Payment, AuditEvent]:
    admin.site.register(model)
