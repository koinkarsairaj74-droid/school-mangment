"""Multi-school data model. Every school-owned query must include school_id."""
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils.text import slugify

class School(models.Model):
    name = models.CharField(max_length=180)
    slug = models.SlugField(unique=True)
    logo_url = models.URLField(blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=25, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    class Role(models.TextChoices):
        PLATFORM_ADMIN = "platform_admin", "Platform admin"
        SCHOOL_ADMIN = "school_admin", "School admin"
        TEACHER = "teacher", "Teacher"
        PARENT = "parent", "Parent"
        STUDENT = "student", "Student"
    school = models.ForeignKey(School, on_delete=models.PROTECT, null=True, blank=True, related_name="users")
    role = models.CharField(max_length=22, choices=Role.choices, default=Role.STUDENT)
    must_change_password = models.BooleanField(default=True)

    def clean(self):
        super().clean()
        if self.role == self.Role.PLATFORM_ADMIN and self.school_id is not None:
            raise ValidationError({"school": "Platform admins cannot belong to a school."})
        if self.role != self.Role.PLATFORM_ADMIN and self.school_id is None:
            raise ValidationError({"school": "School users must belong to a school."})

class SchoolModel(models.Model):
    school = models.ForeignKey(School, on_delete=models.PROTECT)
    class Meta:
        abstract = True

class Classroom(SchoolModel):
    name = models.CharField(max_length=50)
    division = models.CharField(max_length=12)
    year = models.CharField(max_length=12, default="2026-2027")
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT, related_name="homerooms")
    class Meta:
        constraints = [models.UniqueConstraint(fields=["school", "name", "division", "year"], name="unique_school_class_division_year")]
    def clean(self):
        if self.teacher_id and (self.teacher.school_id != self.school_id or self.teacher.role != User.Role.TEACHER):
            raise ValidationError({"teacher": "Class teacher must be a teacher of this school."})

class Student(SchoolModel):
    admission_number = models.CharField(max_length=40)
    full_name = models.CharField(max_length=180)
    classroom = models.ForeignKey(Classroom, on_delete=models.PROTECT, related_name="students")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["school", "admission_number"], name="unique_admission_number_per_school")]
    def clean(self):
        if self.classroom_id and self.classroom.school_id != self.school_id:
            raise ValidationError({"classroom": "Class must belong to the student's school."})

class ParentLink(SchoolModel):
    parent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="linked_students")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="linked_parents")
    relation = models.CharField(max_length=35, default="Guardian")
    class Meta:
        constraints = [models.UniqueConstraint(fields=["parent", "student"], name="unique_parent_student")]
    def clean(self):
        if self.parent_id and (self.parent.school_id != self.school_id or self.parent.role != User.Role.PARENT):
            raise ValidationError({"parent": "Parent must belong to this school."})
        if self.student_id and self.student.school_id != self.school_id:
            raise ValidationError({"student": "Student belongs to another school."})

class FacultyAssignment(SchoolModel):
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="assigned_classes")
    classroom = models.ForeignKey(Classroom, on_delete=models.PROTECT, related_name="faculty_assignments")
    subject = models.CharField(max_length=70)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["teacher","classroom","subject"], name="unique_teacher_class_subject")]
    def clean(self):
        if self.teacher_id and (self.teacher.school_id != self.school_id or self.teacher.role != User.Role.TEACHER):
            raise ValidationError({"teacher": "Teacher must belong to this school."})
        if self.classroom_id and self.classroom.school_id != self.school_id:
            raise ValidationError({"classroom": "Assigned class must belong to this school."})

