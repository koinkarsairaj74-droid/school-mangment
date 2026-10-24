from datetime import date
from django.test import TestCase, Client
from django.urls import reverse
from .models import School, User, Classroom, Student, ParentLink, FacultyAssignment

class SchoolIsolationTests(TestCase):
    def setUp(self):
        self.a = School.objects.create(name="School A", slug="school-a")
        self.b = School.objects.create(name="School B", slug="school-b")
        self.admin_a = User.objects.create_user(username="admin_a", password="VeryStrongPass456!", school=self.a, role="school_admin")
        self.admin_b = User.objects.create_user(username="admin_b", password="VeryStrongPass456!", school=self.b, role="school_admin")
        self.parent_a = User.objects.create_user(username="parent_a", password="VeryStrongPass456!", school=self.a, role="parent")
        self.teacher_a = User.objects.create_user(username="teacher_a", password="VeryStrongPass456!", school=self.a, role="teacher")
        self.ca = Classroom.objects.create(school=self.a, name="Class 8", division="A", teacher=self.teacher_a)
        self.cb = Classroom.objects.create(school=self.b, name="Class 8", division="A")
        self.sa = Student.objects.create(school=self.a, classroom=self.ca, admission_number="001", full_name="Student A")
        self.sb = Student.objects.create(school=self.b, classroom=self.cb, admission_number="001", full_name="Student B")

    def test_same_admission_numbers_allowed_in_separate_schools(self):
        self.assertNotEqual(self.sa.school_id, self.sb.school_id)

    def test_admin_only_sees_own_students(self):
        self.client.force_login(self.admin_a)
        response = self.client.get("/api/v1/students/")
        self.assertEqual(response.status_code, 200)
        ids = [s["id"] for s in response.json()["results"]]
        self.assertEqual(ids, [self.sa.id])

    def test_parent_without_link_sees_no_students(self):
        self.client.force_login(self.parent_a)
        self.assertEqual(self.client.get("/api/v1/students/").json()["results"], [])

    def test_parent_with_link_only_sees_child(self):
        ParentLink.objects.create(school=self.a, parent=self.parent_a, student=self.sa)
        self.client.force_login(self.parent_a)
        self.assertEqual([s["id"] for s in self.client.get("/api/v1/students/").json()["results"]], [self.sa.id])

    def test_cross_school_classroom_creation_denied(self):
        self.client.force_login(self.admin_a)
        response = self.client.post("/api/v1/students/", data='{"name":"Intruder","admission_number":"002","classroom_id":'+str(self.cb.id)+'}', content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Student.objects.filter(school=self.a, admission_number="002").exists())

    def test_teacher_cannot_enrol(self):
        self.client.force_login(self.teacher_a)
        response = self.client.post("/api/v1/students/", data="{}", content_type="application/json")
        self.assertEqual(response.status_code, 403)

    def test_anonymous_cannot_access_student_data(self):
        self.client.logout()
        self.assertEqual(self.client.get("/api/v1/students/").status_code, 401)

    def test_parent_cannot_submit_attendance(self):
        self.client.force_login(self.parent_a)
        self.assertEqual(self.client.post("/api/v1/attendance/", data="{}", content_type="application/json").status_code, 403)

    def test_teacher_can_submit_complete_attendance(self):
        self.client.force_login(self.teacher_a)
        import json
        data = {"classroom_id": self.ca.pk, "date": date.today().isoformat(), "period": 1,
                "subject": "Maths", "records": [{"student_id": self.sa.pk, "present": True}]}
        response = self.client.post("/api/v1/attendance/", data=json.dumps(data), content_type="application/json")
        self.assertEqual(response.status_code, 201, response.content)
        duplicate = self.client.post("/api/v1/attendance/", data=json.dumps(data), content_type="application/json")
        self.assertIn(duplicate.status_code, (400, 409))
