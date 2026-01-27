using Cassandra;
using StudentOrganiserApp.Data;
using StudentOrganiserApp.Entities;

namespace StudentOrganiserApp.Repositories
{
    public class StudentRepository
    {
        private readonly ISession _session;

        public StudentRepository()
        {
            _session = SessionManager.GetSession();
        }

        public void AddStudent(Student s)
        {
            var query = @"INSERT INTO ""Student"" 
                          (studentID, phone, email, fname, lname)
                          VALUES (?, ?, ?, ?, ?)";

            var stmt = _session.Prepare(query);
            _session.Execute(stmt.Bind(
                s.studentID, s.phone, s.email, s.fname, s.lname
            ));
        }

        public Student GetStudent(string studentId)
        {
            var stmt = _session.Prepare(
                @"SELECT * FROM ""Student"" WHERE studentID = ?");

            var row = _session.Execute(stmt.Bind(studentId)).FirstOrDefault();
            if (row == null) return null;

            return new Student
            {
                studentID = row.GetValue<string>("studentID"),
                phone = row.GetValue<string>("phone"),
                email = row.GetValue<string>("email"),
                fname = row.GetValue<string>("fname"),
                lname = row.GetValue<string>("lname")
            };
        }

        public void UpdateStudent(Student s)
        {
            var stmt = _session.Prepare(
                @"UPDATE ""Student"" SET phone=?, email=?, fname=?, lname=?
                  WHERE studentID=?");

            _session.Execute(stmt.Bind(
                s.phone, s.email, s.fname, s.lname, s.studentID
            ));
        }

        public void DeleteStudent(string studentId)
        {
            var stmt = _session.Prepare(
                @"DELETE FROM ""Student"" WHERE studentID=?");

            _session.Execute(stmt.Bind(studentId));
        }
    }
}