class TimetablePeriod(SchoolModel):
    classroom = models.ForeignKey(Classroom, on_delete=models.PROTECT, related_name="periods")
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    subject = models.CharField(max_length=70)
    weekday = models.PositiveSmallIntegerField()
    period = models.PositiveSmallIntegerField()
    starts = models.TimeField()
    ends = models.TimeField()
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["classroom","weekday","period"], name="one_period_per_class_slot"),
            models.UniqueConstraint(fields=["teacher","weekday","starts"], name="one_teacher_per_start_slot"),
        ]
    def clean(self):
        if self.classroom_id and self.classroom.school_id != self.school_id:
            raise ValidationError({"classroom": "Class belongs to another school."})
        if self.teacher_id and (self.teacher.school_id != self.school_id or self.teacher.role != User.Role.TEACHER):
            raise ValidationError({"teacher": "Teacher belongs to another school."})
        if self.starts and self.ends and self.ends <= self.starts:
            raise ValidationError({"ends": "End time must be after start time."})
        if self.classroom_id and self.weekday is not None and self.starts and self.ends:
            collisions = TimetablePeriod.objects.filter(school_id=self.school_id, weekday=self.weekday).filter(
                Q(classroom_id=self.classroom_id) | Q(teacher_id=self.teacher_id),
                starts__lt=self.ends, ends__gt=self.starts)
            if self.pk:
                collisions = collisions.exclude(pk=self.pk)
            if collisions.exists():
                raise ValidationError("Timetable overlaps a teacher or class lesson.")

class AttendanceSession(SchoolModel):
    classroom = models.ForeignKey(Classroom, on_delete=models.PROTECT)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    date = models.DateField()
    period = models.PositiveSmallIntegerField()
    subject = models.CharField(max_length=70)
    submitted_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["school","classroom","date","period"], name="unique_class_attendance_slot")]
    def clean(self):
        if self.classroom_id and self.classroom.school_id != self.school_id:
            raise ValidationError({"classroom": "Class belongs to another school."})
        if self.teacher_id and (self.teacher.school_id != self.school_id or self.teacher.role != User.Role.TEACHER):
            raise ValidationError({"teacher": "Teacher belongs to another school."})

class AttendanceRecord(SchoolModel):
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name="records")
    student = models.ForeignKey(Student, on_delete=models.PROTECT)
    present = models.BooleanField()
    class Meta:
        constraints = [models.UniqueConstraint(fields=["session","student"], name="unique_attendance_student_session")]
    def clean(self):
        if self.session_id and self.session.school_id != self.school_id:
            raise ValidationError({"session": "Session belongs to another school."})
        if self.student_id and (self.student.school_id != self.school_id or self.session_id and self.student.classroom_id != self.session.classroom_id):
            raise ValidationError({"student": "Student does not belong to this session's class."})

class Exam(SchoolModel):
    name = models.CharField(max_length=90)
    year = models.CharField(max_length=12)

class Mark(SchoolModel):
    exam = models.ForeignKey(Exam, on_delete=models.PROTECT)
    student = models.ForeignKey(Student, on_delete=models.PROTECT)
    subject = models.CharField(max_length=70)
    awarded = models.DecimalField(max_digits=7, decimal_places=2)
    maximum = models.DecimalField(max_digits=7, decimal_places=2)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["exam","student","subject"], name="unique_exam_student_subject")]
    def clean(self):
        if self.exam_id and self.exam.school_id != self.school_id:
            raise ValidationError({"exam": "Exam belongs to another school."})
        if self.student_id and self.student.school_id != self.school_id:
            raise ValidationError({"student": "Student belongs to another school."})
        if self.maximum is not None and self.awarded is not None and not (0 <= self.awarded <= self.maximum and self.maximum > 0):
            raise ValidationError({"awarded": "Marks must be between zero and the maximum."})

class FeeInvoice(SchoolModel):
    student = models.ForeignKey(Student, on_delete=models.PROTECT, related_name="invoices")
    amount = models.DecimalField(max_digits=11, decimal_places=2)
    description = models.CharField(max_length=150)
    due_date = models.DateField()
    def clean(self):
        if self.student_id and self.student.school_id != self.school_id:
            raise ValidationError({"student": "Student belongs to another school."})

class Payment(SchoolModel):
    invoice = models.ForeignKey(FeeInvoice, on_delete=models.PROTECT, related_name="payments")
    amount = models.DecimalField(max_digits=11, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.CheckConstraint(condition=Q(amount__gt=0), name="positive_payment")]
    def clean(self):
        if self.invoice_id and self.invoice.school_id != self.school_id:
            raise ValidationError({"invoice": "Invoice belongs to another school."})

class AuditEvent(SchoolModel):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=50)
    target_id = models.PositiveBigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
