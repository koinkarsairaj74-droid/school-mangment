"""Minimal authenticated, tenant-scoped API foundation for Campus ERP.
API operations are restricted to the logged-in user's school. No public demo credentials.
"""
import json
from datetime import date
from decimal import Decimal, InvalidOperation
from django.contrib.auth.decorators import login_required
from django.db import transaction, IntegrityError
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
from .models import School, User, Student, Classroom, FacultyAssignment, AttendanceSession, AttendanceRecord, FeeInvoice, Payment, ParentLink

from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

def home(request):
    if not request.user.is_authenticated:
        return redirect("login")
    user = request.user
    if user.role == User.Role.PLATFORM_ADMIN:
        return redirect("/django-admin/")
    school, error = context(request)
    if error:
        return render(request, "school_error.html", {"message": "Your school account is inactive or incomplete."}, status=403)
    allowed = {
        "students": user.role in (User.Role.SCHOOL_ADMIN, User.Role.TEACHER, User.Role.PARENT),
        "attendance": user.role in (User.Role.SCHOOL_ADMIN, User.Role.TEACHER, User.Role.PARENT),
        "fees": user.role in (User.Role.SCHOOL_ADMIN, User.Role.PARENT),
    }
    return render(request, "school_dashboard.html", {
        "school": school, "role": user.get_role_display(), "allowed": allowed,
        "student_count": student_queryset(user, school).count()
    })

@csrf_protect
@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.user.is_authenticated:
        return redirect("home")
    error = None
    if request.method == "POST":
        username = str(request.POST.get("username", "")).strip()
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is None or not user.is_active:
            error = "Invalid username or password."
        elif user.role != User.Role.PLATFORM_ADMIN and (not user.school_id or not user.school.active):
            error = "This school account is not active."
        else:
            login(request, user)
            return redirect("home")
    return render(request, "login.html", {"error": error})

@require_POST
def logout_view(request):
    logout(request)
    return redirect("login")

def health(request):
    return JsonResponse({"ok": True, "service": "campus-erp"})

def fail(message, status=400):
    return JsonResponse({"error": str(message)}, status=status)

def decode(request):
    try:
        obj = json.loads(request.body.decode("utf-8"))
        if not isinstance(obj, dict):
            raise ValueError("JSON request body must be an object")
        return obj
    except (ValueError, UnicodeDecodeError):
        return None

def context(request):
    user = request.user
    if not user.is_authenticated:
        return None, fail("Sign in required", 401)
    if user.role == User.Role.PLATFORM_ADMIN:
        return None, fail("Platform administrators must use the separate school-management workflow", 403)
    if not user.school_id or not user.school.active:
        return None, fail("A valid active school membership is required", 403)
    return user.school, None

def student_queryset(user, school):
    qs = Student.objects.filter(school=school).select_related("classroom")
    if user.role == User.Role.SCHOOL_ADMIN:
        return qs
    if user.role == User.Role.TEACHER:
        teacher_class_ids = FacultyAssignment.objects.filter(school=school, teacher=user).values_list("classroom_id", flat=True)
        home_class_ids = Classroom.objects.filter(school=school, teacher=user).values_list("id", flat=True)
        return qs.filter(classroom_id__in=list(teacher_class_ids) + list(home_class_ids))
    if user.role == User.Role.PARENT:
        return qs.filter(linked_parents__school=school, linked_parents__parent=user).distinct()
    return qs.none()

def student_json(s):
    return {"id": s.id, "admission_number": s.admission_number, "name": s.full_name,
            "classroom_id": s.classroom_id, "class": s.classroom.name,
            "division": s.classroom.division, "active": s.active}

@require_http_methods(["GET"])
def me(request):
    school, error = context(request)
    if error:
        return error
    user = request.user
    return JsonResponse({"id": user.id, "username": user.username, "role": user.role,
                         "school": {"id": school.id, "name": school.name, "slug": school.slug}})

@require_http_methods(["GET"])
def schools(request):
    school, error = context(request)
    if error:
        return error
    return JsonResponse({"school": {"id": school.id, "name": school.name, "slug": school.slug,
                                    "logo_url": school.logo_url, "address": school.address}})

@require_http_methods(["GET", "POST"])
def students(request):
    school, error = context(request)
    if error:
        return error
    if request.method == "GET":
        qs = student_queryset(request.user, school).order_by("admission_number")[:500]
        return JsonResponse({"results": [student_json(s) for s in qs]})
    if request.user.role != User.Role.SCHOOL_ADMIN:
        return fail("Only school administrators can enrol students", 403)
    data = decode(request)
    if data is None:
        return fail("Invalid JSON")
    name = str(data.get("name", "")).strip()
    admission = str(data.get("admission_number", "")).strip()
    if not name or not admission:
        return fail("Student name and admission number are required")
    try:
        classroom = Classroom.objects.get(pk=int(data.get("classroom_id")), school=school)
        student = Student(school=school, classroom=classroom, full_name=name, admission_number=admission)
        student.full_clean()
        student.save()
        return JsonResponse({"student": student_json(student)}, status=201)
    except (ValueError, TypeError, Classroom.DoesNotExist):
        return fail("Classroom does not belong to your school")
    except ValidationError as exc:
        return fail(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)
    except IntegrityError:
        return fail("Admission number already exists at this school", 409)

