namespace StudentOrganiserApp.Entities
{
    public class TaskStatusHistory
    {
        public string StudentId { get; set; }
        public Guid TaskId { get; set; }

        public DateTime ChangeTime { get; set; }
        public string OldStatus { get; set; }
        public string NewStatus { get; set; }
    }
}
