using Cassandra;
using StudentOrganiserApp.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

namespace StudentOrganiserApp.Data
{
    public static class DataProvider
    {
        #region Login
        public static Student? GetStudentForLogin(string studentID)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("SELECT * FROM \"Student\" WHERE \"studentID\"=?");
            var boundStatement = ps.Bind(studentID);
            Row? row = session.Execute(boundStatement).FirstOrDefault();

            if (row == null) return null;

            return new Student
            {
                studentID = row["studentID"]?.ToString(),
                phone = row["phone"]?.ToString(),
                email = row["email"]?.ToString(),
                fname = row["fname"]?.ToString(),
                lname = row["lname"]?.ToString(),
                password = row["password"]?.ToString()
            };
        }
        #endregion
        
        #region Student

        public static Student? GetStudent(string studentID)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("SELECT * FROM \"Student\" WHERE \"studentID\"=?");
            var boundStatement = ps.Bind(studentID);
            Row? row = session.Execute(boundStatement).FirstOrDefault();

            if (row == null) return null;

            return new Student
            {
                studentID = row["studentID"]?.ToString(),
                phone = row["phone"]?.ToString(),
                email = row["email"]?.ToString(),
                fname = row["fname"]?.ToString(),
                lname = row["lname"]?.ToString(),
                password = row["password"]?.ToString()
            };
        }

        public static List<Student> GetStudents()
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var rows = session.Execute("SELECT * FROM \"Student\"");
            List<Student> students = new List<Student>();

            foreach (var row in rows)
            {
                students.Add(new Student
                {
                    studentID = row["studentID"]?.ToString(),
                    phone = row["phone"]?.ToString(),
                    email = row["email"]?.ToString(),
                    fname = row["fname"]?.ToString(),
                    lname = row["lname"]?.ToString(),
                    password = row["password"]?.ToString()
                });
            }
            return students;
        }

        public static void AddStudent(Student s)
        {
            Cassandra.ISession session = SessionManager.GetSession();

            s.password = BCrypt.Net.BCrypt.HashPassword(s.password);

            var ps = session.Prepare("INSERT INTO \"Student\" (\"studentID\", phone, email, fname, lname, password) VALUES (?, ?, ?, ?, ?, ?)");
            var boundStatement = ps.Bind(s.studentID, s.phone, s.email, s.fname, s.lname, s.password);
            session.Execute(boundStatement);
        }

        public static void UpdateStudent(Student s)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("UPDATE \"Student\" SET phone=?, email=?, fname=?, lname=? WHERE \"studentID\"=?");
            var boundStatement = ps.Bind(s.phone, s.email, s.fname, s.lname, s.studentID);
            session.Execute(boundStatement);
        }

        public static void DeleteStudent(string studentID)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("DELETE FROM \"Student\" WHERE \"studentID\"=?");
            var boundStatement = ps.Bind(studentID);
            session.Execute(boundStatement);
        }

        #endregion

        #region Task
        public static List<StudentOrganiserApp.Entities.Task> GetTasksByStudentAndPeriod(string studentId, string period)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("SELECT * FROM \"Tasks_By_Student_Period\" WHERE student_id=? AND period=?");
            var rows = session.Execute(ps.Bind(studentId, period));
            List<StudentOrganiserApp.Entities.Task> tasks = new List<StudentOrganiserApp.Entities.Task>();

            foreach (var row in rows)
            {
                tasks.Add(new Entities.Task
                {
                    StudentId = row.GetValue<string>("student_id"),
                    TaskId = row.GetValue<Guid>("task_id"),
                    TaskTime = row.GetValue<DateTime>("task_time"),
                    Title = row.GetValue<string>("title"),
                    Type = row.GetValue<string>("type"),
                    Priority = row.GetValue<int>("priority"),
                    Status = row.GetValue<string>("status"),
                    Deadline = row.GetValue<DateTime>("deadline"),
                    CreatedAt = row.GetValue<DateTime>("created_at"),
                    UpdatedAt = row.GetValue<DateTime>("updated_at")
                });
            }
            return tasks;
        }
        public static List<StudentOrganiserApp.Entities.Task> GetDailyPlan(string studentId, LocalDate date)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("SELECT * FROM \"Daily_Plan_By_Student\" WHERE student_id=? AND date=?");
            var rows = session.Execute(ps.Bind(studentId, date));
            List<StudentOrganiserApp.Entities.Task> tasks = new List<StudentOrganiserApp.Entities.Task>();

            foreach (var row in rows)
            {
                tasks.Add(new Entities.Task
                {
                    StudentId = row.GetValue<string>("student_id"),
                    TaskId = row.GetValue<Guid>("task_id"),
                    TaskTime = row.GetValue<DateTime>("task_time"),
                    Title = row.GetValue<string>("title"),
                    Type = row.GetValue<string>("type"),
                    Priority = row.GetValue<int>("priority"),
                    Status = row.GetValue<string>("status")
                });
            }
            return tasks;
        }

        public static List<StudentOrganiserApp.Entities.Task> GetWeeklyPlan(string studentId, LocalDate startDate)
        {
            List<StudentOrganiserApp.Entities.Task> weeklyTasks = new List<StudentOrganiserApp.Entities.Task>();
            DateOnly baseDate = new DateOnly(startDate.Year, startDate.Month, startDate.Day);

            for (int i = 0; i < 7; i++)
            {
                DateOnly nextDate = baseDate.AddDays(i);

                LocalDate currentDate = new LocalDate(nextDate.Year, nextDate.Month, nextDate.Day);

                var dailyTasks = GetDailyPlan(studentId, currentDate);
                weeklyTasks.AddRange(dailyTasks);
            }

            return weeklyTasks.OrderBy(t => t.TaskTime).ToList();
        }


        public static List<StudentOrganiserApp.Entities.Task> GetTasksByType(string studentId, string type)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("SELECT * FROM \"Tasks_By_Student_Type\" WHERE student_id=? AND type=?");
            var rows = session.Execute(ps.Bind(studentId, type));
            List<StudentOrganiserApp.Entities.Task> tasks = new List<StudentOrganiserApp.Entities.Task>();

            foreach (var row in rows)
            {
                tasks.Add(new Entities.Task
                {
                    StudentId = row.GetValue<string>("student_id"),
                    Type = row.GetValue<string>("type"),
                    TaskTime = row.GetValue<DateTime>("task_time"),
                    TaskId = row.GetValue<Guid>("task_id"),
                    Title = row.GetValue<string>("title"),
                    Status = row.GetValue<string>("status"),
                    Priority = row.GetValue<int>("priority")
                });
            }
            return tasks;
        }

        public static StudentOrganiserApp.Entities.Task? GetTask(string studentId, string period, DateTime taskTime, Guid taskId)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("SELECT * FROM \"Tasks_By_Student_Period\" WHERE student_id=? AND period=? AND task_time=? AND task_id=?");
            var row = session.Execute(ps.Bind(studentId, period, taskTime, taskId)).FirstOrDefault();

            if (row == null) return null;

            return new Entities.Task
            {
                StudentId = row.GetValue<string>("student_id"),
                TaskId = row.GetValue<Guid>("task_id"),
                TaskTime = row.GetValue<DateTime>("task_time"),
                Title = row.GetValue<string>("title"),
                Type = row.GetValue<string>("type"),
                Priority = row.GetValue<int>("priority"),
                Status = row.GetValue<string>("status"),
                Deadline = row.GetValue<DateTime>("deadline"),
                CreatedAt = row.GetValue<DateTime>("created_at"),
                UpdatedAt = row.GetValue<DateTime>("updated_at")
            };
        }

        public static void AddTask(StudentOrganiserApp.Entities.Task t, string period)
        {
            Cassandra.ISession session = SessionManager.GetSession();

            var localDate = new LocalDate(t.TaskTime.Year, t.TaskTime.Month, t.TaskTime.Day);

            var ps1 = session.Prepare("INSERT INTO \"Tasks_By_Student_Period\" (student_id, period, task_time, task_id, title, type, priority, status, deadline, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            session.Execute(ps1.Bind(t.StudentId, period, t.TaskTime, t.TaskId, t.Title, t.Type, t.Priority, t.Status, t.Deadline, t.CreatedAt, t.UpdatedAt));

            var ps2 = session.Prepare("INSERT INTO \"Daily_Plan_By_Student\" (student_id, date, task_time, task_id, title, type, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            session.Execute(ps2.Bind(t.StudentId, localDate, t.TaskTime, t.TaskId, t.Title, t.Type, t.Priority, t.Status));

            var ps3 = session.Prepare("INSERT INTO \"Tasks_By_Student_Type\" (student_id, type, task_time, task_id, title, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?)");
            session.Execute(ps3.Bind(t.StudentId, t.Type, t.TaskTime, t.TaskId, t.Title, t.Status, t.Priority));
        }

        public static void DeleteTask(StudentOrganiserApp.Entities.Task t, string period)
        {
            Cassandra.ISession session = SessionManager.GetSession();

            var localDate = new LocalDate(t.TaskTime.Year, t.TaskTime.Month, t.TaskTime.Day);

            var ps1 = session.Prepare("DELETE FROM \"Tasks_By_Student_Period\" WHERE student_id=? AND period=? AND task_time=? AND task_id=?");
            session.Execute(ps1.Bind(t.StudentId, period, t.TaskTime, t.TaskId));

            var ps2 = session.Prepare("DELETE FROM \"Daily_Plan_By_Student\" WHERE student_id=? AND date=? AND task_time=? AND task_id=?");
            session.Execute(ps2.Bind(t.StudentId, localDate, t.TaskTime, t.TaskId));

            var ps3 = session.Prepare("DELETE FROM \"Tasks_By_Student_Type\" WHERE student_id=? AND type=? AND task_time=? AND task_id=?");
            session.Execute(ps3.Bind(t.StudentId, t.Type, t.TaskTime, t.TaskId));
        }

        public static void UpdateTask(StudentOrganiserApp.Entities.Task t, string period, DateTime? oldTime = null)
        {
            Cassandra.ISession session = SessionManager.GetSession();

            var timeToLookup = oldTime ?? t.TaskTime;
            var existingTask = GetTask(t.StudentId, period, timeToLookup, t.TaskId);

            if (existingTask != null)
            {
                if (existingTask.Status != t.Status)
                {
                    AddTaskStatusHistory(new TaskStatusHistory
                    {
                        StudentId = t.StudentId,
                        TaskId = t.TaskId,
                        ChangeTime = DateTime.UtcNow,
                        OldStatus = existingTask.Status,
                        NewStatus = t.Status
                    });
                }

                if (oldTime.HasValue && oldTime.Value != t.TaskTime)
                {
                    DeleteTask(existingTask, oldTime.Value.ToString("yyyy-MM"));
                    AddTask(t, t.TaskTime.ToString("yyyy-MM"));
                    return;
                }
            }

            var localDate = new LocalDate(t.TaskTime.Year, t.TaskTime.Month, t.TaskTime.Day);

            var ps1 = session.Prepare("UPDATE \"Tasks_By_Student_Period\" SET title=?, type=?, priority=?, status=?, deadline=?, updated_at=? WHERE student_id=? AND period=? AND task_time=? AND task_id=?");
            session.Execute(ps1.Bind(t.Title, t.Type, t.Priority, t.Status, t.Deadline, t.UpdatedAt, t.StudentId, period, t.TaskTime, t.TaskId));

            var ps2 = session.Prepare("UPDATE \"Daily_Plan_By_Student\" SET title=?, type=?, priority=?, status=? WHERE student_id=? AND date=? AND task_time=? AND task_id=?");
            session.Execute(ps2.Bind(t.Title, t.Type, t.Priority, t.Status, t.StudentId, localDate, t.TaskTime, t.TaskId));

            var ps3 = session.Prepare("UPDATE \"Tasks_By_Student_Type\" SET title=?, status=?, priority=? WHERE student_id=? AND type=? AND task_time=? AND task_id=?");
            session.Execute(ps3.Bind(t.Title, t.Status, t.Priority, t.StudentId, t.Type, t.TaskTime, t.TaskId));
        }

        #endregion

        #region TaskStatusHistory

        public static void AddTaskStatusHistory(TaskStatusHistory h)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("INSERT INTO \"Task_Status_History\" (student_id, task_id, change_time, old_status, new_status) VALUES (?, ?, ?, ?, ?)");
            session.Execute(ps.Bind(h.StudentId, h.TaskId, h.ChangeTime, h.OldStatus, h.NewStatus));
        }

        public static List<TaskStatusHistory> GetTaskStatusHistory(string studentId, Guid taskId)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("SELECT * FROM \"Task_Status_History\" WHERE student_id=? AND task_id=?");
            var rows = session.Execute(ps.Bind(studentId, taskId));
            List<TaskStatusHistory> history = new List<TaskStatusHistory>();

            foreach (var row in rows)
            {
                history.Add(new TaskStatusHistory
                {
                    StudentId = row["student_id"]?.ToString(),
                    TaskId = row.GetValue<Guid>("task_id"),
                    ChangeTime = row.GetValue<DateTime>("change_time"),
                    OldStatus = row["old_status"]?.ToString(),
                    NewStatus = row["new_status"]?.ToString()
                });
            }
            return history;
        }

        public static void UpdateTaskStatusHistory(TaskStatusHistory h)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("UPDATE \"Task_Status_History\" SET old_status=?, new_status=? WHERE student_id=? AND task_id=? AND change_time=?");
            session.Execute(ps.Bind(h.OldStatus, h.NewStatus, h.StudentId, h.TaskId, h.ChangeTime));
        }

        public static void DeleteTaskStatusHistory(TaskStatusHistory h)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("DELETE FROM \"Task_Status_History\" WHERE student_id=? AND task_id=? AND change_time=?");
            session.Execute(ps.Bind(h.StudentId, h.TaskId, h.ChangeTime));
        }
        #endregion

        #region ArchiveTask
        public static void ArchiveTask(StudentOrganiserApp.Entities.Task t)
        {
            Cassandra.ISession session = SessionManager.GetSession();

            var ps = session.Prepare("INSERT INTO \"Archived_Tasks_By_Student\" (student_id, finished_at, task_id, title, type, priority) VALUES (?, ?, ?, ?, ?, ?)");
            session.Execute(ps.Bind(t.StudentId, t.TaskTime, t.TaskId, t.Title, t.Type, t.Priority));

            DeleteTask(t, t.TaskTime.ToString("yyyy-MM"));
        }
        public static void DeleteArchivedTask(string studentId, DateTime finishedAt, Guid taskId)
        {
            Cassandra.ISession session = SessionManager.GetSession();

            var ps = session.Prepare(
                "DELETE FROM \"Archived_Tasks_By_Student\" WHERE student_id=? AND finished_at=? AND task_id=?"
            );

            session.Execute(ps.Bind(studentId, finishedAt, taskId));
        }
        
        public static List<StudentOrganiserApp.Entities.Task> GetArchivedTasks(string studentId)
        {
            Cassandra.ISession session = SessionManager.GetSession();
            var ps = session.Prepare("SELECT * FROM \"Archived_Tasks_By_Student\" WHERE student_id=?");
            var rows = session.Execute(ps.Bind(studentId));
            List<StudentOrganiserApp.Entities.Task> tasks = new List<StudentOrganiserApp.Entities.Task>();

            foreach (var row in rows)
            {
                tasks.Add(new Entities.Task
                {
                    StudentId = row.GetValue<string>("student_id"),
                    TaskId = row.GetValue<Guid>("task_id"),
                    TaskTime = row.GetValue<DateTime>("finished_at"),
                    Title = row.GetValue<string>("title"),
                    Type = row.GetValue<string>("type"),
                    Priority = row.GetValue<int>("priority")
                });
            }
            return tasks;
        }

        #endregion
    }
}