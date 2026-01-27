namespace StudentOrganiserApp.Entities
{
    public class Task
    {
        public Guid TaskId { get; set; }
        public string StudentId { get; set; }

        public DateTime TaskTime { get; set; }
        public DateTime Deadline { get; set; }

        public string Title { get; set; }
        public string Type { get; set; }
        public int Priority { get; set; }
        public string Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