@require_http_methods(["GET", "POST"])
def attendance(request):
    school, error = context(request)
    if error:
        return error
    user = request.user
    if request.method == "GET":
        qs = AttendanceSession.objects.filter(school=school).select_related("classroom")
        if user.role == User.Role.TEACHER:
            qs = qs.filter(teacher=user)
        elif user.role == User.Role.PARENT:
            # Parents receive only their own child's status; never other students' data or class totals.
            linked_ids = set(student_queryset(user, school).values_list("id", flat=True))
            qs = qs.filter(records__student_id__in=linked_ids).distinct()
            result = []
            for session in qs.order_by("-date", "-id")[:150]:
                child_records = session.records.filter(student_id__in=linked_ids)
                for record in child_records:
                    result.append({"session_id": session.id, "student_id": record.student_id,
                                   "date": session.date.isoformat(), "subject": session.subject,
                                   "period": session.period, "present": record.present})
            return JsonResponse({"results": result})
        elif user.role != User.Role.SCHOOL_ADMIN:
            return fail("Not authorized", 403)
        return JsonResponse({"results": [{
            "id": s.id, "date": s.date.isoformat(), "classroom_id": s.classroom_id,
            "period": s.period, "subject": s.subject,
            "present": s.records.filter(present=True).count(), "absent": s.records.filter(present=False).count()
        } for s in qs.order_by("-date", "-id")[:150]]})
    if user.role != User.Role.TEACHER:
        return fail("Only assigned teachers can submit attendance", 403)
    data = decode(request)
    if data is None:
        return fail("Invalid JSON")
    try:
        classroom = Classroom.objects.get(pk=int(data.get("classroom_id")), school=school)
        permitted = classroom.teacher_id == user.id or FacultyAssignment.objects.filter(
            school=school, teacher=user, classroom=classroom, subject=data.get("subject")).exists()
        if not permitted:
            return fail("You are not assigned to this class and subject", 403)
        period = int(data.get("period"))
        if not 1 <= period <= 12:
            return fail("Period must be between 1 and 12")
        attendance_date = date.fromisoformat(str(data.get("date")))
        if attendance_date > date.today():
            return fail("Future attendance dates are not allowed")
        subject = str(data.get("subject", "")).strip()
        records = data.get("records")
        if not subject or not isinstance(records, list) or not records:
            return fail("Provide a subject and the complete attendance roster")
        roster = set(Student.objects.filter(school=school, classroom=classroom, active=True).values_list("id", flat=True))
        ids = [int(row["student_id"]) for row in records]
        if len(ids) != len(set(ids)) or set(ids) != roster or any(type(row.get("present")) is not bool for row in records):
            return fail("Submit exactly one present/absent value for every active student in this classroom")
        with transaction.atomic():
            session = AttendanceSession(school=school, classroom=classroom, teacher=user,
                                        date=attendance_date, period=period, subject=subject)
            session.full_clean()
            session.save()
            AttendanceRecord.objects.bulk_create([
                AttendanceRecord(school=school, session=session, student_id=int(row["student_id"]),
                                 present=row["present"]) for row in records
            ])
        return JsonResponse({"session_id": session.pk, "students_recorded": len(records)}, status=201)
    except (ValueError, TypeError, KeyError, Classroom.DoesNotExist):
        return fail("Invalid date, class, student, or period")
    except ValidationError as exc:
        return fail(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)
    except IntegrityError:
        return fail("Attendance for this class, date and period already exists", 409)

@require_http_methods(["GET"])
def fee_receipts(request):
    school, error = context(request)
    if error:
        return error
    if request.user.role not in (User.Role.SCHOOL_ADMIN, User.Role.PARENT):
        return fail("Not permitted to view fee data", 403)
    qs = Payment.objects.filter(school=school).select_related("invoice", "invoice__student")
    if request.user.role == User.Role.PARENT:
        linked_student_ids = student_queryset(request.user, school).values_list("id", flat=True)
        qs = qs.filter(invoice__student_id__in=linked_student_ids)
    return JsonResponse({"results": [{
        "id": p.id, "invoice_id": p.invoice_id, "student_id": p.invoice.student_id,
        "amount": str(p.amount), "reference": p.reference, "date": p.created_at.isoformat()
    } for p in qs.order_by("-created_at")[:300]]})
